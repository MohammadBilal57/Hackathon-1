const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");

exports.createAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, date, timeSlot, notes, symptoms } = req.body;

    // Check for slot conflict
    const conflict = await Appointment.findOne({
      doctorId,
      date: new Date(date),
      timeSlot,
      status: { $ne: "cancelled" },
    });
    if (conflict) {
      return res.status(400).json({ message: "This time slot is already booked" });
    }

    const appointment = await Appointment.create({
      patientId, doctorId, date, timeSlot, notes, symptoms,
      bookedBy: req.user._id,
    });

    await appointment.populate(["patientId", { path: "doctorId", select: "name specialization" }]);
    res.status(201).json({ appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const { status, date, doctorId, patientId, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    // Role-based filtering
    if (req.user.role === "doctor") query.doctorId = req.user._id;
    else if (doctorId) query.doctorId = doctorId;
    if (patientId) query.patientId = patientId;

    const total = await Appointment.countDocuments(query);
    const appointments = await Appointment.find(query)
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "name specialization")
      .sort({ date: -1, timeSlot: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ appointments, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patientId")
      .populate("doctorId", "name specialization phone");
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    res.json({ appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate("patientId", "name").populate("doctorId", "name specialization");
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    res.json({ appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    await Appointment.findByIdAndUpdate(req.params.id, { status: "cancelled" });
    res.json({ message: "Appointment cancelled" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDoctorSchedule = async (req, res) => {
  try {
    const doctorId = req.user.role === "doctor" ? req.user._id : req.query.doctorId;
    const { date } = req.query;

    const start = date ? new Date(date) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const appointments = await Appointment.find({
      doctorId,
      date: { $gte: start, $lte: end },
      status: { $ne: "cancelled" },
    }).populate("patientId", "name age gender").sort({ date: 1, timeSlot: 1 });

    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
