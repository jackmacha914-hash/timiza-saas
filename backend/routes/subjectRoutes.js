const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {

    getSubjects,

    createSubject,

    updateSubject,

    deleteSubject

} = require("../controllers/subjectController");

router.get("/", auth, getSubjects);

router.post("/", auth, createSubject);

router.put("/:id", auth, updateSubject);

router.delete("/:id", auth, deleteSubject);

module.exports = router;
