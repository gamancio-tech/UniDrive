// Configuração do ESLint (flat config).
// Fase 0 da refatoração (docs/planos_implementacao/plano-refatoracao-frontend.md):
// o objetivo é só ter uma rede de segurança. As regras de tamanho de arquivo
// (max-lines) e de imports restritos entram na Fase 9.
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "dev-dist", "node_modules"] },
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, ...globals.serviceworker },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      // Evita closures velhas e polling duplicado ao extrair hooks.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Segurança: o projeto proíbe injeção de HTML no frontend (AGENTS.md).
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: "dangerouslySetInnerHTML é proibido (docs/seguranca).",
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  }
);
