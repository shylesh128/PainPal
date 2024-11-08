import "../styles/globals.css";
import { ThemeProvider, createTheme } from "@mui/material";
/* slick-carousel styles */
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Layout } from "../components/layout/Layout.component";
import { UserProvider } from "../services/userContext";

// Define color variables
const colors = {
  background: "#1b1b1b",
  text: "#ffffff",
  primary: "#ffa31a",
  secondary: "#292929",
  buttonBackground: "#808080",
  buttonText: "#ffffff",
};

// Create the theme using the colors object
const theme = createTheme({
  palette: {
    background: {
      default: colors.background,
      paper: colors.secondary,
    },
    text: {
      primary: colors.text,
    },
    primary: {
      main: colors.primary,
    },
    secondary: {
      main: colors.secondary,
    },
    action: {
      active: colors.buttonBackground,
    },
  },
  typography: {
    fontFamily: "Hilti, Roboto, sans-serif",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundColor: colors.buttonBackground,
          color: colors.buttonText,
          "&:hover": {
            backgroundColor: colors.primary,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            color: colors.text,
            "& fieldset": {
              borderColor: colors.secondary,
            },
            "&:hover fieldset": {
              borderColor: colors.primary,
            },
            "&.Mui-focused fieldset": {
              borderColor: colors.primary,
            },
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: colors.text,
          "&.Mui-checked": {
            color: colors.primary,
          },
        },
      },
    },
  },
});

export default function App({ Component, pageProps }) {
  return (
    <UserProvider>
      <ThemeProvider theme={theme}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ThemeProvider>
    </UserProvider>
  );
}
