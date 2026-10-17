"use client";

import { createTheme } from "@mui/material/styles";

// Paleta inspirada no Material Design 3 (tons de verde "gramado").
// Todas as combinações texto/fundo foram escolhidas para contraste ≥ 4.5:1 (WCAG 1.4.3).
const theme = createTheme({
  cssVariables: { colorSchemeSelector: "class" },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#1B6B3A", contrastText: "#FFFFFF" },
        secondary: { main: "#52634F", contrastText: "#FFFFFF" },
        error: { main: "#BA1A1A", contrastText: "#FFFFFF" },
        background: { default: "#F7FBF2", paper: "#FFFFFF" },
        text: { primary: "#181D17", secondary: "#424940" },
        divider: "#C2C9BE",
      },
    },
    dark: {
      palette: {
        primary: { main: "#8FD89D", contrastText: "#00391A" },
        secondary: { main: "#B9CCB4", contrastText: "#243424" },
        error: { main: "#FFB4AB", contrastText: "#690005" },
        background: { default: "#10140F", paper: "#1C211B" },
        text: { primary: "#E0E4DB", secondary: "#C2C9BE" },
        divider: "#424940",
      },
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "var(--font-roboto), Roboto, Arial, sans-serif",
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButtonBase: {
      styleOverrides: {
        // Foco sempre visível para quem navega por teclado (WCAG 2.4.7).
        root: ({ theme }) => ({
          "&.Mui-focusVisible": {
            outline: `3px solid ${theme.vars.palette.primary.main}`,
            outlineOffset: 2,
          },
        }),
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      // Alvos de toque de no mínimo 48dp (Material / WCAG 2.5.5).
      styleOverrides: { root: { minHeight: 48, borderRadius: 24, paddingInline: 24 } },
    },
    MuiAvatar: {
      // O cinza padrão do MUI não atinge 4.5:1 no modo escuro.
      styleOverrides: {
        colorDefault: ({ theme }) => ({
          backgroundColor: theme.vars.palette.primary.main,
          color: theme.vars.palette.primary.contrastText,
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { minWidth: 48, minHeight: 48 } },
    },
    MuiTextField: {
      defaultProps: { fullWidth: true },
    },
  },
});

export default theme;
