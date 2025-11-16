const handleSendNotiDeleteConversationForMuti = async (message) => {
  console.log("emit delete conver  .....");
  console.log("message: " + JSON.stringify(message, null, 2));

  if (message.data.type === "private" || message.data.type === "bot") {
    message.data.actionUserId.forEach((userId) => {
      global.io.to(userId.toString()).emit("deleteConversation", message);
    });
  } else if (message.data.type === "group") {
    message.data.actionUserId.forEach((userId) => {
      global.io.to(userId.toString()).emit("deleteConversation", message);
      message.data.remainMemberIds.forEach((userId) => {
        global.io.to(userId.toString()).emit("deleteConversation", message);
      });
    });
  }

  console.log("emit delete-conver success.....");
};
module.exports = handleSendNotiDeleteConversationForMuti;
