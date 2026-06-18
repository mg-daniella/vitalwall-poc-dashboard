# Changelog

All notable changes to the Vital Shell dashboard are documented here.

---

## [Unreleased]

### Added
- **Panel General — KPI trio**: replaced Tendencia de Temperatura chart with three building performance KPIs:
  - Estabilidad térmica (objetivo ≥95%)
  - Captación de agua (objetivo >20 L/m²)
  - Balance energético neto (objetivo ≥0%)
  - Each KPI shows current value, target label, a progress bar and a target marker line. Color turns green when target is met, amber when not.

---

## [2025-06-18]

### Added
- **Action type color mapping**: new `ACTION_VARIANT` map in `rules.js` for rule engine actions arriving via WebSocket `rule_update` and `GET /api/rules`:

  | Action | Badge variant | Color |
  |---|---|---|
  | `activate_cooling` | blue | `#378ADD` |
  | `activate_pcm_cooling` | teal | `#008080` |
  | `protect_components` | red | `#E24B4A` |
  | `reduce_internal_load` | amber | `#EF9F27` |
  | `activate_ventilation` | green | `#1D9E75` |
  | `alert_low_water` | amber | `#EF9F27` |
  | `alert_low_battery` | red | `#E24B4A` |
  | `shift_load_to_now` | blue | `#378ADD` |

- **Design system — teal token**: added `--teal: #008080` (light mode) and `--teal: #2aa8a8` (dark mode) to `tokens.css`.
- **StatusBadge — teal variant**: new `.status-badge.teal` class following the existing 12% background opacity pattern.
- **RuleRow**: displays `action_type` badge between status and layer badges when the field is present.
- **rules.js normalizer**: `normalizeRule` now preserves `action_type` from the API payload.

---

## [2025-06-17]

### Changed
- Dashboard location updated from Almería to Barcelona.
- Brand renamed from VitalWall to Vital Shell; POC Dashboard label removed.

### Fixed
- Vercel WSS proxy added to resolve mixed-content WebSocket error on HTTPS.
- Panel General: Condición Actual values no longer hidden by overflow clipping.
- Panel General: right column clipping fixed.
- Panel General: KPI column cut-off resolved; layout stacks below bars on medium screens.
- Panel General: fully responsive layout, no horizontal overflow.

---

## [2025-06-16]

### Changed
- ESG PDF: sidebar and topbar hidden on print via global styles.
- Capas de la Pared: real building photo overlay and panel naming applied.
- Red Eléctrica: vertical bar chart for Mix Energético; Panel General KPI layout fix.
- Clima y Previsión: full redesign; site selector updated.
- Confort and Calidad del Aire: redesigned pages.
- Red Eléctrica restored to sidebar; Cerebro Activo design overhaul applied.
- Dashboard UI overhaul: spacing, ESG report, Decisiones IA improvements.

### Fixed
- Rule normalization in `handleRuleUpdate` merged and corrected.
- WebSocket alert payload normalization: `level→severity`, `message→title`, generated id.
- `CategoryScale` registered in Chart.js — root cause of navigation blocking.
- Sensors store now accepts flat server format (`temperatura: 20`) alongside object format.

---

## [2025-06-15]

### Fixed
- Full audit: performance fixes, memory leaks, and data corrections across stores and components.
