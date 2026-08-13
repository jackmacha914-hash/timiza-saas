const Class = require('../models/Class');
const User = require('../models/User');


// =====================================================
// HELPER: Validate authenticated school
// =====================================================

const getSchoolId = (req, res) => {
    const schoolId = req.user?.school;

    if (!schoolId) {
        res.status(403).json({
            success: false,
            message: 'User is not associated with a school'
        });

        return null;
    }

    return schoolId;
};


// =====================================================
// CREATE CLASS
// =====================================================

const createClass = async (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);

        if (!schoolId) {
            return;
        }

        const {
            name,
            level,
            section,
            capacity,
            teacherInCharge,
            roomNumber,
            academicYear,
            notes,
            teacher
        } = req.body;


        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Class name is required'
            });
        }

        if (!level) {
            return res.status(400).json({
                success: false,
                message: 'Education level is required'
            });
        }

        if (!academicYear) {
            return res.status(400).json({
                success: false,
                message: 'Academic year is required'
            });
        }


        // -------------------------------------------------
        // TEACHER
        //
        // If a teacher was supplied, make absolutely sure
        // that teacher belongs to the current school.
        // Otherwise use the logged-in teacher.
        // -------------------------------------------------

        let teacherId = teacher || req.user.id;

        if (teacherId) {
            const teacherUser = await User.findOne({
                _id: teacherId,
                school: schoolId,
                role: 'teacher'
            }).select('_id');

            if (!teacherUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Teacher not found in this school'
                });
            }

            teacherId = teacherUser._id;
        }


        // -------------------------------------------------
        // CHECK DUPLICATE CLASS
        // -------------------------------------------------

        const existingClass = await Class.findOne({
            school: schoolId,
            name: name.trim(),
            academicYear: academicYear.trim()
        });

        if (existingClass) {
            return res.status(400).json({
                success: false,
                message: 'A class with this name already exists for this academic year'
            });
        }


        // -------------------------------------------------
        // CREATE CLASS
        // -------------------------------------------------

        const newClass = new Class({
            school: schoolId,

            name: name.trim(),

            level,

            section:
                typeof section === 'string'
                    ? section.trim()
                    : '',

            capacity:
                capacity !== undefined
                    ? Number(capacity)
                    : 30,

            studentCount: 0,

            teacherInCharge:
                teacherInCharge || '',

            roomNumber:
                roomNumber || '',

            academicYear:
                academicYear.trim(),

            notes:
                notes || '',

            teacher: teacherId,

            students: []
        });


        await newClass.save();


        console.log('[CLASS] Class created:', {
            id: newClass._id,
            school: newClass.school,
            name: newClass.name,
            academicYear: newClass.academicYear,
            teacher: newClass.teacher
        });


        return res.status(201).json({
            success: true,
            data: newClass
        });


    } catch (error) {
        console.error('[CLASS] Error creating class:', error);


        // Duplicate index
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'This class already exists in this school for the selected academic year'
            });
        }


        return res.status(500).json({
            success: false,
            message: 'Server error creating class',
            error:
                process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined
        });
    }
};


// =====================================================
// GET TEACHER CLASSES
// =====================================================

const getTeacherClasses = async (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);

        if (!schoolId) {
            return;
        }


        const classes = await Class.find({
            school: schoolId,
            teacher: req.user.id
        })
            .populate({
                path: 'teacher',
                select: 'name email role',
                match: {
                    school: schoolId,
                    role: 'teacher'
                }
            })
            .populate({
                path: 'students',
                match: {
                    school: schoolId,
                    role: 'student'
                },
                select: 'name email class school role'
            })
            .sort({
                createdAt: -1
            })
            .lean();


        // -------------------------------------------------
        // EXTRA SECURITY FILTER
        //
        // Even though MongoDB query above is school scoped,
        // filter populated students again before returning.
        // -------------------------------------------------

        const safeClasses = classes.map(classItem => ({
            ...classItem,

            students: (classItem.students || []).filter(student =>
                student &&
                String(student.school) === String(schoolId) &&
                student.role === 'student'
            )
        }));


        return res.json({
            success: true,
            count: safeClasses.length,
            data: safeClasses
        });


    } catch (error) {
        console.error('[CLASS] Error fetching teacher classes:', error);


        return res.status(500).json({
            success: false,
            message: 'Server error fetching classes',
            error:
                process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined
        });
    }
};


// =====================================================
// GET CLASS BY ID
// =====================================================

