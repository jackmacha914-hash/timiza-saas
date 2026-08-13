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

[AUTH] Authenticated user: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03'
}
[AUTH] JWT decoded: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03',
  iat: 1786629179,
  exp: 1786632779
}
[AUTH] Authenticated user: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03'
}
Getting assignments...
Found assignments: 0
[2026-08-13T13:53:01.304Z] GET /api/assignments -> ACAO: undefined
Incoming host: timiza-saas.onrender.com
Running in School Code mode.
[AUTH] JWT decoded: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03',
  iat: 1786629179,
  exp: 1786632779
}
[AUTH] Authenticated user: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03'
}
[AUTH] JWT decoded: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03',
  iat: 1786629179,
  exp: 1786632779
}
[AUTH] Authenticated user: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03'
}
[2026-08-13T13:53:01.309Z] GET /api/students -> ACAO: undefined
Incoming host: timiza-saas.onrender.com
Running in School Code mode.
[AUTH] JWT decoded: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03',
  iat: 1786629179,
  exp: 1786632779
}
[AUTH] Authenticated user: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03'
}
=================================
GET /api/resources
USER: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03'
}
QUERY: { class: 'Grade 1' }
=================================
RESOURCE QUERY: {
  school: '6a67b27256c76faea1ef5a03',
  uploadedBy: '6a67b31d56c76faea1ef5a45',
  classAssigned: 'Grade 1'
}
Incoming host: timiza-saas.onrender.com
Running in School Code mode.
[AUTH] JWT decoded: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03',
  iat: 1786629179,
  exp: 1786632779
}
[AUTH] Authenticated user: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03'
}
[AUTH] JWT decoded: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03',
  iat: 1786629179,
  exp: 1786632779
}
[AUTH] Authenticated user: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03'
}
Incoming host: timiza-saas.onrender.com
Running in School Code mode.
[AUTH] JWT decoded: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03',
  iat: 1786629179,
  exp: 1786632779
}
[AUTH] Authenticated user: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03'
}
[2026-08-13T13:53:01.410Z] GET /api/classes -> ACAO: undefined
[2026-08-13T13:53:01.411Z] GET /api/announcements -> ACAO: undefined
Incoming host: timiza-saas.onrender.com
Running in School Code mode.
Returning 2 resources
[2026-08-13T13:53:01.412Z] GET /api/resources?class=Grade+1 -> ACAO: undefined
[AUTH] JWT decoded: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03',
  iat: 1786629179,
  exp: 1786632779
}
[AUTH] Authenticated user: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03'
}
Incoming host: timiza-saas.onrender.com
Running in School Code mode.
[AUTH] JWT decoded: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03',
  iat: 1786629179,
  exp: 1786632779
}
[AUTH] Authenticated user: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03'
}
=================================
GET /api/resources
USER: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03'
}
QUERY: {}
=================================
RESOURCE QUERY: {
  school: '6a67b27256c76faea1ef5a03',
  uploadedBy: '6a67b31d56c76faea1ef5a45'
}
[2026-08-13T13:53:01.507Z] GET /favicon.ico -> ACAO: undefined
[2026-08-13T13:53:01.510Z] GET /api/homeworks -> ACAO: undefined
Returning 3 resources
[2026-08-13T13:53:01.510Z] GET /api/resources -> ACAO: undefined
Incoming host: timiza-saas.onrender.com
Running in School Code mode.
[AUTH] JWT decoded: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03',
  iat: 1786629179,
  exp: 1786632779
}
[AUTH] Authenticated user: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03'
}
[AUTH] JWT decoded: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03',
  iat: 1786629179,
  exp: 1786632779
}
[AUTH] Authenticated user: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03'
}
[2026-08-13T13:53:01.604Z] GET /api/students -> ACAO: undefined
Incoming host: timiza-saas.onrender.com
Running in School Code mode.
[AUTH] JWT decoded: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03',
  iat: 1786629179,
  exp: 1786632779
}
[AUTH] Authenticated user: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03'
}
[AUTH] JWT decoded: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03',
  iat: 1786629179,
  exp: 1786632779
}
[AUTH] Authenticated user: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03'
}
Getting assignments...
Found assignments: 0
[2026-08-13T13:53:01.608Z] GET /api/assignments -> ACAO: undefined
Incoming host: timiza-saas.onrender.com
Running in School Code mode.
[AUTH] JWT decoded: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03',
  iat: 1786629179,
  exp: 1786632779
}
[AUTH] Authenticated user: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03'
}
[2026-08-13T13:53:11.508Z] GET /api/users?role=student -> ACAO: undefined
Incoming host: timiza-saas.onrender.com
Running in School Code mode.
[AUTH] JWT decoded: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03',
  iat: 1786629179,
  exp: 1786632779
}
[AUTH] Authenticated user: {
  id: '6a67b31d56c76faea1ef5a45',
  role: 'teacher',
  school: '6a67b27256c76faea1ef5a03'
}
[2026-08-13T13:53:13.638Z] GET /api/users?role=student -> ACAO: undefined
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
