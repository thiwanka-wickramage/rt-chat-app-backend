const db = require('../models');
const redis = require('../service/redisClient');

const User = db.user;
const ConversationMap = db.conversationMap;
const Conversation = db.conversation;
const TAG = "USER CONTROLLER";

const handler = {
    findById: async (req, res) => {
        try {
            const {userId} = req.params;
            const user = await User.findById(userId);
            if (!user) return res.status(400).send('User not found.!');

            const {firstName, lastName} = user;
            res.status(200).send({firstName, lastName});
        } catch (e) {
            console.error(`Error in ${TAG}: `, e);
            res.status(500).send({message: e});
            return;
        }
    },

    findAllOnlineUsers: async (req, res) => {
        try {
            const onlineUserIds = await redis.get('onlineUsers', true)
            const onlineUsers = await User.find({_id: {$in: onlineUserIds}}, ['firstName', 'lastName', '_id']);
            res.status(200).send(onlineUsers);
        } catch (e) {
            console.error(`Error in ${TAG}: `, e);
            res.status(500).send({message: e});
            return;
        }
    },

    findAllUsers: async (req, res) => {
        try {
            const onlineUserIds = await redis.get('onlineUsers', true) || [];
            const allUsers = await User.find({}, ['firstName', 'lastName', '_id']);

            let conversationList = [];
            const {userId} = req;
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

            const conIds = conversationList.map(con => (
                    (con.createdUser._id.toString() === userId) ?
                        con.recipient._id.toString() : con.createdUser._id.toString()
                )
            );

            const filteredArray = allUsers.filter((user) => !conIds.some((id2) => id2 === user._id.toString()));

            const allUsersWithStatus = filteredArray.map(user => ((onlineUserIds.includes(user._id.toString())) ? {
                ...user._doc,
                isOnline: true
            } : {...user._doc, isOnline: false}));
            res.status(200).send(allUsersWithStatus);
        } catch (e) {
            console.error(`Error in ${TAG}: `, e);
            res.status(500).send({message: e});
            return;
        }
    }

};

module.exports = handler;