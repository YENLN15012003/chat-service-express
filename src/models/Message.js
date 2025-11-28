const mongoose = require("mongoose");
const BaseSchemaNoOptimistic = require("./base/BaseSchemaNoOptimistic.js");
const BaseSchema = require("./base/BaseSchema.js");

const STATUS = Object.freeze({
  SENT: "SENT",
  DELIVERED: "DELIVERED",
  READ: "READ",
});

const REACTION = Object.freeze({
  LIKE: "LIKE",
  TYM: "TYM",
  DISLIKE: "DISLIKE",
});

const MessageSchema = new BaseSchema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "conversations",
    },
    replyForMessgeId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    recipients: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
        reaction: {
          type: String,
          enum: Object.values(REACTION),
          default: null,
        },
        reactedAt: { type: Date, default: null },
        status: {
          type: String,
          enum: ["sent", "seen", "unsent"],
          default: "sent",
        },
      },
    ],
    reaction: {
      type: String,
      enum: Object.values(REACTION),
      default: null,
    },
    reactedAt: { type: Date, default: null },
    content: String,
    type: {
      type: String,
      enum: [
        "text",
        "attachment",
        "voice",
        "add_member_group_notification",
        "kick_member_group_notification",
        "leave_group_notification",
      ],
      default: "text",
    },

    attachments: [
      {
        originalFileName: String,
        fileSize: Number,
        bucket: String,
        contentType: String,
        key: String,
        status: {
          type: String,
          enum: ["ACTIVE", "INACTIVE"],
          default: "ACTIVE",
        },
        createdAt: {
          type: Date,
          default: new Date(),
        },
      },
    ],
    status: {
      type: String,
      enum: ["WAITING_CONFIRM", "CONFIRMED", "DELETED"],
      default: "WAITING_CONFIRM",
    },
  },
  {
    collection: "messages",
  }
);
MessageSchema.index({ conversationId: 1 });
const Message = mongoose.model("messages", MessageSchema);

module.exports = {
  Message,
  STATUS,
  REACTION,
};
