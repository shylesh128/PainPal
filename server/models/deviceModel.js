const mongoose = require("mongoose");

const deviceLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  device: {
    device: String,
    os: String,
    browser: String,
  },
  ip: { type: String, required: true },
  loginAt: { type: Date, default: Date.now },
});

const DeviceLog = mongoose.model("DeviceLog", deviceLogSchema);

module.exports = DeviceLog;
