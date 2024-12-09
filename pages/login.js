import { Box, Button, Typography, TextField, Divider } from "@mui/material";
import { useState, useContext } from "react";
import { TypeAnimation } from "react-type-animation";
import { UserContext } from "../services/userContext";
import { useRouter } from "next/router"; // Import useRouter for routing
import { FcGoogle } from "react-icons/fc"; // Import Google icon from react-icons
import { styles } from "../styles/login-style";

const Login = () => {
  const { login, handleGoogleLogin } = useContext(UserContext);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const router = useRouter(); // Initialize the router

  const handleLogin = async () => {
    if (email) {
      setError("");
      const res = await login(email);
    } else {
      setError("Please provide valid email");
    }
  };

  return (
    <div style={styles.container}>
      <Box sx={styles.box}>
        <Typography variant="h2" component="div" sx={styles.title}>
          Pain
          <span style={styles.highlightedSpan}>Pal</span>
        </Typography>

        <TypeAnimation
          sequence={["Welcome", 1500, "Write your pain", 1500]}
          speed={40}
          style={styles.typeAnimation}
        />

        <TextField
          type="email"
          placeholder="username"
          variant="outlined"
          value={email}
          fullWidth
          onChange={(e) => setEmail(e.target.value)}
          sx={styles.textField}
          slotProps={{
            input: {
              style: styles.inputProps,
            },
          }}
        />

        {error && <p style={styles.error}>{error}</p>}

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <Button variant="contained" sx={styles.button}>
            Login
          </Button>

          <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
            <Divider sx={{ flexGrow: 1 }} />
            <Typography sx={{ mx: 2, fontWeight: "bold" }}>OR</Typography>
            <Divider sx={{ flexGrow: 1 }} />
          </Box>

          <Button
            variant="outlined"
            onClick={handleGoogleLogin}
            sx={styles.googleButton}
            startIcon={<FcGoogle />}
          >
            Sign in with Google
          </Button>
        </Box>
      </Box>
    </div>
  );
};

export default Login;
