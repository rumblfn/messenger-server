const express = require("express");
const { updateBanner } = require("../controllers/userController.js/updateBanner");
const router = express.Router();
const { dirname } = require('path');
const { updateAvatar } = require("../controllers/userController.js/updateAvatar");

router
    .route("/update-banner")
    .post(updateBanner)

router
    .route("/update-avatar")
    .post(updateAvatar)

// router
//     .get('/get-banner/:filename', (req, res) => {
//         const fileName = req.params.filename
//         const path = dirname(require.main.filename) + '/images/banners/' + fileName

//         // res.sendFile(path)
//     })

module.exports = router