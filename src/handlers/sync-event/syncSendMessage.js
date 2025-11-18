const Conversation = require("../../models/Conversation");
const createEvent = require("../../common/utils/createEventEntity");

const mongoose = require("mongoose");
const { Message } = require("../../models/Message");

const syncSendMessage = async (message) => {
  console.log("syncing sendMessage.....");
  console.log("message: " + JSON.stringify(message, null, 2));

  const messageId = new mongoose.Types.ObjectId(message._id);
  const conversationId = new mongoose.Types.ObjectId(message.conversationId);
  const messageType = message.type;
  console.log(messageType);
  if (
    messageType === "text" ||
    messageType === "image" ||
    messageType === "video" ||
    messageType === "file" ||
    messageType === "attachment" ||
    messageType === "notification"
  ) {
    console.log("messageId: " + messageId);
    console.log("conversationId: " + conversationId);

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      console.log("No exist conversation with id = ", conversationId);
      throw new Error(`No exist conversation with id = ${conversationId}`);
    }

    conversation.participants.forEach((participant) => {
      participant.unreadMessageNums++;
      participant.status = "running";
    });

    await conversation.save();
  }
};

module.exports = syncSendMessage;
