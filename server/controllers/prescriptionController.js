const Prescription = require("../models/Prescription");
const { generatePrescriptionExplanation } = require("../services/aiService");

exports.createPrescription = async (req, res) => {
  try {
    const { patientId, appointmentId, diagnosis, instructions, followUpDate } = req.body;
    let { medicines } = req.body;

    let documentUrl = null;
    if (req.file) {
      documentUrl = req.file.path;
    }

    if (typeof medicines === "string") {
      medicines = JSON.parse(medicines);
    }

    const prescription = await Prescription.create({
      patientId, doctorId: req.user._id, appointmentId,
      medicines, diagnosis, instructions, followUpDate, documentUrl
    });

    // Auto-generate AI explanation if Pro plan
    if (req.user.subscriptionPlan === "pro") {
      const result = await generatePrescriptionExplanation({ medicines, diagnosis, instructions });
      prescription.aiExplanation = result.explanation;
      await prescription.save();
    }

    await prescription.populate([
      { path: "patientId", select: "name age gender" },
      { path: "doctorId", select: "name specialization" },
    ]);

    res.status(201).json({ prescription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPrescriptions = async (req, res) => {
  try {
    const { patientId, page = 1, limit = 10 } = req.query;
    const query = {};
    if (req.user.role === "doctor") query.doctorId = req.user._id;
    if (patientId) query.patientId = patientId;

    const total = await Prescription.countDocuments(query);
    const prescriptions = await Prescription.find(query)
      .populate("patientId", "name age gender")
      .populate("doctorId", "name specialization")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ prescriptions, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate("patientId")
      .populate("doctorId", "name specialization phone");
    if (!prescription) return res.status(404).json({ message: "Prescription not found" });
    res.json({ prescription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.generateExplanation = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ message: "Prescription not found" });

    const { language = "english" } = req.body;
    const result = await generatePrescriptionExplanation({
      medicines: prescription.medicines,
      diagnosis: prescription.diagnosis,
      instructions: prescription.instructions,
      language,
    });

    if (language === "urdu") {
      prescription.aiExplanationUrdu = result.explanation;
    } else {
      prescription.aiExplanation = result.explanation;
    }
    await prescription.save();

    res.json({ explanation: result.explanation, isFallback: result.fallback });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
