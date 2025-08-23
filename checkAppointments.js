const mongoose = require("mongoose");
const Appointment = require("./models/Appointment.js"); 

mongoose.connect("mongodb://localhost:27017/pawsheart", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.once("open", async () => {
  try {
    const all = await Appointment.find();
    console.log("Appointments:", all);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    mongoose.connection.close();
  }
});