const getClassById = async (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);

        if (!schoolId) {
            return;
        }


        const classData = await Class.findOne({
            _id: req.params.id,

            // CRITICAL TENANT FILTER
            school: schoolId,

            // Teacher can only access their own class
            teacher: req.user.id
        })
            .populate({
                path: 'teacher',
                select: 'name email role school',

                match: {
                    school: schoolId,
                    role: 'teacher'
                }
            })
            .populate({
                path: 'students',

                // CRITICAL TENANT FILTER
                match: {
                    school: schoolId,
                    role: 'student'
                },

                select: 'name email class classAssigned profile school role'
            })
            .lean();


        if (!classData) {
            return res.status(404).json({
                success: false,
                message: 'Class not found or not authorized'
            });
        }


        // -------------------------------------------------
        // EXTRA STUDENT SECURITY FILTER
        // -------------------------------------------------

        classData.students = (classData.students || [])
            .filter(student =>
                student &&
                String(student.school) === String(schoolId) &&
                student.role === 'student'
            );


        // Keep count accurate
        classData.studentCount = classData.students.length;


        return res.json({
            success: true,
            data: classData
        });


    } catch (error) {
        console.error('[CLASS] Error fetching class:', error);


        return res.status(500).json({
            success: false,
            message: 'Server error fetching class',
            error:
                process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined
        });
    }
};


// =====================================================
// UPDATE CLASS
// =====================================================

const updateClass = async (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);

        if (!schoolId) {
            return;
        }


        const {
            name,
            level,
            section,
            capacity,
            teacherInCharge,
            roomNumber,
            academicYear,
            notes,
            teacher
        } = req.body;


        // -------------------------------------------------
        // BUILD UPDATE OBJECT
        // -------------------------------------------------

        const updateData = {};


        if (name !== undefined) {
            updateData.name = name.trim();
        }

        if (level !== undefined) {
            updateData.level = level;
        }

        if (section !== undefined) {
            updateData.section = section.trim();
        }

        if (capacity !== undefined) {
            updateData.capacity = Number(capacity);
        }

        if (teacherInCharge !== undefined) {
            updateData.teacherInCharge = teacherInCharge;
        }

        if (roomNumber !== undefined) {
            updateData.roomNumber = roomNumber;
        }

        if (academicYear !== undefined) {
            updateData.academicYear = academicYear.trim();
        }

        if (notes !== undefined) {
            updateData.notes = notes;
        }


        // -------------------------------------------------
        // IF CHANGING TEACHER
        // VERIFY TEACHER BELONGS TO SAME SCHOOL
        // -------------------------------------------------

        if (teacher !== undefined) {

            const teacherUser = await User.findOne({
                _id: teacher,
                school: schoolId,
                role: 'teacher'
            }).select('_id');

            if (!teacherUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Teacher not found in this school'
                });
            }

            updateData.teacher = teacherUser._id;
        }


        // -------------------------------------------------
        // UPDATE ONLY THIS SCHOOL'S CLASS
        // -------------------------------------------------

        const updatedClass = await Class.findOneAndUpdate(

            {
                _id: req.params.id,

                // CRITICAL TENANT FILTER
                school: schoolId,

                // Teacher ownership
                teacher: req.user.id
            },

            updateData,

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


        return res.json({
            success: true,
            data: updatedClass
        });


    } catch (error) {
        console.error('[CLASS] Error updating class:', error);


        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Another class with this name already exists for this academic year'
            });
        }


        return res.status(500).json({
            success: false,
            message: 'Server error updating class',
            error:
                process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined
        });
    }
};


// =====================================================
// DELETE CLASS
// =====================================================

const deleteClass = async (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);

        if (!schoolId) {
            return;
        }


        const deletedClass = await Class.findOneAndDelete({
            _id: req.params.id,

            // CRITICAL TENANT FILTER
            school: schoolId,

            // Teacher ownership
            teacher: req.user.id
        });


        if (!deletedClass) {
            return res.status(404).json({
                success: false,
                message: 'Class not found or not authorized'
            });
        }


        console.log('[CLASS] Class deleted:', {
            id: deletedClass._id,
            school: schoolId,
            teacher: req.user.id
        });


        return res.json({
            success: true,
            message: 'Class deleted successfully'
        });


    } catch (error) {
        console.error('[CLASS] Error deleting class:', error);


        return res.status(500).json({
            success: false,
            message: 'Server error deleting class',
            error:
                process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined
        });
    }
};


// =====================================================
// ADD STUDENT TO CLASS
// =====================================================

