const mongoose = require("mongoose");
const Subject = require("../models/Subject");

/**
 * =====================================================
 * GET SUBJECTS
 * =====================================================
 */
exports.getSubjects = async (req, res) => {
    try {

        const subjects = await Subject.find({
            school: req.user.school
        })
        .sort({ name: 1 })
        .lean();

        return res.status(200).json({
            success: true,
            count: subjects.length,
            data: subjects
        });

    } catch (err) {

        console.error("[SUBJECTS] Get error:", err);

        return res.status(500).json({
            success: false,
            message: "Failed to load subjects."
        });
    }
};


/**
 * =====================================================
 * CREATE SUBJECT
 * =====================================================
 */
exports.createSubject = async (req, res) => {

    try {

        const {
            name,
            code,
            category,
            description
        } = req.body;

        // ---------------------------------------------
        // Validation
        // ---------------------------------------------

        if (!name || !code) {

            return res.status(400).json({
                success: false,
                message: "Subject name and code are required."
            });
        }

        const cleanName = String(name).trim();

        const cleanCode = String(code)
            .trim()
            .toUpperCase();

        if (!cleanName) {

            return res.status(400).json({
                success: false,
                message: "Subject name cannot be empty."
            });
        }

        if (!cleanCode) {

            return res.status(400).json({
                success: false,
                message: "Subject code cannot be empty."
            });
        }

        // ---------------------------------------------
        // Check duplicate
        // ---------------------------------------------

        const exists = await Subject.findOne({
            school: req.user.school,
            code: cleanCode
        });

        if (exists) {

            return res.status(409).json({
                success: false,
                message: `Subject code "${cleanCode}" already exists.`
            });
        }

        // ---------------------------------------------
        // Create
        // ---------------------------------------------

        const subject = await Subject.create({

            school: req.user.school,

            name: cleanName,

            code: cleanCode,

            category:
                category || "Core",

            description:
                description
                    ? String(description).trim()
                    : "",

            active: true,

            createdBy: req.user.id
        });

        return res.status(201).json({
            success: true,
            message: "Subject created successfully.",
            data: subject
        });

    } catch (err) {

        console.error("[SUBJECTS] Create error:", err);

        // Mongo duplicate-key protection
        if (err.code === 11000) {

            return res.status(409).json({
                success: false,
                message: "A subject with this code already exists."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to create subject."
        });
    }
};


/**
 * =====================================================
 * UPDATE SUBJECT
 * =====================================================
 */
exports.updateSubject = async (req, res) => {

    try {

        const {
            name,
            code,
            category,
            description,
            active
        } = req.body;

        // ---------------------------------------------
        // Validate ObjectId
        // ---------------------------------------------

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

            return res.status(400).json({
                success: false,
                message: "Invalid subject ID."
            });
        }

        // ---------------------------------------------
        // Build update object
        // ---------------------------------------------

        const update = {};

        if (name !== undefined) {

            const cleanName = String(name).trim();

            if (!cleanName) {

                return res.status(400).json({
                    success: false,
                    message: "Subject name cannot be empty."
                });
            }

            update.name = cleanName;
        }

        if (code !== undefined) {

            const cleanCode = String(code)
                .trim()
                .toUpperCase();

            if (!cleanCode) {

                return res.status(400).json({
                    success: false,
                    message: "Subject code cannot be empty."
                });
            }

            // Check whether another subject already uses code
            const duplicate = await Subject.findOne({
                school: req.user.school,
                code: cleanCode,
                _id: {
                    $ne: req.params.id
                }
            });

            if (duplicate) {

                return res.status(409).json({
                    success: false,
                    message: `Subject code "${cleanCode}" already exists.`
                });
            }

            update.code = cleanCode;
        }

        if (category !== undefined) {
            update.category = category;
        }

        if (description !== undefined) {

            update.description =
                String(description).trim();
        }

        if (active !== undefined) {
            update.active = Boolean(active);
        }

        // ---------------------------------------------
        // Update only within user's school
        // ---------------------------------------------

        const subject = await Subject.findOneAndUpdate(

            {
                _id: req.params.id,
                school: req.user.school
            },

            {
                $set: update
            },

            {
                new: true,
                runValidators: true
            }
        );

        if (!subject) {

            return res.status(404).json({
                success: false,
                message: "Subject not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Subject updated successfully.",
            data: subject
        });

    } catch (err) {

        console.error("[SUBJECTS] Update error:", err);

        if (err.code === 11000) {

            return res.status(409).json({
                success: false,
                message: "A subject with this code already exists."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Update failed."
        });
    }
};


/**
 * =====================================================
 * DEACTIVATE SUBJECT
 * =====================================================
 */
exports.deleteSubject = async (req, res) => {

    try {

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

            return res.status(400).json({
                success: false,
                message: "Invalid subject ID."
            });
        }

        const subject = await Subject.findOneAndUpdate(

            {
                _id: req.params.id,
                school: req.user.school
            },

            {
                $set: {
                    active: false
                }
            },

            {
                new: true
            }
        );

        if (!subject) {

            return res.status(404).json({
                success: false,
                message: "Subject not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Subject deactivated successfully.",
            data: subject
        });

    } catch (err) {

        console.error("[SUBJECTS] Delete error:", err);

        return res.status(500).json({
            success: false,
            message: "Unable to deactivate subject."
        });
    }
};
