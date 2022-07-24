const express = require("express");
const router = express.Router();
const fs = require('fs')
const {
    dirname
} = require('path');

router
    .route('/getFile/:filename')
    .get((req, res) => {
        const fileName = req.params.filename
        let path = dirname(require.main.filename) + '/upload/' + fileName

        res.sendFile(path)
    })

router
    .route("/uploadFile")
    .post((req, res) => {
        if (!req.session.user || !req.session.user.id) {
            res.json({
                error: 'Not authorized'
            })
        }
    
        const userid = req.session.user.id
        let file = req.files.file
        const fileName = `${userid}_${file.name}`
        let path = dirname(require.main.filename) + '/upload/' + fileName
    
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
                path: fileName
            }))
        })
    })

module.exports = router