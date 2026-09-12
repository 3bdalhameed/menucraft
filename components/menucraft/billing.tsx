'use client';
import {Check,CreditCard} from 'lucide-react';
import {pricing} from '@/lib/menucraft/pricing';

export default function Billing(){
  return <section className="billing-panel">
    <div><span className="landing-section-badge"><CreditCard size={15}/> TableMint Essentials</span><h2>Your restaurant, beautifully served.</h2><p className="billing-price">${pricing.monthly}<span> USD / month</span></p><p>Manage your menus, publish updates, and share your QR codes.</p></div>
    <ul>{['Visual menu designer and templates','English and Arabic menus','Photo library and QR downloads','Publishing and version history'].map(text=><li key={text}><Check size={17}/>{text}</li>)}</ul>
    <div className="billing-status" role="status"><strong>Subscriptions are not open yet</strong><p>No active paid subscription or payment method is attached to this workspace. Checkout and subscription management will appear here when billing is available.</p></div>
    <a href="/landing#pricing" className="auth-secondary">View plan details</a>
  </section>;
}
