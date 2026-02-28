const router = require("express").Router();
const { protect, authorize, requirePro } = require("../middleware/auth");
const { upload } = require("../config/cloudinary");
const {
  createPrescription, getPrescriptions, getPrescription, generateExplanation
} = require("../controllers/prescriptionController");

router.use(protect);
router.route("/")
  .get(getPrescriptions)
  .post(authorize("doctor"), upload.single("document"), createPrescription);

router.get("/:id", getPrescription);
router.post("/:id/explanation", requirePro, generateExplanation);
module.exports = router;
