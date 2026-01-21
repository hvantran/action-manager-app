# Linting and Code Formatting Setup

This project uses comprehensive linting and code formatting tools to maintain consistent code quality and style.

## Tools

- **ESLint**: JavaScript/TypeScript linter
- **Prettier**: Code formatter
- **Husky**: Git hooks manager
- **lint-staged**: Run linters on staged files

## Available Scripts

```bash
# Lint all source files
npm run lint

# Lint and auto-fix all source files
npm run lint:fix

# Format all source files
npm run format

# Check formatting without modifying files
npm run format:check

# Run both lint and format check
npm run lint:all
```

## Configuration Files

- `.eslintrc.json` - ESLint configuration
- `.eslintignore` - Files to ignore for ESLint
- `.prettierrc` - Prettier configuration
- `.prettierignore` - Files to ignore for Prettier
- `.editorconfig` - Editor configuration for consistency
- `.husky/pre-commit` - Git pre-commit hook
- `.vscode/settings.json` - VS Code editor settings
- `.vscode/extensions.json` - Recommended VS Code extensions

## ESLint Rules

The project uses the following ESLint configurations:

- `@typescript-eslint/recommended` - TypeScript best practices
- `plugin:react/recommended` - React best practices
- `plugin:react-hooks/recommended` - React Hooks rules
- `plugin:jsx-a11y/recommended` - Accessibility rules
- `prettier` - Prettier integration (disables conflicting rules)

### Key Rules

- TypeScript: Warns on explicit `any`, requires consistent variable naming
- React: Enforces hooks rules, no prop-types needed (using TypeScript)
- Import: Enforces alphabetical import order with newlines between groups
- Accessibility: Enforces WCAG 2.1 AA standards
- Code Quality: Warns on console statements, debugger statements

## Prettier Configuration

- Print width: 100 characters
- Tab width: 2 spaces
- Use semicolons: Yes
- Use single quotes: Yes
- Trailing commas: ES5 style
- End of line: LF (Unix-style)

## Pre-commit Hooks

Git pre-commit hooks automatically run on staged files before each commit:

1. ESLint with auto-fix on `.ts`, `.tsx`, `.js`, `.jsx` files
2. Prettier formatting on all staged files

To bypass hooks (not recommended):
```bash
git commit --no-verify
```

## VS Code Integration

### Recommended Extensions

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- EditorConfig (`editorconfig.editorconfig`)

### Auto-formatting

The workspace settings enable:
- Format on save
- ESLint auto-fix on save
- Prettier as default formatter

## CI/CD Integration

To add linting to your CI/CD pipeline:

```yaml
# Example for GitHub Actions
- name: Lint code
  run: npm run lint

- name: Check formatting
  run: npm run format:check
```

## Migration Notes

When applying to existing code:

1. Run `npm run lint:fix` to auto-fix most issues
2. Run `npm run format` to format all files
3. Manually review and fix remaining errors
4. Commit all changes
5. Pre-commit hooks will prevent future violations

## Node.js Version

This setup requires Node.js >= 18.0.0. The project is configured to use Node.js 20.18.1.

### Automatic Version Switching

The project includes:
- `.nvmrc` - Specifies Node.js 20.18.1
- `.envrc` - Direnv configuration for automatic version switching

When you enter the directory:
- **With direnv**: Node version switches automatically
- **Without direnv**: Run `nvm use` to switch to the correct version

```bash
# Manual switch with nvm
nvm use

# Or specify version directly
nvm use 20.18.1
```

## Troubleshooting

### ESLint errors on build

Ensure all linting errors are fixed before building:
```bash
npm run lint:fix
```

### Prettier conflicts with ESLint

The configuration includes `eslint-config-prettier` to disable conflicting rules.

### Pre-commit hooks not running

Ensure Husky is installed:
```bash
npm run prepare
```

### Different formatting in different editors

Install the EditorConfig extension in your editor to respect `.editorconfig` settings.

## Resources

- [ESLint Documentation](https://eslint.org/)
- [Prettier Documentation](https://prettier.io/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react)
- [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)
