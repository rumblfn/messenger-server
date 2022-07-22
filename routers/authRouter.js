const express = require("express");
const {validateForm, validateNewPassword} = require("../controllers/validateForm");
const router = express.Router();

const {handleLogin, attemptLogin, attemptRegister, handleLogout, attemptChangePassword, changeEmail, verifyCode} = require('../controllers/authController');
const { rateLimiter } = require("../controllers/rateLimiter");

router
    .route("/login")
    .get(handleLogin)
    .post(validateForm, rateLimiter(60, 10), attemptLogin)

router
    .route("/logout")
    .get(handleLogout)

router
    .post("/signup", validateForm, rateLimiter(30, 4), attemptRegister)

router
    .route("/change-password")
    .post(validateNewPassword, rateLimiter(60, 10), attemptChangePassword)

router
    .route("/change-email")
    .post(changeEmail)

router
    .route("/verify-email-code")
    .post(verifyCode)

module.exports = router