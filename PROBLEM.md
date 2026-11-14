# The Problem

NASA's Physical Sciences Informatics (PSI) database holds decades of microgravity combustion experiments conducted aboard the ISS — but the data is **fragmented across isolated investigations, scattered CSV files, and dense PDFs**. There is no unified way to:

- **Compare experiments** across different hardware racks, fuel types, and environmental conditions
- **Assess fire risk** for specific mission environments (ISS, Lunar bases at 34% O₂, Spacesuit airlocks at 100% O₂, Mars habitats)
- **Predict flammability behavior** under arbitrary combinations of O₂ concentration, pressure, airflow, and gravity
- **Translate findings** into actionable engineering recommendations for next-generation spacecraft fire safety systems

This matters now because **planned Lunar habitats will operate at ≥30% O₂ and reduced pressure** — conditions that increase material flammability by more than 40% compared to Earth. Engineers designing fire detection, suppression, and ventilation systems for Artemis-era missions need a way to query this data as a unified, interactive knowledge base — not hunt through 13 separate investigation archives.

Additionally, **no true Lunar (1/6g) or Martian (3/8g) combustion data exists yet** in PSI. The upcoming LUCI and FM2 experiments will fill this gap, but until then, engineers must interpolate from 0g flight data and 1g ground data — a non-trivial task that benefits from computational modeling.
