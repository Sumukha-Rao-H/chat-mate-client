const { sequelize, Message } = require('../db');
const { Op } = require('sequelize');


const getMessages = async (req, res) => {
    const { userId1, userId2, page = 1, limit = 20 } = req.query;
  
    console.log('Fetching messages for:', userId1, userId2); // Log the incoming request parameters
  
    try {
      const messages = await Message.findAll({
        where: {
          [Op.or]: [
            { senderId: userId1, receiverId: userId2 },
            { senderId: userId2, receiverId: userId1 },
          ],
        },
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit: parseInt(limit, 10),
      });
  
      console.log('Fetched messages:', messages); // Log the fetched messages
      // Check if we have fewer messages than the requested limit
      const hasMore = messages.length === parseInt(limit, 10);
  
      res.status(200).json({
        messages: messages,
        hasMore: hasMore,  // Whether there are more messages to load
      });
    } catch (error) {
      console.error(error); // Log any error
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
};
  
const saveMessage = async (data) => {
  try {
    await Message.create(data);
  } catch (error) {
    console.error('Error saving message:', error);
  }
};

module.exports = { getMessages, saveMessage };
