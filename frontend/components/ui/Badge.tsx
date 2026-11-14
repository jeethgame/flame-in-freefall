"use client";
import { Chip } from "@mui/material";

interface BadgeProps {
  label: string;
  variant?: "teal" | "cyan" | "amber" | "red" | "muted" | "green";
  size?: "sm" | "md";
}

const COLOR_MAP: Record<string, "primary" | "warning" | "error" | "success" | "default"> = {
  teal: "primary",
  cyan: "primary",
  amber: "warning",
  red: "error",
  green: "success",
  muted: "default",
};

export default function Badge({ label, variant = "muted", size = "sm" }: BadgeProps) {
  return (
    <Chip
      label={label}
      size="small"
      variant="outlined"
      color={COLOR_MAP[variant] || "default"}
      sx={size === "md" ? { fontSize: "0.65rem", height: 22 } : { height: 18 }}
    />
  );
}
