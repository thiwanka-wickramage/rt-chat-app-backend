const bcrypt = require('bcryptjs');
const jwToken = require('jsonwebtoken');
const { SECRET_KEY } = process.env;
const db = require('../models');
const socketServer = require('../middlewares/socketServer');

const User = db.user;

const handler = {
    signup: async (req, res) => {
        try {
            const {firstName, lastName, email, password} = req.body;
            let user = await User.findOne({
                email
            });

            if (user) {
                res.status(400).send({message: "Failed! Email is already in use!"});
                return;
            }

            user = new User({
                firstName,
                lastName,
                email,
                password: bcrypt.hashSync(password, 8)
            });

            await user.save();
            res.status(200).send({message: "User was registered successfully!"});
        } catch (e) {
            console.error("Error in signup function : ", e);
            res.status(500).send({message: e});
            return;
        }
    },

    signin: async (req, res) => {
        try {
            const {email, password} = req.body;
            const user = await User.findOne({
                email
            });

            if (!user) {
                return res.status(404).send({message: "User Not found."});
            }

            const isValidUser = bcrypt.compareSync(
                password,
                user.password
            );

            if (!isValidUser) {
                return res.status(401).send({
                    accessToken: null,
                    message: "Provided email or password incorrect.! Please try again."
                });
            }

            // generate logged user jwt token and set token expiration to 24 hours
            const token = jwToken.sign({id: user.id}, SECRET_KEY, {
                expiresIn: 86400 // 24 hours
            });

            res.status(200).send({
                user: {
                    id: user.id,
                    username: `${user.firstName} ${user.lastName}`,
                    token
                },
                message: 'User logged in successfully!'
            });
        } catch (e) {
            console.error("Error in signin function : ", e);
            res.status(500).send({message: e});
            return;
        }
    },

    logOut: async (req, res) => {
        try {
            const {socketId} = req.body;
            await socketServer.removeClient(req.userId, {id: socketId})
            res.status(200).send('User successfully logged out!');
            socketServer.emitToEveryone({tag: 'USER_LOGGED_OUT', userId: req.userId})
        } catch (e) {
            console.error("Error in signin function : ", e);
            res.status(500).send({message: e});
            return;
        }
    }
};

module.exports = handler;