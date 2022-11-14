const express = require("express");
const {newGroup} = require("../controllers/group/new");
const router = express.Router();

router
  .route("/new")
  .post(newGroup)

module.exports = router
