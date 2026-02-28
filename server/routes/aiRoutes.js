const router = require("express").Router();
const { protect, authorize, requirePro } = require("../middleware/auth");
const { symptomChecker, runRiskFlagging, getDiagnosisLogs } = require("../controllers/aiController");

router.use(protect, requirePro);
router.post("/symptom-check", authorize("doctor"), symptomChecker);
router.post("/risk-flag/:patientId", authorize("doctor", "admin"), runRiskFlagging);
router.get("/diagnosis-logs", getDiagnosisLogs);
module.exports = router;
