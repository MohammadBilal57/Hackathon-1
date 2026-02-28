const User = require("../models/User");
const Patient = require("../models/Patient");

exports.createStaff = async (req, res) => {
  try {
    const { name, email, password, role, specialization, phone } = req.body;
    const allowed = ["doctor", "receptionist", "admin"];
    if (!allowed.includes(role)) return res.status(400).json({ message: "Invalid role" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already in use" });

    const user = await User.create({ name, email, password, role, specialization, phone });
    res.status(201).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStaff = async (req, res) => {
  try {
    const { role, page = 1, limit = 10, search } = req.query;
    const query = { role: { $ne: "patient" } };
    if (role) query.role = role;
    if (search) query.name = { $regex: search, $options: "i" };

    const total = await User.countDocuments(query);
    const staff = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ staff, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "Staff account deactivated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSubscription = async (req, res) => {
  try {
    const { userId, plan } = req.body;
    const user = await User.findByIdAndUpdate(userId, { subscriptionPlan: plan }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user, message: `Subscription updated to ${plan}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor", isActive: true }).select("name specialization email phone");
    res.json({ doctors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
