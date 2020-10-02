const mongoose = require("mongoose");

const ConversationMap = mongoose.model(
    "ConversationMap",
    new mongoose.Schema({
        userId: String,
        conversationId: [String]
    })
);

module.exports = ConversationMap;