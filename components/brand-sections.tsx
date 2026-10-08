import Image from "next/image";

const services = [
  {
    icon: "↗",
    title: "Vehicle sales",
    description: "Browse available vehicles and contact the sales team for current availability.",
  },
  {
    icon: "⌕",
    title: "Vehicle sourcing",
    description: "Tell us your preferred vehicle, budget and requirements and let the sales team source a match.",
  },
  {
    icon: "£",
    title: "Finance assistance",
    description: "Start a finance conversation with the sales team. Terms and eligibility are confirmed directly.",
  },
  {
    icon: "⇄",
    title: "Trade-in enquiry",
    description: "Share your vehicle details and start a trade-in or valuation conversation.",
  },
  {
    icon: "?",
    title: "Customer support",
    description: "Get direct help with vehicles, sales, sourcing, finance or after-sales questions.",
  },
];

const principles = [
  {
    icon: "01",
    title: "Compare with clarity",
    description: "Key details sit together, so comparing your shortlist feels straightforward.",
  },
  {
    icon: "02",
    title: "Your choice, your pace",
    description: "Ask questions, explore options and take the time you need to decide.",
  },
  {
    icon: "03",
    title: "Details to verify",
    description: "Know what is illustrative here, and confirm real vehicle information before you buy.",
  },
];

export function ServicesSection() {
  return (
    <section aria-labelledby="services-heading" className="services-section" id="services">
      <div className="section-shell">
        <div className="services-header">
          <div>
            <p className="eyebrow">Ways we can help</p>
            <h2 className="section-heading" id="services-heading">
              Your next step, made simpler.
            </h2>
          </div>
          <a className="text-link" href="#contact">
            Start a conversation <span aria-hidden="true">&#8594;</span>
          </a>
        </div>
        <p className="services-disclaimer">
          Sales and support pathways connect visitors directly to the dealership.
        </p>
        <div className="services-grid">
          {services.map((service) => (
            <article className="service-item" key={service.title}>
              <span aria-hidden="true" className="service-item__icon">
                {service.icon}
              </span>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhyChooseSection() {
  return (
    <section aria-labelledby="why-heading" className="why-section">
      <div className="section-shell">
        <div className="why-heading">
          <p className="eyebrow eyebrow--light">The Legend Motors approach</p>
          <h2 className="section-heading" id="why-heading">
            Shopping for a car should feel clear.
          </h2>
          <p className="section-intro">Useful details, a little less guesswork, and the freedom to choose what works for you.</p>
        </div>
        <div className="why-grid">
          {principles.map((principle, index) => (
            <article className="why-item" key={principle.title}>
              <span aria-hidden="true" className="why-item__number">
                {principle.icon || `0${index + 1}`}
              </span>
              <div>
                <h3>{principle.title}</h3>
                <p>{principle.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutSection() {
  return (
    <section aria-labelledby="about-heading" className="about-section" id="about">
      <div className="section-shell about-layout">
        <div className="about-visual">
          <Image
            alt="Close view of a modern car interior and steering wheel"
            fill
            unoptimized
            sizes="(max-width: 720px) 100vw, 50vw"
            src="https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=1200&q=85"
          />
        </div>
        <div className="about-copy">
          <p className="eyebrow">A little about us</p>
          <h2 id="about-heading">A clearer way to find your next car.</h2>
          <p>
            Legend Motors brings vehicle discovery and enquiry together in one straightforward place. Browse the collection, compare the details, then get in touch when you are ready.
          </p>
          <p>
            Legend Motors Malawi helps customers discover vehicles and connect with the dealership for sales, sourcing and related automotive services.
          </p>
          <a className="text-link" href="#vehicles">
            Explore vehicles <span aria-hidden="true">&#8594;</span>
          </a>
        </div>
      </div>
    </section>
  );
}

export function EnquiryBanner() {
  return (
    <section aria-labelledby="enquiry-banner-heading" className="enquiry-banner">
      <div className="section-shell enquiry-banner__inner">
        <div>
          <p className="eyebrow">Found one you like?</p>
          <h2 id="enquiry-banner-heading">Let’s get you closer to the driver’s seat.</h2>
          <p>Ask about a vehicle, finance, sourcing or trade-in and connect directly with the sales team.</p>
        </div>
        <a className="button button--charcoal" href="#contact">
          Make an enquiry <span aria-hidden="true">&#8594;</span>
        </a>
      </div>
    </section>
  );
}