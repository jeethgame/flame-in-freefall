"use client";
import dynamic from "next/dynamic";
import {
  Accordion, AccordionSummary, AccordionDetails,
  Typography, Chip, Card, CardContent, Paper, Alert, Box, Grid, Stack,
} from "@mui/material";
import { ExpandMore, Shield } from "@mui/icons-material";

const DropletChamberScene = dynamic(() => import("@/components/three/DropletChamberScene"), { ssr: false });

interface InsightCard {
  title: string;
  source: string;
  psi_ids: string[];
  finding: string;
  recommendation: string;
}

const SECTIONS: { id: string; num: string; title: string; cards: InsightCard[] }[] = [
  {
    id: "detection", num: "01", title: "EARLY DETECTION SYSTEMS",
    cards: [
      { title: "Microgravity Smoke Particle Size Shift", source: "SAME / SAME-R", psi_ids: ["PSI-50"], finding: "In 0g, smoke particles from smoldering sources are 2–10× smaller (0.05–0.3 μm) than 1g equivalents. Ionization detectors respond 30–60 seconds later in 0g. Photoelectric detectors perform significantly better for sub-micron particles.", recommendation: "Replace ionization smoke detectors with dual-channel photoelectric (forward + side scatter) as primary fire detection in all future spacecraft. Ionization detectors should be retained only as secondary backup for large-particle events." },
      { title: "Lunar Dust vs. Fire Smoke Discrimination", source: "DAFT / DAFT-2", psi_ids: ["PSI-51"], finding: "Lunar regolith particles are predominantly 1–50 μm (much larger than smoke). Combined size + shape discrimination algorithm achieves 95% correct classification. Ionization detectors cannot distinguish dust from smoke at all.", recommendation: "Lunar habitat fire detectors MUST incorporate multi-channel particle size discrimination (OPC-based) to prevent false alarms from regolith dust intrusion during EVA ingress/egress. Budget for additional sensor mass and power in habitat ECLSS." },
      { title: "Teflon Wire Smolder: Hardest-to-Detect Scenario", source: "SAME / SAME-R", psi_ids: ["PSI-50"], finding: "Teflon wire insulation smolder produces smoke with very low scattering coefficient—the highest false-negative rate across all tested materials. This is the most likely electrical fire precursor in current ISS wiring.", recommendation: "Supplement optical smoke detectors with gas-phase sensors (CO, HCN, formaldehyde) specifically calibrated for fluoropolymer pyrolysis products in wire routing conduits." },
      { title: "Cool Flame Detection Gap", source: "CFI / ACME CFI-G", psi_ids: ["PSI-100", "PSI-159"], finding: "Cool flames at 600–750K produce no visible emission and sub-threshold heat signatures. Formaldehyde chemiluminescence at 400 nm is the primary spectral signature, absent from all current ISS detectors.", recommendation: "Add formaldehyde or peroxide gas sensors to next-generation fire detection suites. Critical for pressurized rovers where liquid fuel/solvent spills may sustain invisible cool-flame oxidation." },
    ],
  },
  {
    id: "suppression", num: "02", title: "SUPPRESSION SYSTEMS",
    cards: [
      { title: "CO₂ vs. Helium Suppression Efficiency", source: "FLEX / FLEX-2", psi_ids: ["PSI-69", "PSI-70"], finding: "CO₂ suppression is 1.4× more efficient per mole than N₂, and significantly more efficient than He, due to superior heat absorption capacity. Heptane LOC in 0g with CO₂ diluent: ~11% O₂ at 20% volume. Methanol requires more agent.", recommendation: "CO₂ should be the primary fire suppression agent for spacecraft cargo and equipment bays. Size systems assuming methanol LOC (the harder fuel), not heptane. He is inferior and should only be used where CO₂ toxicity to crew is a constraint." },
      { title: "Solid Fuel Extinction: Size Matters", source: "ACME BRE", psi_ids: ["PSI-102"], finding: "LOC depends strongly on fuel element size: 1 cm objects extinguish at 19% O₂, 4 cm objects persist down to 16% O₂. Classical D² burning law overestimates suppression effectiveness for large items.", recommendation: "Spacecraft fire suppression agent quantity should be calculated assuming the LARGEST solid fuel item aboard (cargo bags, seat cushions, 40+ cm dimension), not typical small-sample test data." },
      { title: "Wire Insulation: The Underappreciated Hazard", source: "BASS-II", psi_ids: ["PSI-26"], finding: "Silicone rubber wire insulation proved most dangerous: flames persisted down to 15.5% O₂ in 0g, well below Earth-equivalent LOC. CO₂ dilution is more effective than N₂ for cable conduit inerting.", recommendation: "Implement CO₂-based inerting in cable conduits and junction boxes. Evaluate replacing silicone rubber insulation with higher-LOC fluoropolymer alternatives for new spacecraft builds." },
      { title: "Reduced Pressure Increases Inherent LOC", source: "FLEX-2", psi_ids: ["PSI-70"], finding: "Reduced pressure (11.6 psi vs 14.7 psi) increases LOC by ~2% O₂ for all fuels tested. This partially offsets the increased O₂ fraction risk in Moon base / pressurized rover atmospheres (10.2 psi, 34% O₂).", recommendation: "Pressurization strategy is a fire safety variable. Lower cabin pressure slightly reduces fire risk per O₂ concentration, but Moon base O₂ % is so high (34%) that the net effect is still >40% increased flammability." },
    ],
  },
  {
    id: "materials", num: "03", title: "CABIN MATERIAL & VENTILATION DESIGN",
    cards: [
      { title: "Saffire: The 34% O₂ Tipping Point", source: "Saffire I / II / III", psi_ids: ["PSI-80"], finding: "Fire spread across cotton-fiberglass panels was 2× faster at 34% O₂ vs 21%. CO concentration reached 2000 ppm (immediately life-threatening) within 90 seconds at 34% O₂. Post-fire cleanup required >4 hours of HEPA filtration.", recommendation: "Moon base and pressurized rover fire response plans must assume 2× faster fire growth, lethal CO within 90 seconds, and 4+ hour post-fire cleanup. Crew must have immediate access to portable breathing apparatus within 15 seconds of alarm." },
      { title: "The 4–8 cm/s Ventilation Sweet Spot", source: "SPICE / BASS / SLICE", psi_ids: ["PSI-11", "PSI-25", "PSI-13"], finding: "In 0g, flame spread rate peaks at 4–8 cm/s forced airflow—exactly the range of ISS cabin ventilation. Below 2 cm/s, radiative quenching extinguishes. Above 15 cm/s, convective blowoff extinguishes.", recommendation: "Cabin ventilation design should either maintain airflow well below 3 cm/s (fire-safe but poor air quality) or be rapidly switchable to >20 cm/s upon fire detection to leverage convective blowoff as a suppression mechanism." },
      { title: "Electric-Field Assisted Suppression Concept", source: "ACME E-FIELD", psi_ids: ["PSI-101"], finding: "DC electric fields at 4–6 kV across a 2 cm gap can reproduce 1g buoyancy effects on flames in 0g. At lower voltages (~1.5 kV), Lunar-equivalent convection is achieved. This suggests ionic wind actuators as potential fire-control devices.", recommendation: "Investigate electric-field flame control panels as a lightweight, residue-free suppression technology for electronics bays where CO₂ or water mist would damage equipment." },
      { title: "Flame Liftoff: Hidden Danger from Ventilation Fans", source: "SLICE", psi_ids: ["PSI-13"], finding: "Ventilation fans creating local air velocities >20 cm/s can inadvertently LIFT and STABILIZE diffusion flames from leaking fuel lines rather than extinguishing them. Liftoff height in 0g is 20–30% greater than 1g.", recommendation: "Habitat ventilation layout must avoid creating high-velocity jets near fuel lines, gas connectors, or experiment racks. Emergency vent shutoff should be included in fire response procedures." },
    ],
  },
];

