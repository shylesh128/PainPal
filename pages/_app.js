/**
 * @fileoverview Next.js App component with Redux and MUI providers
 * @module pages/_app
 */

import '../styles/globals.css';
import { ThemeProvider, createTheme } from '@mui/material';
import { Provider } from 'react-redux';
import { CookiesProvider } from 'react-cookie';

/* slick-carousel styles */
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import { Layout } from '../components/layout/Layout.component';
import { store } from '../store/store';
import { newColors } from '../Themes/newColors';

// Create the MUI theme using the colors object
const theme = createTheme({
  palette: {
    mode: 'dark',
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
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
        contained: {
          backgroundColor: newColors.primary,
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#9070d1',
          },
        },
        outlined: {
          borderColor: newColors.primary,
          color: newColors.primary,
          '&:hover': {
            backgroundColor: 'rgba(167, 133, 235, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            color: newColors.text,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: newColors.primary,
            },
            '&.Mui-focused fieldset': {
              borderColor: newColors.primary,
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: newColors.secondary,
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: newColors.text,
          '&.Mui-checked': {
            color: newColors.primary,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: newColors.primary,
        },
      },
    },
  },
});

/**
 * Custom App component
 * @param {Object} props - Component props
 * @param {React.ComponentType} props.Component - Page component
 * @param {Object} props.pageProps - Page props
 */
export default function App({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <CookiesProvider>
        <ThemeProvider theme={theme}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ThemeProvider>
      </CookiesProvider>
    </Provider>
  );
}
