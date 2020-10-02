const mongoose = require("mongoose");

const Thread = mongoose.model(
    "Thread",
    new mongoose.Schema({
        messages: [
            {
                userId: String,
                content: String,
                time: {type: Date, default: Date.now},
            }]
    })
);

module.exports = Thread;