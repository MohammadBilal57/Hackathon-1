const DiagnosisLog = require("../models/DiagnosisLog.model");
const Patient = require("../models/Patient.model");

exports.runRiskFlagging = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Find patients with repeated diagnoses in last 30 days
  const logs = await DiagnosisLog.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: { patientId: "$patientId", conditions: "$possibleConditions" }, count: { $sum: 1 } } },
    { $match: { count: { $gte: 2 } } },
  ]);

  for (const log of logs) {
    await Patient.findByIdAndUpdate(log._id.patientId, {
      isRiskFlagged: true,
      $push: {
        riskNotes: {
          message: `Repeated diagnosis pattern detected in last 30 days`,
          flaggedAt: new Date(),
        },
      },
    });
  }

  // Flag high-risk diagnosis logs
  const highRiskPatients = await DiagnosisLog.distinct("patientId", {
    riskLevel: "high",
    createdAt: { $gte: thirtyDaysAgo },
  });

  for (const patientId of highRiskPatients) {
    await Patient.findByIdAndUpdate(patientId, {
      isRiskFlagged: true,
      $push: {
        riskNotes: { message: "High-risk diagnosis flagged by AI", flaggedAt: new Date() },
      },
    });
  }
};
