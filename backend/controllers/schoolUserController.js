const bcrypt = require('bcryptjs');
const SchoolUser = require('../models/SchoolUser');
const User = require('../models/User');

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    let deletedUser = await SchoolUser.findOneAndDelete({
      _id: userId,
      school: req.user.school
    });

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

// Get All Users
exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, status } = req.query;

    let filter = {
      school: req.user.school
    };

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

    if (role) {
      filter.role = role;
    }

    if (status) {
      filter.status = status;
    }

    const users = await SchoolUser.find(filter).sort({
      createdAt: -1
    });

    res.json({
      success: true,
      count: users.length,
      data: users
    });

  } catch (err) {
    console.error('Error fetching users:', err);

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Create User
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

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password and role are required'
      });
    }

    const existingUser = await SchoolUser.findOne({
      email,
      school: req.user.school
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists in this school'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new SchoolUser({
      school: req.user.school,
      name,
      email,
      password: hashedPassword,
      role,
      subject: role === 'teacher' ? subject : undefined,
      studentClass: role === 'student' ? studentClass : undefined
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (err) {
    console.error('Error creating user:', err);

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};
