import express from 'express';
import chatService from '../services/chat.service.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// GET /api/chat/:freightId -> Load message history
router.get('/:freightId', verifyToken, async (req, res) => {
  try {
    const { freightId } = req.params;
    const messages = await chatService.getChatHistory(freightId);
    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/chat -> Post new message
router.post('/', verifyToken, async (req, res) => {
  try {
    const { freightId, senderId, senderName, text } = req.body;
    if (!freightId || !senderId || !text) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const savedMessage = await chatService.createMessage({
      freightId,
      senderId,
      senderName,
      text,
    });

    return res.status(201).json({ success: true, data: savedMessage });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;