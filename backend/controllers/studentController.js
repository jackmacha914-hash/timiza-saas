const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const getClassStudentModel = require('../models/ClassStudent');

// ✅ Get Students by Class
exports.getStudentsByClass = async (req, res) => {
    try {
        console.log('getStudentsByClass called with params:', req.params);
        const { className } = req.params;
        
        if (!className) {
            console.log('No className provided in request');
            return res.status(400).json({ 
                success: false, 
                message: 'Class name is required',
                receivedParams: req.params
            });
        }

        console.log(`Fetching students for class: ${className}`);
        
        const query = {
    school: req.user.school,
    role: 'student',
    $or: [
        { class: className },
        { 'profile.class': className }
    ]
};
        
        console.log('MongoDB query:', JSON.stringify(query, null, 2));
        
        const students = await User.find(query)
            .select('name email profile.class class')
            .lean()
            .exec();
            
        console.log(`Found ${students.length} students for class ${className}`);
        
        // Log the first few students for debugging
        if (students.length > 0) {
            console.log('Sample students:', students.slice(0, 3).map(s => ({
                id: s._id,
                name: s.name,
                class: s.class,
                profileClass: s.profile?.class
            })));
        }

        res.json({
            success: true,
            data: students,
            count: students.length
        });
        
    } catch (err) {
        console.error('Error in getStudentsByClass:', err);
        
        // Log the full error for debugging
        console.error('Full error object:', JSON.stringify({
            name: err.name,
            message: err.message,
            stack: err.stack,
            ...err
        }, null, 2));
        
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch students',
            error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

// ✅ Get All Students
exports.getStudents = async (req, res) => {
    try {
        const role = req.path === '/teachers' ? 'teacher' : 'student';
        
        if (role === 'student') {
            const users = await 
                User.find({
            school: req.user.school,
          role: 'student'
          })
                .select('-password');
            res.json(users);
        } else {
            const users = await
                User.find({
    school: req.user.school,
    role: 'teacher'
})
                .select('-password');
            res.json(users);
        }
    } catch (err) {
        console.error('Error in getStudents:', err);
        res.status(500).json({ error: err.message });
    }
};

// ✅ Get User Profile (supports multiple roles)
exports.getStudentProfile = async (req, res) => {
    try {
        // Allow access to the user's own profile regardless of role
        const userId = req.params.id || req.user.id;
        
        console.log('Fetching profile for user ID:', userId);
        
        // If trying to access another user's profile, check permissions
        if (userId !== req.user.id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own profile.'
            });
        }

        const student = await User.findOne({
    _id: userId,
    school: req.user.school
})
            .select('-password')
            .populate('profile.subjects', 'name')
            .lean();
            
        if (!student) {
            return res.status(404).json({ 
                success: false,
                message: 'Student not found' 
            });
        }

        // Ensure profile object exists
        if (!student.profile) {
            student.profile = {};
        }

        // Prepare response data
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        let photoUrl = '';
        let photoPath = '';
        
        // Ensure we have a proper photo URL
        if (student.profile?.photo) {
            // If it's already a full URL, use it as is
            if (student.profile.photo.startsWith('http')) {
                photoUrl = student.profile.photo;
                photoPath = student.profile.photo;
            } 
            // If it's a path, prepend the base URL
            else if (student.profile.photo.startsWith('/')) {
                photoUrl = `${baseUrl}${student.profile.photo}`;
                photoPath = student.profile.photo;
            }
            // If it's just a filename, construct the full path
            else {
                photoUrl = `${baseUrl}/uploads/profile-photos/${student.profile.photo}`;
                photoPath = `/uploads/profile-photos/${student.profile.photo}`;
            }
        }

        // Get the class from root level, classAssigned, or profile, default to empty string
        const studentClass = student.class || student.classAssigned || (student.profile && student.profile.class) || '';
        console.log('Student class data:', { 
            rootClass: student.class, 
            profileClass: student.profile?.class,
            finalClass: studentClass 
        });
        
        const responseData = {
            success: true,
            id: student._id,
            name: student.name,
            email: student.email,
            role: student.role,
            class: studentClass,  // Add class at root level
            photoUrl: photoUrl,  // Add photoUrl at the root level for easy access
            photoPath: photoPath, // Add clean photo path
            profile: {
                ...(student.profile || {}),
                class: studentClass,  // Ensure class is in profile
                grade: student.grade || (student.profile && student.profile.grade) || '',
                subjects: (student.profile && student.profile.subjects) || [],
                photo: photoUrl,  // Keep for backward compatibility
                photoPath: photoPath  // Keep for backward compatibility
            }
        };
        
        // If class is not at root level but is in profile, move it to root
        if (!responseData.class && responseData.profile?.class) {
            responseData.class = responseData.profile.class;
        }
        
        console.log('Returning profile data:', {
            id: responseData.id,
            email: responseData.email,
            role: responseData.role,
            photoUrl: photoUrl
        });

        res.json(responseData);
    } catch (err) {
        console.error('Error in getStudentProfile:', err);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: err.message 
        });
    }
};


