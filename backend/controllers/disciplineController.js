const mongoose = require('mongoose');
const Discipline = require('../models/Discipline');
const User = require('../models/User');


// =====================================================
// HELPERS
// =====================================================

const getSchoolId = (req) => {
    return (
        req.user?.school ||
        req.school?._id ||
        req.school
    );
};


const getUserId = (req) => {
    return (
        req.user?.id ||
        req.user?._id ||
        req.user?.userId
    );
};


const getUserRole = (req) => {
    return String(
        req.user?.role || ''
    )
        .toLowerCase()
        .trim();
};


// =====================================================
// CHECK DISCIPLINE MASTER
// =====================================================
//
// A teacher is a Discipline Master when:
//
// user.role === teacher
// AND
// user.disciplineMaster === true
//
// Admins automatically have full access.
//

const isDisciplineMaster = async (req) => {

    const role = getUserRole(req);

    if (role === 'admin') {
        return true;
    }

    if (role !== 'teacher') {
        return false;
    }

    const userId = getUserId(req);
    const schoolId = getSchoolId(req);

    if (!userId || !schoolId) {
        return false;
    }

    const teacher = await User.findOne({
        _id: userId,
        school: schoolId,
        role: 'teacher',
        disciplineMaster: true
    }).select('_id');

    return !!teacher;
};


// =====================================================
// CREATE DISCIPLINE CASE
// =====================================================
//
// Admin + Teacher
//
// IMPORTANT:
// reportedBy now stores the ACTUAL USER ID.
//
// This means we know exactly who created/reported
// the discipline case.
//

