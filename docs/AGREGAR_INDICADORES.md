# Agregar un nuevo indicador

Toda la lógica es config-driven. Para un indicador nuevo:

1. **Define la derivación** en `encodat_analysis/src/indicators.py`, en el diccionario `INDICATORS`:
   ```python
   "tab_ult_mes": dict(
     indicator_id="tab_ult_mes",
     label="Uso de tabaco fumado en el último mes",
     short_label="Tabaco último mes",
     category="Tabaco",
     definition="...",              # del glosario del PDF, sin inventar
     period="Último mes",
     unit="% de la población",
     population="12 a 65 años (y subgrupos)",
     source_variable="tb...",       # variable(s) del catálogo (verificar en el catálogo, no por el nombre)
     notes="...",
     derive=lambda d: (y_float_0_1, valid_bool_mask),
   ),
   ```
   Usa **el catálogo** para mapear la variable; nunca supongas el significado por el nombre.
2. Si tiene cifras oficiales, agrégalas a `PDF_TARGETS` para validación automática.
3. Regenera datos (ver `ACTUALIZAR_DATOS.md`). `build_estimates.py` produce automáticamente todas
   las celdas (nacional + 9 regiones × sexo × edad) para cada indicador en el registro.
4. La app ya itera sobre `indicators.json`. Para indicadores continuos (p. ej. *edad de inicio*,
   una media en años, no una prevalencia) habrá que añadir una variante de estimador de media y
   un formato de unidad; queda anotado como extensión.
