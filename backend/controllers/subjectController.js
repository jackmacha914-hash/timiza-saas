//GET SUBJECTS//
const Subject = require("../models/Subject");

exports.getSubjects = async (req, res) => {
    try {

        const subjects = await Subject.find({
            school: req.user.school
        }).sort({
            name: 1
        });

        res.json(subjects);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Failed to load subjects"
        });

    }
};

//CREATE SUBJECTS//
exports.createSubject = async (req, res) => {

    try {

        const {
            name,
            code,
            category
        } = req.body;

        const exists = await Subject.findOne({
            school: req.user.school,
            code
        });

        if (exists) {
            return res.status(400).json({
                message: "Subject code already exists."
            });
        }

        const subject = await Subject.create({

            school: req.user.school,

            name,

            code,

            category,

            createdBy: req.user.id

        });

        res.status(201).json(subject);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Unable to create subject."
        });

    }

};

//UPDATE SUBJECTS//
exports.updateSubject = async (req, res) => {

    try {

        const subject = await Subject.findOneAndUpdate(
            {
                _id: req.params.id,
                school: req.user.school
            },
            req.body,
            {
                new: true
            }
        );

        if (!subject) {
            return res.status(404).json({
                message: "Subject not found."
            });
        }

        res.json(subject);

    } catch (err) {

        res.status(500).json({
            message: "Update failed."
        });

    }

};

//DELETE SUBJECT//
exports.deleteSubject = async (req, res) => {

    try {

        await Subject.findOneAndDelete({

            _id: req.params.id,

            school: req.user.school

        });

        res.json({
            message: "Subject deleted."
        });

    } catch (err) {

        res.status(500).json({
            message: "Delete failed."
        });

    }

};


