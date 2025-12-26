import { newColors } from "../Themes/newColors";

/**
 * Shared styles for all authentication pages
 * Following DRY principle - reusable across login, signup, forgot/reset password
 */
export const styles = {
  // Container styles
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#1b1b1b",
    padding: "20px",
  },

  // Main box/card
  box: {
    backgroundColor: "#292929",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)",
    textAlign: "center",
    width: {
      xs: "350px",
      sm: "400px",
    },
  },

  // Title styles
  title: {
    fontWeight: 600,
    color: "#fff",
  },

  highlightedSpan: {
    backgroundColor: "#a785eb",
    padding: "2px 6px",
    color: "#292929",
    borderRadius: "8px",
    marginLeft: "4px",
  },

  // Type animation
  typeAnimation: {
    fontSize: "2em",
  },

  // Text field styles
  textField: {
    marginTop: "1rem",
    marginBottom: "1rem",
    color: "white",
    background: "#333",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#555",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#777",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: newColors.primary,
    },
    "& .MuiInputLabel-root": {
      color: "#888",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: newColors.primary,
    },
  },

  inputProps: {
    color: "white",
    placeholder: "white",
  },

  // Error message
  error: {
    color: "#ff6b6b",
    margin: "10px 0",
    fontSize: "14px",
  },

  // Success message
  success: {
    color: "#51cf66",
    margin: "10px 0",
    fontSize: "14px",
  },

  // Warning message (for lockout)
  warning: {
    color: "#ffd43b",
    margin: "10px 0",
    fontSize: "14px",
  },

  // Primary button
  button: {
    backgroundColor: newColors.primary,
    color: "#292929",
    cursor: "pointer",
    width: "100%",
    fontWeight: "bold",
    padding: "12px",
    "&:hover": {
      backgroundColor: "#b899f0",
    },
    "&:disabled": {
      backgroundColor: "#666",
      color: "#999",
    },
  },

  // Secondary/outline button
  secondaryButton: {
    color: newColors.primary,
    borderColor: newColors.primary,
    width: "100%",
    fontWeight: "bold",
    padding: "12px",
    "&:hover": {
      borderColor: "#b899f0",
      backgroundColor: "rgba(167, 133, 235, 0.1)",
    },
  },

  // Google OAuth button
  googleButton: {
    marginTop: "1rem",
    color: "#292929",
    backgroundColor: "#f3f3f3",
    borderColor: "#ddd",
    "&:hover": {
      backgroundColor: "#e5e5e5",
    },
    fontWeight: "bold",
    width: "100%",
    padding: "10px",
  },

  // GitHub OAuth button
  githubButton: {
    marginTop: "0.5rem",
    color: "#fff",
    backgroundColor: "#24292e",
    borderColor: "#24292e",
    "&:hover": {
      backgroundColor: "#3d4449",
    },
    fontWeight: "bold",
    width: "100%",
    padding: "10px",
  },

  // Divider with text
  dividerContainer: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    margin: "20px 0",
  },

  dividerText: {
    mx: 2,
    fontWeight: "bold",
    color: "#888",
  },

  // Link text
  linkText: {
    color: newColors.primary,
    cursor: "pointer",
    textDecoration: "none",
    "&:hover": {
      textDecoration: "underline",
    },
  },

  // Form group
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    width: "100%",
    marginBottom: "20px",
  },

  // Button group
  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    justifyContent: "center",
    width: "100%",
  },

  // OAuth button group
  oauthGroup: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    gap: "8px",
  },

  // Footer links
  footerLinks: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "center",
    gap: "16px",
    flexWrap: "wrap",
  },

  // Lockout banner
  lockoutBanner: {
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    border: "1px solid #ff6b6b",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "16px",
  },

  // Cooldown timer
  cooldownText: {
    color: "#ffd43b",
    fontSize: "14px",
    fontWeight: "bold",
  },

  // Info text
  infoText: {
    color: "#888",
    fontSize: "14px",
    marginTop: "16px",
  },

  // Password strength indicator
  passwordStrength: {
    width: "100%",
    height: "4px",
    backgroundColor: "#444",
    borderRadius: "2px",
    marginTop: "8px",
    overflow: "hidden",
  },

  passwordStrengthBar: {
    height: "100%",
    transition: "width 0.3s ease, background-color 0.3s ease",
  },

  // Form header
  formHeader: {
    marginBottom: "24px",
  },

  // Subtitle
  subtitle: {
    color: "#888",
    fontSize: "14px",
    marginTop: "8px",
  },
};

// Helper to get password strength color
export const getPasswordStrengthColor = (strength) => {
  switch (strength) {
    case 1:
      return "#ff6b6b"; // Weak - red
    case 2:
      return "#ffd43b"; // Fair - yellow
    case 3:
      return "#69db7c"; // Good - light green
    case 4:
      return "#51cf66"; // Strong - green
    default:
      return "#444";
  }
};

// Helper to calculate password strength
export const calculatePasswordStrength = (password) => {
  if (!password) return 0;
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
  if (password.match(/\d/)) strength++;
  if (password.match(/[^a-zA-Z\d]/)) strength++;
  return strength;
};
