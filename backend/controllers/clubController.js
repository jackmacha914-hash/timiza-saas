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

const newClub = new Club({
  school: req.user.school,
  name,
  advisor,
  description,
  type
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
