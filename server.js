const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// Serve static files (HTML, CSS, JS) from "public" folder
app.use("/public", express.static(path.join(__dirname, "public")));

// MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/pawsheart", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ---------------------- SCHEMAS ----------------------

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

// Login
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

// ---------------------- START SERVER ----------------------
const PORT = 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
