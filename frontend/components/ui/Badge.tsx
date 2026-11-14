interface BadgeProps {
  label: string;
  variant?: "teal" | "amber" | "red" | "muted" | "green";
  size?: "sm" | "md";
}

export default function Badge({ label, variant = "muted", size = "sm" }: BadgeProps) {
  return (
    <span className={`mc-tag ${variant}`} style={size === "md" ? { fontSize: 10, padding: "2px 8px" } : undefined}>
      {label}
    </span>
  );
}
