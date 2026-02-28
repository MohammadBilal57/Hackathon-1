const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createPatient, getPatients, getPatient,
  updatePatient, deletePatient, getPatientTimeline
} = require("../controllers/patientController");

router.use(protect);
router.route("/")
  .get(getPatients)
  .post(authorize("admin", "receptionist"), createPatient);

router.route("/:id")
  .get(getPatient)
  .put(authorize("admin", "receptionist"), updatePatient)
  .delete(authorize("admin"), deletePatient);

router.get("/:id/timeline", getPatientTimeline);
module.exports = router;
