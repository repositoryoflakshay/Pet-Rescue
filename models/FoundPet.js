// models/FoundPet.js
const mongoose = require("mongoose");

const foundPetSchema = new mongoose.Schema({
  type: String,
  breed: String,
  color: String,
  location: String,
  contact: String,
  reportedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("FoundPet", foundPetSchema);
