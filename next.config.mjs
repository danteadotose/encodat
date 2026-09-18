/** @type {import('next').NextConfig} */
// BASE_PATH permite servir el sitio bajo un subdirectorio, como hace GitHub Pages
// en https://<usuario>.github.io/<repositorio>. Vacío = raíz del dominio.
const basePath = process.env.BASE_PATH ?? "";

const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
};
export default nextConfig;
