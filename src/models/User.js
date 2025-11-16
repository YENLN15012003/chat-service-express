const mongoose = require("mongoose");
const BaseSchema = require("./base/BaseSchema.js");
const { v4: uuidv4 } = require("uuid");

// Define enums
const STATUS = Object.freeze({
  NO_ONBOARDING: "NO_ONBOARDING",
  INACTIVE: "INACTIVE",
  ACTIVE: "ACTIVE",
  LOCK: "LOCK",
  BAN: "BAN",
});

const ROLE = Object.freeze({
  USER: "USER",
  ADMIN: "ADMIN",
});

const UserSchema = new BaseSchema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
    },

    bio: {
      type: String,
      trim: true,
    },

    location: {
      type: String,
      trim: true,
    },

    learningLanguageId: {
      type: Number,
      require: true,
    },

    nativeLanguageId: {
      type: Number,
      require: true,
    },

    nativeLanguageName: {
      type: String,
      trim: true,
    },

    learningLanguageName: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    bucket: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(STATUS),
      required: true,
    },

    role: {
      type: String,
      enum: Object.values(ROLE),
      required: true,
    },
    maxLimitResourceMedia: {
      type: Number,
      default: 0,
    },
    currentUsageResourceMedia: {
      type: Number,
      default: 0,
    },
    lastUpdateLimitResourceTime: {
      type: Date,
      default: () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // reset về 00:00:00.000
        return now;
      },
    },
    // unreadConversationNums: {
    //   type: Number,
    //   default: 0,
    // },
    deletedAt: {
      type: Date,
      default: null,
    },

    deleted: {
      type: Number,
      default: 0,
    },

    rowVersion: {
      type: Number,
      default: 0,
    },
    conversations: [],
    checkDuplicate: {
      type: String,
      default: () => uuidv4(),
      unique: true,
    },
  },
  {
    collection: "users",
  }
);
UserSchema.index({ userId: 1 });
const User = mongoose.model("users", UserSchema);

module.exports = { User, STATUS, ROLE };
