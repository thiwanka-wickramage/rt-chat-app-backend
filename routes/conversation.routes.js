const { authJwt } = require('../middlewares');
const controller = require('../controllers/conversation.controller')

module.exports = app => {
    app.post("/api/conversation", authJwt.verifyToken, controller.create);
    app.get("/api/conversation", authJwt.verifyToken, controller.getAllByUserId);
    app.get("/api/thread/:conversationId/:id", authJwt.verifyToken, controller.getThreadById);

    // to add single message to thread
    app.post("/api/thread", authJwt.verifyToken, controller.addMessageToThread);
};