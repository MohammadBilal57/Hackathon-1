require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Patient = require("./models/Patient");

const connectDB = require("./config/db");

const seedUsers = async () => {
    await connectDB();

    const users = [
        { name: "Admin", email: "admin@mediflow.com", password: "Admin@123", role: "admin", subscriptionPlan: "pro" },
        { name: "Dr. Smith", email: "doctor@mediflow.com", password: "Doctor@123", role: "doctor", specialization: "General Physician" },
        { name: "Receptionist Alice", email: "reception@mediflow.com", password: "Recept@123", role: "receptionist" },
        { name: "John Doe", email: "patient@mediflow.com", password: "Patient@123", role: "patient" },
    ];

    for (const u of users) {
        const existing = await User.findOne({ email: u.email });
        if (!existing) {
            const user = await User.create(u);
            console.log(`Created ${u.role}: ${u.email}`);

            // If patient, create a corresponding Patient record
            if (u.role === "patient") {
                await Patient.create({
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    age: 30,
                    gender: "male",
                    contact: "03001234567",
                });
            }
        } else {
            console.log(`${u.email} already exists.`);
        }
    }

    process.exit();
};

seedUsers();
