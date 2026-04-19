import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // This codebase intentionally uses `any` in many places (template/demo + Mongoose/NextAuth shapes).
      // Keeping this rule enabled makes `npm run lint` unusable.
      "@typescript-eslint/no-explicit-any": "off",
      // Template content includes literal quotes in JSX and a lot of quick-start code.
      "react/no-unescaped-entities": "off",
      "prefer-const": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
];

export default eslintConfig;
