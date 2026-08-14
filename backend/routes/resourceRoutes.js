const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  protect,
  authorize
} = require("../middleware/auth");

const Resource = require("../models/Resource");
const User = mongoose.models.User || require("../models/User");

const router = express.Router();

// =====================================================
// UPLOAD DIRECTORY
// =====================================================

const uploadDir = path.join(
  __dirname,
  "../uploads/resources"
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true
  });
}

// =====================================================
// MULTER
// =====================================================

const allowedTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const fileFilter = (req, file, cb) => {
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error(
        "Only PDF, DOC, and DOCX files are allowed"
      ),
      false
    );
  }

  cb(null, true);
};

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {

    const extension =
      path.extname(
        file.originalname
      );

    const safeName =
      `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${extension}`;

    cb(null, safeName);
  }

});

const upload = multer({

  storage,

  fileFilter,

  limits: {
    fileSize: 10 * 1024 * 1024
  }

}).single("resource");

// =====================================================
// DEBUG SCHOOL
// =====================================================

function getUserSchool(req) {

  return (
    req.user?.school ||
    req.school?._id ||
    req.school?.id ||
    req.school
  );

}

// =====================================================
// UPLOAD RESOURCE
// =====================================================

router.post(
  "/upload",
  protect,
  authorize("teacher"),
  (req, res) => {

    upload(
      req,
      res,
      async (err) => {

        try {

          // -------------------------------------------------
          // MULTER ERROR
          // -------------------------------------------------

          if (err instanceof multer.MulterError) {

            return res.status(400).json({
              success: false,
              message: err.message
            });

          }

          // -------------------------------------------------
          // OTHER UPLOAD ERROR
          // -------------------------------------------------

          if (err) {

            return res.status(400).json({
              success: false,
              message: err.message
            });

          }

          // -------------------------------------------------
          // NO FILE
          // -------------------------------------------------

          if (!req.file) {

            return res.status(400).json({
              success: false,
              message: "No file uploaded."
            });

          }

          // -------------------------------------------------
          // SCHOOL
          // -------------------------------------------------

          const school =
            getUserSchool(req);

          if (!school) {

            return res.status(400).json({
              success: false,
              message:
                "School information is missing from authenticated user."
            });

          }

          // -------------------------------------------------
          // CLASS
          // -------------------------------------------------

          const classAssigned =
            req.body.classAssigned ||
            req.user?.profile?.class ||
            req.user?.class ||
            "General";

          // -------------------------------------------------
          // SAVE RESOURCE
          // -------------------------------------------------

          const resource =
            await Resource.create({

              school,

              name:
                req.file.originalname,

              // IMPORTANT:
              // Store ONLY the filename.
              path:
                req.file.filename,

              classAssigned:
                String(
                  classAssigned
                ).trim(),

              uploadedBy:
                req.user.id

            });

          // -------------------------------------------------
          // FILE URL
          // -------------------------------------------------

          const fileUrl =
            `/uploads/resources/${req.file.filename}`;

          console.log(
            "[RESOURCES] Uploaded:",
            {
              id: resource._id,
              name: resource.name,
              path: resource.path,
              fileUrl,
              classAssigned:
                resource.classAssigned,
              uploadedBy:
                req.user.id,
              school
            }
          );

          // -------------------------------------------------
          // RESPONSE
          // -------------------------------------------------

          return res.status(201).json({

            success: true,

            message:
              "Resource uploaded successfully",

            resource: {

              _id:
                resource._id,

              name:
                resource.name,

              // Keep filename for compatibility
              path:
                resource.path,

              // New clean URL
              fileUrl,

              classAssigned:
                resource.classAssigned

            }

          });

        } catch (error) {

          console.error(
            "RESOURCE UPLOAD ERROR:",
            error
          );

          return res.status(500).json({

            success: false,

            message:
              "Failed to upload resource",

            error:
              error.message

          });

        }

      }
    );

  }
);

// =====================================================
// GET RESOURCES
// =====================================================

