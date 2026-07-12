# PULSE+ System

Population Update and Linking for Sustainable Empowerment — a digitization of OPPO Cavite's
RPFP Form 1 (Profiling) and Documentation Report (Seminar) workflow, replacing the manual
monthly consolidation spreadsheet.

## Run locally

```bash
npm install
npm run dev
```

Then open the printed localhost URL.

## Notes

- **Storage**: this build uses the browser's `localStorage`, so data is per-browser only.
  For a real shared multi-user deployment (all staff seeing the same records), replace the
  `loadRecords`/`saveRecords` functions in `src/PulseApp.jsx` with calls to a real backend/database.
- **District mapping**: `MUNI_DISTRICT` in `src/PulseApp.jsx` is reconstructed from the sample
  March 2025 tracking table. Only ~15 of Cavite's 23 municipalities/cities appeared in that sample;
  the rest are best-guess placeholders — confirm the office's official District I–IV grouping and
  correct that object if needed.
- **Login**: this is a simple mock login (name + role, no password/backend check) for demo purposes.
  Wire up real authentication before using this with real participant data — the RPFP Form 1
  disclaimer requires proper handling of personal information.
- **Export to PDF**: uses the browser's native print dialog ("Save as PDF"). Swap in a library
  like `jspdf` or a backend PDF generator if you need a one-click download instead.
