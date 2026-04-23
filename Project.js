const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema({
  id: String,
  type: { type: String, enum: ["hero", "about", "projects", "skills", "contact", "custom"] },
  title: String,
  content: String,
  bgColor: String,
  textColor: String,
  fontSize: String,
  position: { x: Number, y: Number },
  size: { width: String, height: String },
  order: Number
}, { _id: false });

const projectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, default: "My Portfolio", maxlength: 100 },
  description: { type: String, maxlength: 500 },
  sections: [sectionSchema],
  theme: {
    primaryColor: { type: String, default: "#6366f1" },
    bgColor: { type: String, default: "#020617" },
    fontFamily: { type: String, default: "Segoe UI" }
  },
  isPublished: { type: Boolean, default: false },
  publishedUrl: { type: String },
  views: { type: Number, default: 0 },
  lastModified: { type: Date, default: Date.now }
}, { timestamps: true });

projectSchema.pre("save", function (next) {
  this.lastModified = new Date();
  next();
});

module.exports = mongoose.model("Project", projectSchema);