const createDisciplineCase = async (req, res) => {

    try {

        const {
            student,
            admissionNumber,
            className,
            category,
            severity,
            description,
            incidentDate,
            actionTaken,
            status,
            resolutionNotes
        } = req.body;


        console.log('======================================');
        console.log('[DISCIPLINE CREATE]');
        console.log('Authenticated user:', {
            id: getUserId(req),
            role: getUserRole(req),
            school: getSchoolId(req)
        });
        console.log('Body:', req.body);
        console.log('======================================');


        // =================================================
        // AUTH USER
        // =================================================

        const userId = getUserId(req);
        const role = getUserRole(req);
        const schoolId = getSchoolId(req);


        if (!userId) {

            return res.status(401).json({
                success: false,
                message: 'Authenticated user could not be determined.'
            });

        }


        if (!schoolId) {

            return res.status(400).json({
                success: false,
                message: 'School could not be determined.'
            });

        }


        if (!['admin', 'teacher'].includes(role)) {

            return res.status(403).json({
                success: false,
                message: 'Only administrators and teachers can report discipline cases.'
            });

        }


        // =================================================
        // REQUIRED FIELDS
        // =================================================

        if (!student) {

            return res.status(400).json({
                success: false,
                message: 'Student is required.'
            });

        }


        if (!category) {

            return res.status(400).json({
                success: false,
                message: 'Discipline category is required.'
            });

        }


        if (!description) {

            return res.status(400).json({
                success: false,
                message: 'Incident description is required.'
            });

        }


        if (!incidentDate) {

            return res.status(400).json({
                success: false,
                message: 'Incident date is required.'
            });

        }


        // =================================================
        // VERIFY REPORTING USER
        // =================================================

        const reportingUser = await User.findOne({
            _id: userId,
            school: schoolId
        }).select('_id name email role');


        if (!reportingUser) {

            return res.status(403).json({
                success: false,
                message: 'Authenticated user does not belong to this school.'
            });

        }


        // =================================================
        // FIND STUDENT
        //
        // Accept:
        // 1. MongoDB ObjectId
        // 2. Admission number
        // 3. Exact student name
        // =================================================

        let studentUser = null;


        // -----------------------------------------------
        // CASE 1: MongoDB ID
        // -----------------------------------------------

        if (
            mongoose.Types.ObjectId.isValid(student)
        ) {

            studentUser =
                await User.findOne({
                    _id: student,
                    school: schoolId,
                    role: 'student'
                });

        }


        // -----------------------------------------------
        // CASE 2: Admission Number
        // -----------------------------------------------

        if (
            !studentUser &&
            admissionNumber
        ) {

            studentUser =
                await User.findOne({
                    school: schoolId,
                    role: 'student',
                    admissionNumber:
                        admissionNumber.trim()
                });

        }


        // -----------------------------------------------
        // CASE 3: Student Name
        // -----------------------------------------------

        if (!studentUser) {

            const searchName =
                String(student).trim();


            studentUser =
                await User.findOne({
                    school: schoolId,
                    role: 'student',
                    $or: [
                        {
                            name: searchName
                        },
                        {
                            fullName: searchName
                        }
                    ]
                });

        }


        // -----------------------------------------------
        // STUDENT NOT FOUND
        // -----------------------------------------------

        if (!studentUser) {

            return res.status(404).json({

                success: false,

                message:
                    'Student not found in this school. Please enter the student ID, admission number, or exact student name.'

            });

        }


        console.log(
            '[DISCIPLINE] Student resolved:',
            {
                id: studentUser._id,
                name: studentUser.name,
                admissionNumber:
                    studentUser.admissionNumber
            }
        );


        // =================================================
        // CREATE DISCIPLINE CASE
        // =================================================

        const discipline =
            await Discipline.create({

                school:
                    schoolId,

                student:
                    studentUser._id,

                admissionNumber:
                    admissionNumber ||
                    studentUser.admissionNumber ||
                    '',

                className:
                    className ||
                    studentUser.class ||
                    studentUser.classAssigned ||
                    '',

                category,

                severity:
                    severity || 'low',

                description:
                    String(description).trim(),

                incidentDate:
                    new Date(incidentDate),

                // IMPORTANT:
                // Store the actual User ID
                reportedBy:
                    reportingUser._id,

                actionTaken:
                    actionTaken || '',

                status:
                    status || 'reported',

                resolutionNotes:
                    resolutionNotes || ''

            });


        // =================================================
        // POPULATE RESPONSE
        // =================================================

        const populated =
            await Discipline.findById(
                discipline._id
            )
            .populate(
                'student',
                'name email admissionNumber class classAssigned'
            )
            .populate(
                'reportedBy',
                'name email role'
            );


        // =================================================
        // RESPONSE
        // =================================================

        return res.status(201).json({

            success: true,

            message:
                'Discipline case recorded successfully',

            discipline:
                populated

        });


    } catch (error) {

        console.error(
            '======================================'
        );

        console.error(
            '[DISCIPLINE CREATE ERROR]'
        );

        console.error(error);

        console.error(
            '======================================'
        );


        return res.status(500).json({

            success: false,

            message:
                'Failed to create discipline case',

            error:
                error.message

        });

    }

};


// =====================================================
// GET DISCIPLINE CASES
// =====================================================
//
// ADMIN:
//     All cases
//
// DISCIPLINE MASTER:
//     All cases
//
// NORMAL TEACHER:
//     Only cases they reported
//
// =====================================================

