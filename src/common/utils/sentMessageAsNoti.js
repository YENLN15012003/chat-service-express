const mongoose = require("mongoose");
const Conversation = require("../../models/Conversation");
const { Message } = require("../../models/Message");
const convertMessageToLongFormat = require("./convertMessageToLongFormat");
// const { User } = require("../../models/User");

const sentMessageAsNoti = async (userInfluenced, converId, socketEventBus) => {
  console.log("sentMessageAsNoti..........");

  try {
    const userId = new mongoose.Types.ObjectId(userInfluenced._id);

    const conversationId = new mongoose.Types.ObjectId(converId);
    console.log("conversationId: ", JSON.stringify(conversationId, null, 2));

    // get Conversation
    const conversation = await Conversation.findById(conversationId);

    if (!conversation)
      throw new Error(`Conversation with id: ${conversationId} dont exists.`);
    console.log("conversation: ", JSON.stringify(conversation, null, 2));

    const participantIds = conversation.participants.map(
      (participant) => participant.userId
    );

    // send message to them
    console.log("participantIds: " + participantIds);

    const message = await Message.create({
      senderId: userId,
      conversationId,
      recipients: participantIds.map((recipientId) => {
        return {
          userId: recipientId,
        };
      }),
      content: userInfluenced.fullName,
      type: "notification",
      status: "CONFIRMED",
    });

    const response = await convertMessageToLongFormat(message, userId);

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
  }
};

module.exports = sentMessageAsNoti;
