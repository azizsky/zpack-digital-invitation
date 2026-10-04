import { defineConfig, globalIgnores } from "eslint/config";
import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default defineConfig([
  globalIgnores([
    ".next/**",
    ".open-next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  {
    files: ["**/*.{js,jsx,ts,tsx}"],

    plugins: {
      "@next/next": nextPlugin,
      "@typescript-eslint": tseslint,
    },

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,

      "@typescript-eslint/no-unused-vars": "warn",
"@typescript-eslint/no-unused-expressions": "warn",
"@typescript-eslint/no-explicit-any": "off",
    },
  },
]);