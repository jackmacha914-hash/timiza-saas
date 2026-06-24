const Class = require('../models/Class');
const User = require('../models/User');

// Create Class
const createClass = async (req, res) => {
try {
const { name, description, subject, schedule, academicYear } = req.body;

```
const newClass = new Class({
  school: req.user.school,
  name,
  description,
  teacher: req.user.id,
  subject,
  schedule,
  academicYear,
  students: []
});

await newClass.save();

res.status(201).json({
  success: true,
  data: newClass
});
```

} catch (error) {
console.error('Error creating class:', error);

```
res.status(500).json({
  success: false,
  message: 'Server error creating class'
});
```

}
};

// Get Teacher Classes
const getTeacherClasses = async (req, res) => {
try {
const classes = await Class.find({
school: req.user.school,
teacher: req.user.id
})
.populate('students', 'name email class')
.sort({ createdAt: -1 });

```
res.json({
  success: true,
  data: classes
});
```

} catch (error) {
console.error('Error fetching classes:', error);

```
res.status(500).json({
  success: false,
  message: 'Server error fetching classes'
});
```

}
};

// Get Class By ID
const getClassById = async (req, res) => {
try {
const classData = await Class.findOne({
_id: req.params.id,
school: req.user.school
})
.populate('teacher', 'name email')
.populate('students', 'name email class');

```
if (!classData) {
  return res.status(404).json({
    success: false,
    message: 'Class not found'
  });
}

res.json({
  success: true,
  data: classData
});
```

} catch (error) {
console.error('Error fetching class:', error);

```
res.status(500).json({
  success: false,
  message: 'Server error fetching class'
});
```

}
};

// Update Class
const updateClass = async (req, res) => {
try {
const { name, description, subject, schedule, academicYear } = req.body;

```
const updatedClass = await Class.findOneAndUpdate(
  {
    _id: req.params.id,
    school: req.user.school,
    teacher: req.user.id
  },
  {
    name,
    description,
    subject,
    schedule,
    academicYear
  },
  {
    new: true,
    runValidators: true
  }
);

if (!updatedClass) {
  return res.status(404).json({
    success: false,
    message: 'Class not found or not authorized'
  });
}

res.json({
  success: true,
  data: updatedClass
});
```

} catch (error) {
console.error('Error updating class:', error);

```
res.status(500).json({
  success: false,
  message: 'Server error updating class'
});
```

}
};

// Delete Class
const deleteClass = async (req, res) => {
try {
const deletedClass = await Class.findOneAndDelete({
_id: req.params.id,
school: req.user.school,
teacher: req.user.id
});

```
if (!deletedClass) {
  return res.status(404).json({
    success: false,
    message: 'Class not found or not authorized'
  });
}

res.json({
  success: true,
  message: 'Class deleted successfully'
});
```

} catch (error) {
console.error('Error deleting class:', error);

```
res.status(500).json({
  success: false,
  message: 'Server error deleting class'
});
```

}
};

// Add Student To Class
const addStudentToClass = async (req, res) => {
try {
const { studentId } = req.body;

```
const student = await User.findOne({
  _id: studentId,
  school: req.user.school,
  role: 'student'
});

if (!student) {
  return res.status(400).json({
    success: false,
    message: 'Student not found in this school'
  });
}

const updatedClass = await Class.findOneAndUpdate(
  {
    _id: req.params.id,
    school: req.user.school,
    teacher: req.user.id
  },
  {
    $addToSet: { students: studentId }
  },
  {
    new: true
  }
).populate('students', 'name email class');

if (!updatedClass) {
  return res.status(404).json({
    success: false,
    message: 'Class not found or not authorized'
  });
}

res.json({
  success: true,
  data: updatedClass
});
```

} catch (error) {
console.error('Error adding student:', error);

```
res.status(500).json({
  success: false,
  message: 'Server error adding student'
});
```

}
};

// Remove Student From Class
const removeStudentFromClass = async (req, res) => {
try {
const { studentId } = req.body;

```
const updatedClass = await Class.findOneAndUpdate(
  {
    _id: req.params.id,
    school: req.user.school,
    teacher: req.user.id
  },
  {
    $pull: { students: studentId }
  },
  {
    new: true
  }
).populate('students', 'name email class');

if (!updatedClass) {
  return res.status(404).json({
    success: false,
    message: 'Class not found or not authorized'
  });
}

res.json({
  success: true,
  data: updatedClass
});
```

} catch (error) {
console.error('Error removing student:', error);

```
res.status(500).json({
  success: false,
  message: 'Server error removing student'
});
```

}
};

module.exports = {
createClass,
getTeacherClasses,
getClassById,
updateClass,
deleteClass,
addStudentToClass,
removeStudentFromClass
};
