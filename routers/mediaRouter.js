const express = require("express");
const router = express.Router();
const {uploadFile} = require("../controllers/media/uploadFiles");
const {getFile} = require("../controllers/media/getFile");

router
    .route('/getFile/:filename')
    .get(getFile)

router
    .route("/uploadFile/:userid")
    .post(uploadFile)

module.exports = router