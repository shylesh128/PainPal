const useragent = require("useragent");
const catchAsync = require("../utils/catchAsync");
const { getClientIp } = require("../utils/clientIp");
const DeviceLog = require("../models/deviceModel");

const getStatus = catchAsync(async (req, res, next) => {
  const agent = useragent.parse(req.headers["user-agent"]);
  const ip = getClientIp(req);

  const userId = "675aef6dd113cc09db89efc0";

  const deviceLog = new DeviceLog({
    user: userId,
    device: {
      device: agent.device || "unknown",
      os: agent.os || "unknown",
      browser: agent.toAgent() || "unknown",
    },
    ip: ip || "unknown",
  });

  await deviceLog.save();

  // Send the response
  res.status(200).json({
    status: "success",
    message: "API is working",
  });
});

module.exports = {
  getStatus,
};
