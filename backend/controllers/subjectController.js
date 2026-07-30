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
