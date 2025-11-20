const mongoose = require("mongoose");
const { Message } = require("../../models/Message");
const convertMessageToLongFormat = require("./convertMessageToLongFormat");
// const { User } = require("../../models/User");

const sentMessageAsNoti = async (
  userInfluenced,
  conversation,
  socketEventBus,
  messageType
) => {
  console.log("sentMessageAsNoti..........");

  try {
    const userId = new mongoose.Types.ObjectId(userInfluenced._id);

    const participantIds = conversation.participants.map(
      (participant) => participant.userId
    );

    // send message to them
    console.log("participantIds: " + participantIds);

    const message = await Message.create({
      senderId: userId,
      conversationId: conversation._id,
      recipients: participantIds.map((recipientId) => {
        return {
          userId: recipientId,
        };
      }),
      content: userInfluenced.fullName,
      type: messageType,
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
