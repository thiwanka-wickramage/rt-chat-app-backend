const bcrypt = require('bcryptjs');
const jwToken = require('jsonwebtoken');

const db = require('../models');
const socket = require('../middlewares/socketServer');
const redis = require('../service/redisClient');

const Conversation = db.conversation;
const ConversationMap = db.conversationMap;
const Thread = db.thread;

const createThread = async (userId, content) => {
    const thread = new Thread({
        messages: {
            userId,
            content
        }
    });
    return await thread.save();
};

const createConversation = async (userId, recipient, threadId) => {
    const conversation = new Conversation({
        createdUser: userId,
        recipient,
        threadId
    });
    return await conversation.save();
};

const createConversationMap = async (userId, conversationId) => {
    const conversationMap = new ConversationMap({
        userId,
        conversationId: [conversationId]
    });
    return await conversationMap.save();
};

const updateConversationMap = async (userId, conversationId) => {
    await ConversationMap.updateOne(
        {userId: userId},
        {$push: {conversationId}}
    )
};

const handler = {
    create: async (req, res) => {
        try {
                const {content, recipientId, conversationId = null} = req.body;
            const userId = req.userId;

            let userConversation = null;
            let threadId = null;
            if (conversationId)
                userConversation = await Conversation.findById(conversationId);

            if (!userConversation) {
                const newThread = await createThread(userId, content);
                threadId = newThread.id;
                userConversation = await createConversation(userId, recipientId, threadId);

                const conMap = await ConversationMap.findOne({userId});
                if (!conMap) {
                    await createConversationMap(userId, userConversation.id);
                } else {
                    await updateConversationMap(userId, userConversation.id);
                }

                const recipientConMap = await ConversationMap.findOne({recipientId});
                if (!recipientConMap) {
                    await createConversationMap(recipientId, userConversation.id);
                } else {
                    await updateConversationMap(recipientId, userConversation.id);
                }
            } else {
                await Thread.updateOne(
                    {_id: userConversation.threadId},
                    {
                        $push: {
                            messages: {
                                userId,
                                content
                            }
                        }
                    }
                );

            }
            const isOnline = await socket.emitMessageToUser(recipientId, { messages: {
                    userId,
                    content
                }, conversationId : userConversation.id});
            if (!isOnline) {
                await Conversation.updateOne(
                    {_id: conversationId},
                    {$set: {"notSeenUserId": recipientId}})
            }
            res.status(200).send({conversationId: userConversation.id, threadId});
        } catch (e) {
            console.error("Error in conversation function : ", e);
            res.status(500).send({message: e});
            return;
        }
    },

    getAllByUserId: async (req, res) => {
        try {
            let conversationList = [];
            const {userId} = req;
            const onlineUserIds = await redis.get('onlineUsers', true) || [];
            const conversationMap = await ConversationMap.findOne({userId});
            if (conversationMap) {
                conversationList = await Conversation.find({
                    _id: {
                        $in: conversationMap.conversationId
                    }
                })
                    .populate('createdUser', ['firstName', 'lastName'])
                    .populate('recipient', ['firstName', 'lastName'])
            }

            conversationList = conversationList.map(con => {
                const recipientId = (con.createdUser._id.toString() === userId) ? con.recipient._id.toString() : con.createdUser._id.toString();;
                return onlineUserIds.includes(recipientId) ? {...con._doc, isOnline: true} : con;
            })
            res.status(200).send(conversationList);
        } catch (e) {
            console.error("Error in conversation function : ", e);
            res.status(500).send({message: e});
            return;
        }
    },

    getThreadById: async (req, res) => {
        try {
            const {conversationId , id} = req.params;
            const { isRead } = req.query

            const threadContent = await Thread.findById(id);
            if(isRead){
                await Conversation.updateOne(
                    { _id: conversationId},
                    {$set: { notSeenUserId: null } }
                )
            }

            res.status(200).send(threadContent);
        } catch (e) {
            console.error("Error in conversation function : ", e);
            res.status(500).send({message: e});
            return;
        }
    },

    addMessageToThread: async (req, res) => {
        try {
            const {content, threadId, conversationId = null} = req.body;

            if (!conversationId) {
                return res.status(400).send({message: "Required parameter(s) not found."});
            }

            const conversation = await Conversation.findById(conversationId);
            if (!conversation)
                return res.status(400).send({message: "Conversation id invalid."});

            const recipientId = conversation.createdUser.toString() === req.userId ? conversation.recipient.toString() : conversation.createdUser.toString();
            const messages = {
                userId: req.userId,
                content
            };

            await Thread.updateOne(
                {_id: threadId},
                {
                    $push: {
                        messages
                    }
                }
            );

            const isOnline = await socket.emitMessageToUser(recipientId, { messages, conversationId});
            if (!isOnline) {
                await Conversation.updateOne(
                    {_id: conversationId},
                    {$set: {"notSeenUserId": recipientId}})
            }
            res.status(200).send({message: "Conversation successfully created/updated!"});
        } catch (e) {
            console.error("Error in addMessageToThread function : ", e);
            res.status(500).send({message: e});
            return;
        }
    }
};

module.exports = handler;