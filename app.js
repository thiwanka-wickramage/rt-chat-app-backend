const express = require("express");
const cors = require("cors");

const app = express();
const socketServer = require('./middlewares/socketServer');
const redis = require('./service/redisClient');

const corsOptions = {
    origin: "http://localhost:3000"
};
app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({extended: true}));

const db = require("./models");

const {MONGO_INITDB_ROOT_USERNAME, MONGO_INITDB_ROOT_PASSWORD, MONGO_INITDB_DATABASE, MONGO_PORT, MONGO_HOST} = process.env;
if (!MONGO_INITDB_ROOT_PASSWORD) {
    console.error("Please provide database password as an ENV variable..!");
    process.exit();
}

db.mongoose
    .connect(`mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_INITDB_DATABASE}?authSource=admin`, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log("Successfully connect to MongoDB.");
        startServer();
    })
    .catch(err => {
        console.error("Connection error", err);
        process.exit();
    });

// simple route
app.get("/", (req, res) => {
    res.json({message: "Welcome to bezkoder application."});
});
// routes
require('./routes/auth.routes')(app);
require('./routes/user.routes')(app);
require('./routes/conversation.routes')(app);

// set port, listen for requests
const PORT = process.env.PORT || 8080;

const startServer = async () => {
    const server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}.`);
    });

    redis.initializeRedis();
    //initialized the socket connection
    await socketServer.initializeSocket(server);
};
