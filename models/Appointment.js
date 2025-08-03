// models/appointment.js
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  petName: String,
  date: String,
  time: String,
  note: String,
  phone: String,
  email: String,
  checklist: [String]  // ✅ Ensure checklist is an array
});

module.exports = mongoose.model("Appointment", appointmentSchema);
