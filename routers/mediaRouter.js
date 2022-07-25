const express = require("express");
const router = express.Router();
const fs = require('fs')
const {
    dirname
} = require('path');
const redisClient = require("../redis");

router
    .route('/getFile/:filename')
    .get((req, res) => {
        const fileName = req.params.filename
        let path = dirname(require.main.filename) + '/upload/' + fileName

        res.sendFile(path)
    })

router
    .route("/uploadFile/:userid")
    .post((req, res) => {
        if (!req.session.user || !req.session.user.id) {
            res.json({
                error: 'Not authorized'
            })
        }

        const usertoid = req.params.userid

        if (!usertoid) return

        const userid = req.session.user.userid
        let file = req.files.file
        const fileName = `${req.session.user.id}_${file.name}`
        let path = dirname(require.main.filename) + '/upload/' + fileName

        let fileType = 'FILE';

        if (file.mimetype.startsWith('video')) {
            fileType = 'VIDEO'
        } else if (file.mimetype.startsWith('image')) {
            fileType = 'IMAGE'
        }

        file.mv(path, async (error) => {
            if (error) {
                res.writeHead(500, {
                    'Content-Type': 'application/json'
                })
                res.end(JSON.stringify({
                    status: 'error',
                    message: error
                }))
                return
            }

            res.writeHead(200, {
                'Content-Type': 'application/json'
            })

            const messageString = [new Date().getTime(), fileType, usertoid, userid, fileName].join(".")

            await redisClient.hincrby(`userid:${usertoid}:chats`, userid, 1)

            await redisClient.rpush(`chats:${usertoid}:${userid}`, messageString)
            await redisClient.rpush(`chats:${userid}:${usertoid}`, messageString)

            res.end(JSON.stringify({
                status: 'success',
                path: fileName,
                fileType
            }))
        })
    })

module.exports = router