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


    // new rooms

    socket.on('BE-check-user', ({
        roomId
    }) => {
        let error = false;

        const clients = io.sockets.adapter.rooms[roomId];

        if (clients) {
            clients.forEach((client) => {
                if (socketList[client] == socket.user.username) {
                    error = true;
                }
            });
        } else {
            socket.emit('FE-error-user-exist', {
                error,
                username: socket.user.username,
                roomName: roomId
            });
        }
    });

    socket.on('BE-leave-room', ({
        roomId
    }) => {
        delete socketList[socket.id];
        io
            .to(roomId)
            .emit('FE-user-leave', {
                userId: socket.id
            });
        socket.leave(roomId);
    });

    socket.on('BE-join-room', ({
        roomId
    }) => {
        const userName = socket.user.username
        // Socket Join RoomName
        socket.join(roomId);
        socketIdToRoom[socket.id] = roomId
        socketList[socket.id] = {
            userName,
            video: true,
            audio: true
        };

        console.log(socketList)

        // Set User List

        const clients = io.sockets.adapter.rooms.get(roomId) || []
        try {
            const users = [];
            clients.forEach((client) => {
                users.push({
                    userId: client,
                    info: socketList[client]
                });
            });
            io.to(roomId).emit('FE-user-join', users);
        } catch (e) {
            io.in(roomId).emit('FE-error-user-exist', {
                err: true
            });
        }
    });

    socket.on('BE-call-user', ({
        userToCall,
        from,
        signal
    }) => {
        socket.to(userToCall).emit('FE-receive-call', {
            signal,
            from,
            info: socketList[socket.id],
        });
    });

    socket.on('BE-accept-call', ({ signal, to }) => {
        socket.to(to).emit('FE-call-accepted', {
          signal,
          answerId: socket.id,
        });
    });

});

server.listen(4000, () => {
    console.log("Port 4000")
})