const School = require('../models/School');

// CREATE SCHOOL (Super Admin)
exports.createSchool = async (req, res) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ message: "Name and slug are required" });
    }

    const existing = await School.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: "School already exists" });
    }

    const school = await School.create({
      name,
      slug: slug.toLowerCase()
    });

    res.status(201).json({
      message: "School created successfully",
      school
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET ALL SCHOOLS (Super Admin dashboard)
exports.getSchools = async (req, res) => {
  try {
    const schools = await School.find();
    res.json(schools);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
