const getFullUserInfo = require("../../services/getFullUserInfor");
const { TYPE } = require("../../models/Noti");
const Conversation = require("../../models/Conversation");
const mongoose = require("mongoose");
const genPresignURL = require("../../services/genPresignURL");

const convertNoti = async (noti) => {
  switch (noti.type) {
    case TYPE.ACCEPT_FRIEND_REQUEST:
      return converNotiAcceptFriend(noti);

    case TYPE.DELETE_CONVERSATION:
      return converNotiDeleteConverstion(noti);

    default:
      console.log("NO MATCH TYPE");
      return { error: "NO MATCH TYPE" };
  }
};

const converNotiAcceptFriend = async (noti) => {
  const userReferenceEmail = noti.referenceEmail;
  const userReference = await getFullUserInfo(userReferenceEmail);
  console.log("ssssss: ", userReference);

  return {
    id: noti._id,
    content: noti.content,
    status: noti.status,
    type: noti.type,
    createdAt: noti.createdAt,
    seenAt: noti.seenAt,
    userReference,
  };
};
const converNotiDeleteConverstion = async (noti) => {
  const [conversationId, name] = noti.content.split(";");

  const ourConversation = await Conversation.findById(
    new mongoose.Types.ObjectId(conversationId)
  );
  if (!ourConversation) throw new Error("NOT FOUND CONVERSATION TO CONVERT");
  const myConversation = ourConversation.participants[0];

  const avatarPromises = myConversation.view.avatar.map(async (avatar) => {
    return await genPresignURL(avatar.value);
  });
  const avatars = await Promise.all(avatarPromises);

  return {
    id: noti._id,
    content: conversationId + ";" + name + ";" + avatars.join(";"),
    contentExplain:
      "conversationId;conversationName;listAvatar(maximum = 3 =>  may be 1,2 elements)",
    status: noti.status,
    type: noti.type,
    createdAt: noti.createdAt,
    seenAt: noti.seenAt,
  };
};
module.exports = convertNoti;