const getDisciplineCases = async (req, res) => {

    try {

        const schoolId = getSchoolId(req);
        const userId = getUserId(req);
        const role = getUserRole(req);


        if (!schoolId) {

            return res.status(400).json({
                success: false,
                message: 'School could not be determined.'
            });

        }


        if (!userId) {

            return res.status(401).json({
                success: false,
                message: 'Authenticated user could not be determined.'
            });

        }


        // =================================================
        // BASE FILTER
        // =================================================

        const filter = {
            school: schoolId
        };


        // =================================================
        // ACCESS CONTROL
        // =================================================

        const fullAccess =
            await isDisciplineMaster(req);


        // Normal teachers only see their own reports
        if (
            role === 'teacher' &&
            !fullAccess
        ) {

            filter.reportedBy = userId;

        }


        // Any unsupported role should not see records
        if (
            !['admin', 'teacher'].includes(role)
        ) {

            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view discipline cases.'
            });

        }


        console.log(
            '[DISCIPLINE GET] Filter:',
            filter
        );


        // =================================================
        // OPTIONAL FILTERS
        // =================================================
        //
        // Examples:
        //
        // ?status=reported
        // ?severity=high
        // ?category=Bullying
        // ?className=Grade 6
        // ?student=<id>
        // ?reportedBy=<id>
        //
        // Admin / Discipline Master can use reportedBy.
        // Normal teachers cannot override their own filter.
        // =================================================

        const {
            status,
            severity,
            category,
            className,
            student,
            reportedBy,
            fromDate,
            toDate
        } = req.query;


        if (status) {

            filter.status = status;

        }


        if (severity) {

            filter.severity = severity;

        }


        if (category) {

            filter.category = category;

        }


        if (className) {

            filter.className = className;

        }


        if (
            student &&
            mongoose.Types.ObjectId.isValid(student)
        ) {

            filter.student = student;

        }


        // Only admin / discipline master can select
        // another reporter.
        if (
            reportedBy &&
            fullAccess &&
            mongoose.Types.ObjectId.isValid(reportedBy)
        ) {

            filter.reportedBy = reportedBy;

        }


        // =================================================
        // DATE FILTER
        // =================================================

        if (fromDate || toDate) {

            filter.incidentDate = {};

            if (fromDate) {

                filter.incidentDate.$gte =
                    new Date(`${fromDate}T00:00:00.000Z`);

            }

            if (toDate) {

                filter.incidentDate.$lte =
                    new Date(`${toDate}T23:59:59.999Z`);

            }

        }


        // =================================================
        // FETCH
        // =================================================

        const cases =
            await Discipline.find(filter)
                .populate(
                    'student',
                    'name email admissionNumber class classAssigned'
                )
                .populate(
                    'reportedBy',
                    'name email role'
                )
                .sort({
                    incidentDate: -1,
                    createdAt: -1
                });


        return res.json({

            success: true,

            discipline:
                cases,

            count:
                cases.length,

            access:
                role === 'admin'
                    ? 'admin'
                    : fullAccess
                        ? 'discipline_master'
                        : 'own_reports'

        });


    } catch (error) {

        console.error(
            '[DISCIPLINE GET]',
            error
        );


        return res.status(500).json({

            success: false,

            message:
                'Failed to load discipline records',

            error:
                error.message

        });

    }

};


// =====================================================
// GET ONE DISCIPLINE CASE
// =====================================================
//
// Same visibility rules as GET ALL.
//
// Admin / Discipline Master:
//     Any case in school
//
// Teacher:
//     Only their own case
//
// =====================================================

const getDisciplineCase = async (req, res) => {

    try {

        const schoolId = getSchoolId(req);
        const userId = getUserId(req);
        const role = getUserRole(req);


        if (!schoolId || !userId) {

            return res.status(401).json({
                success: false,
                message: 'Authentication information is incomplete.'
            });

        }


        const fullAccess =
            await isDisciplineMaster(req);


        const filter = {

            _id:
                req.params.id,

            school:
                schoolId

        };


        // Normal teacher can only access
        // their own report.
        if (
            role === 'teacher' &&
            !fullAccess
        ) {

            filter.reportedBy =
                userId;

        }


        if (
            !['admin', 'teacher'].includes(role)
        ) {

            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view discipline cases.'
            });

        }


        const discipline =
            await Discipline.findOne(
                filter
            )
            .populate(
                'student',
                'name email admissionNumber class classAssigned'
            )
            .populate(
                'reportedBy',
                'name email role'
            );


        if (!discipline) {

            return res.status(404).json({

                success: false,

                message:
                    'Discipline case not found or you are not authorized to view it.'

            });

        }


        return res.json({

            success: true,

            discipline

        });


    } catch (error) {

        console.error(
            '[DISCIPLINE GET ONE]',
            error
        );


        return res.status(500).json({

            success: false,

            message:
                'Failed to load discipline case',

            error:
                error.message

        });

    }

};


// =====================================================
// UPDATE CASE
// =====================================================
//
// ADMIN:
//     Can update any case
//
// DISCIPLINE MASTER:
//     Can update any case
//
// NORMAL TEACHER:
//     Can update only cases they reported
//
// =====================================================

