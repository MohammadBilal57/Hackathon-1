const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const DiagnosisLog = require("../models/DiagnosisLog");
const User = require("../models/User");

exports.createPatient = async (req, res) => {
  try {
    // Check free plan limit
    if (req.user.subscriptionPlan === "free") {
      const count = await Patient.countDocuments({ createdBy: req.user._id });
      if (count >= 20) {
        return res.status(403).json({
          message: "Free plan limit reached (20 patients). Please upgrade to Pro.",
          upgradeRequired: true,
        });
      }
    }

    const patient = await Patient.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPatients = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { contact: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Patient.countDocuments(query);
    const patients = await Patient.find(query)
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ patients, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate("createdBy", "name");
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json({ patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json({ patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    await Patient.findByIdAndDelete(req.params.id);
    res.json({ message: "Patient deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPatientTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    const [appointments, prescriptions, diagnosisLogs] = await Promise.all([
      Appointment.find({ patientId: id }).populate("doctorId", "name specialization").sort({ date: -1 }),
      Prescription.find({ patientId: id }).populate("doctorId", "name specialization").sort({ createdAt: -1 }),
      DiagnosisLog.find({ patientId: id }).populate("doctorId", "name").sort({ createdAt: -1 }),
    ]);

    const timeline = [
      ...appointments.map((a) => ({ type: "appointment", date: a.date, data: a })),
      ...prescriptions.map((p) => ({ type: "prescription", date: p.createdAt, data: p })),
      ...diagnosisLogs.map((d) => ({ type: "diagnosis", date: d.createdAt, data: d })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ timeline });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
