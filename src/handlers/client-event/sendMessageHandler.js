const mongoose = require("mongoose");
const Conversation = require("../../models/Conversation");
const { Message } = require("../../models/Message");
const convertMessageToLongFormat = require("../../common/utils/convertMessageToLongFormat");
const { User } = require("../../models/User");
const sendMessageHandler = async (socket, socketEventBus) => {
  // Lắng nghe sự kiện 'send_message' từ client
  socket.on("send_message", async (message) => {
    console.log("handle send message event.....");

    const data = JSON.parse(message);
    console.log("data: ", JSON.stringify(data, null, 2));

    try {
      console.log("currentUser: ", JSON.stringify(socket.currentUser, null, 2));

      let user = socket.currentUser.user;

      if (data.isChatBot) {
        user = await User.findOne({ email: "ChatBot@gmail.com" });
      }

      const userId = new mongoose.Types.ObjectId(user._id);

      const conversationId = new mongoose.Types.ObjectId(data.conversationId);
      console.log("conversationId: ", JSON.stringify(conversationId, null, 2));

      // get Conversation
      const conversation = await Conversation.findById(conversationId);

      if (!conversation)
        throw new Error(`Conversation with id: ${conversationId} dont exists.`);
      console.log("conversation: ", JSON.stringify(conversation, null, 2));

      const participantIds = conversation.participants
        // .filter((participant) => !participant.userId.equals(userId))
        .map((participant) => participant.userId);

      // send message to them
      console.log("participantIds: " + participantIds);
      let message = await Message.findById(
        new mongoose.Types.ObjectId(data.messageId)
      );

      if (!message) {
        message = await Message.create({
          _id: new mongoose.Types.ObjectId(data.messageId),
          replyForMessgeId: new mongoose.Types.ObjectId(data.originalMessageId),
          conversationId,
          senderId: userId,
          recipients: participantIds.map((recipientId) => {
            return {
              userId: recipientId,
            };
          }),
          content: data.content,
          type: data.messageType,
          status: "CONFIRMED",
        });
      } else {
        message.status = "CONFIRMED";
        await message.save();
      }

      const response = await convertMessageToLongFormat(message, userId);

      socket.emit("send_message_response", {
        success: true,
        status: 200,
        message: "Send message successfully",
        data: {
          ...response,
          reactions: {
            // 100 % data nay, khong can query
            total: {
              like: [],
              dislike: [],
              heart: [],
            },
            my: {
              like: 0,
              dislike: 0,
              heart: 0,
            },
          },
        },
      });

      await socketEventBus.publish(
        "emit_message_for_multi_receiver_in_multi_device",
        {
          messageEntity: message,
          success: true,
          status: 200,
          message: "Send message successfully",
          data: {
            ...response,
            reactions: {
              // 100 % data nay, khong can query
              total: {
                like: [],
                dislike: [],
                heart: [],
              },
              my: {
                like: 0,
                dislike: 0,
                heart: 0,
              },
            },
          },
        }
      );
    } catch (error) {
      console.error(error);
      socket.emit("send_message_response", {
        success: false,
        status: 400,
        message: "Send message fail because messageId is existed.",
        messageId: data.messageId,
      });
    }
  });
};

module.exports = sendMessageHandler;
