# Custom Hooks

This directory contains custom React hooks for reusable logic.

## Usage

Create custom hooks here to encapsulate reusable stateful logic.

Example:
```typescript
// hooks/useLocalStorage.ts
import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}
```

## Naming Convention

- Prefix all hooks with `use` (e.g., `useAuth`, `useDebounce`)
- Use descriptive names that indicate the hook's purpose

