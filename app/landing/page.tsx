'use client';
import {useState} from 'react';
import Link from 'next/link';
import Pricing from '@/components/menucraft/pricing';
import LandingPreview from '@/components/menucraft/overview-preview';
import {Utensils,Palette,QrCode,Globe,ArrowRight,Menu,X,Sparkles,Layers,Image,Shield,Smartphone} from 'lucide-react';

const features=[
  {icon:Palette,title:'Visual Menu Designer',description:'Build your menu with a drag-and-drop designer. No coding or design skills needed. Just point, click, and create.',detail:'Canva-style editor'},
  {icon:Layers,title:'Smart Categories',description:'Organize your menu into categories with drag-and-drop reordering. Appetizers, mains, desserts — all in order.',detail:'Drag & drop'},
  {icon:QrCode,title:'Instant QR Codes',description:'Every published menu gets a beautiful QR code. Customize the colors and print it for your tables.',detail:'Auto-generated'},
  {icon:Globe,title:'Multilingual Menus',description:'Serve every guest. Full English and Arabic support with automatic RTL layout switching.',detail:'EN + AR'},
  {icon:Smartphone,title:'Mobile-First Design',description:'Your menu looks stunning on every phone. Because that\'s what your customers are using.',detail:'Responsive'},
  {icon:Shield,title:'Secure & Private',description:'Your data is isolated and protected. Only you can access and modify your restaurant\'s menu.',detail:'Restaurant-level isolation'},
  {icon:Image,title:'Media Library',description:'Upload and manage food photos, logos, and backgrounds. Reuse images across all your menus.',detail:'Reusable photo library'},
  {icon:Sparkles,title:'11+ Templates',description:'Start with professionally designed templates. From luxury dining to casual cafés, find your perfect style.',detail:'Fully customizable'},
];

const steps=[
  {number:'01',title:'Add your restaurant',description:'Add your restaurant name, logo, and basic information to make the workspace yours.'},
  {number:'02',title:'Design your menu visually',description:'Choose a template or start from scratch. Drag categories, add items, set prices, upload photos.'},
  {number:'03',title:'Publish & share',description:'Hit publish and your menu goes live. Print the QR code on your tables and let customers scan to browse.'},
];

const templates=[
  {name:'Modern Restaurant',bg:'#faf7ee',color:'#3e6347'},
  {name:'Luxury Dining',bg:'#171b18',color:'#e4cd95'},
  {name:'Minimal Café',bg:'#ffffff',color:'#333333'},
  {name:'Burger Joint',bg:'#fff2de',color:'#8d4025'},
  {name:'Pizza Place',bg:'#fbebe3',color:'#9c422b'},
  {name:'Coffee Shop',bg:'#efe7dc',color:'#5a3e2a'},
  {name:'Bakery',bg:'#fff0ed',color:'#94614f'},
  {name:'Fast Food',bg:'#fff9d9',color:'#473d27'},
  {name:'Dark Elegant',bg:'#192027',color:'#ead9b3'},
  {name:'Colorful Casual',bg:'#edf4f0',color:'#3c7365'},
];

function FeatureCard({icon:Icon,title,description,detail}:typeof features[0]){
  return <div className="landing-feature-card"><div className="landing-feature-icon"><Icon size={22}/></div><div><h3>{title}</h3><p>{description}</p><span className="landing-feature-detail">{detail}</span></div></div>;
}