// ✅ Update Student Profile
exports.updateStudentProfile = async (req, res) => {
    try {
        console.log(
            'Received update request:',
            JSON.stringify(req.body, null, 2)
        );

        const {
            name,
            email,
            profile,
            class: rootClass
        } = req.body;

        const userId = req.user.id;

        // ==========================================
        // SCHOOL IS REQUIRED
        // ==========================================

        if (!req.user.school) {
            return res.status(400).json({
                success: false,
                message: 'School not found in authenticated user'
            });
        }

        // ==========================================
        // FIND USER IN CURRENT SCHOOL
        // ==========================================

        const student = await User.findOne({
            _id: userId,
            school: req.user.school
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // ==========================================
        // BASIC INFORMATION
        // ==========================================

        if (name) {
            student.name = name;
        }

        if (email) {
            student.email = email;
        }

        // ==========================================
        // ROOT CLASS
        // ==========================================

        if (rootClass) {
            student.class = rootClass;

            student.profile = student.profile || {};

            student.profile.class = rootClass;
        }

        // ==========================================
        // PROFILE
        // ==========================================

        if (profile) {
            student.profile = student.profile || {};

            // Class
            if (profile.class) {
                student.class = profile.class;
                student.profile.class = profile.class;
            }

            // Grade
            if (profile.grade) {
                student.profile.grade = profile.grade;
            }

            // Subjects
            if (profile.subjects) {
                student.profile.subjects =
                    Array.isArray(profile.subjects)
                        ? profile.subjects
                        : [profile.subjects].filter(Boolean);
            }
        }

        // ==========================================
        // SAVE
        // ==========================================

        await student.save();

        // ==========================================
        // RETURN UPDATED USER
        // ==========================================

        const updatedStudent = await User.findOne({
            _id: userId,
            school: req.user.school
        })
            .select('-password')
            .populate('profile.subjects', 'name')
            .lean();

        return res.json({
            success: true,
            message: 'Profile updated successfully',
            profile: updatedStudent
        });

    } catch (err) {
        console.error(
            'Error updating student profile:',
            err
        );

        // Duplicate email
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists',
                field: 'email'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: err.message
        });
    }
};
// ✅ Change Password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findOne({
    _id: req.user.id,
    school: req.user.school
});

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if current password is correct
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Current password is incorrect" });
        }

        // Validate new password
        if (newPassword.length < 6) {
            return res.status(400).json({ error: "New password must be at least 6 characters long" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ msg: "Password updated successfully" });
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({ error: err.message });
    }
};

