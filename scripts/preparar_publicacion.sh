#!/usr/bin/env bash
# Prepara el export estático para publicarlo en un hosting que reserva los nombres
# que empiezan con "_" y que rechaza bytes no válidos como texto.
#
# Uso:  bash scripts/preparar_publicacion.sh <directorio-out>
#
# Hace dos cosas, ambas reversibles y sin tocar el código fuente:
#   1. Renombra  _next/  ->  assets/  y reescribe todas las referencias /_next/ -> /assets/
#      en HTML, JS, CSS y los payloads .txt. Se conservan los identificadores internos
#      de Next (__next_f, __nextScript, …), que no son rutas.
#   2. Escapa los tres caracteres U+FFFD literales del polyfill como �. Son parte
#      de un decodificador de URL y viven dentro de literales de cadena, así que el
#      escape es equivalente. Se verifica la sintaxis con `node --check`.
set -euo pipefail
OUT="${1:?Falta el directorio out}"
cd "$OUT"

if [ -d _next ]; then
  mv _next assets
  grep -rl '/_next/' . | while read -r f; do
    python3 - "$f" <<'PY'
import sys
p = sys.argv[1]
b = open(p, 'rb').read()
open(p, 'wb').write(b.replace(b'/_next/', b'/assets/'))
PY
  done
  echo "  _next -> assets: hecho"
fi

python3 - <<'PY'
import os
n = 0
for root, _, files in os.walk('.'):
    for name in files:
        if not name.endswith('.js'):
            continue
        p = os.path.join(root, name)
        b = open(p, 'rb').read()
        c = b.count(b'\xef\xbf\xbd')
        if c:
            open(p, 'wb').write(b.replace(b'\xef\xbf\xbd', b'\\uFFFD'))
            print(f"  U+FFFD escapado ({c}) en {p}")
            n += c
print(f"  U+FFFD escapados en total: {n}")
PY

for f in $(find . -name '*.js'); do node --check "$f" || { echo "SINTAXIS ROTA: $f"; exit 1; }; done
echo "  sintaxis JS verificada"
echo "Listo. Archivos: $(find . -type f | wc -l | tr -d ' '), tamaño: $(du -sh . | cut -f1)"
