const express = require('express');

const {
  authenticateUser,
  authorizeRoles
} = require('../middleware/authMiddleware');

const Homework = require('../models/Homework');

const multer = require('multer');
const path = require('path');
const fs = require('fs');


// ============================================================
// ROUTER
// ============================================================

const router = express.Router();


// ============================================================
// HOMEWORK UPLOAD DIRECTORY
// ============================================================

const homeworkUploadDir = path.join(
  __dirname,
  '..',
  'uploads',
  'homeworks'
);

if (!fs.existsSync(homeworkUploadDir)) {
  fs.mkdirSync(homeworkUploadDir, {
    recursive: true
  });
}


// ============================================================
// MULTER CONFIGURATION
// ============================================================

const homeworkUpload = multer({

  storage: multer.diskStorage({

    destination: (req, file, cb) => {
      cb(null, homeworkUploadDir);
    },

    filename: (req, file, cb) => {

      const uniqueSuffix =
        Date.now() +
        '-' +
        Math.round(Math.random() * 1E9);

      const ext =
        path.extname(file.originalname);

      cb(
        null,
        'submission-' +
        uniqueSuffix +
        ext
      );
    }

  }),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  },

  fileFilter: (req, file, cb) => {

    const allowedTypes = [
      '.pdf',
      '.doc',
      '.docx',
      '.jpg',
      '.jpeg',
      '.png'
    ];

    const ext =
      path
        .extname(file.originalname)
        .toLowerCase();

    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Only PDF, Word documents, and images are allowed'
        )
      );
    }
  }

});


// ============================================================
// CREATE HOMEWORK
// Teacher Only
// ============================================================

router.post(
  '/',
  authenticateUser,
  authorizeRoles('teacher'),
  homeworkUpload.single('homework-file'),

  async (req, res) => {

    try {

      console.log(
        '[HOMEWORK CREATE] User:',
        {
          id: req.user?.id,
          role: req.user?.role,
          school: req.user?.school
        }
      );

      const {
        title,
        description,
        dueDate,
        classAssigned
      } = req.body;

      if (
        !title ||
        !dueDate ||
        !classAssigned
      ) {

        return res.status(400).json({
          error: 'Missing required fields',
          details:
            'Please provide title, due date, and class assigned'
        });
      }

      const homework =
        new Homework({

          school:
            req.user.school,

          title,

          description,

          dueDate:
            new Date(dueDate),

          classAssigned,

          teacher:
            req.user.id,

          file:
            req.file
              ? `/uploads/homeworks/${req.file.filename}`
              : null

        });

      await homework.save();

      console.log(
        '[HOMEWORK CREATE] Created:',
        {
          id: homework._id,
          teacher: homework.teacher,
          school: homework.school,
          classAssigned: homework.classAssigned
        }
      );

      return res.json({
        msg:
          'Homework created successfully!',

        homework
      });

    } catch (err) {

      console.error(
        '[HOMEWORK CREATE] Error:',
        err
      );

      return res.status(500).json({
        error:
          'Failed to create homework',

        details:
          err.message
      });
    }
  }
);


// ============================================================
// GET ALL HOMEWORKS
// Students + Teachers
// ============================================================

router.get(
  '/',
  authenticateUser,

  async (req, res) => {

    try {

      console.log(
        '[HOMEWORK LIST] User:',
        {
          id: req.user?.id,
          role: req.user?.role,
          school: req.user?.school
        }
      );

      let query = {};

      // --------------------------------------------------------
      // SCHOOL ISOLATION
      // --------------------------------------------------------

      if (req.user.school) {
        query.school =
          req.user.school;
      }

      const role =
        String(
          req.user.role || ''
        )
          .toLowerCase()
          .trim();

      // --------------------------------------------------------
      // STUDENT
      // --------------------------------------------------------

      if (role === 'student') {

        const studentClass =
          req.user.profile?.class ||
          req.user.class;

        if (!studentClass) {

          console.log(
            '[HOMEWORK LIST] Student has no class'
          );

          return res.json([]);
        }

        query.classAssigned =
          studentClass;

      }

      // --------------------------------------------------------
      // TEACHER
      // --------------------------------------------------------

      else {

        query.teacher =
          req.user.id;
      }

      console.log(
        '[HOMEWORK LIST] Query:',
        query
      );

      const homeworks =
        await Homework.find(query)
          .populate(
            'teacher',
            'name email'
          )
          .populate(
            'submissions.student',
            'name email'
          )
          .sort({
            dueDate: 1
          });

      console.log(
        '[HOMEWORK LIST] Found:',
        homeworks.length
      );

      return res.json(homeworks);

    } catch (err) {

      console.error(
        '[HOMEWORK LIST] Error:',
        err
      );

      return res.status(500).json({
        error:
          'Failed to fetch homeworks',

        details:
          err.message
      });
    }
  }
);


