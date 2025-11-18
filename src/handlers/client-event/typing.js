const { default: mongoose } = require("mongoose");
const Conversation = require("../../models/Conversation");

const typing = async (socket, socketEventBus) => {
  // Lắng nghe sự kiện 'send_message' từ client
  socket.on("typing", async (message) => {
    console.log("handle typing event.....");
    const data = JSON.parse(message);
    console.log("data: ", JSON.stringify(data, null, 2));

    try {
      const email = socket.currentUser.user.email;
      const { conversationId } = data;
      console.log("conversationId is : ", conversationId);
      const ourConversation = await Conversation.findById(
        new mongoose.Types.ObjectId(conversationId)
      );
      if (!ourConversation) throw new Error("CONVERSATION NOT EXIST");

      const socketEventBus =
        await require("../../handlers/socket-event-bus").getInstance();
      console.log("✅ Socket Event Bus initialized successfully");
      await socketEventBus.publish("TYPING", response);
    } catch (error) {
      console.error(error);
      socket.emit("send_message_response", {
        success: false,
        status: 400,
        message: "typing fail because " + error.message,
      });
    }
  });
};

module.exports = typing;
