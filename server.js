const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

// ─── SECURITY ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: "Too many requests" } });
app.use("/api/", limiter);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: "Too many auth attempts" } });

// ─── DATABASE ─────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/portfolioDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use("/auth", authLimiter, require("./routes/auth"));
app.use("/api/projects", require("./routes/project"));

// ─── STATIC ───────────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

app.get("/app",       (req, res) => res.sendFile(path.join(__dirname, "public", "app.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/feedback",  (req, res) => res.sendFile(path.join(__dirname, "public", "feedback.html")));
app.get("/home",      (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/",          (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/login",     (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("*",          (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));