"use client";

import { useEffect } from "react";

/**
 * Keeps what the person typed when the server sends them back with an error.
 * Saves field values to sessionStorage on submit; restores them when `restore` is true.
 */
export default function FormMemory({ formId, storageKey, restore }: { formId: string; storageKey: string; restore: boolean }) {
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const fields = () =>
      Array.from(form.elements).filter(
        (el): el is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement =>
          (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) &&
          Boolean(el.name) && el.type !== "hidden",
      );
    try {
      if (restore) {
        const raw = sessionStorage.getItem(storageKey);
        if (raw) {
          const saved = JSON.parse(raw) as Record<string, string>;
          for (const el of fields()) if (saved[el.name] !== undefined) el.value = saved[el.name];
        }
      } else {
        sessionStorage.removeItem(storageKey);
      }
    } catch {
      /* storage unavailable: nothing to restore */
    }
    const onSubmit = () => {
      try {
        const data: Record<string, string> = {};
        for (const el of fields()) data[el.name] = el.value;
        sessionStorage.setItem(storageKey, JSON.stringify(data));
      } catch {
        /* ignore */
      }
    };
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [formId, storageKey, restore]);
  return null;
}
