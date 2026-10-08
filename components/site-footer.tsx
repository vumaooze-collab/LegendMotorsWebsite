function FooterBrand() {
  return (
    <a className="brand-lockup" href="#top" aria-label="Legend Motors home">
      <span className="brand-mark" aria-hidden="true">
        LM
      </span>
      <span className="brand-name">
        Legend Motors
        <small>Driven by choice</small>
      </span>
    </a>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="section-shell">
        <div className="footer-main">
          <div>
            <FooterBrand />
            <p className="footer-about">
              A professional digital showroom for vehicle discovery, sales enquiries, sourcing, trade-ins and customer support.
            </p>
          </div>
          <nav aria-label="Footer navigation">
            <h2 className="footer-heading">Explore</h2>
            <div className="footer-links">
              <a href="#vehicles">Vehicles</a>
              <a href="#services">Services</a>
              <a href="#about">About</a>
              <a href="#business">Sales</a>\n              <a href="#contact">Contact</a>
            </div>
          </nav>
          <div>
            <h2 className="footer-heading">Contact</h2>
            <div className="footer-links">
              <span>Phone details to be added</span>
              <span>Email address to be added</span>
              <span>Showroom location to be confirmed</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>Copyright Legend Motors.</span>
          <span>Vehicle availability, pricing and specifications must be confirmed with Legend Motors.</span>
        </div>
      </div>
    </footer>
  );
}