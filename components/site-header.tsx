"use client";

import Link from "next/link";
import { useState } from "react";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Vehicles", href: "/vehicles" },
  { label: "Our approach", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];

function Brand() {
  return (
    <Link className="brand-lockup" href="/" aria-label="Legend Motors home">
      <span className="brand-mark" aria-hidden="true">LM</span>
      <span className="brand-name">Legend Motors<small>Malawi · Lilongwe</small></span>
    </Link>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  function closeMenu() { setMenuOpen(false); }

  return (
    <header className="site-header" id="top">
      <div className="header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>
        <div className="header-actions">
          <Link className="button button--orange header-contact" href="/vehicles">Browse vehicles <span aria-hidden="true">&#8594;</span></Link>
        </div>
        <div className="mobile-menu">
          <button aria-controls="mobile-navigation" aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} className="mobile-menu-toggle" onClick={() => setMenuOpen((open) => !open)} type="button">
            <span /><span /><span />
          </button>
          {menuOpen && <nav className="mobile-nav" id="mobile-navigation" aria-label="Mobile navigation">
            {navigation.map((item) => <Link href={item.href} key={item.href} onClick={closeMenu}>{item.label}</Link>)}
            <Link href="/login" onClick={closeMenu}>Team sign in</Link>
          </nav>}
        </div>
      </div>
    </header>
  );
}
