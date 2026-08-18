const express = require("express");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| AUTHENTICATION
|--------------------------------------------------------------------------
| Use the same authentication middleware used by server.js.
|--------------------------------------------------------------------------
*/

const { protect } = require("../middleware/auth");


/*
|--------------------------------------------------------------------------
| SUBJECT CONTROLLERS
|--------------------------------------------------------------------------
*/

const {
    getSubjects,
    createSubject,
    updateSubject,
    deleteSubject
} = require("../controllers/subjectController");


/*
|--------------------------------------------------------------------------
| ADMIN AUTHORIZATION
|--------------------------------------------------------------------------
| Only users with the admin role can manage subjects.
|--------------------------------------------------------------------------
*/

function adminOnly(req, res, next) {

    if (!req.user) {

        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });

    }

    if (req.user.role !== "admin") {

        return res.status(403).json({
            success: false,
            message: "Admin access required."
        });

    }

    next();

}


/*
|--------------------------------------------------------------------------
| AUTHENTICATION FOR ALL SUBJECT ROUTES
|--------------------------------------------------------------------------
*/

router.use(protect);


/*
|--------------------------------------------------------------------------
| GET SUBJECTS
|--------------------------------------------------------------------------
| GET /api/academic/subjects
|--------------------------------------------------------------------------
*/

router.get(
    "/subjects",
    adminOnly,
    getSubjects
);


/*
|--------------------------------------------------------------------------
| CREATE SUBJECT
|--------------------------------------------------------------------------
| POST /api/academic/subjects
|--------------------------------------------------------------------------
*/

router.post(
    "/subjects",
    adminOnly,
    createSubject
);


/*
|--------------------------------------------------------------------------
| UPDATE SUBJECT
|--------------------------------------------------------------------------
| PUT /api/academic/subjects/:id
|--------------------------------------------------------------------------
*/

router.put(
    "/subjects/:id",
    adminOnly,
    updateSubject
);


/*
|--------------------------------------------------------------------------
| DELETE SUBJECT
|--------------------------------------------------------------------------
| DELETE /api/academic/subjects/:id
|--------------------------------------------------------------------------
*/

router.delete(
    "/subjects/:id",
    adminOnly,
    deleteSubject
);


/*
--------------------------------------------------------------------------
 EXPORT
--------------------------------------------------------------------------
 IMPORTANT:
 Express app.use() requires this to be an actual router function.
--------------------------------------------------------------------------
*/

module.exports = router;
