const mongoose = require("mongoose");

const Conversation = mongoose.model(
    "Conversation",
    new mongoose.Schema({
        createdUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        threadId: String,
        notSeenUserId : String
    })
);

module.exports = Conversation;