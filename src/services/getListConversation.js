const { User } = require("../models/User");
const { Message } = require("../models/Message");
const Conversation = require("../models/Conversation");
const createPaginateResponseLong = require("../common/utils/createPaginateResponseLong");
const convertMessageToLongFormat = require("../common/utils/convertMessageToLongFormat");
const genPresignURL = require("../services/genPresignURL");

const getListConversation = async (req, res) => {
  try {
    console.log("\nstart-get-list-conversation\n"); // In ra console server
    const data = req.query;
    console.log("Data: ", JSON.stringify(data)); // In ra console server
    const { name, pageSize, currentPage } = data;
    const email = req.currentUser.email;
    console.log("email: " + email);

    const user = await User.findOne({ email, status: "ACTIVE" });

    console.log("user: ", user);

    const userId = user._id;

    const conversationsOfEveryone = await Promise.all(
      user.conversations
        .map(async (_id) => {
          return await Conversation.findById(_id).lean();
        })
        .filter((item) => item !== null && item !== undefined)
    );

    console.log("conversationsOfEveryone: ", conversationsOfEveryone);

    const myConversations = conversationsOfEveryone
      .map((myConversation, index) => {
        return {
          ...myConversation.participants.find((participant) =>
            participant.userId.equals(userId)
          ),
          _id: conversationsOfEveryone[index]._id,
          type: conversationsOfEveryone[index].type,
        };
      })
      .filter((myConversation) => {
        if (myConversation.status === "invisible") return false;
        return name && !myConversation.view.name.includes(name) ? false : true;
      });

    console.log("myConversations: ", myConversations);

    const lastMessages = [];
    for (let i = 0; i < myConversations.length; i++) {
      const myConversation = myConversations[i];
      const skipUntilOffset = myConversation.skipUntilOffset;
      console.log("myConversation: ", myConversation);

      if (myConversation.status === "initial") lastMessages.push([]);
      else if (myConversation.status === "running") {
        const last10Message = await Message.find({
          _id: {
            $gt: skipUntilOffset,
          },
          conversationId: myConversation._id,
          status: "CONFIRMED",
        })
          .sort({ createdAt: -1 }) // Sắp xếp giảm dần theo thời gian tạo
          .limit(10);
        console.log("last10Message: ", last10Message);

        lastMessages.push(last10Message);
      }
    }

    console.log("lastMessages: ", lastMessages);

    const allRecord = [];
    for (let i = 0; i < myConversations.length; i++) {
      const conversation = myConversations[i];
      const index = i;
      const last10Message = lastMessages[index];

      const lastUpdate =
        last10Message.length > 0
          ? last10Message[0].createdAt
          : conversation.createdAt;

      conversation.updatedAt = lastUpdate;
      const lastMessage = last10Message.length > 0 ? last10Message[0] : null;

      const avatarPromises = myConversations[index].view.avatar.map(
        async (item) => {
          const profilePic = await genPresignURL(item.value);

          return {
            user: {
              _id: item.userId,
              profilePic,
            },
          };
        }
      );

      allRecord.push({
        conversation: {
          id: conversation._id,
          name: conversation.view.name,
          type: conversation.type,
          lastMessage: await convertMessageToLongFormat(lastMessage, userId),
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        },
        isNewCreated: false,
        messages: [], // de rong cho Long
        users: await Promise.all(avatarPromises),
        unSeenMessageQuantity: Math.max(
          0,
          myConversations[index].unreadMessageNums
        ),
        currentMessagePage: 1, // để là 1 cho Long
        totalMessagePageQuantity: 1,
        lastUpdate,
      });
    }

    // const allRecord = await Promise.all(promised);

    // sắp xếp giảm dần theo lastMessageDate
    allRecord.sort((a, b) => b.lastUpdate - a.lastUpdate);
    console.log("allRecord: ", allRecord);
    const total = allRecord.length;
    const limit = +pageSize;
    const offset = +currentPage * +limit;
    const paginatedResults = allRecord.slice(offset, offset + limit);

    const response = createPaginateResponseLong(
      true,
      200,
      "",
      currentPage,
      pageSize,
      total,
      paginatedResults
    );

    // // Gán biến đếm số conversation chưa đọc
    response.data.unreadConversationNums = allRecord.filter(
      (conversation) => conversation.unreadMessageNums > 0
    ).length;
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
  }
};
module.exports = getListConversation;
