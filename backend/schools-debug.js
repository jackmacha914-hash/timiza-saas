const School = require('../models/School');

router.get('/schools-debug', async (req, res) => {
  const schools = await School.find({});
  res.json(schools);
});
