const { OAuth2Client } = require("google-auth-library");
const { google } = require("googleapis");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const DeviceLog = require("../models/deviceModel");
const useragent = require("useragent");
const { getClientIp } = require("../utils/clientIp");
const jwt = require("jsonwebtoken");

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
const secretKey = process.env.SECRET_KEY;

const googleOauth = catchAsync(async (req, res, next) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
  });
  res.redirect(authUrl);
});

const googleOauthCallback = catchAsync(async (req, res, next) => {
  const code = req.query.code;
  const agent = useragent.parse(req.headers["user-agent"]);

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: oAuth2Client,
      version: "v2",
    });

    const userInfo = await oauth2.userinfo.get();
    console.log("User Info:", userInfo.data);

    let user = await User.findOne({ email: userInfo.data.email });

    if (!user) {
      user = await User.create({
        name: userInfo.data.name,
        email: userInfo.data.email,
        isOAuth: true,
      });
    } else {
      user.isOAuth = true;
      await user.save();
    }

    const ip = getClientIp(req);

    const deviceLog = new DeviceLog({
      user: user._id,
      device: {
        device: agent.device || "unknown",
        os: agent.os || "unknown",
        browser: agent.toAgent() || "unknown",
      },
      ip: ip || "unknown",
    });

    await deviceLog.save();

    const token = jwt.sign({ userId: user._id }, secretKey, {
      expiresIn: "9999999d",
    });

    res.cookie("pain", token);
    res.redirect(`/`);

    // res.status(200).json({
    //   status: "success",
    //   message: "SSO login successful",
    //   token: token,
    //   user: user,
    // });
  } catch (error) {
    console.error("Error retrieving tokens:", error);
    res.status(500).send("Authentication failed");
  }
});

module.exports = {
  googleOauth,
  googleOauthCallback,
};
