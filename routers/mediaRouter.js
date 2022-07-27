const express = require("express");
const router = express.Router();
const {
    dirname
} = require('path');
const {
    v4: uuidv4
} = require('uuid')

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
        const fileName = `${req.session.user.id}_${uuidv4(8)}_${file.name}`
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

            res.end(JSON.stringify({
                status: 'success',
                path: fileName,
                fileType
            }))
        })
    })

module.exports = router