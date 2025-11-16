const { User } = require("../models/User");
const { Message } = require("../models/Message");
const Conversation = require("../models/Conversation");
const withTransactionThrow = require("../common/utils/withTransactionThrow");
const { getMyConversationFromOurConversation } = require("./getMyConversation");
const convertUserToLongFormat = require("../common/utils/convertUserToLongFormat");

const createGroup = async (req, res) => {
  return await withTransactionThrow(
    async (session, req, res) => {
      console.log("\nstart-create-group\n"); // In ra console server
      const { name, memberEmails } = req.body;

      if (!memberEmails.length) {
        throw new Error("memberEmails must be array");
      }
      //TODO remove toLowerCase
      const email = req.currentUser.email;
      console.log("email: " + email);
      const user = await User.findOne({ email, status: "ACTIVE" });
      console.log("user: ", user);
      const userId = user._id;

      const users = await Promise.all(
        memberEmails.map(async (email) => {
          const res = await User.findOne({
            email,
          });

          if (!res) throw new Error("USER NOT FOUND WITH ID: " + memberId);

          return res;
        })
      );

      const [conversation] = await Conversation.insertMany(
        [
          {
            type: "group",
            leaderId: userId,
            currentMember: memberEmails.length,
            participants: users.map((user) => {
              return {
                userId: user._id,
                view: {
                  name: name,
                  avatar: users.slice(0, 3).map((user) => {
                    return {
                      userId: user._id,
                      value: user.avatar,
                    };
                  }),
                  bucket: user.bucket,
                },
              };
            }),
          },
        ],
        { session }
      );

      await Promise.all(
        users.map(async (user) => {
          user.conversations.push({ _id: conversation._id });
          await user.save({ session });
        })
      );

      // get response
      const conversationId = conversation._id;
      const [ourConversation, myConversation] =
        await getMyConversationFromOurConversation(conversation, userId);

      if (!myConversation)
        throw new Error("CONVERSATION NOT FOUND WITH ID: " + conversationId);

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

      const response = {
        success: true,
        status: 200,
        message: "Here is your detail conversation",
        data: {
          conversation: {
            _id: ourConversation._id,
            name: myConversation.view.name,
            status: myConversation.status,
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
          isNewCreated: true,
          messages: [],
          users: await Promise.all(
            ourConversation.participants.map(async (participant) => {
              const res = await convertUserToLongFormat(participant.userId);
              res.isKeyMember = participant.userId.equals(userId);
              return res;
            })
          ),
          unSeenMessageQuantity: 0,
          currentMessagePage: 1,
          totalMessagePageQuantity: 1,
          pagination: {
            currentPage: 0,
            pageSize: 10,
            totalItems: 0,
            totalPages: 0,
          },
        },
      };

      const socketEventBus =
        await require("../handlers/socket-event-bus").getInstance();
      console.log("✅ Socket Event Bus initialized successfully");
      await socketEventBus.publish("CREATE_GROUP", response);

      return res.json(response);
    },
    req,
    res
  );
};

module.exports = createGroup;
