const { User } = require("../models/User");
const { Message } = require("../models/Message");
const {
  getMyConversationByUserIdAndConversationId,
} = require("./getMyConversation");
const mongoose = require("mongoose");
const SocketEventBus = require("../handlers/socket-event-bus");

const updateStatusSeenLastMessage = async (req, res) => {
  try {
    console.log("\nstart-update status seen last message -conversation\n"); // In ra console server
    const { conversationId } = req.params;
    const { messageId } = req.body;
    const convId = new mongoose.Types.ObjectId(conversationId);
    const lastReadOffset = new mongoose.Types.ObjectId(messageId);

    const email = req.currentUser.email;
    console.log("email: " + email);
    const user = await User.findOne({ email, status: "ACTIVE" });
    console.log("user: ", user);

    const userId = user._id;
    const [ourConversation, myConversation] =
      await getMyConversationByUserIdAndConversationId(userId, convId);

    // console.log("xxxxxxx: ", myConversation.lastReadOffset);

    const unreadMessageNums = await Message.countDocuments({
      _id: {
        $gt: myConversation.lastReadOffset,
        $lte: lastReadOffset,
      },
      conversationId,
      status: "CONFIRMED",
    });
    console.log("xinchooo: ", unreadMessageNums);

    myConversation.lastReadOffset = lastReadOffset;
    myConversation.unreadMessageNums -= unreadMessageNums;

    const socketEventBus = await SocketEventBus.getInstance();
    console.log("✅ Socket Event Bus initialized successfully");

    await Promise.all([
      ourConversation.save({ timestamps: false }),
      socketEventBus.publish(
        "emit_seen_status_for_multi_receiver_in_multi_device",
        {
          user,
          ourConversation,
          myConversation,
        }
      ),
    ]);
    // // Tạo kết quả phân trang
    return res.json({
      success: true,
      status: 200,
      message: "",
      data: {
        conversation: {
          _id: ourConversation._id,
          seenBy: ourConversation.participants.map((participant) => {
            return {
              userId: participant.userId,
              messageId: participant.lastReadOffset,
            };
          }),
        },
      },
    });
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
module.exports = updateStatusSeenLastMessage;