const addStudentToClass = async (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);

        if (!schoolId) {
            return;
        }


        const { studentId } = req.body;


        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: 'Student ID is required'
            });
        }


        // -------------------------------------------------
        // FIND STUDENT IN CURRENT SCHOOL ONLY
        // -------------------------------------------------

        const student = await User.findOne({
            _id: studentId,

            // CRITICAL TENANT FILTER
            school: schoolId,

            role: 'student'
        }).select('_id name email class classAssigned school role');


        if (!student) {
            return res.status(400).json({
                success: false,
                message: 'Student not found in this school'
            });
        }


        // -------------------------------------------------
        // FIND CLASS IN CURRENT SCHOOL ONLY
        // -------------------------------------------------

        const classData = await Class.findOne({
            _id: req.params.id,

            // CRITICAL TENANT FILTER
            school: schoolId,

            // Teacher ownership
            teacher: req.user.id
        });


        if (!classData) {
            return res.status(404).json({
                success: false,
                message: 'Class not found or not authorized'
            });
        }


        // -------------------------------------------------
        // CAPACITY CHECK
        // -------------------------------------------------

        if (
            classData.capacity &&
            classData.students.length >= classData.capacity
        ) {
            return res.status(400).json({
                success: false,
                message: 'Class capacity has been reached'
            });
        }


        // -------------------------------------------------
        // PREVENT DUPLICATE
        // -------------------------------------------------

        const alreadyInClass =
            classData.students.some(
                id => String(id) === String(studentId)
            );


        if (alreadyInClass) {
            return res.status(400).json({
                success: false,
                message: 'Student is already in this class'
            });
        }


        // -------------------------------------------------
        // ADD STUDENT
        // -------------------------------------------------

        classData.students.push(student._id);

        classData.studentCount =
            classData.students.length;


        await classData.save();


        // -------------------------------------------------
        // RETURN ONLY SCHOOL STUDENTS
        // -------------------------------------------------

        const updatedClass = await Class.findOne({
            _id: classData._id,
            school: schoolId
        })
            .populate({
                path: 'students',
                match: {
                    school: schoolId,
                    role: 'student'
                },
                select: 'name email class classAssigned school role'
            })
            .lean();


        return res.json({
            success: true,
            message: 'Student added to class successfully',
            data: updatedClass
        });


    } catch (error) {
        console.error('[CLASS] Error adding student:', error);


        return res.status(500).json({
            success: false,
            message: 'Server error adding student',
            error:
                process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined
        });
    }
};


// =====================================================
// REMOVE STUDENT FROM CLASS
// =====================================================

const removeStudentFromClass = async (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);

        if (!schoolId) {
            return;
        }


        const { studentId } = req.body;


        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: 'Student ID is required'
            });
        }


        // -------------------------------------------------
        // VERIFY STUDENT BELONGS TO CURRENT SCHOOL
        // -------------------------------------------------

        const student = await User.findOne({
            _id: studentId,
            school: schoolId,
            role: 'student'
        }).select('_id');


        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found in this school'
            });
        }


        // -------------------------------------------------
        // REMOVE ONLY FROM THIS SCHOOL'S CLASS
        // -------------------------------------------------

        const updatedClass = await Class.findOneAndUpdate(

            {
                _id: req.params.id,

                // CRITICAL TENANT FILTER
                school: schoolId,

                // Teacher ownership
                teacher: req.user.id
            },

            {
                $pull: {
                    students: studentId
                }
            },

            {
                new: true,
                runValidators: true
            }
        )
            .populate({
                path: 'students',
                match: {
                    school: schoolId,
                    role: 'student'
                },
                select: 'name email class classAssigned school role'
            })
            .lean();


        if (!updatedClass) {
            return res.status(404).json({
                success: false,
                message: 'Class not found or not authorized'
            });
        }


        // -------------------------------------------------
        // UPDATE COUNT
        // -------------------------------------------------

        const studentCount =
            updatedClass.students?.length || 0;


        await Class.updateOne(
            {
                _id: updatedClass._id,
                school: schoolId
            },
            {
                $set: {
                    studentCount
                }
            }
        );


        updatedClass.studentCount = studentCount;


        return res.json({
            success: true,
            message: 'Student removed from class successfully',
            data: updatedClass
        });


    } catch (error) {
        console.error('[CLASS] Error removing student:', error);


        return res.status(500).json({
            success: false,
            message: 'Server error removing student',
            error:
                process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    createClass,
    getTeacherClasses,
    getClassById,
    updateClass,
    deleteClass,
    addStudentToClass,
    removeStudentFromClass
};
