module.exports = {
    env: {
        browser: true,
        es2021: true
    },
    extends: [
        'airbnb-base',
        'airbnb-typescript/base',
    ],
    overrides: [
        {
            env: {
                node: true
            },
            files: [
                ".eslintrc.{js,cjs}"
            ],
            parserOptions: {
                "sourceType": "script"
            }
        }
    ],
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json"
    },
    rules: {
        "import/no-extraneous-dependencies": ["error", {"devDependencies": true}],
        "no-console": "off",
        "no-await-in-loop": "off"
    }
}
