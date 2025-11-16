const { User } = require("../models/User");
const { Message } = require("../models/Message");
const {
  getMyConversationByUserIdAndConversationId,
} = require("./getMyConversation");
const mongoose = require("mongoose");
const SynchronizePublisher = require("../messageBroker/synchronizePublisher");

const reactionMessage = async (req, res) => {
  try {
    console.log("\nstart-update-message\n"); // In ra console server
    const { id } = req.params;
    const messageId = new mongoose.Types.ObjectId(id);
    const { type } = req.body;
    const reaction = type;
    const email = req.currentUser.email;
    console.log("email: " + email);

    const [user, message] = await Promise.all([
      User.findOne({ email, status: "ACTIVE" }),
      Message.findById(messageId),
    ]);

    console.log("user: ", user);
    const userId = user._id;

    const { senderId, recipients } = message;

    if (userId.equals(senderId)) {
      if (message.reaction === reaction) message.reaction = null;
      else message.reaction = reaction;
      message.reactedAt = new Date();
    }

    // not sender
    else {
      const member = recipients.find((recipient) =>
        recipient.userId.equals(userId)
      );
      if (member.reaction === reaction) member.reaction = null;
      else member.reaction = reaction;
      member.reactedAt = new Date();
    }

    await message.save();
    // // Tạo kết quả phân trang

    const response = {
      success: true,
      status: 200,
      message: "Reaction message successfully",
      data: {
        reactBy: {
          messageId: messageId,
          userId,
          conversationId: message.conversationId,
          type,
          createdAt: message.reactedAt,
          updatedAt: message.reactedAt,
        },
      },
    };

    // Khởi tạo SocketEventBus & emit su kien co nguoi doc tin nhan
    const synchronizePublisher = await SynchronizePublisher.getInstance();
    // Publish lên Redis Stream
    const event = {
      destination: "sync-stream",
      payload: JSON.stringify({
        eventType: "NEW_REACTION",
        ...response,
      }),
    };
    await synchronizePublisher.publish(event);

    return res.json(response);
  } catch (error) {
    console.error(error);
    res.json({
      message: error.message,
      error: error.message,
      success: false,
      status: 500,
    });
  }
};
module.exports = reactionMessage;
