const DiagnosisLog = require("../models/DiagnosisLog");
const Patient = require("../models/Patient");
const { analyzeSymptoms, checkRiskPatterns } = require("../services/aiService");

exports.symptomChecker = async (req, res) => {
  try {
    const { patientId, symptoms, age, gender, history } = req.body;

    const result = await analyzeSymptoms({ symptoms, age, gender, history });

    const log = await DiagnosisLog.create({
      patientId,
      doctorId: req.user._id,
      symptoms,
      patientAge: age,
      patientGender: gender,
      medicalHistory: history,
      aiResponse: JSON.stringify(result.data),
      possibleConditions: result.data.possibleConditions,
      riskLevel: result.data.riskLevel,
      suggestedTests: result.data.suggestedTests,
      isAiFallback: result.fallback || false,
    });

    res.json({
      diagnosisLog: log,
      analysis: result.data,
      isFallback: result.fallback || false,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.runRiskFlagging = async (req, res) => {
  try {
    const { patientId } = req.params;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentLogs = await DiagnosisLog.find({
      patientId,
      createdAt: { $gte: thirtyDaysAgo },
    }).sort({ createdAt: -1 });

    if (recentLogs.length < 2) {
      return res.json({ isHighRisk: false, message: "Not enough history to assess risk" });
    }

    const result = await checkRiskPatterns(recentLogs);

    if (result.data.isHighRisk) {
      await Patient.findByIdAndUpdate(patientId, {
        isRiskFlagged: true,
        riskNote: result.data.riskNote,
      });
    }

    res.json(result.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDiagnosisLogs = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === "doctor") query.doctorId = req.user._id;
    if (req.query.patientId) query.patientId = req.query.patientId;

    const logs = await DiagnosisLog.find(query)
      .populate("patientId", "name age gender")
      .populate("doctorId", "name")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
