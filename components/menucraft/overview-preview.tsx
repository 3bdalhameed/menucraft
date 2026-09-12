'use client';
import {useState} from 'react';
import {MenuRenderer} from './menu-renderer';
import {seed,templatePresets} from '@/lib/menucraft/model';
const sample=seed();
const sampleMenu={...sample.menus[0],id:'demo',categories:sample.menus[0].categories.map(c=>({...c,id:'demo-category'})),items:sample.menus[0].items.map((item,index)=>({...item,id:'demo-item-'+index,categoryId:'demo-category'}))};
const templates=templatePresets.filter(t=>['Modern Restaurant','Luxury Dining','Coffee Shop'].includes(t.name));
export default function LandingPreview(){
  const [selected,setSelected]=useState(0);
  const menu={...sampleMenu,design:{...templates[selected]}};
  return <section id="menu-preview" className="overview-preview" style={{maxWidth:980,margin:'20px auto 0',textAlign:'left',scrollMarginTop:90}} aria-labelledby="overview-preview-title">
    <div className="overview-preview-copy">
      <span className="eyebrow">INTERACTIVE PREVIEW</span>
      <h2 id="overview-preview-title">Your next menu starts here.</h2>
      <p>Try a sample menu. Search for a dish, tap to explore its details, or switch to Arabic. This is what your guests will see.</p>
      <label htmlFor="preview-template">Make it your style</label>
      <select id="preview-template" value={selected} onChange={e=>setSelected(Number(e.target.value))}>
        {templates.map((t,index)=><option key={t.name} value={index}>{t.name}</option>)}
      </select>
      <span className="overview-preview-note">Sample restaurant ? Explore freely, no sign-in needed.</span>
      <a className="landing-btn-primary" href="/signup">Create your own menu</a>
    </div>
    <div className="overview-preview-device">
      <div className="overview-preview-device-bar"><span/> Live menu preview</div>
      <div className="overview-preview-screen" tabIndex={0} aria-label="Interactive sample menu"><MenuRenderer menu={menu} profile={sample.profile}/></div>
    </div>
  </section>;
}
