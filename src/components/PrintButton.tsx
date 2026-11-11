"use client";

export default function PrintButton({ label = "Print this sign" }: { label?: string }) {
  return (
    <button className="ck-button" type="button" onClick={() => window.print()}>
      {label}
    </button>
  );
}
