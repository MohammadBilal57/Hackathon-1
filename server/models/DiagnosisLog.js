const mongoose = require("mongoose");

const diagnosisLogSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    symptoms: { type: String, required: true },
    patientAge: { type: Number },
    patientGender: { type: String },
    medicalHistory: { type: String },
    aiResponse: { type: String },
    possibleConditions: [{ type: String }],
    riskLevel: { type: String, enum: ["low", "medium", "high"] },
    suggestedTests: [{ type: String }],
    isAiFallback: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DiagnosisLog", diagnosisLogSchema);
