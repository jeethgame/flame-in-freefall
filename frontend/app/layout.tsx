"use client";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
    <span style={{ color: "var(--value)", fontWeight: 700, fontSize: 12, letterSpacing: "0.05em", fontFeatureSettings: "'tnum'" }}>
      {time}
    </span>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <html lang="en">
      <head>
        <title>FLAME IN FREEFALL · Microgravity Fire Safety Console</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <header style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 16px" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "6px 0", borderBottom: "1px solid var(--border-dim)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "var(--cyan)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" }}>
                  FLAME IN FREEFALL
                </span>
                <span style={{ color: "var(--muted)", fontSize: 9, letterSpacing: "0.06em" }}>
                  MICROGRAVITY FIRE SAFETY · NASA SPACE APPS 2026
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <MissionClock />
                <span className="status-pill green">ONLINE</span>
              </div>
            </div>

            <nav style={{ display: "flex", gap: 0, padding: "2px 0" }}>
              {NAV.map(({ href, label, num }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "4px 12px", fontSize: 9, fontWeight: 600,
                      fontFamily: "var(--sans)",
                      letterSpacing: "0.08em", textDecoration: "none",
                      color: active ? "var(--cyan)" : "var(--label)",
                      borderBottom: active ? "1px solid var(--cyan)" : "1px solid transparent",
                    }}
                  >
                    <span style={{ fontSize: 8, fontWeight: 700, opacity: 0.4 }}>{num}</span>
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        <main style={{ maxWidth: 1400, margin: "0 auto", padding: "12px 16px 24px" }}>
          {children}
        </main>

        <footer style={{
          borderTop: "1px solid var(--border-dim)", padding: "6px 16px",
          textAlign: "center", color: "var(--muted)", fontSize: 8,
          letterSpacing: "0.08em", fontFamily: "var(--sans)",
        }}>
          DATA: NASA PSI · PSI.NASA.GOV/PHYSCI/REPO
        </footer>
      </body>
    </html>
  );
}
