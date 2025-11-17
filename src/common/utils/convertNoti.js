const getFullUserInfo = require("../../services/getFullUserInfor");
const { TYPE } = require("../../models/Noti");

const convertNoti = async (noti) => {
  switch (noti.type) {
    case TYPE.ACCEPT_FRIEND_REQUEST:
      return converNotiAcceptFriend(noti);
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

module.exports = convertNoti;
