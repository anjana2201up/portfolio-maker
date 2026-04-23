const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Username required"],
    unique: true,
    trim: true,
    minlength: [3, "Username must be at least 3 characters"],
    maxlength: [30, "Username too long"],
    match: [/^[a-zA-Z0-9_]+$/, "Only letters, numbers, underscores"]
  },
  password: {
    type: String,
    required: [true, "Password required"],
    minlength: [6, "Password must be at least 6 characters"]
  },
  avatar: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
}, { timestamps: true });

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);