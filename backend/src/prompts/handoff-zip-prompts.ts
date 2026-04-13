/** Artefactos para el ZIP de handoff (README, theme MUI, rutas, capa API). */

export const HANDOFF_BUNDLE_JSON_SCHEMA = `{
  "readme": "string (Markdown completo del README para el desarrollador)",
  "themeTs": "string (código TypeScript: createTheme de @mui/material con palette y typography coherentes con el diseño descrito)",
  "routesTsx": "string (código TSX: componente default export con React Router v6: Routes, Route, Navigate; importar cada pantalla desde ./screens/PantallaN)",
  "endpointsTs": "string (código TypeScript: exportar tipos/listas de endpoints y comentarios JSDoc; sin fetch real obligatorio)"
}`;

export const HANDOFF_BUNDLE_SYSTEM = `Sos un tech lead frontend. Generás artefactos para entregar a desarrollo en un monorepo React + TypeScript + MUI v5 + react-router-dom v6.

Reglas:
- Respondé en español en comentarios y en el README; nombres de variables y rutas pueden ser en inglés si es idiomático.
- El README debe incluir: requisitos (Node), cómo instalar dependencias (\`npm install\` @mui/material @emotion/react @emotion/styled react-router-dom react react-dom), cómo conectar las rutas (montar el componente de rutas en App), y una tabla o lista breve describiendo cada pantalla del flujo.
- theme.ts: usá createTheme de @mui/material; inferí palette.primary/secondary, grey, background, text y typography (fontFamily sistema) a partir de las muestras de HTML/TSX (colores hex visibles, pesos de fuente).
- routes.tsx: una ruta por pantalla en orden (/pantalla/1, /pantalla/2, … o paths claros); importá default desde './screens/Pantalla1', etc. Incluí un Route path="/" que redirija a la primera pantalla.
- endpoints.ts: si hay lista de API, documentala como constantes tipadas y funciones stub comentadas; si no, inferí endpoints plausibles del flujo (GET /… por paso) claramente marcados como "inferido".
- Salida: ÚNICAMENTE un objeto JSON válido (sin markdown fences) con exactamente las claves:

${HANDOFF_BUNDLE_JSON_SCHEMA}`;
