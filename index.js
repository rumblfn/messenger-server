const express = require("express");
const helmet = require("helmet");
const {
    Server
} = require("socket.io")
const app = express();
const cors = require("cors")
const authRouter = require("./routers/authRouter")
const friendsRouter = require("./routers/friendsRouter")
const userRouter = require('./routers/userRouter')
const mediaRouter = require('./routers/mediaRouter')
require("dotenv").config();
const server = require("http").createServer(app)
const fileupload = require('express-fileupload')

const {
    sessionMiddleware,
    corsConfig,
    wrap
} = require("./controllers/serverController");

const {
    addFriend
} = require("./controllers/socket/addFriend");
const {
    dm
} = require("./controllers/socket/userMessage");
const {
    readMessages
} = require("./controllers/socket/readChatMessages");
const {
    acceptConf
} = require("./controllers/socket/acceptFriendRequest");
const {
    declineConf
} = require("./controllers/socket/declineFriendRequest");
const {
    onDisconnect
} = require("./controllers/socket/disconnect");
const {
    initializeUser
} = require("./controllers/socket/initializeUser");
const {
    authorizeUser
} = require("./controllers/socket/authorizeUser");
const {
    chatMessages
} = require("./controllers/socket/getChatMessages");
const {
    updateBanner
} = require("./controllers/socket/updateBanner");
const {
    updateAvatar
} = require("./controllers/socket/updateAvatar");
const {
    updateAbout
} = require("./controllers/socket/updateAbout");
const {
    delMessage
} = require("./controllers/socket/deleteMessage");

const io = new Server(server, {
    cors: corsConfig
})

app.use(helmet())
app.use(cors(corsConfig))

app.use(express.json());
app.use(sessionMiddleware)

app.use('/images', express.static('images'));
app.use(fileupload())

app.use("/auth", authRouter)
app.use("/friends", friendsRouter)
app.use('/user', userRouter)
app.use('/media', mediaRouter)

app.get('/', (req, res) => {
    res.json('Server for messenger')
})

io.use(wrap(sessionMiddleware))
io.use(authorizeUser)
io.on("connect", socket => {
    initializeUser(socket);

    socket.on("add_friend", (friendName, cb) => addFriend(socket, friendName, cb))

    socket.on("dm", (message, id) => dm(socket, message, id))

    socket.on("readMessages", userid => readMessages(socket, userid))

    socket.on("accept_confirmation", user => acceptConf(socket, user))
    socket.on("decline_confirmation", user => declineConf(socket, user))

    socket.on("disconnect", () => onDisconnect(socket))

    socket.on("chatMessages", userid => chatMessages(socket, userid))

    socket.on('banner-changed', filename => updateBanner(socket, filename))

    socket.on('avatar-changed', filename => updateAvatar(socket, filename))

    socket.on('about-changed', about => updateAbout(socket, about))

    socket.on('delete-message-me', messageToDelete => delMessage(socket, messageToDelete, false))

    socket.on('delete-message-me-and-user', messageToDelete => delMessage(socket, messageToDelete, true))

});

server.listen(4000, () => {
    console.log("Port 4000")
})