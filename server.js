const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const path = require("path");
const app = express();
app.use(express.json());
app.use(cors());
const multer = require("multer");
const Newsletter = require('./models/Newsletter');
const storage = multer.memoryStorage(); // or use diskStorage for real uploads
const upload = multer({ storage });
const bodyParser = require("body-parser");
require("dotenv").config();

// Serve static files (HTML, CSS, JS) from "public" folder
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());

// MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/pawsheart", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

  const LostPet = require('./models/lostPet');
const FoundPet = require('./models/FoundPet');


const Appointment = require("./models/Appointment");
// ---------------------- SCHEMAS ----------------------


const donationSchema = new mongoose.Schema({
  name: String,
  email: String,
  amount: Number,
  purpose: String,
  date: String
});
const Donation = mongoose.model("Donation", donationSchema);

// // Lost Pet Schema
// const lostPetSchema = new mongoose.Schema({
//   name: String,
//   type: String,
//   breed: String,
//   color: String,
//   location: String,
//   reportedAt: { type: Date, default: Date.now },
// });

// // Found Pet Schema
// const foundPetSchema = new mongoose.Schema({
//   type: String,
//   breed: String,
//   color: String,
//   location: String,
//   contact: String,
//   reportedAt: { type: Date, default: Date.now },
// });

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  role: { type: String, default: "user" },
});
const User = mongoose.model("User", userSchema);


const applicationSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address: String,
  petType: String,
  experience: String,
  housing: String,
  selectedAnimal:{
    name: String,
    species: String,
    breed: String,
    age: String,
    color: String,
    description: String
  },
  submittedAt: { type: Date, default: Date.now },
});
const AdoptionApplication = mongoose.model(
  "AdoptionApplication",
  applicationSchema
);

const storySchema = new mongoose.Schema({
  name: String,
  text: String,
  img: String, // base64 or URL
  approved: { type: Boolean, default: false },
  tags: [String],
  createdAt: { type: Date, default: Date.now },
});
const Story = mongoose.model("Story", storySchema);

const volunteerSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  roles: [String],
  message: String,
  fileName: String,
  submittedAt: { type: Date, default: Date.now }
});

const Volunteer = mongoose.model("Volunteer", volunteerSchema);

// Product Schema
const productSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    emoji: String,
    price: { type: Number, required: true },
    category: String,
    desc: String
});

const Product = mongoose.model("Product", productSchema);


// ---------------------- ROUTES ----------------------

