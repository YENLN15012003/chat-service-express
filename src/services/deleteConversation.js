const { User } = require("../models/User");
const {
  getMyConversationByUserIdAndConversationId,
} = require("./getMyConversation");
const mongoose = require("mongoose");
const withTransactionThrow = require("../common/utils/withTransactionThrow");
const SynchronizePublisher = require("../messageBroker/synchronizePublisher");

const deleteConversation = async (req, res) => {
  return await withTransactionThrow(
    async (session, req, res) => {
      try {
        console.log("\nstart-delete-conversation\n"); // In ra console server
        const { id } = req.params;
        const conversationId = new mongoose.Types.ObjectId(id);
        const email = req.currentUser.email;
        console.log("email: " + email);

        const user = await User.findOne({ email, status: "ACTIVE" });

        console.log("user: ", user);

        const userId = user._id;
        const [ourConversation, myConversation] =
          await getMyConversationByUserIdAndConversationId(
            userId,
            conversationId
          );

        console.log("myConversation: ", myConversation);

        myConversation.status = "invisible";
        myConversation.skipUntilOffset = new mongoose.Types.ObjectId();

        await ourConversation.save({ session });
        if (
          ourConversation.type === "group" &&
          ourConversation.leaderId.equals(userId)
        ) {
          await Promise.all(
            ourConversation.participants.map(async (participant) => {
              const user = await User.findById(participant.userId);
              if (!user)
                throw new Error(
                  "NOT EXISTS USER WITH ID " + participant.userId
                );

              user.conversations = user.conversations.filter(
                (conversation) => !conversation._id.equals(conversationId)
              );
              //save
              await user.save({ session });
            })
          );
          await ourConversation.deleteOne();
        }
        const response = {
          success: true,
          status: 200,
          message: "",
          data: {
            conversation: {
              conversation: {
                _id: ourConversation._id,
                status: myConversation.status,
                name: myConversation.view.name,
                type: ourConversation.type,
                createdAt: ourConversation.createdAt,
                updatedAt: ourConversation.updatedAt,
                __v: ourConversation.__v,
                lastMessage: null,
                settings: null,
              },
              users: ourConversation.participants.map((participant) => {
                return {
                  user: {
                    _id: participant.userId,
                  },
                };
              }),
            },
            actionUserId: [userId],
            remainMemberIds: ourConversation.participants
              .filter((participant) => !participant.userId.equals(userId))
              .map((participant) => participant.userId),
          },
        };

        const synchronizePublisher = await SynchronizePublisher.getInstance();
        // Publish lên Redis Stream
        const event = {
          destination: "sync-stream",
          payload: JSON.stringify({
            eventType: "DELETE_CONVERSATION",
            ...response,
          }),
        };
        await synchronizePublisher.publish(event);

        // // Tạo kết quả phân trang
        return res.json(response);
      } catch (error) {
        console.error(error);
        res.json({
          message: error.message,
          error: error.message,
          success: false,
          status: 500,
        });
        throw error;
      }
    },
    req,
    res
  );
};
module.exports = deleteConversation;
