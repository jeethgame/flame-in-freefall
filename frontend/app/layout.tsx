"use client";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AppBar, Toolbar, Box, Typography, Chip, Tabs, Tab } from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry";

const NAV = [
  { href: "/explorer",  label: "PSI MATRIX",     num: "01" },
  { href: "/ranker",    label: "MISSION RANKER",  num: "02" },
  { href: "/simulator", label: "SIMULATOR",       num: "03" },
  { href: "/hardware",  label: "HARDWARE",        num: "04" },
  { href: "/spinoffs",  label: "SPINOFFS",        num: "05" },
];

function MissionClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(new Date().toISOString().slice(11, 19));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <Typography variant="body1" sx={{ fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.05em", fontFeatureSettings: "'tnum'", color: "text.primary" }}>
      {time}
    </Typography>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tabIndex = NAV.findIndex(n => pathname === n.href || pathname.startsWith(n.href + "/"));

  return (
    <html lang="en">
      <head>
        <title>FLAME IN FREEFALL · Microgravity Fire Safety Console</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <ThemeRegistry>
          <AppBar position="sticky" elevation={0} sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}>
            <Toolbar variant="dense" sx={{ minHeight: 32, px: 2, gap: 1, justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 700, letterSpacing: "0.1em", fontSize: "0.65rem" }}>
                  FLAME IN FREEFALL
                </Typography>
                <Typography variant="caption" sx={{ color: "text.disabled" }}>
                  MICROGRAVITY FIRE SAFETY · NASA SPACE APPS 2026
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <MissionClock />
                <Chip label="ONLINE" size="small" color="success" variant="outlined" sx={{ height: 18 }} />
              </Box>
            </Toolbar>

            <Tabs
              value={tabIndex >= 0 ? tabIndex : false}
              sx={{ minHeight: 28, px: 2, "& .MuiTabs-indicator": { bgcolor: "primary.main" } }}
            >
              {NAV.map(({ href, label, num }, i) => (
                <Tab
                  key={href}
                  component={Link}
                  href={href}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Typography variant="caption" sx={{ opacity: 0.4, fontWeight: 700 }}>{num}</Typography>
                      {label}
                    </Box>
                  }
                  sx={{ color: tabIndex === i ? "primary.main" : "text.disabled" }}
                />
              ))}
            </Tabs>
          </AppBar>

          <Box component="main" sx={{ maxWidth: 1400, mx: "auto", px: 2, py: 1.5 }}>
            {children}
          </Box>

          <Box component="footer" sx={{ borderTop: 1, borderColor: "divider", py: 0.75, px: 2, textAlign: "center" }}>
            <Typography variant="caption">
              DATA: NASA PSI · PSI.NASA.GOV/PHYSCI/REPO
            </Typography>
          </Box>
        </ThemeRegistry>
      </body>
    </html>
  );
}
