'use client';
import {ArrowRight,Check} from 'lucide-react';
import {pricing} from '@/lib/menucraft/pricing';

const included=['Visual menu designer and 11 design presets','Multiple menus and organized categories','English and Arabic with right-to-left layouts','Food photos and reusable media library','Custom-color QR codes to download and print','Draft saves, publishing, and version restoration','Menu view and QR scan counts'];
const faqs=[
  ['Do my guests need an account?','No. Guests can open a published menu from its link or scan its QR code. There is no app to download.'],
  ['Can I try it before signing in?','Yes. The interactive preview above lets you explore a sample menu, compare styles, search dishes, and switch languages without an account.'],
  ['How do I create my own menu?','Start with your restaurant details, choose a design, and fill your menu with categories, dishes, prices, and photos.'],
  ['Will editing my menu change what guests see immediately?','Your changes stay in a draft until you publish. Publishing updates the guest menu while keeping its link and QR code the same.'],
  ['Can guests place orders or pay for food?','TableMint currently displays your menu. Food ordering, table reservations, and guest payments are not included.'],
  ['Are paid subscriptions available now?','Paid subscriptions are not open yet. The Essentials plan is $10 USD per month. You can explore the sample menu while subscriptions are being prepared.'],
];

export default function Pricing(){
  const checkout=pricing.checkoutUrl;
  return <>
    <section className="landing-pricing" id="pricing" aria-labelledby="pricing-title">
      <div className="landing-section-header">
        <span className="landing-section-badge">Simple pricing</span>
        <h2 id="pricing-title">One plan. Your whole menu.</h2>
        <p>Everything you need to design, publish, and update your digital menu.</p>
      </div>
      <div className="pricing-card">
        <div className="pricing-summary">
          <span className="landing-section-badge">TableMint Essentials</span>
          <h3>Essentials</h3>
          <p>A beautiful digital menu for your restaurant, café, or bakery.</p>
          <div className="pricing-amount" aria-live="polite"><strong>${pricing.monthly}</strong><span>{pricing.currency} / month</span></div>
          <p className="pricing-billing">Billed monthly.</p>
          <a className="landing-btn-primary" href={checkout||'#menu-preview'}>{checkout?'Continue to checkout':'Explore the live demo'}<ArrowRight size={16}/></a>
          {!checkout&&<p className="pricing-availability">Subscriptions are coming soon. No payment is collected here.</p>}
        </div>
        <div className="pricing-included"><h4>Everything included</h4><ul>{included.map(feature=><li key={feature}><Check size={18} aria-hidden="true"/><span>{feature}</span></li>)}</ul></div>
      </div>
    </section>
    <section className="landing-faq" id="faq" aria-labelledby="faq-title">
      <div className="landing-section-header"><span className="landing-section-badge">Good to know</span><h2 id="faq-title">Before your first scan.</h2></div>
      {faqs.map(([question,answer])=><details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
    </section>
  </>;
}
