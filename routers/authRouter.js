const express = require("express");
const {validateForm, validateNewPassword} = require("../controllers/validateForm");
const router = express.Router();

const { rateLimiter } = require("../controllers/rateLimiter");
const { handleLogin } = require("../controllers/auth/handleLogin");
const { attemptLogin } = require("../controllers/auth/attemptLogin");
const { attemptRegister } = require("../controllers/auth/attemptRegister");
const { handleLogout } = require("../controllers/auth/handleLogout");
const { attemptChangePassword } = require("../controllers/auth/attemptChangePassword");
const { changeEmail } = require("../controllers/auth/changeEmail");
const { verifyCode } = require("../controllers/auth/verifyCode");

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