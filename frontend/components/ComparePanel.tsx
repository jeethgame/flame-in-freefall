"use client";
import { Dialog, DialogTitle, DialogContent, IconButton, Typography, Box, Chip, Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import type { Experiment } from "@/lib/types";

interface ComparePanelProps {
  experiments: Experiment[];
  onClose: () => void;
}

const ROWS: { key: keyof Experiment; label: string }[] = [
  { key: "experimental_objective", label: "OBJECTIVE" },
  { key: "fuel_material", label: "FUEL MATERIAL" },
  { key: "fuel_geometry", label: "FUEL GEOMETRY" },
  { key: "o2_percent_min", label: "O₂ MIN (%)" },
  { key: "o2_percent_max", label: "O₂ MAX (%)" },
  { key: "pressure_psi_range", label: "PRESSURE (PSI)" },
  { key: "airflow_cm_s_min", label: "AIRFLOW MIN" },
  { key: "airflow_cm_s_max", label: "AIRFLOW MAX" },
  { key: "gravity_regime", label: "GRAVITY" },
  { key: "varied_parameters", label: "VARIED" },
  { key: "constant_parameters", label: "CONSTANT" },
  { key: "instrumentation", label: "SENSORS" },
  { key: "spacecraft_safety_impact", label: "SAFETY IMPACT" },
];

function renderVal(v: unknown): React.ReactNode {
  if (Array.isArray(v)) return v.join(", ");
  if (v == null) return <Typography variant="caption" sx={{ color: "text.disabled" }}>—</Typography>;
  return String(v);
}

export default function ComparePanel({ experiments, onClose }: ComparePanelProps) {
  if (!experiments.length) return null;
  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1, px: 2 }}>
        <Typography variant="h6">EXPERIMENT COMPARISON</Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: "text.disabled" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 120, color: "text.disabled", fontSize: "0.6rem" }}>FIELD</TableCell>
                {experiments.map(exp => (
                  <TableCell key={exp.psi_id}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      <Chip label={exp.psi_id} size="small" color="primary" variant="outlined" />
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>{exp.name}</Typography>
                      <Chip label={exp.hardware_rack} size="small" variant="outlined" sx={{ width: "fit-content" }} />
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {ROWS.map(({ key, label }) => (
                <TableRow key={key} sx={{ "&:hover": { bgcolor: "action.hover" } }}>
                  <TableCell sx={{ color: "text.disabled", fontSize: "0.6rem", fontWeight: 600, verticalAlign: "top" }}>
                    {label}
                  </TableCell>
                  {experiments.map(exp => (
                    <TableCell key={exp.psi_id} sx={{ fontSize: "0.7rem", verticalAlign: "top" }}>
                      {renderVal(exp[key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
