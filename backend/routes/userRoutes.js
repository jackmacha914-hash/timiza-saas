const express = require('express');
const User = require('../models/User');
const SchoolUser = require('../models/SchoolUser');

const router = express.Router();
const { protect } = require('../middleware/auth');

// =====================================================
// DEBUG MIDDLEWARE
// =====================================================

router.use((req, res, next) => {
    console.log(
        `[${new Date().toISOString()}] User route accessed: ${req.method} ${req.originalUrl}`
    );

    console.log('Request origin:', req.headers.origin);
    console.log('Request headers:', req.headers);

    next();
});

// =====================================================
// GET CURRENT USER PROFILE
// GET /api/users/me
// =====================================================

router.get('/me', protect, async (req, res) => {

    console.log('[DEBUG] GET /api/users/me - Start');
    console.log('[DEBUG] Authenticated user:', req.user);

    try {

        // =================================================
        // GET USER ID FROM JWT
        // =================================================

        const userId =
            req.user.userId ||
            req.user.id ||
            req.user._id;

        console.log(
            '[DEBUG] Fetching user profile for user ID:',
            userId
        );

        if (!userId) {

            console.error(
                '[ERROR] No user ID found in request'
            );

            return res.status(400).json({
                success: false,
                message: 'User ID not found in token',
                user: req.user
            });
        }

        // =================================================
        // SCHOOL FROM JWT
        // =================================================

        const schoolId = req.user.school;

        console.log(
            '[DEBUG] Authenticated school:',
            schoolId
        );

        if (!schoolId) {

            console.error(
                '[ERROR] No school found in authenticated user'
            );

            return res.status(403).json({
                success: false,
                message: 'School not found in authenticated user'
            });
        }

        // =================================================
        // FIRST: LOOK FOR USER IN SCHOOLUSER
        // =================================================
        //
        // Your newer school-based users are stored here.
        //
        // IMPORTANT:
        // We restrict by BOTH _id and school.
        // =================================================

        let schoolUser = await SchoolUser.findOne({
            _id: userId,
            school: schoolId
        })
            .select('-password')
            .lean();

        if (schoolUser) {

            console.log(
                '[DEBUG] User found in SchoolUser:',
                {
                    _id: schoolUser._id,
                    email: schoolUser.email,
                    role: schoolUser.role,
                    studentClass: schoolUser.studentClass,
                    school: schoolUser.school
                }
            );

            // =================================================
            // RETURN SCHOOL USER
            // =================================================

            return res.json({
                success: true,
                user: {
                    _id: schoolUser._id,
                    id: schoolUser._id,

                    name: schoolUser.name || '',

                    email: schoolUser.email || '',

                    firstName:
                        schoolUser.firstName ||
                        (schoolUser.name
                            ? schoolUser.name.split(' ')[0]
                            : ''),

                    lastName:
                        schoolUser.lastName ||
                        (schoolUser.name
                            ? schoolUser.name
                                .split(' ')
                                .slice(1)
                                .join(' ')
                            : ''),

                    role: schoolUser.role || '',

                    class:
                        schoolUser.studentClass ||
                        schoolUser.class ||
                        schoolUser.classAssigned ||
                        '',

                    studentClass:
                        schoolUser.studentClass ||
                        schoolUser.class ||
                        schoolUser.classAssigned ||
                        '',

                    subject:
                        schoolUser.subject || '',

                    school: schoolUser.school,

                    completedQuizzes: []
                }
            });
        }

        // =================================================
        // SECOND: LOOK FOR USER IN OLD USER MODEL
        // =================================================
        //
        // Keep this because your existing application
        // still uses User for some functionality,
        // including completed quizzes.
        //
        // IMPORTANT:
        // We also restrict this lookup to the JWT school.
        // =================================================

        const user = await User.findOne({
            _id: userId,
            school: schoolId
        })
            .select('-password')
            .lean();

        if (!user) {

            console.error(
                '[ERROR] User not found in either SchoolUser or User:',
                {
                    userId,
                    schoolId
                }
            );

            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log(
            '[DEBUG] User found in User model:',
            {
                _id: user._id,
                email: user.email,
                role: user.role,
                class: user.class,
                completedQuizzesCount:
                    user.completedQuizzes
                        ? user.completedQuizzes.length
                        : 0
            }
        );

        // =================================================
        // NO COMPLETED QUIZZES
        // =================================================

        if (
            !user.completedQuizzes ||
            user.completedQuizzes.length === 0
        ) {

            console.log(
                '[DEBUG] No completed quizzes found for user:',
                user._id
            );

            return res.json({
                success: true,

                user: {
                    _id: user._id,
                    id: user._id,

                    email: user.email || '',

                    name: user.name || '',

                    firstName:
                        user.firstName || '',

                    lastName:
                        user.lastName || '',

                    role:
                        user.role || '',

                    class:
                        user.class ||
                        user.classAssigned ||
                        user.profile?.class ||
                        '',

                    studentClass:
                        user.class ||
                        user.classAssigned ||
                        user.profile?.class ||
                        '',

                    school: user.school,

                    completedQuizzes: []
                }
            });
        }

        // =================================================
        // USER HAS COMPLETED QUIZZES
        // =================================================

        console.log(
            '[DEBUG] User has',
            user.completedQuizzes.length,
            'completed quizzes'
        );

        console.log(
            '[DEBUG] Attempting to populate completed quizzes'
        );

        // =================================================
        // POPULATE COMPLETED QUIZZES
        // =================================================

        const populatedUser = await User.findOne({
            _id: user._id,
            school: schoolId
        })
            .select('-password')
            .populate({
                path: 'completedQuizzes.quizId',

                select:
                    'title description subject class',

                options: {
                    lean: true,

                    transform: (doc) =>
                        doc || null
                }
            })
            .lean();

        if (!populatedUser) {

            console.error(
                '[ERROR] User not found after population attempt'
            );

            throw new Error(
                'User not found after population'
            );
        }

        // =================================================
        // FILTER INVALID QUIZ REFERENCES
        // =================================================

        const validCompletedQuizzes =
            (
                populatedUser.completedQuizzes || []
            ).filter(item =>
                item &&
                item.quizId &&
                typeof item.quizId === 'object' &&
                !Array.isArray(item.quizId)
            );

        console.log(
            `[DEBUG] Successfully populated ${validCompletedQuizzes.length} valid quizzes out of ${populatedUser.completedQuizzes?.length || 0} for user ${user._id}`
        );

        // =================================================
        // CREATE CLEAN RESPONSE
        // =================================================

        const userResponse = {

            _id:
                populatedUser._id,

            id:
                populatedUser._id,

            name:
                populatedUser.name || '',

            email:
                populatedUser.email || '',

            firstName:
                populatedUser.firstName || '',

            lastName:
                populatedUser.lastName || '',

            role:
                populatedUser.role || '',

            class:
                populatedUser.class ||
                populatedUser.classAssigned ||
                populatedUser.profile?.class ||
                '',

            studentClass:
                populatedUser.class ||
                populatedUser.classAssigned ||
                populatedUser.profile?.class ||
                '',

            school:
                populatedUser.school,

            completedQuizzes:
                validCompletedQuizzes.map(quiz => ({

                    quizId:
                        quiz.quizId._id,

                    score:
                        quiz.score,

                    totalQuestions:
                        quiz.totalQuestions,

                    completedAt:
                        quiz.completedAt,

                    title:
                        quiz.quizId.title,

                    description:
                        quiz.quizId.description,

                    subject:
                        quiz.quizId.subject,

                    class:
                        quiz.quizId.class
                }))
        };

        // =================================================
        // RESPONSE
        // =================================================

        return res.json({
            success: true,
            user: userResponse
        });

    } catch (error) {

        console.error(
            '[ERROR] Unhandled error in /api/users/me:',
            {
                message: error.message,
                stack: error.stack,
                userId:
                    req.user?.userId ||
                    req.user?.id ||
                    req.user?._id,
                school:
                    req.user?.school,
                timestamp:
                    new Date().toISOString()
            }
        );

        // =================================================
        // SAFE FALLBACK RESPONSE
        // =================================================

        const safeUser = {

            _id:
                req.user?.userId ||
                req.user?.id ||
                req.user?._id,

            id:
                req.user?.userId ||
                req.user?.id ||
                req.user?._id,

            email:
                req.user?.email || '',

            firstName:
                req.user?.firstName || '',

            lastName:
                req.user?.lastName || '',

            name:
                req.user?.name || '',

            role:
                req.user?.role || 'student',

            class:
                req.user?.class || '',

            studentClass:
                req.user?.studentClass ||
                req.user?.class ||
                '',

            school:
                req.user?.school,

            completedQuizzes: []
        };

        return res.json({
            success: true,
            user: safeUser
        });

    } finally {

        console.log(
            `[DEBUG] GET /api/users/me - Completed for user ${
                req.user?.userId ||
                req.user?.id ||
                req.user?._id
            }`
        );
    }
});

module.exports = router;
