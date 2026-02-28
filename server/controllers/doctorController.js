const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const Patient = require("../models/Patient");
const DiagnosisLog = require("../models/DiagnosisLog");

// @GET /api/doctor/stats
const getDoctorStats = async (req, res) => {
  const doctorId = req.user._id;
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setHours(23, 59, 59, 999));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todayAppointments, monthlyAppointments, totalPrescriptions, pendingAppointments] = await Promise.all([
    Appointment.countDocuments({ doctorId, date: { $gte: startOfDay, $lte: endOfDay } }),
    Appointment.countDocuments({ doctorId, createdAt: { $gte: startOfMonth } }),
    Prescription.countDocuments({ doctorId }),
    Appointment.countDocuments({ doctorId, status: "pending" }),
  ]);

  // 6-month appointment trend
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const appointmentTrend = await Appointment.aggregate([
    { $match: { doctorId, createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Flagged patients
  const flaggedDiagnoses = await DiagnosisLog.find({ doctorId, riskLevel: "high" })
    .populate("patientId", "name age gender contact")
    .limit(5)
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    stats: { todayAppointments, monthlyAppointments, totalPrescriptions, pendingAppointments },
    appointmentTrend,
    flaggedDiagnoses,
  });
};

module.exports = { getDoctorStats };
