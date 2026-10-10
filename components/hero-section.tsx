import Image from "next/image";
import Link from "next/link";

export function HeroSection() {
  return (
    <section aria-labelledby="hero-heading" className="hero">
      <div className="hero__media">
        <Image
          alt="Editorial view of a luxury vehicle in a studio setting"
          fill
          preload
          sizes="100vw"
          src="/images/editorial-automotive.jpg"
        />
      </div>
      <div className="hero__content">
        <p className="eyebrow eyebrow--light">Legend Motors · Lilongwe</p>
        <h1 id="hero-heading">A better way to find your next car.</h1>
        <p className="hero__copy">
          Explore available vehicles, compare the details, and speak directly with our team when you are ready.
        </p>
        <div className="hero__actions">
          <Link className="button button--orange" href="/vehicles">
            Browse available vehicles <span aria-hidden="true">&#8594;</span>
          </Link>
          <a className="button button--outline-light" href="#contact">
            Speak with our team
          </a>
        </div>
        <p className="hero__note">Availability and pricing are confirmed directly with Legend Motors.</p>
      </div>
      <span className="hero__caption">Editorial photography · Not dealership inventory</span>
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
