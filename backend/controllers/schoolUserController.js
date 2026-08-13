const bcrypt = require('bcryptjs');
const SchoolUser = require('../models/SchoolUser');
const User = require('../models/User');


// =====================================================
// DELETE USER
// =====================================================
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Always restrict deletion to the logged-in user's school
    let deletedUser = await SchoolUser.findOneAndDelete({
      _id: userId,
      school: req.user.school
    });

    // Keep your existing fallback logic
    if (!deletedUser) {
      deletedUser = await User.findOneAndDelete({
        _id: userId,
        school: req.user.school
      });
    }

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (err) {
    console.error('Error deleting user:', err);

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};


// =====================================================
// GET ALL USERS
// =====================================================
exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, status } = req.query;

    // =================================================
    // CRITICAL:
    // The school MUST come from the authenticated JWT.
    // Never take school from req.query or frontend.
    // =================================================
    const schoolId = req.user && req.user.school;

    if (!schoolId) {
      console.error('[USERS] No school found in authenticated user');

      return res.status(403).json({
        success: false,
        message: 'User is not associated with a school'
      });
    }

    // =================================================
    // BASE FILTER
    // =================================================
    const filter = {
      school: schoolId
    };

    // =================================================
    // ROLE FILTER
    // =================================================
    if (role) {
      filter.role = String(role).toLowerCase().trim();
    }

    // =================================================
    // STATUS FILTER
    // =================================================
    if (status) {
      filter.status = status;
    }

    // =================================================
    // SEARCH FILTER
    // =================================================
    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: 'i'
          }
        },
        {
          email: {
            $regex: search,
            $options: 'i'
          }
        },
        {
          username: {
            $regex: search,
            $options: 'i'
          }
        }
      ];
    }

    // =================================================
    // DEBUG LOGGING
    // =================================================
    console.log('=================================');
    console.log('[USERS] GET ALL USERS');
    console.log('[USERS] Authenticated user:', {
      id: req.user.id,
      role: req.user.role,
      school: req.user.school
    });
    console.log('[USERS] Query:', req.query);
    console.log('[USERS] MongoDB filter:', filter);
    console.log('=================================');

    // =================================================
    // IMPORTANT:
    // Query SchoolUser ONLY with the school restriction.
    // =================================================
    const users = await SchoolUser.find(filter)
      .sort({
        createdAt: -1
      })
      .lean();

    // =================================================
    // SECURITY CHECK
    // Never return a user belonging to another school.
    // This is an additional server-side safeguard.
    // =================================================
    const schoolUsers = users.filter(user => {
      return String(user.school) === String(schoolId);
    });

    console.log(
      `[USERS] Found ${schoolUsers.length} users for school ${schoolId}`
    );

    if (role) {
      console.log(
        `[USERS] Role filter: ${String(role).toLowerCase().trim()}`
      );
    }

    // Optional detailed debugging
    console.log(
      '[USERS] Returned users:',
      schoolUsers.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentClass: user.studentClass,
        school: user.school
      }))
    );

    // =================================================
    // RESPONSE
    // =================================================
    return res.json({
      success: true,
      count: schoolUsers.length,
      data: schoolUsers
    });

  } catch (err) {
    console.error('[USERS] Error fetching users:', err);

    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};


// =====================================================
// CREATE USER
// =====================================================
exports.createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      subject,
      studentClass
    } = req.body;

    // =================================================
    // VALIDATION
    // =================================================
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password and role are required'
      });
    }

    // =================================================
    // SCHOOL MUST COME FROM JWT
    // =================================================
    const schoolId = req.user && req.user.school;

    if (!schoolId) {
      return res.status(403).json({
        success: false,
        message: 'User is not associated with a school'
      });
    }

    // =================================================
    // NORMALIZE ROLE
    // =================================================
    const normalizedRole = String(role)
      .toLowerCase()
      .trim();

    // =================================================
    // CHECK EXISTING USER
    // ONLY WITHIN THIS SCHOOL
    // =================================================
    const existingUser = await SchoolUser.findOne({
      email,
      school: schoolId
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists in this school'
      });
    }

    // =================================================
    // HASH PASSWORD
    // =================================================
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // =================================================
    // CREATE USER
    // =================================================
    const newUser = new SchoolUser({
      school: schoolId,
      name,
      email,
      password: hashedPassword,
      role: normalizedRole,

      subject:
        normalizedRole === 'teacher'
          ? subject
          : undefined,

      studentClass:
        normalizedRole === 'student'
          ? studentClass
          : undefined
    });

    await newUser.save();

    console.log('[USERS] User created:', {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      school: newUser.school,
      studentClass: newUser.studentClass
    });

    // =================================================
    // RESPONSE
    // =================================================
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        school: newUser.school,
        studentClass: newUser.studentClass
      }
    });

  } catch (err) {
    console.error('Error creating user:', err);

    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};
