import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
} from "@mui/material";
import { MdCheckCircle, MdError, MdEmail } from "react-icons/md";
import axios from "axios";
import { UserContext } from "../services/userContext";
import { newColors } from "../Themes/newColors";

/**
 * Email Verification Page
 * Handles email verification from link in email
 */
export default function VerifyEmailPage() {
  const router = useRouter();
  const { token, email } = router.query;
  const { setUser, setToken } = useContext(UserContext);

  const [status, setStatus] = useState("loading"); // loading, success, error, no-token
  const [message, setMessage] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    // Wait for query params to be available
    if (!router.isReady) return;

    if (!token || !email) {
      setStatus("no-token");
      setMessage("Invalid verification link. Please check your email for the correct link.");
      return;
    }

    verifyEmail();
  }, [router.isReady, token, email]);

  const verifyEmail = async () => {
    setVerifying(true);
    setStatus("loading");

    try {
      const response = await axios.post("/api/v1/auth/verify-email", {
        token,
        email,
      });

      setStatus("success");
      setMessage(response.data.message);

      // Auto-login: set the token and user
      if (response.data.token && response.data.user) {
        setToken(response.data.token);
        setUser(response.data.user);

        // Redirect to home after 2 seconds
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    } catch (error) {
      setStatus("error");
      setMessage(
        error.response?.data?.message ||
          "Verification failed. The link may have expired."
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;

    setVerifying(true);

    try {
      await axios.post("/api/v1/auth/resend-verification", { email });
      setMessage("A new verification email has been sent. Please check your inbox.");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to send verification email."
      );
    } finally {
      setVerifying(false);
    }
  };

  const renderIcon = () => {
    switch (status) {
      case "success":
        return <MdCheckCircle size={80} color="#51cf66" />;
      case "error":
      case "no-token":
        return <MdError size={80} color="#ff6b6b" />;
      default:
        return <MdEmail size={80} color={newColors.primary} />;
    }
  };

  const renderContent = () => {
    if (status === "loading" && verifying) {
      return (
        <>
          <CircularProgress size={60} sx={{ color: newColors.primary, mb: 3 }} />
          <Typography variant="h5" sx={{ color: "#fff", mb: 2 }}>
            Verifying your email...
          </Typography>
          <Typography sx={{ color: "#888" }}>
            Please wait while we verify your email address.
          </Typography>
        </>
      );
    }

    return (
      <>
        <Box sx={{ mb: 3 }}>{renderIcon()}</Box>

        <Typography
          variant="h5"
          sx={{
            color: status === "success" ? "#51cf66" : status === "error" ? "#ff6b6b" : "#fff",
            mb: 2,
            fontWeight: 600,
          }}
        >
          {status === "success"
            ? "Email Verified!"
            : status === "error"
            ? "Verification Failed"
            : "Invalid Link"}
        </Typography>

        <Typography sx={{ color: "#aaa", mb: 4, textAlign: "center" }}>
          {message}
        </Typography>

        {status === "success" && (
          <Typography sx={{ color: "#888", fontSize: 14 }}>
            Redirecting to home page...
          </Typography>
        )}

        {status === "error" && email && (
          <Box sx={{ display: "flex", gap: 2, flexDirection: "column" }}>
            <Button
              variant="contained"
              onClick={handleResendVerification}
              disabled={verifying}
              sx={{
                bgcolor: newColors.primary,
                color: "#1c1c1c",
                "&:hover": { bgcolor: "#b899f0" },
              }}
            >
              {verifying ? "Sending..." : "Resend Verification Email"}
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push("/login")}
              sx={{
                borderColor: "#444",
                color: "#aaa",
                "&:hover": { borderColor: "#666" },
              }}
            >
              Back to Login
            </Button>
          </Box>
        )}

        {(status === "no-token" || (status === "error" && !email)) && (
          <Button
            variant="contained"
            onClick={() => router.push("/login")}
            sx={{
              bgcolor: newColors.primary,
              color: "#1c1c1c",
              "&:hover": { bgcolor: "#b899f0" },
            }}
          >
            Go to Login
          </Button>
        )}
      </>
    );
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: newColors.background,
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          bgcolor: newColors.secondary,
          borderRadius: 3,
          p: 5,
          maxWidth: 450,
          width: "100%",
          textAlign: "center",
          border: "1px solid #333",
        }}
      >
        {/* Logo */}
        <Typography
          variant="h4"
          sx={{
            color: "#fff",
            mb: 4,
            fontWeight: 700,
          }}
        >
          Pain
          <Box
            component="span"
            sx={{
              bgcolor: newColors.primary,
              color: "#292929",
              px: 1,
              py: 0.5,
              borderRadius: 1,
              ml: 0.5,
            }}
          >
            Pal
          </Box>
        </Typography>

        {renderContent()}
      </Paper>
    </Box>
  );
}

