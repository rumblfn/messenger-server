const express = require("express");
const { getFriends } = require("../controllers/friendsController");
const router = express.Router();

router
    .route("/search")
    .get(async (req, res) => {
        res.send(req.query.username)
    })

router
    .get('/get', getFriends)

module.exports = router