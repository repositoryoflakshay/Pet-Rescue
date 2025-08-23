
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  petName: String,
  date: String,
  time: String,
  note: String,
  phone: String,
  email: String,
  checklist: [String]  
});

module.exports = mongoose.model("Appointment", appointmentSchema);