const updateDisciplineCase = async (req, res) => {

    try {

        const schoolId = getSchoolId(req);
        const userId = getUserId(req);
        const role = getUserRole(req);


        if (!schoolId || !userId) {

            return res.status(401).json({
                success: false,
                message: 'Authentication information is incomplete.'
            });

        }


        const fullAccess =
            await isDisciplineMaster(req);


        // =================================================
        // FIND CASE FIRST
        // =================================================

        const filter = {

            _id:
                req.params.id,

            school:
                schoolId

        };


        if (
            role === 'teacher' &&
            !fullAccess
        ) {

            filter.reportedBy =
                userId;

        }


        const existingCase =
            await Discipline.findOne(
                filter
            );


        if (!existingCase) {

            return res.status(404).json({

                success: false,

                message:
                    'Discipline case not found or you are not authorized to update it.'

            });

        }


        // =================================================
        // ALLOWED FIELDS
        // =================================================

        const allowedFields = [

            'category',
            'severity',
            'description',
            'incidentDate',
            'actionTaken',
            'status',
            'resolutionNotes'

        ];


        const updates = {};


        allowedFields.forEach(field => {

            if (
                req.body[field] !== undefined
            ) {

                updates[field] =
                    req.body[field];

            }

        });


        // =================================================
        // RESOLUTION DATE
        // =================================================

        if (
            updates.status === 'resolved'
        ) {

            updates.resolvedAt =
                new Date();

        }


        if (
            updates.status &&
            updates.status !== 'resolved'
        ) {

            updates.resolvedAt =
                null;

        }


        // =================================================
        // UPDATE
        // =================================================

        const discipline =
            await Discipline.findOneAndUpdate(

                {
                    _id:
                        req.params.id,

                    school:
                        schoolId

                },

                updates,

                {
                    new: true,
                    runValidators: true
                }

            )
            .populate(
                'student',
                'name email admissionNumber class classAssigned'
            )
            .populate(
                'reportedBy',
                'name email role'
            );


        return res.json({

            success: true,

            message:
                'Discipline case updated successfully',

            discipline

        });


    } catch (error) {

        console.error(
            '[DISCIPLINE UPDATE]',
            error
        );


        return res.status(500).json({

            success: false,

            message:
                'Failed to update discipline case',

            error:
                error.message

        });

    }

};


// =====================================================
// DELETE CASE
// =====================================================
//
// ADMIN:
//     Can delete any case
//
// DISCIPLINE MASTER:
//     Can delete any case
//
// NORMAL TEACHER:
//     Can delete only cases they reported
//
// =====================================================

const deleteDisciplineCase = async (req, res) => {

    try {

        const schoolId = getSchoolId(req);
        const userId = getUserId(req);
        const role = getUserRole(req);


        if (!schoolId || !userId) {

            return res.status(401).json({
                success: false,
                message: 'Authentication information is incomplete.'
            });

        }


        const fullAccess =
            await isDisciplineMaster(req);


        const filter = {

            _id:
                req.params.id,

            school:
                schoolId

        };


        if (
            role === 'teacher' &&
            !fullAccess
        ) {

            filter.reportedBy =
                userId;

        }


        const discipline =
            await Discipline.findOneAndDelete(
                filter
            );


        if (!discipline) {

            return res.status(404).json({

                success: false,

                message:
                    'Discipline case not found or you are not authorized to delete it.'

            });

        }


        return res.json({

            success: true,

            message:
                'Discipline case deleted successfully'

        });


    } catch (error) {

        console.error(
            '[DISCIPLINE DELETE]',
            error
        );


        return res.status(500).json({

            success: false,

            message:
                'Failed to delete discipline case',

            error:
                error.message

        });

    }

};


// =====================================================
// GET TEACHERS
// ADMIN ONLY
// =====================================================
//
// Used by the Discipline page to populate:
//
// - Class Teacher assignment
// - Discipline Master assignment
//
// =====================================================

const getDisciplineTeachers = async (req, res) => {

    try {

        const schoolId =
            getSchoolId(req);


        if (!schoolId) {

            return res.status(400).json({
                success: false,
                message: 'School could not be determined.'
            });

        }


        const teachers =
            await User.find({

                school:
                    schoolId,

                role:
                    'teacher'

            })
            .select(
                '_id name email class classAssigned profile disciplineMaster'
            )
            .sort({
                name: 1
            });


        return res.json({

            success: true,

            teachers

        });


    } catch (error) {

        console.error(
            '[DISCIPLINE TEACHERS GET]',
            error
        );


        return res.status(500).json({

            success: false,

            message:
                'Failed to load teachers',

            error:
                error.message

        });

    }

};


