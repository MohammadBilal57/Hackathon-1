const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

// Verify JWT
exports.protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Not authorized, no token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ message: "User not found" });
    if (!req.user.isActive) return res.status(403).json({ message: "Account deactivated" });
    next();
  } catch (err) {
    res.status(401).json({ message: "Token invalid or expired" });
  }
};

// Role-based access
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role '${req.user.role}' not authorized for this route` });
    }
    next();
  };
};

// Pro plan guard
exports.requirePro = (req, res, next) => {
  if (req.user.subscriptionPlan !== "pro") {
    return res.status(403).json({
      message: "This feature requires a Pro subscription. Please upgrade to access it.",
      upgradeRequired: true,
    });
  }
  next();
};
