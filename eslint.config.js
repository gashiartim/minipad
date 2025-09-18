/** @type {import('eslint').Linter.Config} */
const config = {
  extends: ["next/core-web-vitals", "next/typescript"],
  rules: {
    "prefer-const": "error",
    "no-var": "error",
  },
}

module.exports = config
