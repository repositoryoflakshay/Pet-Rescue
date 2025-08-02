const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  petName: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  note: {
    type: String,
    default: "",
  },
  email: {
    type: String,
    default: "",
  },
  phone: {
    type: String,
    default: "",
  },
  checklist: {
    type: [String],
    default: [],
  },
  journalNote: {
    type: String,
    default: "",
  },
}, { timestamps: true });

module.exports = mongoose.model("Appointment", appointmentSchema);
