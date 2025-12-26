import {
  Box,
  Button,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { useState, useContext, useEffect } from "react";
import { UserContext } from "../services/userContext";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  styles,
  calculatePasswordStrength,
  getPasswordStrengthColor,
} from "../styles/login-style";
import { MdVisibility, MdVisibilityOff, MdLock, MdCheckCircle } from "react-icons/md";

const ResetPassword = () => {
  const { resetPassword } = useContext(UserContext);
  const router = useRouter();
  const { token } = router.query;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordStrength = calculatePasswordStrength(password);
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  // Check if token exists
  useEffect(() => {
    if (router.isReady && !token) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [router.isReady, token]);

  const validateForm = () => {
    if (!password) {
      setError("Please enter a new password");
      return false;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const result = await resetPassword(token, password);
      
      if (result?.error) {
        setError(result.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div style={styles.container}>
      <Box sx={styles.box}>
        <Box sx={styles.formHeader}>
          <Typography variant="h2" component="div" sx={styles.title}>
            Pain
            <span style={styles.highlightedSpan}>Pal</span>
          </Typography>
        </Box>

        {!success ? (
          <>
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  backgroundColor: "rgba(167, 133, 235, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <MdLock size={30} color="#a785eb" />
              </Box>
              <Typography variant="h5" sx={{ color: "#fff", mb: 1 }}>
                Reset Password
              </Typography>
              <Typography sx={styles.subtitle}>
                Enter your new password below.
              </Typography>
            </Box>

            <Box sx={styles.formGroup}>
              <Box sx={{ width: "100%" }}>
                <TextField
                  type={showPassword ? "text" : "password"}
                  placeholder="New Password"
                  variant="outlined"
                  value={password}
                  fullWidth
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  onKeyPress={handleKeyPress}
                  disabled={loading || !token}
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
                {password && (
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
                placeholder="Confirm New Password"
                variant="outlined"
                value={confirmPassword}
                fullWidth
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                onKeyPress={handleKeyPress}
                disabled={loading || !token}
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
                onClick={handleSubmit}
                disabled={loading || !token}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Reset Password"
                )}
              </Button>

              <Link href="/login" style={{ textDecoration: "none" }}>
                <Typography sx={styles.linkText}>Back to Login</Typography>
              </Link>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  backgroundColor: "rgba(81, 207, 102, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <MdCheckCircle size={30} color="#51cf66" />
              </Box>
              <Typography variant="h5" sx={{ color: "#fff", mb: 1 }}>
                Password Reset Successful!
              </Typography>
              <Typography sx={styles.subtitle}>
                Your password has been reset successfully. You can now login with your new password.
              </Typography>
            </Box>

            <Box sx={styles.buttonGroup}>
              <Link href="/login" style={{ textDecoration: "none", width: "100%" }}>
                <Button variant="contained" sx={styles.button}>
                  Go to Login
                </Button>
              </Link>
            </Box>
          </>
        )}
      </Box>
    </div>
  );
};

export default ResetPassword;

