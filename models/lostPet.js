const mongoose = require("mongoose");

const lostPetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  breed: { type: String, required: true },
  color: { type: String, required: true },
  location: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("LostPet", lostPetSchema);
