"use client";

import { useEffect, useState } from "react";
import { removeBrowserExtensionAttributes } from "@/lib/hydration-utils";

export function HydrationFix({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Remove browser extension attributes that cause hydration mismatches
    removeBrowserExtensionAttributes();

    // Set hydrated state
    setIsHydrated(true);
  }, []);

  // Prevent hydration mismatch by only rendering after client-side hydration
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
