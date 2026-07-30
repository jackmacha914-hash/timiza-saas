exports.getDashboard = async (req, res) => {

    res.json({
        totalSubjects: 0,
        allocations: 0,
        exams: 0,
        average: 0,
        reportCards: 0,
        students: 0
    });

};
