'use client'

import { AppProvider } from "@/lib/context/AppContext";
import { Toaster } from "@/components/ui/toast";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";

/**
 * Client-side providers wrapper
 * This component wraps all client-side providers and error boundaries
 * Includes ErrorBoundary, AppProvider, and Toaster
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AppProvider>
        {children}
        <Toaster />
      </AppProvider>
    </ErrorBoundary>
  );
}

