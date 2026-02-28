const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createAppointment, getAppointments, getAppointment,
  updateAppointment, deleteAppointment, getDoctorSchedule
} = require("../controllers/appointmentController");

router.use(protect);
router.get("/schedule", getDoctorSchedule);
router.route("/")
  .get(getAppointments)
  .post(authorize("admin", "receptionist", "patient"), createAppointment);

router.route("/:id")
  .get(getAppointment)
  .put(authorize("admin", "receptionist", "doctor"), updateAppointment)
  .delete(authorize("admin", "receptionist"), deleteAppointment);

module.exports = router;
