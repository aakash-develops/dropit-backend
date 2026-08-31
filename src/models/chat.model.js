import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  freightId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MakeRequest',
    required: true,
    index: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('ChatMessage', chatMessageSchema);