// ✅ Register New Student
exports.registerUser = async (req, res) => {
    try {
        console.log('Registration request received:', req.body);
        
        const {
            userType,
            name,
            dob,
            gender,
            email,
            phone,
            address,
            classAssigned,
            specialization,
            emergencyContactName,
            emergencyContactPhone,
            emergencyContactRelationship,
            bloodGroup,
            allergies,
            medicalConditions,
            medications
        } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !userType) {
            return res.status(400).json({
                error: 'Missing required fields',
                details: 'Please provide: name, email, phone, and userType'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
    email,
    school: req.user.school
});
        if (existingUser) {
            return res.status(400).json({
                error: 'User already exists',
                details: 'A user with this email already exists'
            });
        }

        // Log the incoming request data
        console.log('Registration request data:', {
            name,
            email,
            userType,
            classAssigned,
            profile: {
                dob,
                gender,
                // other profile fields
            }
        });

        // Log the incoming request data for debugging
        console.log('Registration request data:', {
            name,
            email,
            userType,
            classAssigned,
            profile: {
                dob,
                gender,
                // other profile fields
            }
        });

        // Ensure class is set for students
        if (userType.toLowerCase() === 'student' && !classAssigned) {
            console.warn('No class assigned for student registration!');
            return res.status(400).json({ 
                success: false, 
                message: 'Class is required for student registration' 
            });
        }

        // Create user object
        const user = new User({
            school: req.user.school,
            name,
            email,
            password: phone, // Using phone as password (will be hashed)
            role: userType.toLowerCase() === 'teacher' ? 'teacher' : 'student',
            ...(classAssigned && { 
                class: classAssigned,  // Save at root level
                classAssigned: classAssigned  // Also save as classAssigned for backward compatibility
            }),
            profile: {
                ...(classAssigned && { class: classAssigned }),  // Also save in profile
                dob,
                gender,
                ...(address && { address }),
                ...(specialization && { specialization }),
                emergencyContact: {
                    name: emergencyContactName,
                    phone: emergencyContactPhone,
                    relationship: emergencyContactRelationship
                },
                health: {
                    bloodGroup,
                    allergies,
                    medicalConditions,
                    medications
                }
            }
        });

        // Hash password before saving
        user.password = await bcrypt.hash(user.password, 10);
        
        // Save user
        const savedUser = await user.save();
        
        // Log the saved user data
        const savedUserPlain = savedUser.toObject();
        console.log('Saved user document:', JSON.stringify(savedUserPlain, null, 2));
        
        // Create response
        const response = { 
            msg: `${userType} registered successfully!`, 
            user: savedUserPlain
        };
        
        console.log('Registration successful. User data:', {
            id: savedUser._id,
            class: savedUser.class,
            classAssigned: savedUser.classAssigned,
            profileClass: savedUser.profile?.class
        });
        
        // Log successful registration
        console.log(`Successfully registered ${userType}:`, response);
        
        res.json(response);
    } catch (err) {
        console.error('User registration error:', err);
        
        // Handle specific errors
        if (err.code === 11000) { // Duplicate key error
            return res.status(400).json({ 
                error: 'Duplicate entry',
                details: 'A user with this email already exists'
            });
        }

        res.status(500).json({ 
            error: 'Failed to register user',
            details: err.message 
        });
    }
};

// ✅ Register New Student
exports.registerStudent = async (req, res) => {
    try {
        const { 
            name, 
            email, 
            password, 
            role,
            studentName,
            studentDob,
            studentGender,
            parentName,
            parentEmail,
        } = req.body;

        // Validate required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({ msg: "Please include all fields" });
        }

        // Check if user exists
        const user = await User.findOne({
    email,
    school: req.user.school
});
        if (user) {
            return res.status(400).json({ msg: "User already exists" });
        }

        // Create new user
        const newUser = new User({
            school: req.user.school,
            name,
            email,
            password,
            role,
            profile: {
                dob: studentDob,
                gender: studentGender,
                parent: {
                    name: parentName,
                    email: parentEmail,
                }
            }
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(password, salt);

        // Save user
        await newUser.save();

        // Send success response
        res.status(201).json({
            msg: "User registered successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (err) {
        console.error('Error in registerStudent:', err);
        res.status(500).json({ error: err.message });
    }
};

// =====================================================
// Upload Profile Photo
// =====================================================

exports.uploadProfilePhoto = async (req, res) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const userId = req.user.id;

        // Relative path stored in database
        const photoPath = `/uploads/profile-photos/${req.file.filename}`;

        // Full URL
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const fullPhotoUrl = `${baseUrl}${photoPath}`;

        // Find current user
        const user = await User.findOne({
            _id: userId,
            school: req.user.school
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Save old photo path before updating
        const oldPhotoPath = user.profile?.photoPath;

        // Make sure profile exists
        user.profile = user.profile || {};

        // Update profile photo information
        user.profile.photo = fullPhotoUrl;
        user.profile.photoPath = photoPath;
        user.profile.originalFilename = req.file.originalname;
        user.profile.photoUploadedAt = new Date();

        await user.save();

        // Delete previous local photo if it exists
        if (
            oldPhotoPath &&
            oldPhotoPath !== photoPath &&
            oldPhotoPath.startsWith('/uploads/profile-photos/')
        ) {
            try {
                const oldFilePath = path.join(
                    __dirname,
                    '..',
                    oldPhotoPath
                );

                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);

                    console.log(
                        'Deleted old profile photo:',
                        oldFilePath
                    );
                }
            } catch (deleteError) {
                // Do not fail the upload if old photo deletion fails
                console.error(
                    'Error deleting old profile photo:',
                    deleteError
                );
            }
        }

        return res.json({
            success: true,
            message: 'Profile photo updated successfully',
            photoUrl: fullPhotoUrl,
            photoPath: photoPath
        });

    } catch (err) {
        console.error(
            'Error uploading profile photo:',
            err
        );

        return res.status(500).json({
            success: false,
            message: 'Failed to upload profile photo',
            error: err.message
        });
    }
};
