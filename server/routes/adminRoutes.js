const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const { createStaff, getStaff, updateStaff, deleteStaff, updateSubscription, getDoctors } = require("../controllers/adminController");

router.use(protect, authorize("admin"));
router.get("/doctors", getDoctors);
router.route("/staff").get(getStaff).post(createStaff);
router.route("/staff/:id").put(updateStaff).delete(deleteStaff);
router.post("/subscription", updateSubscription);
module.exports = router;
