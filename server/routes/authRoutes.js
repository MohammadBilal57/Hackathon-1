const router = require("express").Router();
const { body } = require("express-validator");
const { register, login, refreshToken, logout, getMe, updateProfile } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/register", [
  body("name").trim().notEmpty(),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  body("role").isIn(["admin", "doctor", "receptionist", "patient"]),
], register);

router.post("/login", [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
], login);

router.post("/refresh", refreshToken);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfile);

module.exports = router;
