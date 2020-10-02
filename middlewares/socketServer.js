const socket  = require('socket.io');
const redis = require('../service/redisClient');
let io = null;
//this should be replace from Redis service
const sessions =  {};

const addClient = async (userId, client) => {
    const userSessions = await redis.get(userId, true) || [];
    const onlineUsers = await redis.get('onlineUsers', true) || []

    userSessions.push(client.id);
    redis.set(userId, userSessions);

    onlineUsers.push(userId)
    const uniqueOnlineUsers = [...new Set(onlineUsers)]

    redis.set('onlineUsers', uniqueOnlineUsers);
};

const removeClient = async (userId, client) => {
    const userSessions = await redis.get(userId, true) || [];
    const onlineUsers = await redis.get('onlineUsers', true) || []

    const clientIndex = userSessions.findIndex(us => us ===client.id)

    if (clientIndex < 0) return;
    userSessions.splice(clientIndex, 1);
    redis.set(userId, userSessions);

    if (userSessions.length <= 0) {
       const userIndex = onlineUsers.findIndex((user => user === userId))
        if (userIndex < 0) return;

        onlineUsers.splice(userIndex, 1);
        redis.set('onlineUsers', onlineUsers);
    }
};


const initializeSocket = async (server) => {
    try {
        io = socket(server, {
            path: '/socket',
            serveClient: false,
            pingInterval: 10000,
            pingTimeout: 5000,
            cookie: false
        });
        io.set('origins', '*:*');
        io.on('connection', async client => {
            const { userId } = client.handshake.query;
            await addClient(userId, client);
            await emitToEveryone({ tag : 'USER_LOGGED_IN' , userId});

            client.on('disconnect', () => {
                removeClient(userId, client);
            });
        });
    }catch (e) {
        console.error('socket initialization error :', e)
    }

};

const emitMessageToUser = async (userId, payload) => {
    const userSessions = await redis.get(userId, true) || [];
    userSessions.forEach(session => {
        io.to(session).emit('GET /live/incoming-message', payload)
    });
    return userSessions.length;
};

const emitToEveryone = (message) => {
    io.sockets.emit('GET /live/global-news', message)
};

module.exports = {
    initializeSocket,
    emitMessageToUser,
    emitToEveryone,
    removeClient
};