import { useState } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { Box, Button, Typography, TextField, Divider } from "@mui/material";
import { FcGoogle } from "react-icons/fc";
import { styles } from "../styles/login-style";
import { loginUser } from "../store/userSlice";

const Login = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const dispatch = useDispatch();

  const handleLogin = async () => {
    if (email) {
      setError("");
      dispatch(loginUser({ email }));
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
          <Button variant="contained" sx={styles.button} onClick={handleLogin}>
            Login
          </Button>

          <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
            <Divider sx={{ flexGrow: 1 }} />
            <Typography sx={{ mx: 2, fontWeight: "bold" }}>OR</Typography>
            <Divider sx={{ flexGrow: 1 }} />
          </Box>

          <Button
            variant="outlined"
            sx={styles.googleButton}
            startIcon={<FcGoogle />}
            onClick={() => {
              router.push("/api/v1/auth/google");
            }}
          >
            Sign in with Google
          </Button>
        </Box>
      </Box>
    </div>
  );
};

export default Login;
