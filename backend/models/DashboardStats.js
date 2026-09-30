const mongoose = require('mongoose');

const dashboardStatsSchema = new mongoose.Schema({
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true
    },

    totalStudents: {
        type: Number,
        default: 0
    },

    totalTeachers: {
        type: Number,
        default: 0
    },

    totalClasses: {
        type: Number,
        default: 0
    },

    attendanceRate: {
        type: Number,
        default: 0
    },

    recentActivities: [{
        type: {
            type: String,
            enum: [
                'student_added',
                'teacher_added',
                'attendance_taken',
                'grade_updated',
                'assignment_added'
            ],
            required: true
        },

        description: {
            type: String,
            required: true
        },

        timestamp: {
            type: Date,
            default: Date.now
        },

        metadata: {
            studentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },

            teacherId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },

            classId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Class'
            }
        }
    }],

    lastUpdated: {
        type: Date,
        default: Date.now
    }

}, {
    timestamps: true
});


// One stats document per school
dashboardStatsSchema.index(
    { school: 1 },
    { unique: true }
);


// Get stats for a specific school
dashboardStatsSchema.statics.getStats = async function (schoolId) {

    let stats = await this.findOne({
        school: schoolId
    });

    if (!stats) {
        stats = await this.create({
            school: schoolId,
            totalStudents: 0,
            totalTeachers: 0,
            totalClasses: 0,
            attendanceRate: 0,
            recentActivities: []
        });
    }

    return stats;
};


// Update student count
dashboardStatsSchema.statics.updateStudentCount = async function (
    schoolId,
    change
) {
    const stats = await this.getStats(schoolId);

    stats.totalStudents += change;

    await stats.save();

    return stats;
};


// Update teacher count
dashboardStatsSchema.statics.updateTeacherCount = async function (
    schoolId,
    change
) {
    const stats = await this.getStats(schoolId);

    stats.totalTeachers += change;

    await stats.save();

    return stats;
};


// Add activity
dashboardStatsSchema.statics.addActivity = async function (
    schoolId,
    activity
) {
    const stats = await this.getStats(schoolId);

    stats.recentActivities.unshift({
        type: activity.type,
        description: activity.description,
        metadata: activity.metadata || {}
    });

    if (stats.recentActivities.length > 10) {
        stats.recentActivities =
            stats.recentActivities.slice(0, 10);
    }

    stats.lastUpdated = new Date();

    await stats.save();

    return stats;
};

module.exports =
    mongoose.models.DashboardStats ||
    mongoose.model('DashboardStats', dashboardStatsSchema);
