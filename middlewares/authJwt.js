const jwt = require('jsonwebtoken');
const { SECRET_KEY } = process.env;

module.exports.verifyToken = (req, res, next) =>{
    let token = req.headers["authorization"];

    if (!token) {
        return res.status(403).send({ message: "Token not provided!" });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "Unauthorized!" });
        }
        req.userId = decoded.id;
        next();
    });
};