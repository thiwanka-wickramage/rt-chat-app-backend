const redis = require('redis');
const bluebird = require('bluebird');
bluebird.promisifyAll(redis);

const { REDIS_HOST, REDIS_PORT }  = process.env;
const redis_url = `redis://${REDIS_HOST}:${REDIS_PORT}`;
let redisClient = null;
const initializeRedis = () => {
    redisClient = redis.createClient(redis_url);
    redisClient.on('connect', () => {
        console.info('Redis client is up and running')
    })
};

const set = (key, val, exp) => {
    const value = typeof val !== 'string' ? JSON.stringify(val) : val

    if (exp)
        return redisClient.setAsync(key, value, exp)

    return redisClient.setAsync(key, value);
};

const get = async (key, shouldParse = false) => {
    const data =  await redisClient.getAsync(key);
    if (shouldParse) return JSON.parse(data)

    return data
};

module.exports = {
    initializeRedis,
    set,
    get
};