app.post("/submitStory", async (req, res) => {
  try {
    const story = new Story(req.body);
    await story.save();
    res.status(201).json({ message: "Story submitted for review" });
  } catch (err) {
    console.error("Error saving story:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/pendingStories", async (req, res) => {
  const { username } = req.query;
  const user = await User.findOne({ username });

  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  const pending = await Story.find({ approved: false });
  res.json(pending);
});

app.post("/approveStory/:id", async (req, res) => {
  try {
    await Story.findByIdAndUpdate(req.params.id, { approved: true });
    res.json({ message: "Story approved" });
  } catch (err) {
    res.status(500).json({ message: "Error approving story" });
  }
});

app.get("/approvedStories", async (req, res) => {
  try {
    const approved = await Story.find({ approved: true }).sort({
      createdAt: -1,
    });
    res.json(approved);
  } catch (err) {
    console.error("Error fetching approved stories:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/rejectStory/:id", async (req, res) => {
  try {
    await Story.findByIdAndDelete(req.params.id);
    res.json({ message: "Story rejected and deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting story" });
  }
});

app.post("/submitVolunteer", upload.single("file"), async (req, res) => {
  try {
    const { name, email, phone, message, roles } = req.body;

    const volunteer = new Volunteer({
      name,
      email,
      phone,
      roles: Array.isArray(roles) ? roles : [roles], // in case it's a single value
      message,
      fileName: req.file?.originalname || "N/A",
    });

    await volunteer.save();
    res.status(201).json({ message: "Volunteer application submitted successfully" });
  } catch (err) {
    console.error("Error saving volunteer application:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/getVolunteers", async (req, res) => {
  try {
    const volunteers = await Volunteer.find();
    res.json(volunteers);
  } catch (err) {
    console.error("Error fetching volunteers:", err);
    res.status(500).json({ message: "Error retrieving data" });
  }
});


// Signup
app.post("/signup", async (req, res) => {
  const { username, password, email, role } = req.body;
  const existing = await User.findOne({ username });
  if (existing) return res.status(409).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, email, password: hashedPassword, role });
  await user.save();
  res.status(201).json({ message: "Signup successful" });
});

//login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user) return res.status(404).json({ message: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: "Invalid credentials" });

  res.json({
    message: "Login successful",
    role: user.role,
    username: user.username,
    email: user.email
  });
});
// Submit Adoption Application
app.post("/submitApplication", async (req, res) => {
  try {
    const appData = new AdoptionApplication(req.body);
    await appData.save();
    res.status(201).json({ message: "Application submitted successfully" });
  } catch (err) {
    console.error("Error saving application:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all applications (admin only)
app.get("/applications", async (req, res) => {
  const { username } = req.query;

  const user = await User.findOne({ username });
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  const applications = await AdoptionApplication.find().sort({
    submittedAt: -1,
  });
  res.json(applications);
});

app.post("/api/donations", async (req, res) => {
  try {
    const { name, email, amount, purpose, date } = req.body;

    const newDonation = new Donation({
      name,
      email,
      amount,
      purpose,
      date
    });

    await newDonation.save();

    res.status(201).json({ message: "Donation saved successfully", donation: newDonation });
  } catch (err) {
    console.error("Error saving donation:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post('/api/newsletter', async (req, res) => {
  const { email } = req.body;

  try {
    const existing = await Newsletter.findOne({ email });

    if (existing) {
      return res.status(200).json({ message: "Already subscribed." });
    }

    const newSubscriber = new Newsletter({ email });
    await newSubscriber.save();

    res.status(201).json({ message: "Subscription successful." });
  } catch (err) {
    console.error("❌ Newsletter subscription error:", err);
    res.status(500).json({ error: "Subscription failed." });
  }
});

// Submit Lost Pet
app.post("/api/lostPets", async (req, res) => {
  try {
    const newLostPet = new LostPet(req.body);
    await newLostPet.save();
    res.json({ message: "Lost pet reported successfully" });
  } catch (err) {
    console.error("Error saving lost pet:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Fetch All Lost Pets (used for matching from found pet report)
app.get("/api/lostPets", async (req, res) => {
  try {
    const lostPets = await LostPet.find();
    res.json(lostPets);
  } catch (err) {
    console.error("Error fetching lost pets:", err);
    res.status(500).json({ message: "Failed to fetch lost pets" });
  }
});


// ✅ Admin check route (for frontend visibility logic)
app.get("/api/checkAdmin/:email", async (req, res) => {
  const email = req.params.email;

  try {
    const user = await User.findOne({ email });
    if (user && user.role === "admin") {
      return res.json({ isAdmin: true });
    } else {
      return res.json({ isAdmin: false });
    }
  } catch (err) {
    console.error("Error checking admin:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Submit Found Pet

app.post("/api/foundPets", async (req, res) => {
  try {
    const foundPet = new FoundPet(req.body);
    await foundPet.save();
    res.status(201).json({ message: "Found pet reported" });
  } catch (err) {
    console.error("Error saving found pet:", err);
    res.status(500).json({ message: "Failed to report found pet" });
  }
});
// Fetch All Found Pets (used for matching)
app.get("/api/foundPets", async (req, res) => {
  try {
    const foundPets = await FoundPet.find();
    res.json(foundPets);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch found pets" });
  }
});

app.get("/admin/data", async (req, res) => {
  try {
    const donations = await Donation.find().sort({ date: -1 });
    const subscribers = await Newsletter.find().sort({ subscribedAt: -1 });

    res.json({ donations, subscribers });
  } catch (err) {
    console.error("Error fetching admin data:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/appointments", async (req, res) => {
  try {
    const { petName, date, time, note, email, phone, checklist, journalNote } = req.body;

    const newAppointment = new Appointment({
      petName,
      date,
      time,
      note,
      email,      // Still saving in DB in case needed later
      phone,
      checklist,
      journalNote
    });

    await newAppointment.save();
    res.status(200).json({ message: "Appointment saved successfully." });
  } catch (error) {
    console.error("Error saving appointment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// backend route
app.get("/api/appointments", async (req, res) => {
  try {
    const all = await Appointment.find();
    res.json(all); // ✅ If `checklist` and `note` are in schema, they are returned here
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});


app.delete("/appointments/:id", async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
});

app.put("/appointments/:id", async (req, res) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Update failed" });
  }
});

// --- Product Store Routes ---

// GET all products
// This endpoint will return all products from the database
app.get("/api/products", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        console.error("Error retrieving products:", err);
        res.status(500).json({ message: "Error retrieving products", error: err });
    }
});

// POST endpoint to seed the database with initial product data
// You'll use this once to populate your database from your HTML's product array.
app.post("/api/seed-products", async (req, res) => {
    const productsToSeed = req.body;
    if (!productsToSeed || !Array.isArray(productsToSeed)) {
        return res.status(400).json({ message: "Request body must be an array of products" });
    }
    try {
        await Product.deleteMany({}); // Optional: clears existing products
        const result = await Product.insertMany(productsToSeed);
        res.status(201).json({ message: "Products seeded successfully", count: result.length });
    } catch (err) {
        console.error("Error seeding products:", err);
        res.status(500).json({ message: "Error seeding products", error: err });
    }
});

// Redirect root to homepage
app.get("/", (req, res) => {
  res.redirect("/public/home2.html");
});

// app.get("/createDefaultAdmin", async (req, res) => {
//   const existing = await User.findOne({ username: "admin" });
//   if (existing) return res.status(400).json({ message: "Admin already exists" });

//   const hashed = await bcrypt.hash("admin123", 10);
//   const admin = new User({
//     username: "admin",
//     email: "admin@example.com",
//     password: hashed,
//     role: "admin"
//   });

//   await admin.save();
//   res.json({ message: "✅ Default admin created" });
// });

const PORT = 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);