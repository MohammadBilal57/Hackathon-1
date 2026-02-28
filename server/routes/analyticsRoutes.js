const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const { getAdminAnalytics, getDoctorAnalytics, getPredictiveAnalytics } = require("../controllers/analyticsController");

router.use(protect);
router.get("/admin", authorize("admin"), getAdminAnalytics);
router.get("/doctor", authorize("doctor"), getDoctorAnalytics);
router.get("/predictive", authorize("admin"), getPredictiveAnalytics);
module.exports = router;
