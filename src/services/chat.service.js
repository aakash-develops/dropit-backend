import ChatMessage from '../models/chat.model.js';

class ChatService {
  // Fetch message history for a freight order
  async getChatHistory(freightId) {
    return await ChatMessage.find({ freightId })
      .sort({ timestamp: 1 })
      .lean();
  }

  // Create and persist a message
  async createMessage({ freightId, senderId, senderName, text }) {
    const newMessage = new ChatMessage({
      freightId,
      senderId,
      senderName,
      text: text.trim(),
    });
    return await newMessage.save();
  }
}

export default new ChatService();