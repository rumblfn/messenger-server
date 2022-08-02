const express = require("express");
const { updateBanner } = require("../controllers/user/updateBanner");
const router = express.Router();
const { updateAvatar } = require("../controllers/user/updateAvatar");
const { updateDescription } = require("../controllers/user/updateDescription");
const {getFriends} = require("../controllers/user/getFriends");

router
    .route("/update-banner")
    .post(updateBanner)

router
    .route("/update-avatar")
    .post(updateAvatar)

router
    .route('/update-description')
    .post(updateDescription)

router
    .route('/get_friends')
    .get(getFriends)

module.exports = router