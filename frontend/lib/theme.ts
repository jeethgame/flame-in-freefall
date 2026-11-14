"use client";
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#06B6D4",
      dark: "#0e7490",
      light: "#22D3EE",
      contrastText: "#06090F",
    },
    secondary: {
      main: "#94A3B8",
      dark: "#64748B",
      light: "#CBD5E1",
    },
    warning: {
      main: "#F59E0B",
      dark: "#92400E",
      light: "#FBBF24",
    },
    error: {
      main: "#EF4444",
      dark: "#991B1B",
      light: "#F87171",
    },
    success: {
      main: "#22C55E",
      dark: "#166534",
      light: "#4ADE80",
    },
    background: {
      default: "#06090F",
      paper: "#0C1119",
    },
    text: {
      primary: "#E2E8F0",
      secondary: "#94A3B8",
      disabled: "#475569",
    },
    divider: "#1e293b",
  },
  typography: {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: 12,
    h1: { fontFamily: "'Satoshi', system-ui, sans-serif", fontWeight: 700, letterSpacing: "0.04em" },
    h2: { fontFamily: "'Satoshi', system-ui, sans-serif", fontWeight: 600, letterSpacing: "0.04em" },
    h3: { fontFamily: "'Satoshi', system-ui, sans-serif", fontWeight: 600, letterSpacing: "0.04em" },
    h4: { fontFamily: "'Satoshi', system-ui, sans-serif", fontWeight: 600, letterSpacing: "0.04em" },
    h5: { fontFamily: "'Satoshi', system-ui, sans-serif", fontWeight: 600, letterSpacing: "0.04em" },
    h6: { fontFamily: "'Satoshi', system-ui, sans-serif", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", fontSize: "0.75rem" },
    subtitle1: { fontFamily: "'Satoshi', system-ui, sans-serif", fontSize: "0.7rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "#64748B" },
    subtitle2: { fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748B" },
    body1: { fontSize: "0.75rem", lineHeight: 1.5 },
    body2: { fontSize: "0.68rem", lineHeight: 1.5, color: "#94A3B8" },
    caption: { fontSize: "0.6rem", letterSpacing: "0.06em", color: "#475569" },
    overline: { fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748B" },
    button: { fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" },
  },
  shape: {
    borderRadius: 0,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#06090F",
          fontFeatureSettings: "'tnum'",
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true, disableRipple: true },
      styleOverrides: {
        root: {
          borderRadius: 0,
          textTransform: "uppercase",
          fontWeight: 600,
          fontSize: "0.65rem",
          letterSpacing: "0.08em",
          padding: "4px 10px",
          minWidth: "auto",
        },
        outlined: {
          borderColor: "#1e293b",
          color: "#64748B",
          "&:hover": { borderColor: "#475569", color: "#94A3B8", backgroundColor: "transparent" },
          "&.Mui-selected, &[data-active='true']": {
            borderColor: "#0e7490",
            color: "#06B6D4",
            borderLeftWidth: 2,
            borderLeftColor: "#06B6D4",
          },
        },
        contained: {
          backgroundColor: "transparent",
          border: "1px solid #0e7490",
          color: "#06B6D4",
          "&:hover": { backgroundColor: "#06B6D40C", borderColor: "#06B6D4" },
          "&:active": { backgroundColor: "#0e7490", color: "#06090F" },
        },
      },
    },
    MuiChip: {
      defaultProps: { size: "small" },
      styleOverrides: {
        root: {
          borderRadius: 0,
          height: 20,
          fontSize: "0.6rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        },
        outlined: { borderColor: "#1e293b" },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: "1px solid #1e293b60",
          backgroundImage: "none",
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: "1px solid #1e293b60",
          backgroundColor: "#0C1119",
          backgroundImage: "none",
        },
      },
    },
    MuiAccordion: {
      defaultProps: { disableGutters: true, elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: "0 !important",
          border: "1px solid #1e293b60",
          backgroundColor: "#0C1119",
          "&:before": { display: "none" },
          "&.Mui-expanded": { margin: 0 },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          minHeight: 36,
          padding: "0 10px",
          "&.Mui-expanded": { minHeight: 36 },
        },
        content: { margin: "6px 0", "&.Mui-expanded": { margin: "6px 0" } },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: { padding: "4px 10px 10px" },
      },
    },
    MuiSlider: {
      defaultProps: { size: "small" },
      styleOverrides: {
        root: { color: "#94A3B8", height: 2 },
        thumb: {
          width: 8, height: 14, borderRadius: 0,
          backgroundColor: "#94A3B8",
          "&:hover, &.Mui-active": { backgroundColor: "#06B6D4", boxShadow: "none" },
          "&::before": { display: "none" },
        },
        track: { height: 2, borderRadius: 0, border: "none" },
        rail: { height: 1, backgroundColor: "#1e293b", opacity: 1 },
        valueLabel: {
          backgroundColor: "#0C1119",
          border: "1px solid #1e293b",
          borderRadius: 0,
          fontSize: "0.6rem",
          fontFamily: "'JetBrains Mono', monospace",
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small", variant: "outlined" },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 0,
            fontSize: "0.75rem",
            "& fieldset": { borderColor: "#1e293b" },
            "&:hover fieldset": { borderColor: "#475569" },
            "&.Mui-focused fieldset": { borderColor: "#06B6D4", borderWidth: 1 },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          border: "1px solid #1e293b",
          backgroundColor: "#0B101B",
          backgroundImage: "none",
        },
      },
    },
    MuiTab: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          textTransform: "uppercase",
          fontSize: "0.6rem",
          fontWeight: 600,
          letterSpacing: "0.08em",
          minHeight: 32,
          padding: "4px 12px",
          minWidth: "auto",
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { height: 1 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#0C1119",
          border: "1px solid #1e293b",
          borderRadius: 0,
          fontSize: "0.65rem",
          fontFamily: "'JetBrains Mono', monospace",
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          textTransform: "uppercase",
          fontSize: "0.6rem",
          fontWeight: 600,
          letterSpacing: "0.08em",
          padding: "3px 8px",
          borderColor: "#1e293b",
          color: "#64748B",
          "&.Mui-selected": {
            color: "#06B6D4",
            borderColor: "#0e7490",
            borderLeft: "2px solid #06B6D4",
            backgroundColor: "transparent",
            "&:hover": { backgroundColor: "transparent" },
          },
        },
      },
    },
  },
});

export default theme;
