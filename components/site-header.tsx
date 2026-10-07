"use client";

import { useState } from "react";

const navigation = [
  { label: "Vehicles", href: "#vehicles" },
  { label: "Services", href: "#services" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

function Brand() {
  return (
    <a className="brand-lockup" href="#top" aria-label="Legend Motors home">
      <span className="brand-mark" aria-hidden="true">
        LM
      </span>
      <span className="brand-name">
        Legend Motors
        <small>Cars. Choices. Confidence.</small>
      </span>
    </a>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header" id="top">
      <div className="header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <a className="button button--orange header-contact" href="#vehicles">
          View vehicles <span aria-hidden="true">&#8594;</span>
        </a>
        <div className="mobile-menu">
          <button
            aria-controls="mobile-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="mobile-menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
          {menuOpen && (
            <nav className="mobile-nav" id="mobile-navigation" aria-label="Mobile navigation">
              {navigation.map((item) => (
                <a href={item.href} key={item.href} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </a>
              ))}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}