/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Evita erro quando Turbopack detecta configuração Webpack customizada.
  // Mantemos turbopack vazio para permitir fallback automático ou uso explícito de webpack.
  turbopack: {},
};

module.exports = nextConfig;