// ============================================================
// SUBMIT HOMEWORK
// Student Only
// ============================================================

router.post(
  '/submit/:homeworkId',
  authenticateUser,
  authorizeRoles('student'),
  homeworkUpload.single('submission-file'),

  async (req, res) => {

    try {

      console.log(
        '[HOMEWORK SUBMIT]',
        {
          homeworkId:
            req.params.homeworkId,

          studentId:
            req.user?.id,

          school:
            req.user?.school
        }
      );

      const homework =
        await Homework.findById(
          req.params.homeworkId
        );

      if (!homework) {

        return res.status(404).json({
          error:
            'Homework not found'
        });
      }

      // --------------------------------------------------------
      // SCHOOL CHECK
      // --------------------------------------------------------

      if (
        homework.school &&
        req.user.school &&
        String(homework.school) !==
          String(req.user.school)
      ) {

        return res.status(403).json({
          error:
            'Not authorized to submit this homework'
        });
      }

      // --------------------------------------------------------
      // CHECK DUPLICATE SUBMISSION
      // --------------------------------------------------------

      const existingSubmission =
        homework.submissions.find(
          sub =>
            String(sub.student) ===
            String(req.user.id)
        );

      if (existingSubmission) {

        return res.status(400).json({
          error:
            'You have already submitted this homework'
        });
      }

      // --------------------------------------------------------
      // ADD SUBMISSION
      // --------------------------------------------------------

      homework.submissions.push({

        student:
          req.user.id,

        file:
          req.file
            ? req.file.filename
            : null,

        submittedAt:
          new Date()

      });

      await homework.save();

      console.log(
        '[HOMEWORK SUBMIT] Success:',
        {
          homeworkId:
            homework._id,

          studentId:
            req.user.id
        }
      );

      return res.json({

        msg:
          'Homework submitted successfully!',

        submission:
          homework.submissions[
            homework.submissions.length - 1
          ]

      });

    } catch (err) {

      console.error(
        '[HOMEWORK SUBMIT] Error:',
        err
      );

      return res.status(500).json({
        error:
          'Failed to submit homework',

        details:
          err.message
      });
    }
  }
);


// ============================================================
// GET SINGLE HOMEWORK
//
// Teacher:
//   Can view homework they created.
//
// Student:
//   Can view homework assigned to their class,
//   even BEFORE submitting.
//
// Student only sees their own submission.
// ============================================================

