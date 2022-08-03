const {dirname} = require("path");

module.exports.getFile = (req, res) => {
    const fileName = req.params.filename
    let path = dirname(require.main.filename) + '/upload/' + fileName

    res.sendFile(path)
}