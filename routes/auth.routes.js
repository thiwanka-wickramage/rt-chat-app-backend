const { authJwt } = require('../middlewares')
const controller = require('../controllers/auth.controller');

module.exports = app => {
    app.post('/api/auth/signin', controller.signin);
    app.post('/api/auth/signup', controller.signup);
    app.post('/api/auth/logOut', authJwt.verifyToken, controller.logOut);

}