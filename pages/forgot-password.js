import {
  Box,
  Button,
  Typography,
  TextField,
  CircularProgress,
} from "@mui/material";
import { useState, useContext } from "react";
import { UserContext } from "../services/userContext";
import Link from "next/link";
import { styles } from "../styles/login-style";
import { MdEmail, MdArrowBack } from "react-icons/md";

const ForgotPassword = () => {
  const { forgotPassword } = useContext(UserContext);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await forgotPassword(email);
      
      if (result?.error) {
        setError(result.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("Failed to send reset email. Please try again.");
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
                <MdEmail size={30} color="#a785eb" />
              </Box>
              <Typography variant="h5" sx={{ color: "#fff", mb: 1 }}>
                Forgot Password?
              </Typography>
              <Typography sx={styles.subtitle}>
                No worries! Enter your email and we'll send you a reset link.
              </Typography>
            </Box>

            <Box sx={styles.formGroup}>
              <TextField
                type="email"
                placeholder="Enter your email"
                variant="outlined"
                value={email}
                fullWidth
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                onKeyPress={handleKeyPress}
                disabled={loading}
                sx={styles.textField}
                slotProps={{
                  input: { style: styles.inputProps },
                }}
              />
            </Box>

            {error && <Typography sx={styles.error}>{error}</Typography>}

            <Box sx={styles.buttonGroup}>
              <Button
                variant="contained"
                sx={styles.button}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <Link href="/login" style={{ textDecoration: "none", width: "100%" }}>
                <Button
                  variant="text"
                  sx={{
                    ...styles.secondaryButton,
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                  startIcon={<MdArrowBack />}
                >
                  Back to Login
                </Button>
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
                <MdEmail size={30} color="#51cf66" />
              </Box>
              <Typography variant="h5" sx={{ color: "#fff", mb: 1 }}>
                Check Your Email
              </Typography>
              <Typography sx={styles.subtitle}>
                We've sent a password reset link to:
              </Typography>
              <Typography
                sx={{ color: "#a785eb", fontWeight: "bold", mt: 1, mb: 2 }}
              >
                {email}
              </Typography>
              <Typography sx={{ ...styles.subtitle, fontSize: "13px" }}>
                Didn't receive the email? Check your spam folder or try again.
              </Typography>
            </Box>

            <Box sx={styles.buttonGroup}>
              <Button
                variant="outlined"
                sx={styles.secondaryButton}
                onClick={() => {
                  setSuccess(false);
                  setEmail("");
                }}
              >
                Try Another Email
              </Button>

              <Link href="/login" style={{ textDecoration: "none", width: "100%" }}>
                <Button
                  variant="text"
                  sx={{
                    ...styles.secondaryButton,
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                  startIcon={<MdArrowBack />}
                >
                  Back to Login
                </Button>
              </Link>
            </Box>
          </>
        )}
      </Box>
    </div>
  );
};

export default ForgotPassword;

