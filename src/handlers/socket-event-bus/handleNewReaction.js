const mongoose = require("mongoose");
const Conversation = require("../../models/Conversation");

const handleNewReaction = async (message) => {
  console.log("emit new reaction   .....");
  console.log("message: " + JSON.stringify(message, null, 2));

  const { conversationId } = message.data.reactBy;
  const converId = new mongoose.Types.ObjectId(conversationId);
  const ourConversation = await Conversation.findById(converId);

  ourConversation.participants.forEach((participant) => {
    const userId = participant.userId;
    global.io.to(userId.toString()).emit("receive_new_reaction", message);
  });

  console.log("emit new reaction success.....");
};
module.exports = handleNewReaction;
