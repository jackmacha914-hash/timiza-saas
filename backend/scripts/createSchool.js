require('dotenv').config();

const mongoose = require('mongoose');
const School = require('../models/School');

async function createSchool() {
try {
await mongoose.connect(process.env.MONGODB_URI);


const existingSchool = await School.findOne({
  code: 'LUCKY001'
});

if (existingSchool) {
  console.log('✅ School already exists');
  process.exit(0);
}

const school = await School.create({
  name: 'Lucky Junior School',
  code: 'LUCKY001',
  slug: 'lucky-junior-school',
  contactEmail: 'luckyjuniorschools@gmail.com',
  phone: '+254700000000',
  active: true
});

console.log('✅ School created successfully');
console.log(school);

process.exit(0);


} catch (error) {
console.error(error);
process.exit(1);
}
}

createSchool();
