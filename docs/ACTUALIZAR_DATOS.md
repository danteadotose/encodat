# Actualizar los datos

Las cifras del explorador se generan en la capa `encodat_analysis` y se copian a `data/`.

1. Coloca/actualiza el microdato `ENCODAT_2025_ADOLESCENTES_ADULTOS.csv` y el catálogo junto a `encodat_analysis/`.
2. Regenera y valida:
   ```bash
   cd encodat_analysis
   python3 src/build_estimates.py     # -> output/estimates.json, indicators.json, regions.json
   python3 src/validate.py            # -> data_validation_report.md  (debe decir APROBADO, 0 críticos)
   ```
3. Copia los JSON al explorador:
   ```bash
   cp encodat_analysis/output/*.json encodat_explorer/data/
   ```
4. Reconstruye la app: `npm run build`. No se edita ningún componente para actualizar datos.

**Regla de oro:** nunca edites `data/*.json` a mano para “cuadrar” la interfaz. Si hay una
inconsistencia, corrígela en la capa de análisis y vuelve a validar.
