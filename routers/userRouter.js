const express = require("express");
const { updateBanner } = require("../controllers/user/updateBanner");
const router = express.Router();
const { updateAvatar } = require("../controllers/user/updateAvatar");
const { updateDescription } = require("../controllers/user/updateDescription");

router
    .route("/update-banner")
    .post(updateBanner)

router
    .route("/update-avatar")
    .post(updateAvatar)

router
    .route('/update-description')
    .post(updateDescription)

module.exports = router