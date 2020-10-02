const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.user = require("./user.model");
db.conversation = require('./conversation.model');
db.conversationMap = require('./conversationMap.model');
db.thread = require('./thread.model');

module.exports = db;