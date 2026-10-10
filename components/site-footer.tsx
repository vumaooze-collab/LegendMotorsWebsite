import Link from "next/link";
import { BUSINESS } from "@/data/business";

function FooterBrand() {
  return <Link className="brand-lockup footer-brand" href="/" aria-label="Legend Motors home">
    <span className="brand-mark" aria-hidden="true">LM</span>
    <span className="brand-name">Legend Motors<small>Malawi · Lilongwe</small></span>
  </Link>;
}

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="section-shell">
      <div className="footer-main">
        <div><FooterBrand /><p className="footer-about">Thoughtful vehicle discovery and direct conversations with our Lilongwe team.</p></div>
        <nav aria-label="Footer navigation"><h2 className="footer-heading">Explore</h2><div className="footer-links">
          <Link href="/vehicles">Vehicles</Link><Link href="/#about">Our approach</Link><Link href="/#contact">Contact</Link>
        </div></nav>
        <div><h2 className="footer-heading">Visit or contact</h2><div className="footer-links">
          <a href={`tel:+${BUSINESS.phoneInternational}`}>{BUSINESS.phoneDisplay}</a><a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a><span>{BUSINESS.address}</span>
        </div></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Legend Motors Malawi</span><span>Vehicle availability, pricing and specifications should be confirmed with Legend Motors.</span></div>
    </div>
  </footer>;
}
