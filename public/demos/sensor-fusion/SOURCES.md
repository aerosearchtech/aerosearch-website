# Sensor Fusion — public research demonstration

This viewer illustrates independent public surveys of the DRC seeded test field
in Pawnee, Oklahoma. It does not represent an AeroSearch hardware configuration,
measured detection performance, or synchronized live acquisition.

## Data sources

- Baur et al., Demining Research Community Seeded Field Multimodal Landmine
  Detection Dataset: https://doi.org/10.5281/zenodo.19100554
  RGB and rendered thermal orthomosaics; EM61-Lite measurement workbook.
- SPH Engineering magnetic surveys, raw logs and processed R1 grid:
  https://www.sphengineering.com/news/uxo-detection-total-field-vs-fluxgate-magnetometer
- DRC item positions and GPR interpretation flags:
  https://de-mine.com/webmap/data/2.csv
  https://de-mine.com/webmap/data/AIU.csv
- Field design and published ground-control coordinates:
  https://www.jmu.edu/news/cisr/2023/10/273/01-273-baur.shtml

The viewer includes local display derivatives: browser tiles, normalized contrast,
coverage-limited interpolated magnetic responses, and image-based adaptive blend
weights. The provider grids and local display interpolation are labeled separately.
Adaptive weights are visual heuristics, not temperatures or detection confidence.
Playback uses existing mosaics with an illustrative route and simulated delay.
Original provider attribution and applicable source terms continue to apply.

The website route uses the existing browser-side demo gate. Static assets remain
directly accessible, consistent with the site's static hosting architecture.