router.get(
  "/",
  protect,
  async (req, res) => {

    try {

      console.log(
        "================================="
      );

      console.log(
        "GET /api/resources"
      );

      console.log(
        "USER:",
        req.user
      );

      console.log(
        "QUERY:",
        req.query
      );

      console.log(
        "================================="
      );

      // -------------------------------------------------
      // Authentication
      // -------------------------------------------------

      if (!req.user) {

        return res.status(401).json({
          success: false,
          message:
            "Authentication required"
        });

      }

      // -------------------------------------------------
      // School
      // -------------------------------------------------

      const school =
        getUserSchool(req);

      if (!school) {

        console.error(
          "[RESOURCES] NO SCHOOL FOUND FOR USER"
        );

        return res.status(400).json({

          success: false,

          message:
            "School information is missing."

        });

      }

      // -------------------------------------------------
      // Role
      // -------------------------------------------------

      const role =
        String(
          req.user.role || ""
        )
          .toLowerCase()
          .trim();

      const userId =
        String(
          req.user.id
        );

      const classFilter =
        req.query.class;

      // -------------------------------------------------
      // Base query
      // -------------------------------------------------

      const query = {
        school
      };

      // =================================================
      // STUDENT
      // =================================================

      let resolvedUserClass = null;

      if (role === "student") {

        resolvedUserClass =
          req.user.class ||
          req.user.profile?.class ||
          req.user.classAssigned ||
          null;

        // ------------------------------------------------
        // Load class from database if missing
        // ------------------------------------------------

        if (!resolvedUserClass) {

          console.log(
            "[RESOURCES] Class missing from req.user."
          );

          console.log(
            "[RESOURCES] Loading user from database:",
            req.user.id
          );

          const student =
            await User.findById(
              req.user.id
            ).select(
              "class profile classAssigned school role name email"
            );

          if (student) {

            console.log(
              "[RESOURCES] Database student:",
              {
                id:
                  student._id,

                name:
                  student.name,

                class:
                  student.class,

                profileClass:
                  student.profile?.class,

                classAssigned:
                  student.classAssigned,

                school:
                  student.school
              }
            );

            resolvedUserClass =
              student.class ||
              student.profile?.class ||
              student.classAssigned ||
              null;

          }

        }

        // ------------------------------------------------
        // Still no class
        // ------------------------------------------------

        if (!resolvedUserClass) {

          console.error(
            "[RESOURCES] Student has NO class."
          );

          return res.status(400).json({

            success: false,

            message:
              "Student is not assigned to a class. Please contact an administrator."

          });

        }

        // ------------------------------------------------
        // Normalize class
        // ------------------------------------------------

        resolvedUserClass =
          String(
            resolvedUserClass
          ).trim();

        console.log(
          "[RESOURCES] Resolved student class:",
          resolvedUserClass
        );

        // ------------------------------------------------
        // Students always see their own class
        // ------------------------------------------------

        query.classAssigned =
          resolvedUserClass;

      }

      // =================================================
      // TEACHER
      // =================================================

      else if (role === "teacher") {

        query.uploadedBy =
          req.user.id;

        if (
          classFilter &&
          classFilter !== "all"
        ) {

          query.classAssigned =
            String(
              classFilter
            ).trim();

        }

      }

      // =================================================
      // ADMIN
      // =================================================

      else if (
        role === "admin" ||
        role === "superadmin"
      ) {

        if (
          classFilter &&
          classFilter !== "all"
        ) {

          query.classAssigned =
            String(
              classFilter
            ).trim();

        }

      }

      // =================================================
      // UNKNOWN ROLE
      // =================================================

      else {

        return res.status(403).json({

          success: false,

          message:
            "You are not authorized to view resources."

        });

      }

      // -------------------------------------------------
      // Debug query
      // -------------------------------------------------

      console.log(
        "[RESOURCES] FINAL QUERY:",
        query
      );

      // -------------------------------------------------
      // Find resources
      // -------------------------------------------------

      const resources =
        await Resource.find(query)
          .populate(
            "uploadedBy",
            "name email"
          )
          .sort({
            createdAt: -1
          })
          .lean();

      console.log(
        `[RESOURCES] Found ${resources.length} resources`
      );

      // -------------------------------------------------
      // Add URLs and permissions
      // -------------------------------------------------

      const resourcesWithDelete =
        resources.map(
          (resource) => {

            // ---------------------------------------------
            // Normalize existing database path
            // ---------------------------------------------

            let fileUrl = "";

            if (resource.path) {

              const storedPath =
                String(
                  resource.path
                ).trim();

              // Already a complete uploads path
              if (
                storedPath.startsWith(
                  "/uploads/"
                )
              ) {

                fileUrl =
                  storedPath;

              }

              // Already absolute URL
              else if (
                storedPath.startsWith(
                  "http://"
                ) ||
                storedPath.startsWith(
                  "https://"
                )
              ) {

                fileUrl =
                  storedPath;

              }

              // Filename only
              else {

                fileUrl =
                  `/uploads/resources/${storedPath}`;

              }

            }

            return {

              ...resource,

              // Clean URL for frontend
              fileUrl,

              // Keep original path for compatibility
              path:
                resource.path,

              canDelete:
                role === "admin" ||
                role === "superadmin" ||
                String(
                  resource.uploadedBy?._id
                ) === userId

            };

          }
        );

      // =================================================
      // CLASSES
      // =================================================

      let classes = [];

      if (role === "teacher") {

        classes =
          await Resource.distinct(
            "classAssigned",
            {
              school,

              uploadedBy:
                req.user.id
            }
          );

      } else {

        classes =
          await Resource.distinct(
            "classAssigned",
            {
              school
            }
          );

      }

      // -------------------------------------------------
      // Response
      // -------------------------------------------------

      console.log(
        "[RESOURCES] Returning:",
        {
          resources:
            resourcesWithDelete.length,

          classes,

          userClass:
            resolvedUserClass
        }
      );

      return res.json({

        success: true,

        resources:
          resourcesWithDelete,

        classes,

        userClass:
          role === "student"
            ? resolvedUserClass
            : null

      });

    } catch (error) {

      console.error(
        "================================="
      );

      console.error(
        "RESOURCE GET ERROR"
      );

      console.error(
        error
      );

      console.error(
        "================================="
      );

      return res.status(500).json({

        success: false,

        message:
          "Failed to load resources",

        error:
          error.message

      });

    }

  }
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;
