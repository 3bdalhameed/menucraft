'use client';
import {useState,useEffect,useMemo} from 'react';
import {createPortal} from 'react-dom';
import type {Menu,State,Item} from '@/lib/menucraft/model';
import {X,Star,Flame,Leaf,CheckCircle2} from 'lucide-react';

const DIETARY_STYLES:Record<string,string>={
  vegan:'vegan',vegetarian:'vegetarian','gluten-free':'gluten-free',halal:'halal',glutenfrei:'gluten-free','no nuts':'',
};

export function MenuRenderer({menu,profile}:{menu:Menu;profile:State['profile']}){
  const [lang,setLang]=useState('en');
  const [search,setSearch]=useState('');
  const [diet,setDiet]=useState('');
  const [detail,setDetail]=useState<Item|null>(null);
  const [activeCat,setActiveCat]=useState('');

  const ar=lang==='ar',d=menu.design;
  const t=(en:string,arabic:string)=>ar?(arabic||en):en;

  useEffect(()=>{
    if(!menu.categories.some(c=>c.id===activeCat))setActiveCat(menu.categories[0]?.id||'');
  },[menu.categories,activeCat]);

  useEffect(()=>{
    if(!detail)return;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setDetail(null)};
    window.addEventListener('keydown',onKey);
    return()=>{window.removeEventListener('keydown',onKey);document.body.style.overflow=previousOverflow};
  },[detail]);

  const dietaryFilters=useMemo(()=>{
    const set=new Set<string>();
    menu.items.forEach(i=>i.dietary.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean).forEach(x=>set.add(x)));
    return [...set];
  },[menu.items]);

  const visibleItems=useMemo(()=>menu.items.filter(i=>!i.hidden&&(
    (i.name+i.ar+i.description).toLowerCase().includes(search.toLowerCase())
  )&&(!diet||i.dietary.toLowerCase().includes(diet))),[menu.items,search,diet]);

  const spicyLevel=(n:number)=>{
    if(n<=0)return null;
    return <span className="food-spicy" title={t('Spicy level','مستوى الحرارة')}>{Array.from({length:3}).map((_,k)=><Flame key={k} size={12} fill={k<n?'currentColor':'none'} color={k<n?'#dc2626':'#d1d5db'}/>)}</span>;
  };

  return <div className="public-menu" dir={ar?'rtl':'ltr'} style={{background:d.background,color:d.primary,fontFamily:d.font,fontSize:d.fontSize,padding:d.spacing}}>

    <header style={{textAlign:d.header}}>
      {profile.logo&&<img src={profile.logo} alt="" width={64}/>}
      <small>{menu.name}</small>
      <h1>{ar?profile.ar||profile.name:profile.name}</h1>
      <p>{ar?profile.descriptionAr||profile.description:profile.description}</p>
      <button onClick={()=>setLang(ar?'en':'ar')}>{ar?'English':'العربية'}</button>
    </header>

    {d.banner&&<div className="promo">{ar?profile.descriptionAr?.split('.')[0]+'.':d.banner}</div>}

    <div className="menu-search">
      <input aria-label={t('Search the menu','ابحث في القائمة')} placeholder={t('Search the menu','ابحث في القائمة')} value={search} onChange={e=>setSearch(e.target.value)}/>
      {dietaryFilters.length>0&&<fieldset className="diet-chips" aria-label={t('Dietary filters','فلاتر الحمية')} style={{border:0,padding:0,margin:0}}>
        {dietaryFilters.map(x=><button key={x} className={`diet-chip ${diet===x?'active':''}`} onClick={()=>setDiet(diet===x?'':x)}>{x}</button>)}
</fieldset>}
    </div>

    <nav className="category-nav" style={{background:d.background}}>
      {menu.categories.map(c=>(
        <a key={c.id} href={'#c'+c.id} onClick={()=>setActiveCat(c.id)} className={activeCat===c.id?'active':''}>{t(c.name,c.ar||c.name)}</a>
      ))}
    </nav>

    {menu.categories.map(c=>{
      const items=visibleItems.filter(i=>i.categoryId===c.id);
      if(!items.length)return null;
      return <section id={'c'+c.id} key={c.id}>
        <h2>{t(c.name,c.ar||c.name)}</h2>
        <div className="food-grid" style={{gridTemplateColumns:`repeat(${d.columns},minmax(0,1fr))`,gap:d.spacing}}>
          {items.map(i=>(
            <button key={i.id} className={`food-card ${d.card}`} style={{borderRadius:d.radius,opacity:i.available?1:.55}} onClick={()=>setDetail(i)}>
              {i.image&&<img src={i.image} alt={t(i.name,i.ar||i.name)} loading="lazy"/>}
              <div>
                <h3>{t(i.name,i.ar||i.name)} {i.featured&&<Star size={13} fill="#f59e0b" color="#f59e0b" aria-label={t('Featured','مميز')}/>}</h3>
                {i.description&&<p>{t(i.description,i.descriptionAr||i.description)}</p>}
                <strong>
                  {i.discount>0?<><del>{i.price.toFixed(2)} {profile.name.length? (ar?'د.أ':'JOD'):''}</del> {i.discount.toFixed(2)} {(ar?'د.أ':'JOD')}</>:<>{i.price.toFixed(2)} {(ar?'د.أ':'JOD')}</>}
                </strong>
                <div className="food-badges">
                  {i.dietary.split(',').map(s=>s.trim()).filter(Boolean).map((x,k)=><span key={k} className={`food-badge ${DIETARY_STYLES[x.toLowerCase()]||''}`}>{x}</span>)}
                  {spicyLevel(i.spicy)}
                  {!i.available&&<span className="food-badge">{t('Sold out','غير متوفر')}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>;
    })}

    {menu.categories.length===0&&<section style={{textAlign:'center',padding:60}}><p>{t('This menu is under construction.','هذه القائمة قيد الإنشاء.')}</p></section>}

    {profile.hours&&<footer>{profile.hours} · {profile.address}</footer>}

    {detail&&typeof document!=='undefined'&&createPortal(<div className="item-detail-overlay" dir={ar?'rtl':'ltr'} style={{fontFamily:d.font,fontSize:d.fontSize}}>
      <button className="item-detail-backdrop" aria-label={t('Close','إغلاق')} onClick={()=>setDetail(null)}/>
      <div className="item-detail" style={{color:d.primary}}>
        <button className="item-detail-close" aria-label={t('Close','إغلاق')} onClick={()=>setDetail(null)}><X size={18}/></button>
        {detail.image&&<img className="item-detail-img" src={detail.image} alt={t(detail.name,detail.ar||detail.name)}/>}
        <div className="item-detail-body">
          <h2>{t(detail.name,detail.ar||detail.name)} {detail.featured&&<Star size={18} fill="#f59e0b" color="#f59e0b"/>}</h2>
          {detail.description&&<p>{t(detail.description,detail.descriptionAr||detail.description)}</p>}
          <div className="item-detail-meta">
            <strong style={{fontSize:16}}>{detail.discount>0?<><del style={{opacity:.4,marginRight:6,fontSize:13}}>{detail.price.toFixed(2)} JOD</del>{detail.discount.toFixed(2)} JOD</>:<>{detail.price.toFixed(2)} JOD</>}</strong>
            {detail.calories>0&&<span>{detail.calories} {t('kcal','سعرة')}</span>}
            {spicyLevel(detail.spicy)}
            {!detail.available&&<span className="food-badge" style={{background:'#fee2e2',color:'#991b1b'}}>{t('Sold out','غير متوفر')}</span>}
          </div>
          {detail.ingredients&&<div><strong style={{fontSize:12,opacity:.6}}>{t('Ingredients','المكونات')}</strong><p style={{fontSize:12,marginTop:4}}>{detail.ingredients}</p></div>}
          {detail.allergens&&<div><strong style={{fontSize:12,opacity:.6}}>{t('Allergens','مسببات الحساسية')}</strong><div className="food-badges" style={{marginTop:4}}>{detail.allergens.split(',').map((s,k)=><span key={k} className="food-badge" style={{background:'#fef3c7',color:'#92400e'}}>{s.trim()}</span>)}</div></div>}
          {detail.dietary&&<div style={{marginTop:8}}><div className="food-badges">{detail.dietary.split(',').map(s=>s.trim()).filter(Boolean).map((x,k)=><span key={k} className={`food-badge ${DIETARY_STYLES[x.toLowerCase()]||''}`}><Leaf size={9}/> {x}</span>)}</div></div>}
          {detail.available&&<div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,opacity:.7,marginTop:10}}><CheckCircle2 size={13} color="#16a34a"/>{t('Available now','متوفر الآن')}</div>}
        </div>
      </div>
    </div>,document.body)}

  </div>;
}
