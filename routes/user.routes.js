const { authJwt } = require('../middlewares');
const controller = require('../controllers/user.controller')

module.exports = app => {
    app.get("/api/user/:userId", authJwt.verifyToken, controller.findById);
    app.get("/api/users", authJwt.verifyToken, controller.findAllUsers);
}