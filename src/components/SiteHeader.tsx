import KettleMark from "@/components/KettleMark";

export default function SiteHeader() {
  return (
<header className="ck-header">
    <a className="ck-wordmark" href="/#top" aria-label="CivicKettle home">
      <KettleMark className="ck-mark" />
      <span>CivicKettle</span>
    </a>
    <nav className="ck-nav" aria-label="Main navigation">
      <a href="/#workflow">How it works</a>
      <a href="/#about">About</a>
      <a href="/#plans">Price</a>
      <a href="/app">Sign in</a>
    </nav>
    <a className="ck-header-contact" href="/#contact">Get started</a>
  </header>
  );
}
