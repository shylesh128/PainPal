import "../styles/globals.css";
import { ThemeProvider, createTheme } from "@mui/material";
/* slick-carousel styles */
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Layout } from "../components/layout/Layout.component";
import { UserProvider } from "../services/userContext";
import { newColors } from "../Themes/newColors";
import { Provider } from "react-redux";
import store from "../store/store";

// Create the theme using the colors object
const theme = createTheme({
  palette: {
    background: {
      default: newColors.background,
      paper: newColors.secondary,
    },
    text: {
      primary: newColors.text,
    },
    primary: {
      main: newColors.primary,
    },
    secondary: {
      main: newColors.secondary,
    },
    action: {
      active: newColors.buttonBackground,
    },
  },
  typography: {
    fontFamily: "Roboto, sans-serif",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundColor: newColors.buttonBackground,
          color: newColors.buttonText,
          "&:hover": {
            backgroundColor: newColors.primary,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            color: newColors.text,
            "& fieldset": {
              borderColor: newColors.secondary,
            },
            "&:hover fieldset": {
              borderColor: newColors.primary,
            },
            "&.Mui-focused fieldset": {
              borderColor: newColors.primary,
            },
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: newColors.text,
          "&.Mui-checked": {
            color: newColors.primary,
          },
        },
      },
    },
  },
});

export default function App({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <UserProvider>
        <ThemeProvider theme={theme}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ThemeProvider>
      </UserProvider>
    </Provider>
  );
}
