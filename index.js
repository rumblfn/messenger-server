const express = require("express");
const helmet = require("helmet");
const {Server} = require("socket.io")
const app = express();
const cors = require("cors")
const authRouter = require("./routers/authRouter")

const server = require("http").createServer(app)

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        credentials: "true",
    }
})

app.use(helmet())
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}))
app.use(express.json());

app.use("/auth", authRouter)

app.get('/', (req, res) => {
    res.json('Hi')
})

io.on("connect", socket => {

})

server.listen(4000, () => {
    console.log("Port 4000")
})