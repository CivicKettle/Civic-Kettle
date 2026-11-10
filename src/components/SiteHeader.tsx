export default function SiteHeader() {
  return (
<header className="ck-header">
    <a className="ck-wordmark" href="/#top" aria-label="CivicKettle home">
      <svg aria-hidden="true" className="ck-mark" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15.5h17v10.1a7.4 7.4 0 0 1-7.4 7.4h-2.2a7.4 7.4 0 0 1-7.4-7.4V15.5Z"/><path d="M29 18h2.1a4.3 4.3 0 0 1 0 8.6H29M12 19H9.5a3.3 3.3 0 0 0-3.3 3.3v1.2M16 11.5c0-2.1 1.5-2.7 1.5-4.8M23 11.5c0-2.1 1.5-2.7 1.5-4.8"/><path d="M20.5 22c1.8-3.3 5.4-2.8 6.1-2.6-.2 3.6-2.6 5.5-6.1 5.4"/></svg>
      <span>CivicKettle</span>
    </a>
    <nav className="ck-nav" aria-label="Main navigation">
      <a href="/#workflow">How it works</a>
      <a href="/#plans">Plans</a>
      <a href="/app">Sign in</a>
    </nav>
    <a className="ck-header-contact" href="/#contact">Get in touch</a>
  </header>
  );
}
