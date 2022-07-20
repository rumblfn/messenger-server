const express = require("express");
const helmet = require("helmet");
const {
    Server
} = require("socket.io")
const app = express();
const cors = require("cors")
const authRouter = require("./routers/authRouter")
const friendsRouter = require("./routers/friendsRouter")
require("dotenv").config();
const server = require("http").createServer(app)

let socketList = {};
const socketIdToRoom = {}

const users = {};
const socketToRoom = {};

const {
    sessionMiddleware,
    corsConfig,
    wrap
} = require("./controllers/serverController");

const {
    addFriend
} = require("./controllers/socketController/addFriend");
const {
    dm
} = require("./controllers/socketController/userMessage");
const {
    readMessages
} = require("./controllers/socketController/readChatMessages");
const {
    acceptConf
} = require("./controllers/socketController/acceptFriendRequest");
const {
    declineConf
} = require("./controllers/socketController/declineFriendRequest");
const {
    onDisconnect
} = require("./controllers/socketController/disconnect");
const {
    initializeUser
} = require("./controllers/socketController/initializeUser");
const {
    authorizeUser
} = require("./controllers/socketController/authorizeUser");
const {
    chatMessages
} = require("./controllers/socketController/getChatMessages");

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
    res.json('Server for messenger')
})

io.use(wrap(sessionMiddleware))
io.use(authorizeUser)
io.on("connect", socket => {
    initializeUser(socket);

    socket.on("add_friend", (friendName, cb) => {
        addFriend(socket, friendName, cb)
    })

    socket.on("dm", (message, id) => dm(socket, message, id))

    socket.on("readMessages", userid => readMessages(socket, userid))

    socket.on("accept_confirmation", user => acceptConf(socket, user))
    socket.on("decline_confirmation", user => declineConf(socket, user))

    socket.on("disconnect", () => {
        onDisconnect(socket)

        const roomId = socketIdToRoom[socket.id]
        delete socketList[socket.id];
        io
            .to(roomId)
            .emit('FE-user-leave', {
                userId: socket.id
            });
        socket.leave(roomId)


        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id);
            users[roomID] = room;
        }
    })

    socket.on("chatMessages", userid => chatMessages(socket, userid))

    socket.on('me', () => socket.emit('me', socket.id))

    socket.on("callEnded", () => {
        socket.broadcast.emit("callEnded")
    })

    socket.on('callUser', data => {
        socket.to(data.userToCall).emit('callUser', {
            signal: data.signalData,
            from: data.from,
            name: data.name
        })
    })

    socket.on('answerCall', data => {
        socket.to(data.to).emit("callAccepted", data.signal)
    })

});

server.listen(4000, () => {
    console.log("Port 4000")
})