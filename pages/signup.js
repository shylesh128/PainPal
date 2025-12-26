import {
  Box,
  Button,
  Typography,
  TextField,
  Divider,
  IconButton,
  InputAdornment,
  CircularProgress,
  Paper,
} from "@mui/material";
import { useState } from "react";
import { useAuthStore } from "../services/stores/authStore";
import { useRouter } from "next/router";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { MdVisibility, MdVisibilityOff, MdEmail, MdRefresh } from "react-icons/md";
import Link from "next/link";
import api from "../services/api/axios";
import {
  styles,
  calculatePasswordStrength,
  getPasswordStrengthColor,
} from "../styles/login-style";

const Signup = () => {
  const { handleGoogleLogin, handleGithubLogin } = useAuthStore();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const router = useRouter();

  const passwordStrength = calculatePasswordStrength(formData.password);
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    setError("");
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!formData.username.trim()) {
      setError("Username is required");
      return false;
    }
    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters");
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError("Username can only contain letters, numbers, and underscores");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email");
      return false;
    }
    if (!formData.password) {
      setError("Password is required");
      return false;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/signup", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });

      if (response.data.requiresVerification) {
        setVerificationSent(true);
        setRegisteredEmail(response.data.email || formData.email);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    setResendMessage("");

    try {
      await api.post("/auth/resend-verification", {
        email: registeredEmail,
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
      handleSignup();
    }
  };

  // Show verification sent screen
  if (verificationSent) {
    return (
      <div style={styles.container}>
        <Paper
          elevation={0}
          sx={{
            ...styles.box,
            textAlign: "center",
            py: 5,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: "rgba(167, 133, 235, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <MdEmail size={40} color="#a785eb" />
          </Box>

          <Typography variant="h5" sx={{ color: "#fff", mb: 2, fontWeight: 600 }}>
            Check Your Email
          </Typography>

          <Typography sx={{ color: "#aaa", mb: 1 }}>
            We've sent a verification link to:
          </Typography>

          <Typography
            sx={{
              color: "#a785eb",
              fontWeight: 500,
              mb: 3,
              fontSize: 18,
            }}
          >
            {registeredEmail}
          </Typography>

          <Typography sx={{ color: "#888", mb: 4, fontSize: 14 }}>
            Click the link in the email to verify your account and complete
            registration. The link expires in 24 hours.
          </Typography>

          {resendMessage && (
            <Typography
              sx={{
                color: resendMessage.includes("sent") ? "#51cf66" : "#ff6b6b",
                mb: 2,
                fontSize: 14,
              }}
            >
              {resendMessage}
            </Typography>
          )}

          <Button
            variant="outlined"
            onClick={handleResendVerification}
            disabled={resending}
            startIcon={resending ? <CircularProgress size={16} /> : <MdRefresh />}
            sx={{
              borderColor: "#444",
              color: "#aaa",
              mb: 2,
              "&:hover": { borderColor: "#666" },
            }}
          >
            {resending ? "Sending..." : "Resend Verification Email"}
          </Button>

          <Box sx={{ mt: 3 }}>
            <Typography sx={{ color: "#666", fontSize: 14 }}>
              Already verified?{" "}
              <Link href="/login" style={{ textDecoration: "none" }}>
                <span style={{ color: "#a785eb", cursor: "pointer" }}>
                  Login here
                </span>
              </Link>
            </Typography>
          </Box>
        </Paper>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Box sx={styles.box}>
        <Box sx={styles.formHeader}>
          <Typography variant="h2" component="div" sx={styles.title}>
            Pain
            <span style={styles.highlightedSpan}>Pal</span>
          </Typography>
          <Typography sx={styles.subtitle}>Create your account</Typography>
        </Box>

        <Box sx={styles.formGroup}>
          <TextField
            type="text"
            placeholder="Full Name"
            variant="outlined"
            value={formData.name}
            fullWidth
            onChange={handleChange("name")}
            onKeyPress={handleKeyPress}
            disabled={loading}
            sx={styles.textField}
            slotProps={{
              input: { style: styles.inputProps },
            }}
          />

          <TextField
            type="text"
            placeholder="Username"
            variant="outlined"
            value={formData.username}
            fullWidth
            onChange={handleChange("username")}
            onKeyPress={handleKeyPress}
            disabled={loading}
            sx={styles.textField}
            slotProps={{
              input: { style: styles.inputProps },
            }}
          />

          <TextField
            type="email"
            placeholder="Email"
            variant="outlined"
            value={formData.email}
            fullWidth
            onChange={handleChange("email")}
            onKeyPress={handleKeyPress}
            disabled={loading}
            sx={styles.textField}
            slotProps={{
              input: { style: styles.inputProps },
            }}
          />

          <Box sx={{ width: "100%" }}>
            <TextField
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              variant="outlined"
              value={formData.password}
              fullWidth
              onChange={handleChange("password")}
              onKeyPress={handleKeyPress}
              disabled={loading}
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
            {formData.password && (
              <>
                <Box sx={styles.passwordStrength}>
                  <Box
                    sx={{
                      ...styles.passwordStrengthBar,
                      width: `${(passwordStrength / 4) * 100}%`,
                      backgroundColor: getPasswordStrengthColor(passwordStrength),
                    }}
                  />
                </Box>
                <Typography
                  sx={{
                    color: getPasswordStrengthColor(passwordStrength),
                    fontSize: "12px",
                    textAlign: "left",
                    mt: 0.5,
                  }}
                >
                  {strengthLabels[passwordStrength]}
                </Typography>
              </>
            )}
          </Box>

          <TextField
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            variant="outlined"
            value={formData.confirmPassword}
            fullWidth
            onChange={handleChange("confirmPassword")}
            onKeyPress={handleKeyPress}
            disabled={loading}
            sx={styles.textField}
            slotProps={{
              input: {
                style: styles.inputProps,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      sx={{ color: "#888" }}
                    >
                      {showConfirmPassword ? <MdVisibilityOff /> : <MdVisibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        {error && <Typography sx={styles.error}>{error}</Typography>}

        <Box sx={styles.buttonGroup}>
          <Button
            variant="contained"
            sx={styles.button}
            onClick={handleSignup}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Sign Up"}
          </Button>

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
            Already have an account?{" "}
            <Link href="/login" style={{ textDecoration: "none" }}>
              <span style={{ color: "#a785eb", cursor: "pointer" }}>Login</span>
            </Link>
          </Typography>
        </Box>
      </Box>
    </div>
  );
};

export default Signup;
