const express = require("express");
const router = express.Router();
const { registerUser, loginUser, logoutUser, getUser, loginStatus, updateUser, changePassword, forgotPassword, resetPassword, deleteAccount } = require("../controllers/userController");
const protect = require("../middleWare/authMiddleware");
const protectDeletedUser = require("../middleWare/deletedUserMiddleware");



router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser)
router.get("/getuser", protect, getUser);
router.get("/loggedin", protectDeletedUser, loginStatus);
router.patch("/updateuser",protect, updateUser);
router.patch("/changepassword",protect, changePassword);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resetToken", resetPassword);
router.delete("/deleteaccount/:id", protect, deleteAccount);











module.exports = router