const express = require('express');
const mongoose = require('mongoose');
const path = require('path');       // ✅ only once
require('dotenv').config();

const connectDB = require('./config/db');
const cors = require('cors');

const app = express();



// -------------------------
// Connect to MongoDB
// -------------------------
connectDB();

// -------------------------
// Global CORS – allow frontend domain
// -------------------------
app.use(cors({
  origin: "https://luckyjuniorschool.onrender.com",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
const tenant = require('./middleware/tenant');
app.use('/api', tenant);

// -------------------------
// Body parsers
// -------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------
// Debug logging (CORS check)
// -------------------------
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ACAO:`,
      res.getHeader('access-control-allow-origin')
    );
  });
  next();
});

// -------------------------
// Serve uploaded files (resources, homeworks, etc.)
// -------------------------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// -------------------------
// Static assets (frontend)
const publicFrontendPath = path.join(__dirname, 'frontend_public');
const pagesPath = path.join(publicFrontendPath, 'pages');

app.use(express.static(publicFrontendPath));
app.use('/css', express.static(path.join(publicFrontendPath, 'css')));
app.use('/js', express.static(path.join(publicFrontendPath, 'js')));
app.use('/images', express.static(path.join(publicFrontendPath, 'images')));

app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(publicFrontendPath, 'favicon.ico'), {
    headers: { 'Content-Type': 'image/x-icon' }
  });
});

// -------------------------
// API routes
const requireSchool = require('./middleware/requireSchool');

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/assignments', requireSchool, require('./routes/assignmentRoutes'));
app.use('/api/grades', requireSchool, require('./routes/gradesRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/profile', requireSchool, require('./routes/profileRoutes'));
app.use('/api/resources', requireSchool, require('./routes/resourceRoutes'));
app.use('/api/clubs', requireSchool, require('./routes/clubs'));
app.use('/api/books', requireSchool, require('./routes/books'));
app.use('/api/events', requireSchool, require('./routes/events'));
app.use('/api/accounts', requireSchool, require('./routes/accounts'));
app.use('/api/stats', requireSchool, require('./routes/stats'));
app.use('/api/users', requireSchool, require('./routes/schoolUserRoutes'));
app.use('/api/contact', requireSchool, require('./routes/contact'));
app.use('/api/students', requireSchool, require('./routes/studentRoutes'));
app.use('/api/classes', requireSchool, require('./routes/classRoutes'));
app.use('/api/homeworks', requireSchool, require('./routes/homeworkRoutes'));
app.use('/api/reportcards', requireSchool, require('./routes/reportCardRoutes'));
app.use('/api/teachers', requireSchool, require('./routes/teacherRoutes'));
app.use('/api/attendance', requireSchool, require('./routes/attendanceRoutes'));
app.use('/api/fees', requireSchool, require('./routes/fees'));
app.use('/api/library', requireSchool, require('./routes/library'));
app.use('/api/marks', requireSchool, require('./routes/marksRoutes'));
app.use('/api/quizzes', requireSchool, require('./routes/quizRoutes'));
app.use('/api/health', requireSchool, require('./routes/health'));
app.use('/api/transport', require('./routes/transportRoutes'));
app.use('/api/transport/fees', requireSchool, require('./routes/transportFees'));
app.use('/api/transport/payments', requireSchool, require('./routes/transportPayments'));
app.use('/api/transport/attendance', requireSchool, require('./routes/transportAttendance'));
app.use('/api/meals', requireSchool, require('./routes/meals'));
app.use('/api/other-charges', requireSchool, require('./routes/otherCharges'));
app.use('/api/schools', require('./routes/schoolRoutes'));


// -------------------------
// FRONTEND ROUTES

// -------------------------
// FRONTEND ROUTES
// -------------------------

// Always serve login for root and /login
app.get('/', (req, res) => {
  res.sendFile(path.join(pagesPath, 'login.html'));
});

// Admin dashboard
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(pagesPath, 'index.html'));
});

// Teacher dashboard
app.get('/teacher.html', (req, res) => {
  res.sendFile(path.join(pagesPath, 'teacher.html'));
});

// Student dashboard
app.get('/student.html', (req, res) => {
  res.sendFile(path.join(pagesPath, 'student.html'));
});

// Any other page inside /pages folder
app.get('/*.html', (req, res) => {
  const requestedPage = path.join(pagesPath, req.path);
  res.sendFile(requestedPage, (err) => {
    if (err) {
      res.sendFile(path.join(pagesPath, 'login.html'));
    }
  });
});


// -------------------------
// Start server
const PORT = process.env.PORT || 5000;
mongoose.connection.once('open', () => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});

console.log("🧠 Connected DB name:", mongoose.connection.name);

app.get('/setup-admin', async (req, res) => {
  const bcrypt = require('bcrypt');
  const User = require('./models/User');

  try {
    const existingAdmin = await User.findOne({ email: "admin@admin.com" });
    if (existingAdmin) return res.send("Admin already exists ✅");

    const hashedPassword = await bcrypt.hash("admin123", 10);
    await new User({
      name: "Admin User",
      email: "admin@admin.com",
      role: "admin",
      password: hashedPassword
    }).save();

    res.send("✅ Admin user created successfully!");
  } catch (err) {
    res.status(500).send("❌ Error: " + err.message);
  }
});


