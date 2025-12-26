import {
  Box,
  Button,
  Typography,
  TextField,
  Divider,
  IconButton,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { useState, useEffect } from "react";
import { TypeAnimation } from "react-type-animation";
import { useAuthStore } from "../services/stores/authStore";
import { useRouter } from "next/router";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { MdVisibility, MdVisibilityOff, MdEmail, MdRefresh } from "react-icons/md";
import Link from "next/link";
import api from "../services/api/axios";
import { styles } from "../styles/login-style";

const Login = () => {
  const { login, handleGoogleLogin, handleGithubLogin } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState(null);
  const [cooldownTimer, setCooldownTimer] = useState(0);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const router = useRouter();

  // Handle URL error params (from OAuth failures)
  useEffect(() => {
    const { error: urlError } = router.query;
    if (urlError) {
      switch (urlError) {
        case "google_auth_failed":
          setError("Google authentication failed. Please try again.");
          break;
        case "github_auth_failed":
          setError("GitHub authentication failed. Please try again.");
          break;
        case "github_email_required":
          setError("GitHub email is required. Please make your email public or use another method.");
          break;
        default:
          setError("Authentication failed. Please try again.");
      }
    }
  }, [router.query]);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownTimer > 0) {
      const timer = setTimeout(() => {
        setCooldownTimer(cooldownTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (cooldownTimer === 0 && lockoutInfo?.cooldown) {
      setLockoutInfo(null);
      setError("");
    }
  }, [cooldownTimer, lockoutInfo]);

  const formatCooldownTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }

    setError("");
    setLoading(true);
    setVerificationRequired(false);
    setUnverifiedEmail("");
    setResendMessage("");

    try {
      const result = await login(username, password);
      
      if (result?.success) {
        router.push("/");
      } else if (result?.error) {
        setError(result.message);
        
        // Handle email verification required
        if (result.requiresVerification) {
          setVerificationRequired(true);
          setUnverifiedEmail(result.email || username);
        }
        // Handle lockout/cooldown
        else if (result.cooldown || result.locked) {
          setLockoutInfo({
            locked: result.locked,
            cooldown: result.cooldown,
            remainingAttempts: result.remainingAttempts,
          });
          
          if (result.remainingTime) {
            setCooldownTimer(result.remainingTime);
          }
        } else if (result.remainingAttempts !== undefined) {
          setLockoutInfo({
            remainingAttempts: result.remainingAttempts,
          });
        }
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;

    setResending(true);
    setResendMessage("");

    try {
      await api.post("/auth/resend-verification", {
        email: unverifiedEmail,
      });
      setResendMessage("Verification email sent! Please check your inbox.");
    } catch (err) {
      setResendMessage(
        err.response?.data?.message || "Failed to send email. Please try again."
      );
    } finally {
      setResending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  const isDisabled = loading || lockoutInfo?.locked || cooldownTimer > 0;

  return (
    <div style={styles.container}>
      <Box sx={styles.box}>
        <Box sx={styles.formHeader}>
          <Typography variant="h2" component="div" sx={styles.title}>
            Pain
            <span style={styles.highlightedSpan}>Pal</span>
          </Typography>

          <TypeAnimation
            sequence={["Welcome back", 1500, "Write your pain", 1500]}
            speed={40}
            style={styles.typeAnimation}
          />
        </Box>

        {/* Lockout Banner */}
        {lockoutInfo?.locked && (
          <Box sx={styles.lockoutBanner}>
            <Typography sx={{ color: "#ff6b6b", fontWeight: "bold" }}>
              Account Locked
            </Typography>
            <Typography sx={{ color: "#ff6b6b", fontSize: "14px" }}>
              Please check your email or reset your password.
            </Typography>
          </Box>
        )}

        {/* Cooldown Banner */}
        {cooldownTimer > 0 && (
          <Box sx={styles.lockoutBanner}>
            <Typography sx={styles.cooldownText}>
              Too many attempts. Try again in {formatCooldownTime(cooldownTimer)}
            </Typography>
          </Box>
        )}

        {/* Email Verification Required Banner */}
        {verificationRequired && (
          <Box
            sx={{
              bgcolor: "rgba(167, 133, 235, 0.1)",
              borderRadius: 2,
              p: 2,
              mb: 2,
              border: "1px solid rgba(167, 133, 235, 0.3)",
              textAlign: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 1 }}>
              <MdEmail size={24} color="#a785eb" style={{ marginRight: 8 }} />
              <Typography sx={{ color: "#a785eb", fontWeight: "bold" }}>
                Email Verification Required
              </Typography>
            </Box>
            <Typography sx={{ color: "#aaa", fontSize: "14px", mb: 2 }}>
              Please verify your email before logging in.
            </Typography>
            
            {resendMessage && (
              <Typography
                sx={{
                  color: resendMessage.includes("sent") ? "#51cf66" : "#ff6b6b",
                  fontSize: "13px",
                  mb: 1,
                }}
              >
                {resendMessage}
              </Typography>
            )}
            
            <Button
              variant="outlined"
              size="small"
              onClick={handleResendVerification}
              disabled={resending}
              startIcon={resending ? <CircularProgress size={14} /> : <MdRefresh size={16} />}
              sx={{
                borderColor: "#a785eb",
                color: "#a785eb",
                fontSize: "13px",
                "&:hover": { borderColor: "#b899f0", bgcolor: "rgba(167, 133, 235, 0.1)" },
              }}
            >
              {resending ? "Sending..." : "Resend Verification Email"}
            </Button>
          </Box>
        )}

        <Box sx={styles.formGroup}>
          <TextField
            type="text"
            placeholder="Username or Email"
            variant="outlined"
            value={username}
            fullWidth
            onChange={(e) => {
              setUsername(e.target.value);
              setVerificationRequired(false);
              setResendMessage("");
            }}
            onKeyPress={handleKeyPress}
            disabled={isDisabled}
            sx={styles.textField}
            slotProps={{
              input: {
                style: styles.inputProps,
              },
            }}
          />

          <TextField
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            variant="outlined"
            value={password}
            fullWidth
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isDisabled}
            sx={styles.textField}
            slotProps={{
              input: {
                style: styles.inputProps,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: "#888" }}
                    >
                      {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        {error && !verificationRequired && (
          <Typography sx={styles.error}>{error}</Typography>
        )}
        
        {lockoutInfo?.remainingAttempts !== undefined && 
         !lockoutInfo.locked && 
         !lockoutInfo.cooldown && (
          <Typography sx={styles.warning}>
            {lockoutInfo.remainingAttempts} attempt(s) remaining
          </Typography>
        )}

        <Box sx={styles.buttonGroup}>
          <Button
            variant="contained"
            sx={styles.button}
            onClick={handleLogin}
            disabled={isDisabled}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Login"}
          </Button>

          <Link href="/forgot-password" style={{ width: "100%" }}>
            <Typography sx={styles.linkText}>Forgot Password?</Typography>
          </Link>

          <Box sx={styles.dividerContainer}>
            <Divider sx={{ flexGrow: 1, bgcolor: "#555" }} />
            <Typography sx={styles.dividerText}>OR</Typography>
            <Divider sx={{ flexGrow: 1, bgcolor: "#555" }} />
          </Box>

          <Box sx={styles.oauthGroup}>
            <Button
              variant="outlined"
              onClick={handleGoogleLogin}
              sx={styles.googleButton}
              startIcon={<FcGoogle size={20} />}
              disabled={loading}
            >
              Continue with Google
            </Button>

            <Button
              variant="outlined"
              onClick={handleGithubLogin}
              sx={styles.githubButton}
              startIcon={<FaGithub size={20} />}
              disabled={loading}
            >
              Continue with GitHub
            </Button>
          </Box>
        </Box>

        <Box sx={styles.footerLinks}>
          <Typography sx={{ color: "#888" }}>
            Don't have an account?{" "}
            <Link href="/signup" style={{ textDecoration: "none" }}>
              <span style={{ color: "#a785eb", cursor: "pointer" }}>Sign Up</span>
            </Link>
          </Typography>
        </Box>
      </Box>
    </div>
  );
};

export default Login;