router.get(
  '/:id',
  authenticateUser,

  async (req, res) => {

    try {

      console.log(
        '================================================'
      );

      console.log(
        '[HOMEWORK VIEW] START'
      );

      console.log(
        '[HOMEWORK VIEW] Homework ID:',
        req.params.id
      );

      console.log(
        '[HOMEWORK VIEW] User:',
        {
          id: req.user?.id,
          role: req.user?.role,
          school: req.user?.school
        }
      );

      // --------------------------------------------------------
      // FIND HOMEWORK
      // --------------------------------------------------------

      const homework =
        await Homework.findById(
          req.params.id
        )
          .populate(
            'teacher',
            'name email'
          )
          .populate(
            'submissions.student',
            'name email'
          );

      if (!homework) {

        return res.status(404).json({
          error:
            'Homework not found'
        });
      }

      console.log(
        '[HOMEWORK VIEW] Found:',
        {
          id:
            String(homework._id),

          teacher:
            homework.teacher
              ? String(homework.teacher._id)
              : null,

          school:
            homework.school,

          classAssigned:
            homework.classAssigned,

          submissions:
            homework.submissions?.length || 0
        }
      );

      // --------------------------------------------------------
      // SCHOOL SECURITY
      // --------------------------------------------------------

      if (
        homework.school &&
        req.user.school &&
        String(homework.school) !==
          String(req.user.school)
      ) {

        console.error(
          '[HOMEWORK VIEW] SCHOOL MISMATCH'
        );

        return res.status(403).json({
          error:
            'Not authorized to view this homework'
        });
      }

      const role =
        String(
          req.user.role || ''
        )
          .toLowerCase()
          .trim();

      const userId =
        String(
          req.user.id ||
          req.user._id ||
          ''
        );

      // ========================================================
      // TEACHER
      // ========================================================

      if (role === 'teacher') {

        const homeworkTeacherId =
          homework.teacher
            ? String(
                homework.teacher._id
              )
            : '';

        console.log(
          '[HOMEWORK VIEW] Teacher IDs:',
          {
            loggedInTeacher:
              userId,

            homeworkTeacher:
              homeworkTeacherId
          }
        );

        if (
          homeworkTeacherId !==
          userId
        ) {

          return res.status(403).json({
            error:
              'Not authorized to view this homework'
          });
        }

        console.log(
          '[HOMEWORK VIEW] Teacher authorized'
        );

        return res.json(homework);
      }

      // ========================================================
      // STUDENT
      // ========================================================

      if (role === 'student') {

        const studentClass =
          req.user.profile?.class ||
          req.user.class;

        console.log(
          '[HOMEWORK VIEW] Student class:',
          studentClass
        );

        // ------------------------------------------------------
        // CLASS CHECK
        // ------------------------------------------------------

        if (
          studentClass &&
          homework.classAssigned &&
          String(studentClass).trim() !==
            String(homework.classAssigned).trim()
        ) {

          console.error(
            '[HOMEWORK VIEW] CLASS MISMATCH:',
            {
              studentClass,
              homeworkClass:
                homework.classAssigned
            }
          );

          return res.status(403).json({
            error:
              'Not authorized to view this homework'
          });
        }

        // ------------------------------------------------------
        // ONLY SHOW THIS STUDENT'S SUBMISSION
        // ------------------------------------------------------

        homework.submissions =
          homework.submissions.filter(
            sub => {

              if (!sub.student) {
                return false;
              }

              return (
                String(
                  sub.student._id
                ) ===
                userId
              );
            }
          );

        console.log(
          '[HOMEWORK VIEW] Student authorized'
        );

        console.log(
          '[HOMEWORK VIEW] Student submissions:',
          homework.submissions.length
        );

        return res.json(homework);
      }

      // --------------------------------------------------------
      // UNKNOWN ROLE
      // --------------------------------------------------------

      return res.status(403).json({
        error:
          'Not authorized to view this homework'
      });

    } catch (err) {

      console.error(
        '================================================'
      );

      console.error(
        '[HOMEWORK VIEW] ERROR:',
        err
      );

      console.error(
        '================================================'
      );

      return res.status(500).json({
        error:
          'Failed to fetch homework',

        details:
          err.message
      });
    }
  }
);


// ============================================================
// GRADE HOMEWORK
// Teacher Only
// ============================================================

router.put(
  '/grade/:homeworkId/:submissionId',
  authenticateUser,
  authorizeRoles('teacher'),

  async (req, res) => {

    try {

      const {
        grade,
        comments
      } = req.body;

      const homework =
        await Homework.findById(
          req.params.homeworkId
        );

      if (!homework) {

        return res.status(404).json({
          error:
            'Homework not found'
        });
      }

      // Only homework owner can grade

      if (
        String(homework.teacher) !==
        String(req.user.id)
      ) {

        return res.status(403).json({
          error:
            'Not authorized to grade this homework'
        });
      }

      const submission =
        homework.submissions.id(
          req.params.submissionId
        );

      if (!submission) {

        return res.status(404).json({
          error:
            'Submission not found'
        });
      }

      submission.grade =
        grade;

      submission.comments =
        comments;

      await homework.save();

      return res.json({

        msg:
          'Homework graded successfully!',

        submission
      });

    } catch (err) {

      console.error(
        '[HOMEWORK GRADE] Error:',
        err
      );

      return res.status(500).json({
        error:
          'Failed to grade homework',

        details:
          err.message
      });
    }
  }
);


// ============================================================
// DELETE HOMEWORK
// Teacher Only
// ============================================================

router.delete(
  '/:id',
  authenticateUser,
  authorizeRoles('teacher'),

  async (req, res) => {

    try {

      const homework =
        await Homework.findById(
          req.params.id
        );

      if (!homework) {

        return res.status(404).json({
          error:
            'Homework not found'
        });
      }

      // Only owner can delete

      if (
        String(homework.teacher) !==
        String(req.user.id)
      ) {

        return res.status(403).json({
          error:
            'Not authorized to delete this homework'
        });
      }

      await homework.deleteOne();

      return res.json({
        msg:
          'Homework deleted successfully!'
      });

    } catch (err) {

      console.error(
        '[HOMEWORK DELETE] Error:',
        err
      );

      return res.status(500).json({
        error:
          'Failed to delete homework',

        details:
          err.message
      });
    }
  }
);


// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;
