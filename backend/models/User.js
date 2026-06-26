console.log("USING USER MODEL:", __filename);
const mongoose = require('mongoose');

// Validate class format (e.g., 'Grade 1', 'Form 1')
const validateClass = (value) => {
  if (!value) return true;

  return /^(Grade\s\d{1,2}|Form\s[1-4]|Pre-Primary 1 \(PP1\)|Pre-Primary 2 \(PP2\))$/i.test(value);
};

const userSchema = new mongoose.Schema({

  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: function () {
      return this.role !== 'superadmin';
    },
    index: true
  },

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    required: true,
    enum: [
      'student',
      'teacher',
      'admin',
      'accountant',
      'superadmin'
    ],
    default: 'student'
  },

  class: {
    type: String,
    default: '',
    validate: {
      validator: function (v) {
        return this.role !== 'student' || validateClass(v);
      },
      message: props =>
        `${props.value} is not a valid class. Please use format 'Grade X' or 'Form X'`
    }
  },

  classAssigned: {
    type: String,
    default: ''
  },

  completedQuizzes: [
    {
      quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz'
      },

      score: Number,

      totalQuestions: Number,

      completedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],

  profile: {
    dob: Date,

    gender: String,

    address: String,

    class: {
      type: String,
      default: '',
      validate: {
        validator: validateClass,
        message: props =>
          `${props.value} is not a valid class`
      }
    },

    specialization: String,

    subjects: [String],

    photo: String,

    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    },

    health: {
      bloodGroup: String,
      allergies: [String],
      medicalConditions: [String],
      medications: [String]
    }
  }

}, { timestamps: true });


// Keep class fields synchronized
userSchema.pre('save', function (next) {

  console.log('Pre-save hook - Current class data:', {
    rootClass: this.class,
    classAssigned: this.classAssigned,
    profileClass: this.profile?.class,
    isNew: this.isNew
  });

  if (this.class) {

    this.profile = this.profile || {};
    this.profile.class = this.class;
    this.classAssigned = this.class;

  } else if (this.profile?.class) {

    this.class = this.profile.class;
    this.classAssigned = this.profile.class;

  } else if (this.classAssigned) {

    this.class = this.classAssigned;

    this.profile = this.profile || {};
    this.profile.class = this.classAssigned;
  }

  if (this.class) {

    this.classAssigned = this.class;

    this.profile = this.profile || {};
    this.profile.class = this.class;
  }

  console.log('Pre-save hook - Updated class data:', {
    rootClass: this.class,
    classAssigned: this.classAssigned,
    profileClass: this.profile?.class
  });

  next();
});


// SaaS indexes

userSchema.index(
  {
    school: 1,
    email: 1
  },
  {
    unique: true
  }
);

userSchema.index({
  school: 1,
  role: 1
});

userSchema.index({
  school: 1,
  class: 1
});


module.exports =
  mongoose.models.User ||
  mongoose.model('User', userSchema);
