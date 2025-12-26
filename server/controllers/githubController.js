const axios = require("axios");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const DeviceLog = require("../models/deviceModel");
const useragent = require("useragent");
const { getClientIp } = require("../utils/clientIp");
const tokenService = require("../utils/tokenService");

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI;

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
 * Initiate GitHub OAuth flow
 */
const githubOauth = catchAsync(async (req, res, next) => {
  const scope = "read:user user:email";
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI)}&scope=${encodeURIComponent(scope)}`;
  
  res.redirect(authUrl);
});

/**
 * Handle GitHub OAuth callback
 */
const githubOauthCallback = catchAsync(async (req, res, next) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect("/login?error=github_auth_failed");
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_REDIRECT_URI,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      console.error("GitHub token error:", tokenResponse.data);
      return res.redirect("/login?error=github_token_failed");
    }

    // Get user info from GitHub
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const githubUser = userResponse.data;

    // Get user email (might be private)
    let email = githubUser.email;
    if (!email) {
      const emailsResponse = await axios.get(
        "https://api.github.com/user/emails",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const primaryEmail = emailsResponse.data.find(
        (e) => e.primary && e.verified
      );
      email = primaryEmail?.email;
    }

    if (!email) {
      return res.redirect("/login?error=github_email_required");
    }

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create new user
      user = await User.create({
        name: githubUser.name || githubUser.login,
        email: email.toLowerCase(),
        username: githubUser.login.toLowerCase(),
        isOAuth: true,
        photo: githubUser.avatar_url,
        globalId: `github_${githubUser.id}`,
      });
    } else {
      // Update existing user
      user.isOAuth = true;
      if (!user.photo && githubUser.avatar_url) {
        user.photo = githubUser.avatar_url;
      }
      if (!user.globalId) {
        user.globalId = `github_${githubUser.id}`;
      }
      await user.save();
    }

    // Generate tokens
    const deviceInfo = getDeviceInfo(req);
    const tokens = await tokenService.generateTokenPair(user._id, deviceInfo);

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
    res.cookie("pain", tokens.accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 60 * 1000, // 30 minutes
    });

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to home
    res.redirect("/");
  } catch (error) {
    console.error("GitHub OAuth error:", error.response?.data || error.message);
    res.redirect("/login?error=github_auth_failed");
  }
});

module.exports = {
  githubOauth,
  githubOauthCallback,
};

