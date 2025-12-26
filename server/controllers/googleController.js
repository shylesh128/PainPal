const { OAuth2Client } = require("google-auth-library");
const { google } = require("googleapis");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const DeviceLog = require("../models/deviceModel");
const useragent = require("useragent");
const { getClientIp } = require("../utils/clientIp");
const tokenService = require("../utils/tokenService");

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

/**
 * Get device info from request
 */
const getDeviceInfo = (req) => {
  const agent = useragent.parse(req.headers["user-agent"]);
  const ip = getClientIp(req);
  return {
    device: agent.device?.toString() || "unknown",
    os: agent.os?.toString() || "unknown",
    browser: agent.toAgent() || "unknown",
    ip: ip || "unknown",
  };
};

/**
 * Initiate Google OAuth flow
 */
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

/**
 * Handle Google OAuth callback
 */
const googleOauthCallback = catchAsync(async (req, res, next) => {
  const code = req.query.code;

  if (!code) {
    return res.redirect("/login?error=google_auth_failed");
  }

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
      // Create new user
      user = await User.create({
        name: userInfo.data.name,
        email: userInfo.data.email,
        isOAuth: true,
        photo: userInfo.data.picture,
        globalId: `google_${userInfo.data.id}`,
      });
    } else {
      // Update existing user
      user.isOAuth = true;
      if (!user.photo && userInfo.data.picture) {
        user.photo = userInfo.data.picture;
      }
      if (!user.globalId) {
        user.globalId = `google_${userInfo.data.id}`;
      }
      await user.save();
    }

    // Generate tokens using tokenService
    const deviceInfo = getDeviceInfo(req);
    const authTokens = await tokenService.generateTokenPair(user._id, deviceInfo);

    // Log device access
    const agent = useragent.parse(req.headers["user-agent"]);
    const ip = getClientIp(req);
    const deviceLog = new DeviceLog({
      user: user._id,
      device: {
        device: agent.device?.toString() || "unknown",
        os: agent.os?.toString() || "unknown",
        browser: agent.toAgent() || "unknown",
      },
      ip: ip || "unknown",
    });
    await deviceLog.save();

    // Set cookies
    res.cookie("pain", authTokens.accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 60 * 1000, // 30 minutes
    });

    res.cookie("refreshToken", authTokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.redirect("/");
  } catch (error) {
    console.error("Error retrieving tokens:", error);
    res.redirect("/login?error=google_auth_failed");
  }
});

module.exports = {
  googleOauth,
  googleOauthCallback,
};
