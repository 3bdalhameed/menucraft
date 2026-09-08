'use client';
import {useEffect,useRef,useState} from 'react';
import {MenuRenderer} from './menu-renderer';
import {SortableList} from './sortable-list';
import {baseDesign,templatePresets,type Menu,type Item,type State} from '@/lib/menucraft/model';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Switch} from '@/components/ui/switch';
import {NativeSelect} from '@/components/ui/native-select';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {toast,Toaster} from 'sonner';
import {Plus,Undo2,Redo2,Upload,Trash2,Copy,Eye,Globe,Save,ArrowUpRight,GalleryThumbnails,LayoutTemplate,List,Utensils,Type,Image as ImageIcon,Shapes,Droplet,BadgeInfo,QrCode as QrIcon,Sparkles,Smartphone,Tablet,Monitor} from 'lucide-react';

type Workspace=State&{slug:string;published:{id:string;slug:string;published_at:string}[];history:{id:string;menu_id:string;created_at:string}[];media:{id:string;name:string}[]};

async function api(body:unknown){
  const r=await fetch('/api/workspace',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const value:any=await r.json();
  if(!r.ok)throw new Error(value.error||'Request failed');
  return value;
}

const designerTabs=[
  {id:'templates',label:'Templates',icon:GalleryThumbnails},
  {id:'layout',label:'Layout',icon:LayoutTemplate},
  {id:'categories',label:'Categories',icon:List},
  {id:'items',label:'Items',icon:Utensils},
  {id:'text',label:'Text',icon:Type},
  {id:'images',label:'Images',icon:ImageIcon},
  {id:'shapes',label:'Shapes',icon:Shapes},
  {id:'background',label:'Background',icon:Droplet},
  {id:'branding',label:'Branding',icon:BadgeInfo},
  {id:'qr',label:'QR Code',icon:QrIcon},
] as const;

export default function Studio({section}:{section:string}){
  const [state,setState]=useState<Workspace|null>(null);
  const [selected,setSelected]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [editing,setEditing]=useState<Item|null>(null);
  const [preview,setPreview]=useState(false);
  const [width,setWidth]=useState(390);
  const [qr,setQr]=useState('');
  const [qrColor,setQrColor]=useState('#286b50');
  const [query,setQuery]=useState('');
  const [designerTab,setDesignerTab]=useState('templates');
  const [saveState,setSaveState]=useState<'saved'|'dirty'|'saving'>('saved');

  const dirty=useRef(false),latest=useRef<Workspace|null>(null),undo=useRef<Workspace[]>([]),redo=useRef<Workspace[]>([]),saving=useRef(false);

  useEffect(()=>{
    fetch('/api/workspace').then(async r=>{
      const x:any=await r.json();
      if(!r.ok)throw new Error(x.error);
      setState(x);latest.current=x;setSelected(x.menus[0]?.id||'');
    }).catch(e=>setError(e.message));
  },[]);

  const change=(next:Workspace)=>{
    if(latest.current)undo.current.push(structuredClone(latest.current));
    redo.current=[];
    latest.current=next;dirty.current=true;setSaveState('dirty');setState(next);
  };

  async function save(){
    if(!latest.current)return;
    if(saving.current)throw new Error('Please wait for the current save to finish');
    saving.current=true;setBusy(true);setSaveState('saving');
    try{
      const snapshot=latest.current;
      const {revision}=await api({action:'save',state:snapshot});
      const next={...latest.current,revision};
      latest.current=next;setState(next);
      dirty.current=latest.current!==snapshot&&JSON.stringify({...next,revision:snapshot.revision})!==JSON.stringify(snapshot);
      setSaveState(dirty.current?'dirty':'saved');
    }catch(e){toast.error(String(e));setSaveState('dirty');throw e}
    finally{saving.current=false;setBusy(false)}
  }

  useEffect(()=>{
    const timer=setInterval(()=>{if(dirty.current&&!saving.current)void save().catch(()=>{})},4000);
    return()=>clearInterval(timer);
  },[]);

  useEffect(()=>{
    const handler=(e:BeforeUnloadEvent)=>{if(dirty.current){e.preventDefault();e.returnValue=''}};
    window.addEventListener('beforeunload',handler);
    return()=>window.removeEventListener('beforeunload',handler);
  },[]);

  const menu=state?.menus.find(m=>m.id===selected)||state?.menus[0];
  const update=(next:Menu)=>state&&change({...state,menus:state.menus.map(m=>m.id===next.id?next:m)});

  useEffect(()=>{
    if(section==='QR Codes'&&state&&menu&&state.published.some(p=>p.id===menu.id)){
      import('qrcode').then(q=>q.toDataURL(location.origin+'/menu/'+state.slug+'/'+menu.slug+'?via=qr',{width:600,color:{dark:qrColor,light:'#ffffff'},errorCorrectionLevel:'H'})).then(setQr).catch(()=>toast.error('Could not generate QR code'));
    }
  },[section,selected,state?.published,qrColor]);

  // Register the tool for the host app
  useEffect(()=>{
    const context=(document as any).modelContext;
    if(!context?.registerTool)return;
    const lifecycle=new AbortController();
    Promise.resolve(context.registerTool({name:'list_restaurant_menus',description:'Read menus in the current restaurant workspace.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:()=>({menus:latest.current?.menus.map(m=>({id:m.id,name:m.name,items:m.items.length}))||[]})},{signal:lifecycle.signal})).catch(()=>{});
    return()=>lifecycle.abort();
  },[]);

  if(error)return<div className="editor-panel"><h2>Workspace couldn&apos;t load</h2><p>{error}</p><a href="/signin-with-chatgpt?return_to=/" target="_top">Sign in with ChatGPT</a></div>;
  if(!state||!menu)return<p role="status">Loading your restaurant…</p>;

  const makeMenu=()=>{const id=crypto.randomUUID();change({...state,menus:[...state.menus,{id,name:'Untitled menu',slug:'menu-'+id.slice(0,8),design:{...baseDesign},categories:[],items:[]}]});setSelected(id)};
  const deleteMenu=async(menuId:string)=>{
    const victim=state.menus.find(m=>m.id===menuId);
    if(!victim)return;
    if(state.menus.length<=1){toast.error('You need at least one menu');return}
    if(!window.confirm('Delete "'+victim.name+'" permanently? Its published page and version history will be removed.'))return;
    setBusy(true);
    try{
      await api({action:'deleteMenu',menuId});
      const remaining=state.menus.filter(m=>m.id!==menuId);
      const next={...state,menus:remaining,published:state.published.filter(p=>p.id!==menuId),history:state.history.filter(v=>v.menu_id!==menuId)};
      change(next);
      setSelected(remaining[0]?.id||'');
      toast.success('Menu deleted');
    }catch(e){toast.error(String(e))}
    finally{setBusy(false)}
  };
  const newItem=()=>{
    if(!menu.categories.length){toast.error('Add a category first');return}
    const catId=menu.categories[0].id;
    setEditing({id:crypto.randomUUID(),categoryId:catId,name:'',ar:'',description:'',descriptionAr:'',price:0,discount:0,image:'',available:true,featured:false,ingredients:'',allergens:'',calories:0,spicy:0,dietary:'',hidden:false});
  };
  const publish=async()=>{
    try{
      await save();if(dirty.current)throw new Error('Menu changed during save. Please publish again.');
      await api({action:'publish',menuId:menu.id});
      const next={...latest.current!,published:[...latest.current!.published.filter(p=>p.id!==menu.id),{id:menu.id,slug:menu.slug,published_at:new Date().toISOString()}]};
      latest.current=next;setState(next);toast.success('Menu version published');
    }catch(e){toast.error(String(e))}
  };
  const upload=async(file:File)=>{
    if(file.size>5*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose a JPG, PNG or WebP smaller than 5 MB');
    const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas'),scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
    canvas.width=bitmap.width*scale;canvas.height=bitmap.height*scale;
    canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Image conversion failed')),'image/webp',.85));
    const form=new FormData();form.set('file',blob,file.name);
    const response=await fetch('/api/media',{method:'POST',body:form});
    const result:any=await response.json();
    if(!response.ok)throw new Error(result.error);
    const next={...latest.current!,media:[...latest.current!.media,{id:result.id,name:file.name}]};
    latest.current=next;setState(next);
    return '/api/media/'+result.id;
  };

  const deviceSizes=[[390,'Mobile',Smartphone],[768,'Tablet',Tablet],[1100,'Desktop',Monitor]] as const;

  return<div className="studio">
    <Toaster position="bottom-right"/>

    {/* TOOLBAR */}
    <div className="studio-toolbar">
      <NativeSelect aria-label="Menu" value={menu.id} onChange={e=>setSelected(e.target.value)}>
        {state.menus.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
      </NativeSelect>
      <Button variant="outline" onClick={makeMenu}><Plus/>New menu</Button>
      <span className="save-status">{saveState==='saving'?'Saving…':saveState==='dirty'?'Unsaved changes':'Saved'}</span>
      <Button variant="outline" onClick={()=>{const x=undo.current.pop();if(x){redo.current.push(state);const next={...x,revision:state.revision};latest.current=next;setState(next);dirty.current=true;setSaveState('dirty')}}} aria-label="Undo"><Undo2/></Button>
      <Button variant="outline" onClick={()=>{const x=redo.current.pop();if(x){undo.current.push(state);const next={...x,revision:state.revision};latest.current=next;setState(next);dirty.current=true;setSaveState('dirty')}}} aria-label="Redo"><Redo2/></Button>
      <Button variant="outline" onClick={()=>void save()} disabled={busy}><Save/>Save</Button>
      <Button variant="outline" onClick={()=>setPreview(true)}><Eye/>Preview</Button>
      {state.published.some(p=>p.id===menu.id)&&<Button variant="outline" onClick={()=>window.open('/menu/'+state.slug+'/'+menu.slug,'_blank')}><Globe/>View live</Button>}
      <Button variant="destructive" disabled={busy||state.menus.length<=1} onClick={()=>void deleteMenu(menu.id)}><Trash2/>Delete</Button>
      <Button disabled={busy} onClick={publish}><Globe/>Publish</Button>
    </div>

    {/* MENUS SECTION */}
    {section==='Menus'&&<div className="editor-panel">
      <div className="section-heading"><h2>Manage menus</h2><Button variant="destructive" disabled={busy||state.menus.length<=1} onClick={()=>void deleteMenu(menu.id)}><Trash2/>Delete this menu</Button></div>
      <div className="settings-grid">
        <label>Menu name<Input value={menu.name} onChange={e=>update({...menu,name:e.target.value})}/></label>
        <label>Menu address<Input value={menu.slug} onChange={e=>update({...menu,slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'-')})}/></label>
      </div>
      <p>Stable menu address: <b>/menu/{state.slug}/{menu.slug}</b> — QR codes keep working even when you update the menu.</p>
      {state.published.some(p=>p.id===menu.id)&&<a target="_blank" href={'/menu/'+state.slug+'/'+menu.slug}>View live menu <ArrowUpRight size={12}/></a>}
      <h3>Version history</h3>
      {state.history.filter(v=>v.menu_id===menu.id).map(v=>(
        <div className="history-row" key={v.id}>
          <span>{new Date(v.created_at).toLocaleString()}</span>
          <Button variant="outline" onClick={async()=>{const snapshot=await api({action:'restore',versionId:v.id});update(snapshot.menu);toast.success('Version restored to draft')}}>Restore to draft</Button>
        </div>
      ))}
      {state.history.filter(v=>v.menu_id===menu.id).length===0&&<p>No published versions yet. Publish this menu to start its version history.</p>}
      <p style={{marginTop:16}}>Draft changes stay private until you publish.</p>
    </div>}

    {/* CATEGORIES SECTION */}
    {section==='Categories'&&<div className="editor-panel">
      <div className="section-heading"><h2>Categories</h2><Button onClick={()=>update({...menu,categories:[...menu.categories,{id:crypto.randomUUID(),name:'New category',ar:''}]})}><Plus/>Add category</Button></div>
      <p>Drag to reorder. Categories appear in this order on your published menu.</p>
      <SortableList items={menu.categories} onChange={categories=>update({...menu,categories})} render={c=>(
        <>
          <Input aria-label="Category name" value={c.name} onChange={e=>update({...menu,categories:menu.categories.map(x=>x.id===c.id?{...x,name:e.target.value}:x)})}/>
          <Input aria-label="Arabic category name" dir="rtl" placeholder="العربية" value={c.ar} onChange={e=>update({...menu,categories:menu.categories.map(x=>x.id===c.id?{...x,ar:e.target.value}:x)})}/>
          <span className="cat-count">{menu.items.filter(i=>i.categoryId===c.id).length} items</span>
          <Button aria-label="Delete empty category" variant="ghost" onClick={()=>{if(menu.items.some(i=>i.categoryId===c.id)){toast.error('Move or delete this category\u2019s items first');return}update({...menu,categories:menu.categories.filter(x=>x.id!==c.id)})}}><Trash2/></Button>
        </>
      )}/>
    </div>}

    {/* ITEMS SECTION */}
    {section==='Items'&&<div className="editor-panel">
      <div className="section-heading"><h2>Menu items</h2><Button onClick={newItem}><Plus/>Add item</Button></div>
      <Input aria-label="Search items" placeholder="Search items" value={query} onChange={e=>setQuery(e.target.value)}/>
      {menu.categories.length===0&&<p>Add categories first, then create items.</p>}
      {menu.categories.map(c=>{
        const items=menu.items.filter(i=>i.categoryId===c.id&&i.name.toLowerCase().includes(query.toLowerCase()));
        if(!items.length)return null;
        return <div key={c.id} style={{marginTop:12}}>
          <h3 style={{marginLeft:26}}>{c.name} <span style={{fontWeight:400,color:'#839384'}}>({items.length})</span></h3>
          <SortableList items={items} onChange={reordered=>update({...menu,items:menu.items.map(i=>{
            const idx=reordered.findIndex(r=>r.id===i.id);
            return idx>=0?reordered[idx]:i;
          })})} render={i=>(
            <div className="item-row" hidden={!i.name.toLowerCase().includes(query.toLowerCase())}>
              <button onClick={()=>setEditing(i)}><b>{i.name||'Untitled item'}</b><small>{menu.categories.find(c=>c.id===i.categoryId)?.name} · {i.price.toFixed(2)} JOD {i.featured?'★':''}</small></button>
              <Switch aria-label={'Availability of '+i.name} checked={i.available} onCheckedChange={available=>update({...menu,items:menu.items.map(x=>x.id===i.id?{...x,available}:x)})}/>
              <Button variant="ghost" aria-label="Duplicate item" onClick={()=>update({...menu,items:[...menu.items,{...i,id:crypto.randomUUID(),name:i.name+' copy'}]})}><Copy/></Button>
              <Button variant="ghost" onClick={()=>setEditing(i)}>Edit</Button>
            </div>
          )}/>
        </div>;
      })}
    </div>}

    {/* DESIGNER + THEMES */}
    {(section==='Menu Designer'||section==='Themes')&&<div className="designer-grid">
      {/* LEFT SIDEBAR */}
      <aside className="editor-panel designer-left">
        <div className="designer-appearance">
          {designerTabs.map(({id,label,icon:Icon})=>(
            <button key={id} className={`designer-tab ${designerTab===id?'active':''}`} onClick={()=>setDesignerTab(id)}>
              <Icon size={14}/>{label}
            </button>
          ))}
        </div>
        <div className="designer-left-body">
          <div style={{height:1,background:'#eef0ec',margin:'10px 0'}}/>

        {/* TEMPLATES */}
        {designerTab==='templates'&&<>
          <p style={{color:'#6b7b6f'}}>Pick a starting point. Your menu content is preserved — only the look changes.</p>
          {templatePresets.map(t=>(<button key={t.name} className="template-choice" onClick={()=>{
            const {background,primary,font,radius,columns,fontSize,spacing,banner,header,card}=t;
            update({...menu,design:{background,primary,font,radius,columns,fontSize,spacing,banner,header,card}});
            toast.success(t.name+' applied');
          }}>
            <span className="template-swatch" style={{background:t.background}}/>
            <b>{t.name}</b><small>{t.description}</small>
          </button>))}
        </>}

        {/* LAYOUT */}
        {designerTab==='layout'&&<>
          <p className="aside-caption">Change the overall structure of your menu.</p>
          <label>Card style<NativeSelect value={menu.design.card} onChange={e=>update({...menu,design:{...menu.design,card:e.target.value as any}})}>
            <option value="card">Card (with photos)</option><option value="list">List (compact)</option>
          </NativeSelect></label>
          <label>Header alignment<NativeSelect value={menu.design.header} onChange={e=>update({...menu,design:{...menu.design,header:e.target.value as any}})}>
            <option value="center">Centered</option><option value="left">Left</option>
          </NativeSelect></label>
          <label>Columns<NativeSelect value={menu.design.columns} onChange={e=>update({...menu,design:{...menu.design,columns:Number(e.target.value)}})}>
            <option value={1}>1 column (mobile)</option><option value={2}>2 columns</option><option value={3}>3 columns (desktop)</option>
          </NativeSelect></label>
          <label>Item spacing<Input type="range" min={0} max={40} value={menu.design.spacing} onChange={e=>update({...menu,design:{...menu.design,spacing:Number(e.target.value)}})}/></label>
          <label>Font size<Input type="range" min={12} max={24} value={menu.design.fontSize} onChange={e=>update({...menu,design:{...menu.design,fontSize:Number(e.target.value)}})}/></label>
        </>}

        {/* CATEGORIES */}
        {designerTab==='categories'&&<>
          <p className="aside-caption">Reorder categories for this menu.</p>
          <SortableList items={menu.categories} onChange={categories=>update({...menu,categories})} render={c=><span className="aside-cat"><List size={12}/>{c.name||'Untitled'}</span>}/>
          <Button variant="outline" style={{width:'100%',marginTop:6}} onClick={()=>update({...menu,categories:[...menu.categories,{id:crypto.randomUUID(),name:'New category',ar:''}]})}><Plus/>Add category</Button>
        </>}

        {/* ITEMS */}
        {designerTab==='items'&&<>
          <p className="aside-caption">Add items from your library to this menu.</p>
          {state.menus.flatMap(m=>m.items).filter(i=>!menu.items.some(x=>x.id===i.id)).slice(0,6).map(i=>(
            <button key={i.id} className="template-choice" onClick={()=>update({...menu,items:[...menu.items,{...i,id:crypto.randomUUID()}]})}><Plus size={10}/>{i.name}</button>
          ))}
          <Button variant="outline" style={{width:'100%',marginTop:6}} onClick={newItem}><Plus/>New item</Button>
        </>}

        {/* TEXT */}
        {designerTab==='text'&&<>
          <p className="aside-caption">Add a promotional banner or edit your restaurant name &amp; description.</p>
          <label>Promo banner<Input value={menu.design.banner} onChange={e=>update({...menu,design:{...menu.design,banner:e.target.value}})} placeholder="Leave empty to hide"/></label>
          <label>Restaurant name<Input value={state.profile.name} onChange={e=>change({...state,profile:{...state.profile,name:e.target.value}})}/></label>
          <label>Restaurant name (AR)<Input dir="rtl" value={state.profile.ar} onChange={e=>change({...state,profile:{...state.profile,ar:e.target.value}})}/></label>
          <label>Description<textarea value={state.profile.description} onChange={e=>change({...state,profile:{...state.profile,description:e.target.value}})}/></label>
        </>}

        {/* IMAGES */}
        {designerTab==='images'&&<>
          <p className="aside-caption">Upload photos for your items from the media library.</p>
          <label className="upload-label" style={{width:'100%',justifyContent:'center'}}><Upload size={16}/><span>Upload image</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={async e=>{if(e.target.files?.[0])try{const url=await upload(e.target.files[0]);if(editing)setEditing({...editing,image:url});toast.success('Image uploaded')}catch(err){toast.error(String(err))}}}/></label>
          <div className="mini-media-grid">
            {state.media.slice(0,12).map(m=>
              <button key={m.id} onClick={()=>{
                if(!editing){toast.error('Open an item in Items to attach an image');return}
                setEditing({...editing,image:'/api/media/'+m.id});toast.success('Image attached');
              }}><img src={'/api/media/'+m.id} alt={m.name}/></button>
            )}
          </div>
        </>}

        {/* SHAPES */}
        {designerTab==='shapes'&&<>
          <p className="aside-caption">Adjust how photos and cards are shaped.</p>
          <label>Corner radius<Input type="range" min={0} max={40} value={menu.design.radius} onChange={e=>update({...menu,design:{...menu.design,radius:Number(e.target.value)}})}/></label>
          <div className="shape-presets">
            {[0,6,12,20,40].map(r=><button key={r} className="shape-choice" onClick={()=>update({...menu,design:{...menu.design,radius:r}})}><span style={{borderRadius:r}}/>{r}px</button>)}
          </div>
        </>}

        {/* BACKGROUND */}
        {designerTab==='background'&&<>
          <p className="aside-caption">Choose your menu wallpaper.</p>
          <label>Background color<Input type="color" value={menu.design.background} onChange={e=>update({...menu,design:{...menu.design,background:e.target.value}})}/></label>
          <div className="color-presets">
            {['#faf7ee','#ffffff','#171b18','#fff2de','#fbebe3','#efe7dc','#fff0ed','#fff9d9','#f0e9d7','#192027','#edf4f0','#e8ece7','#fdf2f8','#eff6ff','#f0fdf4'].map(c=><button key={c} style={{background:c}} title={c} onClick={()=>update({...menu,design:{...menu.design,background:c}})}/>)}
          </div>
          <label>Text &amp; accent color<Input type="color" value={menu.design.primary} onChange={e=>update({...menu,design:{...menu.design,primary:e.target.value}})}/></label>
          <div className="color-presets">
            {['#3e6347','#e4cd95','#333333','#8d4025','#9c422b','#5a3e2a','#94614f','#473d27','#775b2e','#ead9b3','#3c7365','#286b50','#7c3aed','#b45309','#0f766e'].map(c=><button key={c} style={{background:c}} title={c} onClick={()=>update({...menu,design:{...menu.design,primary:c}})}/>)}
          </div>
        </>}

        {/* BRANDING */}
        {designerTab==='branding'&&<>
          <p className="aside-caption">Reusable brand settings. Save as a theme to reuse across menus.</p>
          <label>Font<NativeSelect value={menu.design.font} onChange={e=>update({...menu,design:{...menu.design,font:e.target.value as any}})}>{['Georgia','Arial','Verdana'].map(x=><option key={x}>{x}</option>)}</NativeSelect></label>
          <label>Restaurant logo URL<Input value={state.profile.logo} onChange={e=>change({...state,profile:{...state.profile,logo:e.target.value}})}/></label>
          <div className="designer-theme-actions">
            <Button variant="outline" style={{flex:1}} onClick={()=>{change({...state,themes:[...state.themes,{id:crypto.randomUUID(),name:menu.name+' theme',design:menu.design}]});toast.success('Theme saved')}}><Save/>Save as theme</Button>
          </div>
          <h3 style={{marginTop:16}}>Saved themes</h3>
          {state.themes.map(t=><Button key={t.id} variant="ghost" style={{width:'100%',justifyContent:'flex-start'}} onClick={()=>{update({...menu,design:t.design});toast.success(t.name+' applied')}}><Sparkles size={13}/>{t.name}</Button>)}
        </>}

        {/* QR */}
        {designerTab==='qr'&&<>
          <p className="aside-caption">Your stable QR code link. Customize in the QR Codes tab.</p>
          <div className="qr-link-preview">
            <QrIcon size={32} color="#286b50"/>
            <span>/menu/{state.slug}/{menu.slug}</span>
          </div>
          <label>QR color<Input type="color" value={qrColor} onChange={e=>setQrColor(e.target.value)}/></label>
          <Button variant="outline" style={{width:'100%',marginTop:6}} onClick={()=>window.open('/menu/'+state.slug+'/'+menu.slug,'_blank')}><Eye/>Preview live menu</Button>
        </>}
        </div>
      </aside>

      {/* CENTER PREVIEW */}
      <div className="preview-stage">
        <div className="device-controls">
          {deviceSizes.map(([n,label,Icon])=>(<Button key={n} variant={width===n?'default':'ghost'} onClick={()=>setWidth(Number(n))} className="device-btn"><Icon size={13}/>{label}</Button>))}
        </div>
        <div className="device-preview" style={{width,maxWidth:'100%'}}>
          <MenuRenderer menu={menu} profile={state.profile}/>
        </div>
      </div>

      {/* RIGHT PROPERTIES PANEL */}
      <aside className="editor-panel properties">
        <h3>Properties</h3>
        <div style={{height:1,background:'#eef0ec',margin:'0 0 14px'}}/>
        <label>Background<Input type="color" value={menu.design.background} onChange={e=>update({...menu,design:{...menu.design,background:e.target.value}})}/></label>
        <label>Text &amp; accents<Input type="color" value={menu.design.primary} onChange={e=>update({...menu,design:{...menu.design,primary:e.target.value}})}/></label>
        <label>Font<NativeSelect value={menu.design.font} onChange={e=>update({...menu,design:{...menu.design,font:e.target.value as any}})}>{['Georgia','Arial','Verdana'].map(x=><option key={x}>{x}</option>)}</NativeSelect></label>
        <label>Card style<NativeSelect value={menu.design.card} onChange={e=>update({...menu,design:{...menu.design,card:e.target.value as any}})}><option value="card">Card</option><option value="list">List</option></NativeSelect></label>
        <label>Header<NativeSelect value={menu.design.header} onChange={e=>update({...menu,design:{...menu.design,header:e.target.value as any}})}><option value="center">Centered</option><option value="left">Left</option></NativeSelect></label>
        <label>Corner radius · {menu.design.radius}px<Input type="range" min={0} max={40} value={menu.design.radius} onChange={e=>update({...menu,design:{...menu.design,radius:Number(e.target.value)}})}/></label>
        <label>Font size · {menu.design.fontSize}px<Input type="range" min={12} max={24} value={menu.design.fontSize} onChange={e=>update({...menu,design:{...menu.design,fontSize:Number(e.target.value)}})}/></label>
        <label>Spacing · {menu.design.spacing}px<Input type="range" min={0} max={40} value={menu.design.spacing} onChange={e=>update({...menu,design:{...menu.design,spacing:Number(e.target.value)}})}/></label>
        <label>Columns<NativeSelect value={menu.design.columns} onChange={e=>update({...menu,design:{...menu.design,columns:Number(e.target.value)}})}><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option></NativeSelect></label>
        <label>Promo banner<Input value={menu.design.banner} onChange={e=>update({...menu,design:{...menu.design,banner:e.target.value}})} placeholder="Hide"/></label>
      </aside>
    </div>}

    {/* RESTAURANT SETTINGS */}
    {section==='Restaurant Settings'&&<div className="editor-panel settings-grid">
      <h2 style={{gridColumn:'1/-1'}}>Restaurant profile</h2>
      <label>Restaurant name<Input value={state.profile.name} onChange={e=>change({...state,profile:{...state.profile,name:e.target.value}})}/></label>
      <label>Restaurant name in Arabic<Input dir="rtl" value={state.profile.ar} onChange={e=>change({...state,profile:{...state.profile,ar:e.target.value}})}/></label>
      <label>Description<textarea value={state.profile.description} onChange={e=>change({...state,profile:{...state.profile,description:e.target.value}})}/></label>
      <label>Description in Arabic<textarea dir="rtl" value={state.profile.descriptionAr} onChange={e=>change({...state,profile:{...state.profile,descriptionAr:e.target.value}})}/></label>
      <label>Phone number<Input value={state.profile.phone} onChange={e=>change({...state,profile:{...state.profile,phone:e.target.value}})}/></label>
      <label>Address<Input value={state.profile.address} onChange={e=>change({...state,profile:{...state.profile,address:e.target.value}})}/></label>
      <label>Opening hours<Input value={state.profile.hours} onChange={e=>change({...state,profile:{...state.profile,hours:e.target.value}})}/></label>
      <label>Social link (https://)<Input value={state.profile.social} onChange={e=>change({...state,profile:{...state.profile,social:e.target.value}})}/></label>
      <label>Logo image URL<Input value={state.profile.logo} onChange={e=>change({...state,profile:{...state.profile,logo:e.target.value}})}/></label>
      <label>Branches (one per line)<textarea value={state.profile.branches.join('\n')} onChange={e=>change({...state,profile:{...state.profile,branches:e.target.value.split('\n')}})}/></label>
      <div style={{gridColumn:'1/-1'}}>
        <p>Your public menu lives at <b>/menu/{state.slug}/…</b> and requires no customer login.</p>
        <a href="/signout-with-chatgpt?return_to=/" target="_top">Sign out</a>
      </div>
    </div>}

    {/* MEDIA LIBRARY */}
    {section==='Media Library'&&<div className="editor-panel">
      <div className="section-heading"><h2>Media Library</h2></div>
      <label className="upload-label"><Upload/>Upload image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={async e=>{if(e.target.files?.[0])try{await upload(e.target.files[0]);toast.success('Image uploaded')}catch(err){toast.error(String(err))}}}/></label>
      <Input placeholder="Search images" value={query} onChange={e=>setQuery(e.target.value)}/>
      <div className="media-grid">
        {state.media.filter(m=>m.name.toLowerCase().includes(query.toLowerCase())).map(m=>(
          <div key={m.id}>
            <img src={'/api/media/'+m.id} alt={m.name}/>
            <p>{m.name}</p>
            <div style={{display:'flex',gap:6,padding:'0 10px 10px'}}>
              <Button variant="outline" onClick={()=>{change({...state,profile:{...state.profile,logo:'/api/media/'+m.id}});toast.success('Restaurant logo updated')}}>Use as logo</Button>
              <Button variant="ghost" aria-label="Delete image" onClick={async()=>{
                try{
                  await fetch('/api/media/'+m.id,{method:'DELETE'});
                  change({...state,media:state.media.filter(x=>x.id!==m.id)});
                  toast.success('Image deleted');
                }catch(err){toast.error(String(err))}
              }}><Trash2 size={14}/></Button>
            </div>
          </div>
        ))}
      </div>
      {state.media.length===0&&<p>No images yet. Upload food photos, your logo, or backgrounds above.</p>}
    </div>}

    {/* QR CODES */}
    {section==='QR Codes'&&<div className="editor-panel qr-panel">
      <h2>Your menu, one scan away.</h2>
      {qr
        ?<>
          <img src={qr} width={260} alt="Menu QR code"/>
          <label>QR color<Input type="color" value={qrColor} onChange={e=>setQrColor(e.target.value)}/></label>
          <div style={{display:'flex',justifyContent:'center',gap:10,flexWrap:'wrap'}}>
            <a href={qr} download={menu.slug+'-qr.png'}>Download QR code</a>
            <Button variant="outline" onClick={()=>window.print()}>Print</Button>
          </div>
          <p style={{marginTop:14}}>Scanning opens <b>/menu/{state.slug}/{menu.slug}</b>. The address never changes, so reprinting isn&apos;t needed when you update your menu.</p>
          <a href={'/menu/'+state.slug+'/'+menu.slug} target="_blank">View live menu</a>
        </>
        :<p>Publish this menu to generate its QR code.</p>}
    </div>}

    {/* PREVIEW DIALOG */}
    <Dialog open={preview} onOpenChange={setPreview}>
      <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-3xl">
        <DialogTitle>Menu preview</DialogTitle>
        <DialogDescription>Your current draft. Publish to update the live menu.</DialogDescription>
        <ModalRenderCapture menu={menu} profile={state.profile}/>
      </DialogContent>
    </Dialog>

    {/* ITEM EDITOR DIALOG */}
    <Dialog open={!!editing} onOpenChange={open=>!open&&setEditing(null)}>
      <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-2xl">
        <DialogTitle>{editing?.name||'New menu item'}</DialogTitle>
        <DialogDescription>Item details and translations</DialogDescription>
        {editing&&<form onSubmit={e=>{
          e.preventDefault();
          update({...menu,items:menu.items.some(i=>i.id===editing.id)?menu.items.map(i=>i.id===editing.id?editing:i):[...menu.items,editing]});
          setEditing(null);
        }}>
          <div className="settings-grid">
            {(['name','ar','description','descriptionAr','ingredients','allergens','dietary'] as const).map(key=>{
              const isTextarea=key==='description'||key==='descriptionAr'||key==='ingredients';
              const isRtl=key==='ar'||key==='descriptionAr';
              const isRequired=key==='name';
              return <label key={key}>
                {key==='ar'?'Name in Arabic':key==='descriptionAr'?'Description in Arabic':key==='description'?'Description':key}
                {isTextarea
                  ?<textarea required={isRequired} dir={isRtl?'rtl':undefined} value={editing[key]} onChange={e=>setEditing({...editing,[key]:e.target.value})}/>
                  :<Input required={isRequired} dir={isRtl?'rtl':undefined} value={editing[key]} onChange={e=>setEditing({...editing,[key]:e.target.value})}/>}
              </label>;
            })}
            {(['price','discount','calories','spicy'] as const).map(key=>(
              <label key={key}>
                {key==='spicy'?'Spicy level (0-3)':key}
                <Input type="number" step={key==='price'||key==='discount'?'.01':'1'} min="0" max={key==='spicy'?3:100000} value={editing[key]} onChange={e=>setEditing({...editing,[key]:Number(e.target.value)})}/>
              </label>
            ))}
            <label>Category
              <NativeSelect value={editing.categoryId} onChange={e=>setEditing({...editing,categoryId:e.target.value})}>
                {menu.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </NativeSelect>
            </label>
            <label>Image from library
              <NativeSelect value={editing.image} onChange={e=>setEditing({...editing,image:e.target.value})}>
                <option value="">No image</option>
                {state.media.map(m=><option key={m.id} value={'/api/media/'+m.id}>{m.name}</option>)}
              </NativeSelect>
            </label>
            {(['available','featured','hidden'] as const).map(key=>(
              <label key={key} style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                {key==='hidden'?'Hidden on menu':key}
                <Switch checked={editing[key]} onCheckedChange={v=>setEditing({...editing,[key]:v})}/>
              </label>
            ))}
          </div>
          <div className="dialog-actions">
            <Button type="submit">{menu.items.some(i=>i.id===editing.id)?'Save item':'Add item'}</Button>
            {menu.items.some(i=>i.id===editing.id)&&<Button type="button" variant="destructive" onClick={()=>{
              update({...menu,items:menu.items.filter(i=>i.id!==editing.id)});
              setEditing(null);toast('Item deleted');
            }}>Delete</Button>}
          </div>
        </form>}
      </DialogContent>
    </Dialog>
  </div>;
}

/* Render a temporary MenuRenderer for dialog preview without state pollution */
function ModalRenderCapture({menu,profile}:{menu:Menu;profile:State['profile']}){
  return <MenuRenderer menu={menu} profile={profile}/>;
}