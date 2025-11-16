const mongoose = require("mongoose");
const BaseSchema = require("./base/BaseSchema.js");
const { v4: uuidv4 } = require("uuid");

// Định nghĩa các ENUM tương ứng với enum trong Java
const STATUS = Object.freeze({
  SEEN: "SEEN",
  NOT_SEEN: "NOT_SEEN",
  DELETED: "DELETED",
});

const SENDER_TYPE = Object.freeze({
  SYSTEM: "SYSTEM",
});

const REFERENCE_TYPE = Object.freeze({
  USER: "USER",
});

const RECEIVER_TYPE = Object.freeze({
  USER: "USER",
  GROUP: "GROUP",
});

const TYPE = Object.freeze({
  ACCEPT_FRIEND_REQUEST: "ACCEPT_FRIEND_REQUEST",
});

const NotiSchema = new BaseSchema(
  {
    content: {
      type: String,
      required: true,
    },
    senderEmail: {
      type: String,
      // required: true,
    },
    senderType: {
      type: String,
      enum: Object.values(SENDER_TYPE),
      default: SENDER_TYPE.SYSTEM,
    },
    receiverEmail: {
      type: String,
    },
    receiverType: {
      type: String,
      enum: Object.values(RECEIVER_TYPE),
      required: true,
    },
    referenceType: {
      type: String,
      enum: Object.values(REFERENCE_TYPE),
    },
    referenceEmail: {
      type: String,
    },
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.NOT_SEEN,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(TYPE),
      required: true,
    },
    seenAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deleted: {
      type: Number,
      default: 0,
    },
    checkDuplicate: {
      type: String,
      default: () => uuidv4(),
      unique: true,
    },
  },
  {
    collection: "notifications",
  }
);

const Noti = mongoose.model("notifications", NotiSchema);

module.exports = {
  Noti,
  STATUS,
  SENDER_TYPE,
  RECEIVER_TYPE,
  REFERENCE_TYPE,
  TYPE,
};
