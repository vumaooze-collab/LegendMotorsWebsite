import Image from "next/image";

export function HeroSection() {
  return (
    <section aria-labelledby="hero-heading" className="hero">
      <div className="hero__media">
        <Image
          alt="A modern sports car on a scenic road"
          fill
          unoptimized
          priority
          sizes="100vw"
          src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2200&q=90"
        />
      </div>
      <div className="hero__shade" />
      <div className="hero__content">
        <p className="eyebrow eyebrow--light">Welcome to Legend Motors</p>
        <h1 id="hero-heading">Find your next car.</h1>
        <p className="hero__copy">
          Explore the cars, compare the details, and find the one that fits your life.
        </p>
        <div className="hero__actions">
          <a className="button button--orange" href="#vehicles">
            Browse vehicles <span aria-hidden="true">&#8594;</span>
          </a>
          <a className="button button--outline-light" href="#contact">
            Talk to us
          </a>
        </div>
        <p className="hero__note">Demo vehicles shown. Details and prices are illustrative.</p>
      </div>
      <span className="hero__caption">Vehicle photography for demonstration purposes</span>
    </section>
  );
}

const shoppingLinks = [
  { label: "Browse cars", detail: "Explore the collection", href: "#inventory" },
  { label: "Featured cars", detail: "A few to get you started", href: "#featured-vehicles" },
  { label: "Financing", detail: "Start an enquiry", href: "#contact" },
  { label: "Contact us", detail: "We’re here to help", href: "#contact" },
];

export function QuickShoppingBar() {
  return (
    <nav aria-label="Quick shopping links" className="shopping-bar">
      <div className="shopping-bar__inner">
        {shoppingLinks.map((item, index) => (
          <a className="shopping-link" href={item.href} key={item.label}>
            <span aria-hidden="true" className="shopping-link__index">
              0{index + 1}
            </span>
            <span className="shopping-link__copy">
              <strong>{item.label}</strong>
              <small>{item.detail}</small>
            </span>
            <span aria-hidden="true" className="shopping-link__arrow">
              &#8599;
            </span>
          </a>
        ))}
      </div>
    </nav>
  );
}