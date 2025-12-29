# Contributing to Hummane

Thank you for your interest in contributing to Hummane! This document provides guidelines and best practices for contributing to the project.

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/hummane.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature-name`
5. Make your changes
6. Test locally: `npm run dev`
7. Build to verify: `npm run build`
8. Commit your changes: `git commit -m "feat: add your feature"`
9. Push to your fork: `git push origin feature/your-feature-name`
10. Create a Pull Request

## Code Style

### TypeScript

- Use TypeScript for all new files
- Enable strict mode
- Define proper types and interfaces
- Avoid `any` type unless absolutely necessary

### Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop types

Example:
```typescript
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn-${variant}`}>
      {label}
    </button>
  )
}
```

### File Naming

- Components: PascalCase (e.g., `EmployeeCard.tsx`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth.ts`)
- Types: PascalCase with `.types.ts` suffix (e.g., `employee.types.ts`)

### Directory Structure

- Place components in appropriate directories
- Keep related files together
- Use index files for cleaner imports

## Commit Messages

Follow the Conventional Commits specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: add employee search functionality
fix: resolve login redirect issue
docs: update README with new features
```

## Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Update the README.md if you've added features
4. Request review from maintainers
5. Address review feedback
6. Squash commits if requested

## Code Review Guidelines

- Be respectful and constructive
- Focus on the code, not the person
- Explain your reasoning
- Suggest improvements
- Approve when satisfied

## Testing

- Write tests for new features
- Ensure existing tests pass
- Test edge cases
- Test on different screen sizes

## Questions?

Feel free to open an issue for:
- Bug reports
- Feature requests
- Questions about the codebase
- Suggestions for improvements

Thank you for contributing! 🎉

