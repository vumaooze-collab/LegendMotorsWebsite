import { BUSINESS, mailtoUrl, whatsappUrl } from "@/data/business";

const actions = [
  { title: "Buy a vehicle", description: "Tell the sales team what you want and receive a direct response.", message: "Hello Legend Motors, I would like help finding a vehicle." },
  { title: "Sell or trade in", description: "Start a valuation conversation for your current vehicle.", message: "Hello Legend Motors, I would like to enquire about selling or trading in my vehicle." },
  { title: "Source a vehicle", description: "Send your preferred make, model, budget and requirements.", message: "Hello Legend Motors, I would like you to help me source a vehicle." },
  { title: "Finance enquiry", description: "Ask the team about available financing options and requirements.", message: "Hello Legend Motors, I would like to discuss vehicle financing." },
];

export function BusinessActions() {
  return (
    <section className="business-actions" id="business">
      <div className="section-shell">
        <div className="business-actions__header">
          <div><p className="eyebrow">Dealership services</p><h2 className="section-heading">More than a catalogue.</h2></div>
          <p>Turn website visitors into real conversations with direct sales, sourcing, trade-in and finance pathways.</p>
        </div>
        <div className="business-actions__grid">
          {actions.map((action) => (
            <article className="business-action" key={action.title}>
              <span className="business-action__mark" aria-hidden="true">LM</span>
              <h3>{action.title}</h3>
              <p>{action.description}</p>
              <a className="text-link" href={whatsappUrl(action.message)} rel="noopener noreferrer" target="_blank">Start on WhatsApp <span aria-hidden="true">↗</span></a>
            </article>
          ))}
        </div>
        <div className="business-actions__contact">
          <div><strong>Sales desk</strong><span>{BUSINESS.phoneDisplay}</span><span>{BUSINESS.email}</span></div>
          <a className="button button--orange" href={mailtoUrl("Vehicle enquiry", "Hello Legend Motors, I would like help with a vehicle enquiry.")}>Email sales <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </section>
  );
}
