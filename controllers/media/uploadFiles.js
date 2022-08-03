const {dirname} = require("path");
const utf8 = require('utf8');
const {
    v4: uuidv4
} = require('uuid')

module.exports.uploadFile = (req, res) => {
    if (!req.session.user || !req.session.user.id) {
        res.json({
            error: 'Not authorized'
        })
    }

    const usertoid = req.params.userid

    if (!usertoid) return

    let file = req.files.file
    const fileName = utf8.decode(file.name)
    const filePath = uuidv4() + '.' + fileName.split('.').slice(1).join('.')
    let path = dirname(require.main.filename) + '/upload/' + filePath

    let fileType = 'FILE';

    if (file.mimetype.startsWith('video')) {
        fileType = 'VIDEO'
    } else if (file.mimetype.startsWith('image')) {
        fileType = 'IMAGE'
    } else if (file.mimetype.startsWith('audio')) {
        fileType = 'AUDIO'
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
            filePath,
            fileName,
            fileType
        }))
    })
}