import { createTheme } from '@mui/material/styles'

export const COLORS = {
  background: '#272e33',
  foreground: '#d3c6aa',
  green: '#a7c080',
  aqua: '#83c092',
}

export const ALPHAS = {
  surface: 'rgba(211, 198, 170, 0.05)',
  surfaceHover: 'rgba(211, 198, 170, 0.09)',
  border: 'rgba(211, 198, 170, 0.16)',
  textSecondary: 'rgba(211, 198, 170, 0.72)',
  textDisabled: 'rgba(211, 198, 170, 0.38)',
}

export default createTheme({
  palette: {
    mode: 'dark',
    primary: { main: COLORS.green },
    secondary: { main: COLORS.aqua },
    background: {
      default: COLORS.background,
      paper: ALPHAS.surface,
    },
    text: {
      primary: COLORS.foreground,
      secondary: ALPHAS.textSecondary,
      disabled: ALPHAS.textDisabled,
    },
    divider: ALPHAS.border,
    success: { main: COLORS.aqua },
    error: { main: COLORS.foreground },
    warning: { main: COLORS.aqua },
    info: { main: COLORS.aqua },
  },
  typography: {
    fontFamily: ['"DM Sans"', 'system-ui', 'sans-serif'].join(','),
    h1: { fontFamily: '"Arimo", sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Arimo", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Arimo", sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Arimo", sans-serif', fontWeight: 700 },
    h5: { fontFamily: '"Arimo", sans-serif', fontWeight: 700 },
    h6: { fontFamily: '"Arimo", sans-serif', fontWeight: 700 },
    subtitle1: { fontFamily: '"Arimo", sans-serif', fontWeight: 700 },
    subtitle2: { fontFamily: '"Arimo", sans-serif', fontWeight: 700 },
    button: { textTransform: 'none' },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: COLORS.background,
          color: COLORS.foreground,
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
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontFamily: '"Arimo", sans-serif',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: { borderColor: ALPHAS.border },
      },
    },
  },
})
