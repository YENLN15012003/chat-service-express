const { User } = require("../models/User");
const { Message } = require("../models/Message");
const mongoose = require("mongoose");
const withTransactionThrow = require("../common/utils/withTransactionThrow");
const {
  getMyConversationByUserIdAndConversationId,
} = require("./getMyConversation");
const {
  Noti,
  SENDER_TYPE,
  RECEIVER_TYPE,
  REFERENCE_TYPE,
  STATUS,
  TYPE,
} = require("../models/Noti");

const removeMemberToGroup = async (req, res) => {
  return await withTransactionThrow(
    async (session, req, res) => {
      console.log("\nstart-delete member -group\n"); // In ra console server
      const { memberEmail } = req.body;
      const { id } = req.params;
      const conversationId = new mongoose.Types.ObjectId(id);

      if (!memberEmail) {
        throw new Error("memberEmail must not be null");
      }

      //TODO remove toLowerCase
      const email = req.currentUser.email;
      console.log("email: " + email);
      const user = await User.findOne({ email, status: "ACTIVE" });
      console.log("user: ", user);
      const userId = user._id;

      const userMember = await User.findOne({
        email: memberEmail,
        status: "ACTIVE",
      });
      console.log("userMember: ", userMember);

      const [ourConversation, myConversation] =
        await getMyConversationByUserIdAndConversationId(
          userId,
          conversationId
        );

      if (!ourConversation || !myConversation)
        throw new Error("CONVERSATION NOT FOUND WITH ID: " + conversationId);

      if (!ourConversation.leaderId.equals(userId)) {
        throw new Error(
          "YOU ARE NOT LEADER OF CONVERSATION WITH ID: " + conversationId
        );
      }

      ourConversation.currentMember -= 1;

      ourConversation.participants = ourConversation.participants.filter(
        (participant) => !participant.userId.equals(userMember._id)
      );

      const members = await Promise.all(
        ourConversation.participants.map(
          async (participant) => await User.findById(participant.userId)
        )
      );
      ourConversation.participants.forEach((participant) => {
        participant.view.avatar = members.slice(0, 3).map((user) => {
          return {
            userId: user._id,
            value: user.avatar,
          };
        });
      });

      const skipUntilOffset = myConversation.skipUntilOffset;
      let messages = [];

      if (myConversation.status === "running") {
        messages = await Message.find({
          _id: {
            $gt: skipUntilOffset,
          },
          conversationId,
          status: "CONFIRMED",
        }).sort({ createdAt: -1 }); // Sắp xếp giảm dần theo thời gian tạo
      }
      console.log("messages: ", messages);

      //update lastReadOffset
      if (messages.length > 0) {
        myConversation.lastReadOffset = messages[0]._id;
      }

      await ourConversation.save({ session });

      userMember.conversations = userMember.conversations.filter(
        (conversation) => !conversation._id.equals(ourConversation._id)
      );

      await userMember.save({ session });

      // sent noti
      const noti = {
        content: ourConversation._id + ";" + myConversation.view.name,
        senderEmail: SENDER_TYPE.SYSTEM,
        senderType: SENDER_TYPE.SYSTEM,
        receiverEmail: userMember.email,
        receiverType: RECEIVER_TYPE.USER,
        referenceType: REFERENCE_TYPE.CONVERSATION,
        referenceEmail: myConversation.view.name,
        status: STATUS.NOT_SEEN,
        type: TYPE.DELETE_FROM_CONVERSATION,
      };

      await Noti.insertMany([noti], { session });

      const response = {
        success: true,
        status: 200,
        message: "Here is your detail conversation",
        data: {
          conversation: {
            _id: ourConversation._id,
            name: myConversation.view.name,
            status: myConversation.status,
            type: ourConversation.type,
            currentMember: ourConversation.currentMember,
            maxMember: ourConversation.maxMember,
            type: ourConversation.type,
            createdAt: ourConversation.createdAt,
            updatedAt: ourConversation.updatedAt,
            lastMessage: null,
            __v: myConversation.__v,
            settings: {
              _id: null,
              userId: user._id,
              conversationId: ourConversation._id,
              getNotifications: myConversation.isReceiveNoti,
              isPinned: false,
              language: myConversation.language,
              translatedTo: myConversation.translatedTo,
              createdAt: ourConversation.createdAt,
              updatedAt: ourConversation.updatedAt,
              __v: ourConversation.__v,
            },
            seenBy: ourConversation.participants.map((participant) => {
              return {
                userId: participant.userId,
                messageId: participant.lastReadOffset,
              };
            }),
          },
          isNewCreated: false,
          messages: [],
          user: {
            _id: userMember._id,
          },
          pagination: {
            currentPage: 0,
            pageSize: 10,
            totalItems: 0,
            totalPages: 0,
          },
          removedUserId: [userMember._id],
          oldMemberIds: members
            .filter((member) => !member._id.equals(userMember._id))
            .map((member) => member._id),
        },
      };
      const socketEventBus =
        await require("../handlers/socket-event-bus").getInstance();
      console.log("✅ Socket Event Bus initialized successfully");
      await socketEventBus.publish("DELETE_MEMBER_FROM_GROUP", response);

      return res.json(response);
    },
    req,
    res
  );
};

module.exports = removeMemberToGroup;
