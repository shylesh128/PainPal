import { newColors } from "../Themes/newColors";

export const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#1b1b1b",
  },
  error: {
    color: newColors.primary,
    margin: "10px 0",
  },
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
  typeAnimation: {
    fontSize: "2em",
  },
  textField: {
    marginTop: "2rem",
    marginBottom: "2rem",
    color: "white",
    background: "#333",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#555",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#555",
    },
  },
  inputProps: {
    color: "white",
    placeholder: "white",
  },
  button: {
    backgroundColor: newColors.primary,
    color: "#292929",
    cursor: "pointer",
    width: "100%",
    fontWeight: "bold",
  },
  googleButton: {
    marginTop: "1rem",
    color: "#292929",
    backgroundColor: "#f3f3f3",
    borderColor: "#ddd",
    "&:hover": {
      backgroundColor: "#f1f1f1",
    },
    fontWeight: "bold",
    width: "100%",
  },
};
