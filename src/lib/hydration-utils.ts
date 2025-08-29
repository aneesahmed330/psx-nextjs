// Utility functions to handle hydration mismatches

export function removeBrowserExtensionAttributes() {
  if (typeof window !== "undefined") {
    // Remove Grammarly and other browser extension attributes that cause hydration mismatches
    const body = document.body;
    if (body) {
      // Remove common browser extension attributes
      const attributesToRemove = [
        "data-new-gr-c-s-check-loaded",
        "data-gr-ext-installed",
        "data-gramm",
        "data-gramm_id",
        "data-gramm_editor",
        "data-enable-grammarly",
      ];

      attributesToRemove.forEach((attr) => {
        if (body.hasAttribute(attr)) {
          body.removeAttribute(attr);
        }
      });
    }
  }
}

export function isHydrationMismatch(error: any): boolean {
  return (
    error?.message?.includes("hydration") ||
    error?.message?.includes("server rendered HTML") ||
    error?.message?.includes("client properties")
  );
}

export function createHydrationSafeValue<T>(serverValue: T, clientValue: T): T {
  // Use server value during SSR, client value after hydration
  if (typeof window === "undefined") {
    return serverValue;
  }
  return clientValue;
}
