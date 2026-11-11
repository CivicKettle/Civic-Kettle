"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-fetches the current page's data on an interval, so a live roster stays live. */
export default function AutoRefresh({ seconds = 20 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
