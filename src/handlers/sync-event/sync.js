const syncConversation = require("./syncConversation");
const syncUpdateUser = require("./syncUpdateUser");
const syncUser = require("./syncUser");
const syncSendMessage = require("./syncSendMessage");
const syncNoti = require("./syncNoti");
const handleSendNotiReceiveFRForMuti = require("../socket-event-bus/handleSendNotiReceiveFRForMuti");
const handleSendNotiRejectFRForMuti = require("../socket-event-bus/handleSendNotiRejectFRForMuti");
const handleSendNotiCancelFRForMuti = require("../socket-event-bus/handleSendNotiCancelFRForMuti");
const handleSendNotiRemoveFriendForMuti = require("../socket-event-bus/handleSendNotiRemoveFriendForMuti");
const handleSendNotiAcceptFRForMuti = require("../socket-event-bus/handleSendNotiAcceptFRForMuti");
const handleSendNotiCreateGroupForMuti = require("../socket-event-bus/handleSendNotiCreateGroupForMuti");
const handleSendNotiAddMemberGroupForMuti = require("../socket-event-bus/handleSendNotiAddMemberGroupForMuti");
const handleSendNotiDeleteMemberGroupForMuti = require("../socket-event-bus/handleSendNotiDeleteMemberGroupForMuti");
const handleSendNotiLeaveGroupForMuti = require("../socket-event-bus/handleSendNotiLeaveGroupForMuti");
const handleSendNotiDeleteConversationForMuti = require("../socket-event-bus/handleSendNotiDeleteConversationForMuti");
const handleTyping = require("../socket-event-bus/handleTyping");
const handleNewReaction = require("../socket-event-bus/handleNewReaction");

const sync = async (message) => {
  try {
    const { eventType, ...data } = message;

    switch (eventType) {
      case "SYNC_USER":
        await syncUser(data);
        break;

      case "SYNC_UPDATE_USER":
        await syncUpdateUser(data);
        break;

      case "SYNC_CONVERSATION":
        await syncConversation(data);
        break;

      case "SYNC_SEND_MESSAGE":
        await syncSendMessage(data);
        break;

      case "TEST":
        console.log("WOWWWWWWWW____TESTTTTTTT: ", data);
        break;

      case "NOTI":
        await syncNoti(data);
        break;

      case "RECEIVE_FRIEND_REQUEST":
        await handleSendNotiReceiveFRForMuti(data);
        break;

      case "CANCEL_FRIEND_REQUEST":
        await handleSendNotiCancelFRForMuti(data);
        break;

      case "DELETE_FRIEND":
        await handleSendNotiRemoveFriendForMuti(data);
        break;

      case "REJECT_FRIEND_REQUEST":
        await handleSendNotiRejectFRForMuti(data);
        break;

      case "ACCEPT_FRIEND_REQUEST":
        await handleSendNotiAcceptFRForMuti(data);
        break;

      case "CREATE_GROUP":
        await handleSendNotiCreateGroupForMuti(data);
        break;

      case "ADD_MEMBER_TO_GROUP":
        await handleSendNotiAddMemberGroupForMuti(data);
        break;

      case "DELETE_MEMBER_FROM_GROUP":
        await handleSendNotiDeleteMemberGroupForMuti(data);
        break;

      case "LEAVE_GROUP":
        await handleSendNotiLeaveGroupForMuti(data);
        break;

      case "DELETE_CONVERSATION":
        await handleSendNotiDeleteConversationForMuti(data);
        break;

      case "TYPING":
        await handleTyping(data);
        break;

      case "NEW_REACTION":
        await handleNewReaction(data);
        break;
      default:
        console.log("NOT FOUND CURRENT EVENT TYPE: " + eventType);
    }

    console.log("📥 sync successfully:");
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = sync;
