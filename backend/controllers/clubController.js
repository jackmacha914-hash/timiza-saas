const Club = require('../models/Club');

// GET /api/clubs
exports.getClubs = async (req, res) => {
try {
const { search, type, advisor } = req.query;

```
const filter = {
  school: req.user.school
};

if (search) {
  filter.$or = [
    {
      name: {
        $regex: search,
        $options: 'i'
      }
    },
    {
      description: {
        $regex: search,
        $options: 'i'
      }
    }
  ];
}

if (type) {
  filter.type = type;
}

if (advisor) {
  filter.advisor = {
    $regex: advisor,
    $options: 'i'
  };
}

const clubs = await Club.find(filter).sort({
  createdAt: -1
});

res.json({
  success: true,
  count: clubs.length,
  data: clubs
});
```

} catch (err) {
console.error('Error fetching clubs:', err);

```
res.status(500).json({
  success: false,
  error: 'Server error fetching clubs'
});
```

}
};

// GET /api/clubs/:id
exports.getClubById = async (req, res) => {
try {
const club = await Club.findOne({
_id: req.params.id,
school: req.user.school
});

```
if (!club) {
  return res.status(404).json({
    success: false,
    error: 'Club not found'
  });
}

res.json({
  success: true,
  data: club
});
```

} catch (err) {
console.error('Error fetching club:', err);

```
res.status(500).json({
  success: false,
  error: 'Server error fetching club'
});
```

}
};

// POST /api/clubs
exports.createClub = async (req, res) => {
try {
const {
name,
advisor,
description,
type
} = req.body;

```
if (!name || !advisor) {
  return res.status(400).json({
    success: false,
    error: 'Name and advisor are required'
  });
}

const existingClub = await Club.findOne({
  school: req.user.school,
  name
});

if (existingClub) {
  return res.status(400).json({
    success: false,
    error: 'Club already exists'
  });
}

const newClub = new Club({
  school: req.user.school,
  name,
  advisor,
  description,
  type,
  createdBy: req.user.id
});

await newClub.save();

res.status(201).json({
  success: true,
  data: newClub
});
```

} catch (err) {
console.error('Error creating club:', err);

```
res.status(500).json({
  success: false,
  error: 'Error creating club'
});
```

}
};

// PUT /api/clubs/:id
exports.updateClub = async (req, res) => {
try {
const club = await Club.findOneAndUpdate(
{
_id: req.params.id,
school: req.user.school
},
req.body,
{
new: true,
runValidators: true
}
);

```
if (!club) {
  return res.status(404).json({
    success: false,
    error: 'Club not found'
  });
}

res.json({
  success: true,
  data: club
});
```

} catch (err) {
console.error('Error updating club:', err);

```
res.status(500).json({
  success: false,
  error: 'Error updating club'
});
```

}
};

// DELETE /api/clubs/:id
exports.deleteClub = async (req, res) => {
try {
const club = await Club.findOneAndDelete({
_id: req.params.id,
school: req.user.school
});

```
if (!club) {
  return res.status(404).json({
    success: false,
    error: 'Club not found'
  });
}

res.json({
  success: true,
  message: 'Club deleted successfully'
});
```

} catch (err) {
console.error('Error deleting club:', err);

```
res.status(500).json({
  success: false,
  error: 'Error deleting club'
});
```

}
};
