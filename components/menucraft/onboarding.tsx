'use client';
import {useState,type FormEvent} from 'react';
import type {State} from '@/lib/menucraft/model';
import {ArrowRight,Utensils} from 'lucide-react';

export default function Onboarding({workspace,onComplete}:{workspace:State;onComplete:()=>void}){
  const [name,setName]=useState(workspace.profile.name);
  const [arabic,setArabic]=useState(workspace.profile.ar);
  const [description,setDescription]=useState(workspace.profile.description);
  const [address,setAddress]=useState(workspace.profile.address);
  const [phone,setPhone]=useState(workspace.profile.phone);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy)return;
    setBusy(true);setError('');
    try{
      const response=await fetch('/api/workspace',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'save',state:{...workspace,profile:{...workspace.profile,name:name.trim(),ar:arabic.trim(),description:description.trim(),address:address.trim(),phone:phone.trim(),setupCompleted:true}}})});
      const result=await response.json() as {error?:string};
      if(!response.ok)throw new Error(result.error||'Could not save your restaurant. Please try again.');
      onComplete();
    }catch(error){setError(error instanceof Error?error.message:'Could not save your restaurant.');setBusy(false)}
  }
  return <section className="setup-card" aria-labelledby="setup-title">
    <span className="landing-section-badge"><Utensils size={15}/> Welcome to TableMint</span>
    <h2 id="setup-title">Let’s set your table.</h2><p>Add your restaurant’s name to get started. You can change these details in Restaurant Settings anytime.</p>
    <form onSubmit={submit} className="setup-form">
      <label>Restaurant name <span aria-hidden="true">*</span><input required maxLength={200} value={name} onChange={e=>setName(e.target.value)} autoComplete="organization" placeholder="Your restaurant"/></label>
      <label>Restaurant name in Arabic<input dir="rtl" maxLength={200} value={arabic} onChange={e=>setArabic(e.target.value)} lang="ar" placeholder="اسم المطعم"/></label>
      <label className="setup-wide">A little about your restaurant<textarea maxLength={3000} value={description} onChange={e=>setDescription(e.target.value)} placeholder="What makes your food special?" rows={3}/></label>
      <label>Address<input maxLength={3000} value={address} onChange={e=>setAddress(e.target.value)} autoComplete="street-address"/></label>
      <label>Phone<input type="tel" maxLength={200} value={phone} onChange={e=>setPhone(e.target.value)} autoComplete="tel"/></label>
      {error&&<p role="alert" className="setup-error setup-wide">{error}</p>}
      <button type="submit" className="primary setup-wide" disabled={busy||!name.trim()}>{busy?'Saving your restaurant…':'Create my workspace'}<ArrowRight size={16}/></button>
    </form>
  </section>;
}
