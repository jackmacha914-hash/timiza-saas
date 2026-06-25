const User = require('../models/User');

// Get Teacher Profile
exports.getTeacherProfile = async (req, res) => {
    try {
        const teacher = await User.findOne({
            _id: req.user.id,
            school: req.user.school
        }).select('-password');

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        res.json({
            success: true,
            data: teacher
        });
    } catch (err) {
        console.error('Error fetching teacher profile:', err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// Update Teacher Profile
exports.updateTeacherProfile = async (req, res) => {
    try {
        const { name, subject } = req.body;

        const teacher = await User.findOne({
            _id: req.user.id,
            school: req.user.school
        });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        if (name) teacher.name = name;
        if (subject) teacher.subject = subject;

        await teacher.save();

        res.json({
            success: true,
            message: "Profile updated successfully",
            data: teacher
        });
    } catch (err) {
        console.error('Error updating teacher profile:', err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};
