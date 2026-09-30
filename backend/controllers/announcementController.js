const Announcement = require('../models/Announcement');

// POST /api/announcements
exports.createAnnouncement = async (req, res) => {
try {
const { text } = req.body;


const announcement = new Announcement({
  text,
  school: req.user.school,
  createdBy: req.user.name || req.user.email,
  createdAt: new Date()
});

await announcement.save();

res.status(201).json({
  success: true,
  announcement
});


} catch (err) {
console.error(err);


res.status(500).json({
  success: false,
  error: err.message
});


}
};

// GET /api/announcements
exports.getAnnouncements = async (req, res) => {
try {
const announcements = await Announcement.find({
school: req.user.school
}).sort({ createdAt: -1 });


res.json(announcements);


} catch (err) {
console.error(err);


res.status(500).json({
  success: false,
  error: err.message
});


}
};

// DELETE /api/announcements/:id
exports.deleteAnnouncement = async (req, res) => {
try {
const announcement = await Announcement.findOneAndDelete({
_id: req.params.id,
school: req.user.school
});


if (!announcement) {
  return res.status(404).json({
    success: false,
    error: 'Announcement not found'
  });
}

res.json({
  success: true,
  message: 'Announcement deleted successfully'
});


} catch (err) {
console.error('Error deleting announcement:', err);


res.status(500).json({
  success: false,
  error: 'Failed to delete announcement'
});


}
};
