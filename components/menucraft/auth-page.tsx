import Link from 'next/link';
import {ArrowRight,Check,Utensils} from 'lucide-react';
import {getChatGPTUser,chatGPTSignInPath} from '@/app/chatgpt-auth';

export default async function AuthPage({signup=false}:{signup?:boolean}){
  const user=await getChatGPTUser();
  return <main className="auth-page">
    <div className="auth-story">
      <Link href="/" className="auth-brand"><Utensils size={24}/>TableMint.</Link>
      <div><span className="auth-eyebrow">MADE FOR YOUR TABLE</span><h1>A great menu.<br/>A warm welcome.</h1><p>Your dishes, your style, and a menu that is always up to date.</p>
      <ul>{['Design with ready-to-use templates','Welcome guests in English and Arabic','Publish once. Share with a QR code.'].map(text=><li key={text}><Check size={18}/>{text}</li>)}</ul></div>
      <span>TableMint Essentials · $10 USD / month</span>
    </div>
    <div className="auth-content"><section className="auth-card" aria-labelledby="auth-title">
      <Link href="/" className="auth-back">← Back to TableMint</Link>
      <span className="landing-section-badge">{signup?'Your restaurant starts here':'Restaurant workspace'}</span>
      <h2 id="auth-title">{signup?'Create your account.':'Welcome back.'}</h2>
      <p>{signup?'Sign in securely, then tell us a little about your restaurant.':'Sign in to manage your menus, photos, and restaurant details.'}</p>
      {user?<>
        <div className="auth-identity"><strong>You’re signed in</strong><span>{user.email}</span></div>
        <Link href="/dashboard" className="landing-btn-primary">Continue to your workspace <ArrowRight size={17}/></Link>
        <a href="/signout-with-chatgpt?return_to=/login" target="_top" className="auth-secondary">Use another account</a>
      </>:<>
        <a href={chatGPTSignInPath('/dashboard')} target="_top" className="landing-btn-primary">Continue with ChatGPT <ArrowRight size={17}/></a>
        <p className="auth-note">Use your ChatGPT account. TableMint never receives or stores your password.</p>
      </>}
      <div className="auth-divider"/>
      <p className="auth-switch">{signup?'Already have an account?':'New to TableMint?'} <Link href={signup?'/login':'/signup'}>{signup?'Log in':'Create an account'}</Link></p>
      <Link href="/landing#menu-preview" className="auth-secondary">Explore the menu demo first</Link>
    </section></div>
  </main>;
}
