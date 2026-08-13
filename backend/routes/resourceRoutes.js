const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { authorize } = require("../middleware/auth");
const Resource = require("../models/Resource");

const router = express.Router();

// =====================================================
// UPLOAD DIRECTORY
// =====================================================

const uploadDir = path.join(__dirname, "../uploads/resources");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// =====================================================
// MULTER
// =====================================================

const allowedTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const fileFilter = (req, file, cb) => {
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error("Only PDF, DOC, and DOCX files are allowed"),
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
    const extension = path.extname(file.originalname);

    const safeName =
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
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
  authorize("teacher"),
  (req, res) => {
    upload(req, res, async (err) => {
      try {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }

        if (err) {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }

        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: "No file uploaded.",
          });
        }

        const school = getUserSchool(req);

        if (!school) {
          return res.status(400).json({
            success: false,
            message: "School information is missing from authenticated user.",
          });
        }

        const classAssigned =
          req.body.classAssigned ||
          req.user?.profile?.class ||
          req.user?.class ||
          "General";

        const resource = await Resource.create({
          school,
          name: req.file.originalname,
          path: req.file.filename,
          classAssigned: String(classAssigned).trim(),
          uploadedBy: req.user._id,
        });

        return res.status(201).json({
          success: true,
          message: "Resource uploaded successfully",

          resource: {
            _id: resource._id,
            name: resource.name,
            path: resource.path,
            classAssigned: resource.classAssigned,
          },
        });
      } catch (error) {
        console.error("RESOURCE UPLOAD ERROR:", error);

        return res.status(500).json({
          success: false,
          message: "Failed to upload resource",
          error: error.message,
        });
      }
    });
  }
);

// =====================================================
// GET RESOURCES
// =====================================================

router.get("/", async (req, res) => {
  try {
    console.log("=================================");
    console.log("GET /api/resources");
    console.log("USER:", req.user);
    console.log("QUERY:", req.query);
    console.log("=================================");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const school = getUserSchool(req);

    if (!school) {
      console.error("NO SCHOOL FOUND FOR USER");

      return res.status(400).json({
        success: false,
        message: "School information is missing.",
      });
    }

    const role = String(req.user.role || "").toLowerCase();

    const userId = String(req.user._id);

    const classFilter = req.query.class;

    const query = {
      school,
    };

    // =================================================
    // STUDENT
    // =================================================

    if (role === "student") {
      const userClass =
        req.user.class ||
        req.user.profile?.class ||
        req.user.classAssigned;

      if (!userClass) {
        return res.status(400).json({
          success: false,
          message:
            "Student is not assigned to a class. Please contact an administrator.",
        });
      }

      query.classAssigned = String(userClass).trim();
    }

    // =================================================
    // TEACHER
    // =================================================

    else if (role === "teacher") {
      query.uploadedBy = req.user._id;

      if (classFilter && classFilter !== "all") {
        query.classAssigned = String(classFilter).trim();
      }
    }

    // =================================================
    // ADMIN
    // =================================================

    else if (role === "admin" || role === "superadmin") {
      if (classFilter && classFilter !== "all") {
        query.classAssigned = String(classFilter).trim();
      }
    }

    // =================================================
    // UNKNOWN ROLE
    // =================================================

    else {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view resources.",
      });
    }

    console.log("RESOURCE QUERY:", query);

    const resources = await Resource.find(query)
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const resourcesWithDelete = resources.map((resource) => ({
      ...resource,

      canDelete:
        role === "admin" ||
        role === "superadmin" ||
        String(resource.uploadedBy?._id) === userId,
    }));

    // =================================================
    // CLASSES
    // =================================================

    let classes = [];

    if (role === "teacher") {
      classes = await Resource.distinct("classAssigned", {
        school,
        uploadedBy: req.user._id,
      });
    } else {
      classes = await Resource.distinct("classAssigned", {
        school,
      });
    }

    console.log(
      `Returning ${resourcesWithDelete.length} resources`
    );

    return res.json({
      success: true,
      resources: resourcesWithDelete,
      classes,
      userClass:
        role === "student"
          ? req.user.class ||
            req.user.profile?.class ||
            req.user.classAssigned ||
            null
          : null,
    });
  } catch (error) {
    console.error("=================================");
    console.error("RESOURCE GET ERROR");
    console.error(error);
    console.error("=================================");

    return res.status(500).json({
      success: false,
      message: "Failed to load resources",
      error: error.message,
    });
  }
});

// =====================================================
// DELETE RESOURCE
// =====================================================

router.delete(
  "/:resourceId",
  authorize("teacher"),
  async (req, res) => {
    try {
      const school = getUserSchool(req);

      if (!school) {
        return res.status(400).json({
          success: false,
          message: "School information is missing.",
        });
      }

      const resource = await Resource.findOne({
        _id: req.params.resourceId,
        school,
      });

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: "Resource not found.",
        });
      }

      const role = String(req.user.role || "").toLowerCase();

      // Teachers can only delete their own resources.
      if (
        role === "teacher" &&
        String(resource.uploadedBy) !== String(req.user._id)
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only delete resources that you uploaded.",
        });
      }

      const filePath = path.join(uploadDir, resource.path);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await Resource.deleteOne({
        _id: resource._id,
      });

      return res.json({
        success: true,
        message: "Resource deleted successfully",
      });
    } catch (error) {
      console.error("RESOURCE DELETE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to delete resource",
        error: error.message,
      });
    }
  }
);

module.exports = router;
