const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const path = require("path");
const multer = require("multer");

const app = express();
app.use(express.json());
app.use(cors());

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Serve static files (HTML, CSS, JS) from "public" folder
app.use("/public", express.static(path.join(__dirname, "public")));

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/pawsheart", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ Connected to MongoDB");
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err);
});

// ---------------------- SCHEMAS ----------------------
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  role: { type: String, default: "user" },
});
const User = mongoose.model("User", userSchema);

const newsletterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }
});
const NewsletterSubscriber = mongoose.model("NewsletterSubscriber", newsletterSchema);

const applicationSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address: String,
  petType: String,
  experience: String,
  housing: String,
  submittedAt: { type: Date, default: Date.now },
});
const AdoptionApplication = mongoose.model("AdoptionApplication", applicationSchema);

const storySchema = new mongoose.Schema({
  name: String,
  text: String,
  img: String,
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

const donationSchema = new mongoose.Schema({
  name: String,
  email: String,
  amount: Number,
  purpose: String,
  date: { type: Date, default: Date.now }
});
const Donation = mongoose.model("Donation", donationSchema);

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
  if (!user || user.role !== "admin") return res.status(403).json({ message: "Access denied" });
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
    const approved = await Story.find({ approved: true }).sort({ createdAt: -1 });
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
      roles: Array.isArray(roles) ? roles : [roles],
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

app.post("/subscribeNewsletter", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    await NewsletterSubscriber.updateOne({ email }, { $set: { email } }, { upsert: true });
    res.status(201).json({ message: "Subscribed successfully" });
  } catch (err) {
    console.error("Newsletter subscription error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/submitDonation", async (req, res) => {
  try {
    const donation = new Donation(req.body);
    await donation.save();
    res.status(201).json({ message: "Donation recorded successfully" });
  } catch (err) {
    console.error("Error saving donation:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/admin/donations", async (req, res) => {
  const { username } = req.query;
  const user = await User.findOne({ username });
  if (!user || user.role !== "admin") return res.status(403).json({ message: "Access denied" });
  const donations = await Donation.find().sort({ date: -1 });
  res.json(donations);
});

app.get("/admin/newsletter-subscribers", async (req, res) => {
  const { username } = req.query;
  const user = await User.findOne({ username });
  if (!user || user.role !== "admin") return res.status(403).json({ message: "Access denied" });
  const subscribers = await NewsletterSubscriber.find();
  res.json(subscribers);
});

app.post("/signup", async (req, res) => {
  const { username, password, email, role } = req.body;
  const existing = await User.findOne({ username });
  if (existing) return res.status(409).json({ message: "User already exists" });
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, email, password: hashedPassword, role });
  await user.save();
  res.status(201).json({ message: "Signup successful" });
});

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
    email: user.email,
    id: user._id
  });
});

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

app.get("/applications", async (req, res) => {
  const { username } = req.query;
  const user = await User.findOne({ username });
  if (!user || user.role !== "admin") return res.status(403).json({ message: "Access denied" });
  const applications = await AdoptionApplication.find().sort({ submittedAt: -1 });
  res.json(applications);
});

app.get("/", (req, res) => {
  res.redirect("/public/home2.html");
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
