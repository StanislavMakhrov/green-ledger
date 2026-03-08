import nextConfig from "eslint-config-next";
import prettierConfig from "eslint-config-prettier";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  ...nextConfig,
  prettierConfig,
  {
    rules: {
      // Project uses App Router, not Pages Router
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  {
    ignores: [
      ".next/",
      "node_modules/",
      "coverage/",
      "prisma/*.db",
    ],
  },
];

export default config;