export default function HardwarePage() {
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        <Shield sx={{ fontSize: 16, color: "primary.main" }} />
        <Typography variant="h6">NEXT-GEN SPACECRAFT FIRE SAFETY ARCHITECTURE</Typography>
        <Chip label="04" size="small" color="primary" variant="outlined" sx={{ height: 18, fontSize: "0.6rem" }} />
      </Stack>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Actionable engineering recommendations synthesized from PSI microgravity combustion experiments.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Stack spacing={1}>
            {SECTIONS.map((section) => (
              <Accordion key={section.id} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore sx={{ fontSize: 16, color: "text.disabled" }} />}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ width: "100%" }}>
                    <Chip label={section.num} size="small" color="primary" variant="outlined" sx={{ height: 18, minWidth: 28, fontSize: "0.6rem" }} />
                    <Typography variant="h6" sx={{ flex: 1 }}>{section.title}</Typography>
                    <Typography variant="caption">{section.cards.length} INSIGHTS</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1}>
                    {section.cards.map((card, i) => (
                      <Card key={i} sx={{ bgcolor: "background.default" }}>
                        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                          <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 700, color: "text.primary" }}>{card.title}</Typography>
                            {card.psi_ids.map((id) => (
                              <Chip key={id} label={id} size="small" color="primary" variant="outlined" sx={{ height: 18, fontSize: "0.6rem" }} />
                            ))}
                            <Chip label={card.source} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.6rem" }} />
                          </Stack>
                          <Paper sx={{ p: 1, mb: 1, bgcolor: "transparent", border: "1px solid", borderColor: "divider" }}>
                            <Typography variant="overline">FINDING</Typography>
                            <Typography variant="body2">{card.finding}</Typography>
                          </Paper>
                          <Alert severity="info" variant="outlined" icon={false} sx={{ "& .MuiAlert-message": { p: 0 } }}>
                            <Typography variant="overline" sx={{ color: "primary.main" }}>ENGINEERING RECOMMENDATION</Typography>
                            <Typography variant="body2" sx={{ color: "text.primary" }}>{card.recommendation}</Typography>
                          </Alert>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ position: "sticky", top: 72, minHeight: 500, p: 0, overflow: "hidden" }}>
            <DropletChamberScene />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
