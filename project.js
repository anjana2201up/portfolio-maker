const router = require("express").Router();
const auth = require("../middleware/auth");
const Project = require("../models/Project");
const crypto = require("crypto");

// All routes require auth
router.use(auth);

// ─── GET ALL PROJECTS ─────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.userId })
      .select("-sections")
      .sort({ lastModified: -1 });
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// ─── GET SINGLE PROJECT ───────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// ─── CREATE PROJECT ───────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { name, description, sections, theme } = req.body;
    const project = await Project.create({
      userId: req.userId,
      name: name || "My Portfolio",
      description,
      sections: sections || [],
      theme
    });
    res.status(201).json({ project, message: "Project created!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to create project" });
  }
});

// ─── UPDATE PROJECT ───────────────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const { name, description, sections, theme } = req.body;
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name, description, sections, theme, lastModified: new Date() },
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ project, message: "Project saved!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update project" });
  }
});

// ─── DELETE PROJECT ───────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ message: "Project deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// ─── PUBLISH ─────────────────────────────────────────────────────────────────
router.post("/:id/publish", async (req, res) => {
  try {
    const slug = crypto.randomBytes(6).toString("hex");
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isPublished: true, publishedUrl: `/portfolio/${slug}` },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ message: "Portfolio published!", url: project.publishedUrl });
  } catch (err) {
    res.status(500).json({ error: "Failed to publish" });
  }
});

// ─── AUTO-SAVE ────────────────────────────────────────────────────────────────
router.patch("/:id/autosave", async (req, res) => {
  try {
    const { sections } = req.body;
    await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { sections, lastModified: new Date() }
    );
    res.json({ saved: true });
  } catch (err) {
    res.status(500).json({ error: "Auto-save failed" });
  }
});

module.exports = router;