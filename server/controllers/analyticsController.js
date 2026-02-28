const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const DiagnosisLog = require("../models/DiagnosisLog");
const User = require("../models/User");

exports.getAdminAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      return { year: d.getFullYear(), month: d.getMonth() };
    }).reverse();

    const [
      totalPatients, totalDoctors, totalAppointments,
      monthlyAppointmentsRaw, diagnosisStats, flaggedPatients,
    ] = await Promise.all([
      Patient.countDocuments(),
      User.countDocuments({ role: "doctor" }),
      Appointment.countDocuments(),
      Appointment.aggregate([
        { $group: { _id: { year: { $year: "$date" }, month: { $month: "$date" } }, count: { $sum: 1 } } },
      ]),
      DiagnosisLog.aggregate([
        { $unwind: "$possibleConditions" },
        { $group: { _id: "$possibleConditions", count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 5 },
      ]),
      Patient.countDocuments({ isRiskFlagged: true }),
    ]);

    const monthlyAppointments = last6Months.map(({ year, month }) => {
      const found = monthlyAppointmentsRaw.find(
        (a) => a._id.year === year && a._id.month === month + 1
      );
      return {
        month: new Date(year, month).toLocaleString("default", { month: "short", year: "2-digit" }),
        count: found?.count || 0,
      };
    });

    // Simulated revenue (Pro plan: $49/month)
    const proUsers = await User.countDocuments({ subscriptionPlan: "pro" });
    const simulatedRevenue = monthlyAppointments.map((m, i) => ({
      ...m,
      revenue: proUsers * 49 + Math.floor(Math.random() * 500),
    }));

    res.json({
      stats: { totalPatients, totalDoctors, totalAppointments, flaggedPatients, proUsers },
      monthlyAppointments,
      diagnosisStats: diagnosisStats.map((d) => ({ name: d._id, value: d.count })),
      simulatedRevenue,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDoctorAnalytics = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayCount, monthCount, prescriptionCount, completedCount] = await Promise.all([
      Appointment.countDocuments({ doctorId, date: { $gte: startOfDay }, status: { $ne: "cancelled" } }),
      Appointment.countDocuments({ doctorId, date: { $gte: startOfMonth } }),
      Prescription.countDocuments({ doctorId, createdAt: { $gte: startOfMonth } }),
      Appointment.countDocuments({ doctorId, status: "completed" }),
    ]);

    const last7Days = await Appointment.aggregate([
      { $match: { doctorId, date: { $gte: new Date(Date.now() - 7 * 86400000) } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      stats: { todayCount, monthCount, prescriptionCount, completedCount },
      last7Days: last7Days.map((d) => ({ date: d._id, count: d.count })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPredictiveAnalytics = async (req, res) => {
  try {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [appointmentsCount, diagnosisStats] = await Promise.all([
      Appointment.countDocuments({ date: { $gte: lastMonth, $lt: now } }),
      DiagnosisLog.aggregate([
        { $match: { createdAt: { $gte: lastMonth, $lt: now } } },
        { $unwind: "$possibleConditions" },
        { $group: { _id: "$possibleConditions", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    const diagnosisText = diagnosisStats.map(d => `${d._id}: ${d.count}`).join(", ");

    const prompt = `Based on the following clinic data from the last month, forecast the next month's patient load and identify potential disease trends.
    Last month total appointments: ${appointmentsCount}
    Top diagnoses (and count): ${diagnosisText || "None recorded"}
    
    Respond STRICTLY in JSON format:
    {
      "forecastLoad": "number or short description",
      "diseaseTrends": ["trend1", "trend2"],
      "recommendations": ["rec1", "rec2"]
    }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response format");

    res.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
