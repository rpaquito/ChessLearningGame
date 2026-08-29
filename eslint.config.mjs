import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored third-party file (see Fix 6 / README) — not our code to lint.
    "public/stockfish/**",
    // Native iOS shell (Capacitor, see CLAUDE.md "App nativa iOS") — the
    // whole ios/ tree is a generated/vendored Xcode project, not app
    // source. In particular ios/App/App/public/ is `npm run build:capacitor`
    // + `cap sync`'s copy of out/ (itself already ignored above) into the
    // native project; without this, running lint after a cap sync trips
    // hundreds of warnings/errors on Next's own minified chunk output.
    "ios/**",
  ]),
]);

export default eslintConfig;
