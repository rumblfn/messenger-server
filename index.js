const express = require("express");
const helmet = require("helmet");
const {Server} = require("socket.io")
const app = express();
const cors = require("cors")
const authRouter = require("./routers/authRouter")
const friendsRouter = require("./routers/friendsRouter")
require("dotenv").config();
const server = require("http").createServer(app)

const { sessionMiddleware, corsConfig, wrap } = require("./controllers/serverController");
const { addFriend, initializeUser, authorizeUser, onDisconnect, dm } = require("./controllers/socketController");

const io = new Server(server, {
    cors: corsConfig
})

app.use(helmet())
app.use(cors(corsConfig))

app.use(express.json());
app.use(sessionMiddleware)

app.use("/auth", authRouter)
app.use("/friends", friendsRouter)

app.get('/', (req, res) => {
    res.json('Hi')
})

io.use(wrap(sessionMiddleware))
io.use(authorizeUser)
io.on("connect", socket => {
    initializeUser(socket);

    socket.on("add_friend", (friendName, cb) => {
        addFriend(socket, friendName, cb)
    })

    socket.on("dm", message => dm(socket, message))

    socket.on("disconnect", () => onDisconnect(socket))
}) 

server.listen(4000, () => {
    console.log("Port 4000")
})