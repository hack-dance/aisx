import { fixupPluginRules } from "@eslint/compat"
import eslint from "@eslint/js"
import nextPlugin from "@next/eslint-plugin-next"
import prettierConfig from "eslint-config-prettier"
import reactPlugin from "eslint-plugin-react"
import reactHooksPlugin from "eslint-plugin-react-hooks"
import tailwind from "eslint-plugin-tailwindcss"
import globals from "globals"
import tseslint from "typescript-eslint"

const coreConfig = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.strictTypeChecked,
  {
    plugins: {
      "@typescript-eslint": tseslint.plugin
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd()
      }
    },
    rules: {
      "linebreak-style": "off",
      "semi": "off",
      "indent": "off",
      "require-await": "off",

      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-invalid-void-type": "off",
      "@typescript-eslint/no-dynamic-delete": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: false
        }
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "eqeqeq": ["error", "always"],
      "no-unused-expressions": "off",
      "no-unused-vars": "off",
      ...prettierConfig.rules,
      "arrow-body-style": "off",
      "prefer-arrow-callback": "off",
      "prefer-const": "off"
    },
    files: ["**/*.js?(x)", "**/*.mjs?(x)", "**/*.ts?(x)"],
    ignores: [
      ".vercel",
      ".turbo",
      "node_modules",
      "dist",
      "**/.turbo",
      "**/.vercel",
      "**/.next",
      "**/node_modules/",
      "**/dist/",
      "lottie.*.ts",
      "@lottie.loader-smile.ts",
      ".next",
      "node_modules",
      ".vercel",
      ".turbo",
      "dist/"
    ]
  },
  {
    files: ["**/*.js?(x)", "**/*.mjs?(x)", "**/*.ts?(x)"],
    ignores: [
      ".vercel",
      ".turbo",
      "node_modules",
      "dist",
      "**/.turbo",
      "**/.vercel",
      "**/.next",
      "**/node_modules/",
      "**/dist/",
      "lottie.*.ts",
      "@lottie.loader-smile.ts",
      ".next",
      "node_modules",
      ".vercel",
      ".turbo",
      "dist/",
      "postcss.config.ts"
    ],
    ...tseslint.configs.disableTypeChecked
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    ...tseslint.configs.disableTypeChecked
  }
)

export default tseslint.config(
  {
    name: "Country: react our rules",
    plugins: {
      "@next/next": nextPlugin,
      "react": reactPlugin,
      "react-hooks": fixupPluginRules(reactHooksPlugin)
    },

    rules: {
      // React specific rules
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/display-name": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/jsx-filename-extension": "off",
      "react/no-unknown-property": "off",
      "react/jsx-no-target-blank": "off",
      "react/jsx-boolean-value": "error",
      "react/jsx-max-props-per-line": "off",
      "react/jsx-sort-props": [
        "error",
        {
          callbacksLast: true,
          shorthandFirst: true,
          reservedFirst: true,
          multiline: "last"
        }
      ],

      // Next.js specific rules
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-img-element": "error",
      "@next/next/no-unwanted-polyfillio": "warn",
      "@next/next/inline-script-id": "error"
    },
    files: ["**/*.js?(x)", "**/*.mjs?(x)", "**/*.ts?(x)"],
    ignores: [
      ".vercel",
      ".turbo",
      "node_modules",
      "dist",
      "**/.turbo",
      "**/.vercel",
      "**/.next",
      "**/node_modules/",
      "**/dist/",
      "lottie.*.ts",
      "@lottie.loader-smile.ts",
      ".next",
      "node_modules",
      ".vercel",
      ".turbo",
      "dist/",
      "postcss.config.ts"
    ]
  },
  ...tailwind.configs["flat/recommended"],
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        React: true,
        JSX: true
      },
      parserOptions: { ecmaFeatures: { jsx: true } }
    },

    settings: {
      tailwindcss: {
        callees: ["cn"],
        config: "tailwind.config.js"
      },
      react: {
        version: "detect"
      }
    },
    rules: {
      "tailwindcss/no-custom-classname": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": 0,
      "react/no-unknown-property": "off",
      "@next/next/no-duplicate-head": "off"
    }
  },
  ...coreConfig
)
