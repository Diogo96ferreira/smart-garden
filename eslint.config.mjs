// eslint.config.mjs
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  { ignores: ["**/.next/**", "**/node_modules/**", "dist/**", "coverage/**", "next-env.d.ts"] },
  js.configs.recommended,
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "prefer-const": "error",
    },
  },
];

export default config;
