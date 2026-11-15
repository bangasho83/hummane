'use client'

import { usePathname } from "next/navigation";
import { AppProvider } from "@/lib/context/AppContext";
import { Toaster } from "@/components/ui/toast";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";

/**
 * Client-side providers wrapper
 * This component wraps all client-side providers and error boundaries
 * Includes ErrorBoundary, AppProvider, and Toaster
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The public help center needs no session state. Skipping AppProvider lets it render
  // on the server (AppProvider renders nothing until the browser has mounted).
  if (pathname === "/help" || pathname.startsWith("/help/")) {
    return <ErrorBoundary>{children}</ErrorBoundary>;
  }

  return (
    <ErrorBoundary>
      <AppProvider>
        {children}
        <Toaster />
      </AppProvider>
    </ErrorBoundary>
  );
}

