import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // TypeScript rules
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/prefer-as-const": "off",
    "@typescript-eslint/no-unused-disable-directive": "off",
    
    // React rules
    "react-hooks/exhaustive-deps": "off",
    "react-hooks/purity": "off",
    /**
     * Buscar dados no `useEffect` de montagem, com o `setLoading(true)` antes do
     * primeiro `await`. A regra veio junto com o conjunto novo do React
     * Compiler e acusa 12 pontos em 9 arquivos — incluindo `ui/carousel.tsx` e
     * `hooks/use-mobile.ts`, que são código de terceiros (shadcn) e não devem
     * ser reescritos aqui.
     *
     * Desligada, e não silenciada caso a caso, porque a queixa é legítima e a
     * correção de verdade é uma só para todos eles: mover a carga de dados para
     * o React Query, que já é dependência do projeto (`@tanstack/react-query`)
     * e não é usado em nenhuma destas telas. Enquanto isso não acontece, um
     * `eslint-disable` por arquivo só espalharia a dívida sem registrá-la.
     *
     * A regra irmã `react-hooks/immutability` continua LIGADA de propósito: foi
     * ela que encontrou um `useState({})[0]` usado como ref mutável em
     * `analysis-view.tsx` — defeito real, já corrigido.
     */
    "react-hooks/set-state-in-effect": "off",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    "react-compiler/react-compiler": "off",
    
    // Next.js rules
    "@next/next/no-img-element": "off",
    "@next/next/no-html-link-for-pages": "off",
    
    // General JavaScript rules
    "prefer-const": "off",
    "no-unused-vars": "off",
    "no-console": "off",
    "no-debugger": "off",
    "no-empty": "off",
    "no-irregular-whitespace": "off",
    "no-case-declarations": "off",
    "no-fallthrough": "off",
    "no-mixed-spaces-and-tabs": "off",
    "no-redeclare": "off",
    "no-undef": "off",
    "no-unreachable": "off",
    "no-useless-escape": "off",
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "examples/**", "skills"]
}];

export default eslintConfig;
