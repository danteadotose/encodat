# Despliegue

La app se publica en Sites como sitio estático, con interactividad en el navegador.
La identidad del sitio y la carpeta de salida están en `.openai/hosting.json`.

## Generar la versión pública

`npm run build` exporta todas las páginas y recursos a `out/`. La configuración
`output: "export"` y `trailingSlash: true` permite abrir directamente cada ruta.
El paquete de publicación debe contener esta salida compilada y el manifiesto de Sites.
La publicación utiliza una revisión del código guardada en el repositorio de Sites.

## Desarrollo local

Usa `npm run dev`. Con la exportación estática, `next start` no sirve la versión
compilada: para una vista previa de producción, sirve la carpeta `out/` con un servidor estático.

## Datos incluidos

No hay backend ni base de datos: los resultados agregados de `data/*.json` se
empaquetan con la app. Los archivos de análisis, microdatos y revisiones del directorio
padre no forman parte del sitio. Los filtros compartidos se conservan en la URL.
