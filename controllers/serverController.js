const session = require("express-session");
const redisClient = require("../redis");
const RedisStore = require("connect-redis")(session);
require("dotenv").config();

const sessionMiddleware = session({
    secret: process.env.COOKIE_SECRET,
    credentials: true,
    name: "sid",
    store: new RedisStore({
        client: redisClient
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production" ? true : 'auto',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        expires: 1000 * 60 * 60 * 24 * 7
    }
})

const wrap = expressMiddleware => (socket, next) => 
    expressMiddleware(socket.request, {}, next)

const corsConfig = {
    origin: [process.env.CLIENT_URL, process.env.VIDEO_URL], // [process.env.ORIGIN_URL, process.env.VIDEO_URL],
    credentials: true,
    api: {
        bodyParser: false,
    },
}

module.exports = {
    sessionMiddleware,
    wrap,
    corsConfig
}