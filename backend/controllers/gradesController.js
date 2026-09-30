const Grade = require('../models/Grade');
const User = require('../models/User');

// Add Grade
exports.addGrade = async (req, res) => {
try {
const { student, subject, score } = req.body;


const studentRecord = await User.findOne({
  _id: student,
  school: req.user.school,
  role: 'student'
});

if (!studentRecord) {
  return res.status(404).json({
    success: false,
    message: 'Student not found in this school'
  });
}

const grade = new Grade({
  school: req.user.school,
  student,
  subject,
  score,
  teacher: req.user.id
});

await grade.save();

res.status(201).json({
  success: true,
  message: 'Grade added successfully',
  data: grade
});


} catch (err) {
console.error('Error adding grade:', err);


res.status(500).json({
  success: false,
  error: err.message
});


}
};

// Get Grades
exports.getStudentGrades = async (req, res) => {
try {
let grades;


if (req.user.role === 'student') {
  grades = await Grade.find({
    school: req.user.school,
    student: req.user.id
  })
    .populate('student', 'name email')
    .populate('teacher', 'name email');
} else if (req.user.role === 'teacher') {
  grades = await Grade.find({
    school: req.user.school,
    teacher: req.user.id
  })
    .populate('student', 'name email')
    .populate('teacher', 'name email');
} else {
  grades = await Grade.find({
    school: req.user.school
  })
    .populate('student', 'name email')
    .populate('teacher', 'name email');
}

res.json({
  success: true,
  count: grades.length,
  data: grades
});


} catch (err) {
console.error('Error fetching grades:', err);


res.status(500).json({
  success: false,
  error: err.message
});


}
};

// Update Grade
exports.updateGrade = async (req, res) => {
try {
const { score } = req.body;


const grade = await Grade.findOne({
  _id: req.params.id,
  school: req.user.school
});

if (!grade) {
  return res.status(404).json({
    success: false,
    message: 'Grade not found'
  });
}

grade.score = score ?? grade.score;

await grade.save();

res.json({
  success: true,
  message: 'Grade updated successfully',
  data: grade
});


} catch (err) {
console.error('Error updating grade:', err);


res.status(500).json({
  success: false,
  error: err.message
});


}
};

// Delete Grade
exports.deleteGrade = async (req, res) => {
try {
const grade = await Grade.findOne({
_id: req.params.id,
school: req.user.school
});


if (!grade) {
  return res.status(404).json({
    success: false,
    message: 'Grade not found'
  });
}

await grade.deleteOne();

res.json({
  success: true,
  message: 'Grade deleted successfully'
});


} catch (err) {
console.error('Error deleting grade:', err);


res.status(500).json({
  success: false,
  error: err.message
});


}
};