// =====================================================
// ASSIGN / REMOVE DISCIPLINE MASTER
// ADMIN ONLY
// =====================================================
//
// Body:
//
// {
//     "teacherId": "...",
//     "disciplineMaster": true
// }
//
// =====================================================

const assignDisciplineMaster = async (req, res) => {

    try {

        const schoolId =
            getSchoolId(req);


        const {
            teacherId,
            disciplineMaster
        } = req.body;


        if (!teacherId) {

            return res.status(400).json({

                success: false,

                message:
                    'Teacher ID is required.'

            });

        }


        if (
            !mongoose.Types.ObjectId.isValid(
                teacherId
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid teacher ID.'

            });

        }


        const teacher =
            await User.findOne({

                _id:
                    teacherId,

                school:
                    schoolId,

                role:
                    'teacher'

            });


        if (!teacher) {

            return res.status(404).json({

                success: false,

                message:
                    'Teacher not found in this school.'

            });

        }


        teacher.disciplineMaster =
            Boolean(disciplineMaster);


        await teacher.save();


        return res.json({

            success: true,

            message:
                teacher.disciplineMaster
                    ? `${teacher.name} is now a Discipline Master.`
                    : `${teacher.name} is no longer a Discipline Master.`,

            teacher: {

                _id:
                    teacher._id,

                name:
                    teacher.name,

                email:
                    teacher.email,

                disciplineMaster:
                    teacher.disciplineMaster

            }

        });


    } catch (error) {

        console.error(
            '[DISCIPLINE MASTER ASSIGN ERROR]',
            error
        );


        return res.status(500).json({

            success: false,

            message:
                'Failed to update Discipline Master assignment',

            error:
                error.message

        });

    }

};


// =====================================================
// GET DISCIPLINE SUMMARY
// =====================================================
//
// Useful for the Discipline dashboard.
//
// Returns:
//
// total
// reported
// under investigation
// high severity
// critical severity
// resolved
//
// =====================================================

const getDisciplineSummary = async (req, res) => {

    try {

        const schoolId =
            getSchoolId(req);

        const userId =
            getUserId(req);

        const role =
            getUserRole(req);


        if (!schoolId || !userId) {

            return res.status(401).json({
                success: false,
                message: 'Authentication information is incomplete.'
            });

        }


        const fullAccess =
            await isDisciplineMaster(req);


        const match = {

            school:
                new mongoose.Types.ObjectId(
                    schoolId
                )

        };


        if (
            role === 'teacher' &&
            !fullAccess
        ) {

            match.reportedBy =
                new mongoose.Types.ObjectId(
                    userId
                );

        }


        if (
            !['admin', 'teacher'].includes(role)
        ) {

            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view discipline summary.'
            });

        }


        const [
            total,
            reported,
            underInvestigation,
            high,
            critical,
            resolved
        ] = await Promise.all([

            Discipline.countDocuments(
                match
            ),

            Discipline.countDocuments({
                ...match,
                status: 'reported'
            }),

            Discipline.countDocuments({
                ...match,
                status: 'under_investigation'
            }),

            Discipline.countDocuments({
                ...match,
                severity: 'high'
            }),

            Discipline.countDocuments({
                ...match,
                severity: 'critical'
            }),

            Discipline.countDocuments({
                ...match,
                status: 'resolved'
            })

        ]);


        return res.json({

            success: true,

            summary: {

                total,

                reported,

                underInvestigation,

                high,

                critical,

                resolved

            }

        });


    } catch (error) {

        console.error(
            '[DISCIPLINE SUMMARY ERROR]',
            error
        );


        return res.status(500).json({

            success: false,

            message:
                'Failed to load discipline summary',

            error:
                error.message

        });

    }

};


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    createDisciplineCase,

    getDisciplineCases,

    getDisciplineCase,

    updateDisciplineCase,

    deleteDisciplineCase,

    getDisciplineTeachers,

    assignDisciplineMaster,

    getDisciplineSummary

};
