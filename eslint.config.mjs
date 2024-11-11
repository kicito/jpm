import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["**/dist", "**/node_modules"],
}, ...compat.extends("plugin:@typescript-eslint/recommended", "prettier").map(config => ({
    ...config,
    files: ["**/*.ts"],
})), {
    files: ["**/*.ts"],

    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
        },

        parser: tsParser,
        ecmaVersion: "latest",
        sourceType: "script",
    },

    rules: {
        "space-before-function-paren": "off",
        "dot-notation": "off",
        quotes: ["error", "single"],
        semi: ["error"],
        "@typescript-eslint/no-unused-vars": [
            "error",
            {
              "args": "all",
              "argsIgnorePattern": "^_",
              "caughtErrors": "all",
              "caughtErrorsIgnorePattern": "^_",
              "destructuredArrayIgnorePattern": "^_",
              "varsIgnorePattern": "^_",
              "ignoreRestSiblings": true
            }
        ]
    },
}];