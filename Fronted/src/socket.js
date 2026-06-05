import { io } from "socket.io-client";

// ADDED: shared socket instance for real-time updates
const socket = io("http://localhost:5000");

// ADDED: helper to join/leave queue rooms
export const joinQueueRoom = (queueId) => {
  if (queueId) {
    socket.emit("joinQueueRoom", queueId);
  }
};

export const leaveQueueRoom = (queueId) => {
  if (queueId) {
    socket.emit("leaveQueueRoom", queueId);
  }
};

export default socket;
