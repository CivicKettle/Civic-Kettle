import KettleMark from "@/components/KettleMark";

export default function SiteFooter() {
  return (
<footer className="ck-footer ck-page">
    <a className="ck-wordmark" href="/#top" aria-label="CivicKettle home">
      <KettleMark className="ck-mark" />
      <span>CivicKettle</span>
    </a>
    <p>Less admin, more community impact.</p>
    <nav className="ck-footer-links" aria-label="Footer">
      <a href="/app">Coordinator sign in</a>
      <a href="/privacy">Privacy</a>
      <a href="/terms">Terms</a>
      <a href="mailto:civickettle@gmail.com">civickettle@gmail.com</a>
    </nav>
    <span className="ck-copyright">© 2026 CivicKettle</span>
  </footer>
  );
}