export default function Landing(){
  const [mobileMenu,setMobileMenu]=useState(false);
  return <div className="landing">
    <nav className="landing-nav">
      <div className="landing-nav-inner">
        <div className="landing-nav-brand">
          <span className="landing-nav-logo" style={{position:'relative'}}>
            <Utensils size={18}/>
          </span>
          <span className="landing-nav-name">Table<span className="brand-craft">Mint</span><span className="landing-nav-dot">.</span></span>
        </div>
        <div id="landing-navigation" onClick={()=>setMobileMenu(false)} className={`landing-nav-links ${mobileMenu?'open':''}`}>
          <a href="#features">Features</a>
          <a href="#templates">Templates</a>
          <a href="#how-it-works">How it works</a>
          <a href="#pricing">Pricing</a><a href="#faq">FAQ</a>
          <Link href="/login">Log in</Link><Link href="/signup" className="landing-nav-cta">Get started <ArrowRight size={14}/></Link>
        </div>
        <button className="landing-nav-toggle" onClick={()=>setMobileMenu(!mobileMenu)} aria-label="Toggle navigation" aria-expanded={mobileMenu} aria-controls="landing-navigation">{mobileMenu?<X size={22}/>:<Menu size={22}/>}</button>
      </div>
    </nav>

    <section className="landing-hero">
      <div className="landing-hero-badge"><Sparkles size={14}/> Built for restaurant owners</div>
      <h1>Your menu, <span className="landing-hero-highlight">beautifully</span> designed.</h1>
      <p className="landing-hero-sub">Create, design, and publish stunning digital menus. No design skills needed. Update anytime, everywhere.</p>
      <div className="landing-hero-actions">
        <Link href="/signup" className="landing-btn-primary">Start building your menu <ArrowRight size={16}/></Link>
        <a href="#menu-preview" className="landing-btn-secondary">Try the menu preview</a>
      </div>
      <LandingPreview/>
    </section>

    <section className="landing-features" id="features">
      <div className="landing-section-header">
        <span className="landing-section-badge">Features</span>
        <h2>Everything you need to manage your digital menu</h2>
        <p>From creation to publication, TableMint handles every step of your menu lifecycle.</p>
      </div>
      <div className="landing-features-grid">
        {features.map(f=><FeatureCard key={f.title} {...f}/>)}
      </div>
    </section>

    <section className="landing-templates" id="templates">
      <div className="landing-section-header">
        <span className="landing-section-badge">Templates</span>
        <h2>Start with a template, make it yours</h2>
        <p>11 professionally designed templates. Pick one that matches your restaurant&apos;s vibe and customize everything.</p>
      </div>
      <div className="landing-templates-grid">
        {templates.map(t=><div key={t.name} className="landing-template-card" style={{background:t.bg,color:t.color}}>
          <div className="landing-template-preview">
            <div className="ltp-line long" style={{background:t.color}}/>
            <div className="ltp-line medium" style={{background:t.color,opacity:.6}}/>
            <div className="ltp-line short" style={{background:t.color,opacity:.3}}/>
          </div>
          <span className="landing-template-name">{t.name}</span>
        </div>)}
      </div>
    </section>

    <section className="landing-steps" id="how-it-works">
      <div className="landing-section-header">
        <span className="landing-section-badge">How it works</span>
        <h2>From sign-up to live menu in minutes</h2>
      </div>
      <div className="landing-steps-grid">
        {steps.map(s=><div key={s.number} className="landing-step-card">
          <div className="landing-step-number">{s.number}</div>
          <h3>{s.title}</h3>
          <p>{s.description}</p>
        </div>)}
      </div>
    </section>

    <Pricing/>

    <section className="landing-cta">
      <h2>Ready to serve your menu beautifully?</h2>
      <p>Give every guest a menu that is easy to browse and always up to date.</p>
      <Link href="/signup" className="landing-btn-primary large">Create your account <ArrowRight size={16}/></Link>
    </section>

    <footer className="landing-footer">
      <div className="landing-footer-inner">
        <div className="landing-footer-brand">
          <span className="landing-nav-logo" style={{position:'relative'}}>
            <Utensils size={16}/>
          </span>
          <span>Table<span className="brand-craft">Mint</span><span className="landing-nav-dot">.</span></span>
        </div>
        <div className="landing-footer-links">
          <a href="#features">Features</a>
          <a href="#templates">Templates</a>
          <a href="#how-it-works">How it works</a>
          <a href="#pricing">Pricing</a><a href="#faq">FAQ</a><Link href="/login">Log in</Link>
        </div>
        <p className="landing-footer-copy">&copy; 2026 TableMint. Crafted for restaurants that care.</p>
      </div>
    </footer>
  </div>;
}
