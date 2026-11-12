import { useId } from "react";

/**
 * The CivicKettle mark: a stovetop kettle with a check cut out of it.
 * One colour (it follows the text colour), and the check is a real hole, so
 * it sits on any background.
 */
export default function KettleMark({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg aria-hidden="true" className={className} viewBox="6.75 3.2 60 60" fill="currentColor" stroke="none">
      <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="70" height="70">
        <rect x="0" y="0" width="70" height="70" fill="#fff" stroke="none" />
        <path d="M22.5 40.5l6.7 6.5L42 33.5" fill="none" stroke="#000" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
      </mask>
      <g mask={`url(#${id})`}>
        <path stroke="none" d="M11 50C11 36 19.5 26 32 26s21 10 21 24v2.5a1.5 1.5 0 0 1-1.5 1.5h-39A1.5 1.5 0 0 1 11 52.5Z" />
        <path stroke="none" d="M49 39l9.2-9.6a2 2 0 0 1 3.3.7l.9 2.3a2 2 0 0 1-.5 2.2L51 46Z" />
        <path d="M17.5 31C17.5 9 46.5 9 46.5 31" fill="none" stroke="currentColor" strokeWidth="4.2" strokeLinecap="round" />
        <circle stroke="none" cx="32" cy="23" r="3.2" />
      </g>
    </svg>
  );
}
