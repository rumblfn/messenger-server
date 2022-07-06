const express = require("express");
const router = express.Router();

router
    .route("/search")
    .get(async (req, res) => {
        // console.log(req.query.username)
        res.send(req.query.username)
    })

module.exports = router