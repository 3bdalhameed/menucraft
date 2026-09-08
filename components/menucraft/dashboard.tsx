'use client';
import {useState,useEffect} from 'react';
import Studio from '@/components/menucraft/studio';
import {BookOpen,LayoutDashboard,Palette,Layers,Utensils,Image,QrCode,Settings,Plus,ArrowUpRight,ChevronRight,Bell,Globe,Star} from 'lucide-react';
import {SidebarProvider,Sidebar,SidebarContent,SidebarHeader,SidebarMenu,SidebarMenuItem,SidebarMenuButton,SidebarFooter,SidebarTrigger} from '@/components/ui/sidebar';

const links=[['Overview',LayoutDashboard],['Menus',BookOpen],['Menu Designer',Palette],['Categories',Layers],['Items',Utensils],['Media Library',Image],['QR Codes',QrCode],['Themes',Palette],['Restaurant Settings',Settings]] as const;

export default function Home(){
  const [active,setActive]=useState('Overview');
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    if(active==='Overview'){
      setLoading(true);
      fetch('/api/workspace').then(r=>r.ok?r.json():null).then(d=>{setData(d);setLoading(false)}).catch(()=>setLoading(false));
    }
  },[active]);

  const totalItems=data?.menus?.reduce((sum:number,m:any)=>sum+m.items.length,0)||0;
  const totalViews=data?.analytics?.find((a:any)=>a.kind==='view')?.count||0;
  const totalQr=data?.analytics?.find((a:any)=>a.kind==='qr')?.count||0;
  const publishedCount=data?.published?.length||0;
  const draftCount=(data?.menus?.length||0)-publishedCount;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="brand"><span><Utensils size={21}/></span>MenuCraft<span className="brand-dot">.</span></div>
          <div className="restaurant">
            {data?.profile?.logo?<img src={data.profile.logo} alt="Logo" style={{width:38,height:38,borderRadius:9,objectFit:'cover'}}/>:<div className="monogram">{(data?.profile?.name||'O')[0]}</div>}
            <div><b>{data?.profile?.name||'Your restaurant'}</b><small>Restaurant workspace</small></div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <p className="nav-caption">WORKSPACE</p>
          <SidebarMenu>
            {links.map(([label,Icon])=>(
              <SidebarMenuItem key={label}>
                <SidebarMenuButton isActive={active===label} onClick={()=>setActive(label)}>
                  <Icon/><span>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="workspace-status"><span className="status-dot"/> Your restaurant, beautifully served.</div>
          <div className="restaurant"><div className="avatar">AM</div><div><b>Account</b><small>Restaurant owner</small></div></div>
        </SidebarFooter>
      </Sidebar>

      <div className="workspace">
        <header className="topbar">
          <div><SidebarTrigger/><span>Workspace</span><ChevronRight size={14}/><b>{active}</b></div>
          <div>
            <span className="branch">{(data?.profile?.branches||['Main'])[0]} branch</span>
            <Bell size={18}/>
            <div className="avatar">AM</div>
          </div>
        </header>

        <main className="dashboard">
          <div className="page-heading">
            <div>
              <p className="eyebrow">YOUR RESTAURANT AT A GLANCE</p>
              <h1>{active==='Overview'?'A fresh look at your menus.':active}</h1>
              <p>Let&apos;s make something delicious.</p>
            </div>
            <button className="primary" onClick={()=>setActive('Menus')}>
              <Plus size={17}/> Create menu
            </button>
          </div>

          {active!=='Overview'
            ?<Studio section={active}/>
            :loading
              ?<><div className="stats">{Array.from({length:4}).map((_,i)=><div key={i} className="stat" style={{minHeight:100}}><div style={{height:10,width:60,background:'#eef0ec',borderRadius:4,marginBottom:12}}/><div style={{height:30,width:80,background:'#eef0ec',borderRadius:6,marginBottom:8}}/><div style={{height:10,width:120,background:'#eef0ec',borderRadius:4}}/></div>)}</div>
              <div className="table-wrap" style={{minHeight:200}}><div className="table-header"><div style={{height:14,width:120,background:'#eef0ec',borderRadius:4}}/></div>{Array.from({length:3}).map((_,i)=><div key={i} style={{padding:18,display:'flex',gap:10,alignItems:'center'}}><div style={{width:34,height:34,borderRadius:8,background:'#eef0ec'}}/><div style={{flex:1}}><div style={{height:11,width:150,background:'#eef0ec',borderRadius:4,marginBottom:6}}/><div style={{height:9,width:90,background:'#eef0ec',borderRadius:4}}/></div></div>)}</div></>
              :<>
                <div className="quick-actions">
                  <button className="quick-action" onClick={()=>setActive('Menu Designer')}><span className="quick-action-icon"><Palette size={18}/></span>Design a menu</button>
                  <button className="quick-action" onClick={()=>setActive('Items')}><span className="quick-action-icon"><Utensils size={18}/></span>Add menu item</button>
                  <button className="quick-action" onClick={()=>setActive('QR Codes')}><span className="quick-action-icon"><QrCode size={18}/></span>Get QR codes</button>
                  <button className="quick-action" onClick={()=>setActive('Media Library')}><span className="quick-action-icon"><Image size={18}/></span>Upload photos</button>
                </div>

                <div className="stats">
                  <div className="stat highlight"><small>Published menus</small><strong>{publishedCount}</strong><span>{draftCount} still in draft</span></div>
                  <div className="stat"><small>Total menu items</small><strong>{totalItems}</strong><span>Across {data?.menus?.length||0} menus</span></div>
                  <div className="stat"><small>Menu views</small><strong>{totalViews}</strong><span>All time customer views</span></div>
                  <div className="stat"><small>QR code scans</small><strong>{totalQr}</strong><span>Scans from printed QR codes</span></div>
                </div>

                <div className="table-wrap">
                  <div className="table-header"><h3>Your menus</h3><span style={{fontSize:11,color:'#839384'}}>{data?.menus?.length||0} menus</span></div>
                  <table>
                    <thead><tr><th>Menu</th><th>Categories</th><th>Items</th><th>Status</th><th>Address</th></tr></thead>
                    <tbody>
                      {data?.menus?.map((m:any)=>(
                        <tr key={m.id}>
                          <td><b style={{fontSize:13}}>{m.name}</b></td>
                          <td>{m.categories.length}</td>
                          <td>{m.items.length}</td>
                          <td><span className={`status-badge ${data.published.some((p:any)=>p.id===m.id)?'published':'draft'}`}>{data.published.some((p:any)=>p.id===m.id)?'Published':'Draft'}</span></td>
                          <td><a className="view-link" href={`/menu/${data.slug}/${m.slug}`} target="_blank">/menu/{data.slug}/{m.slug} <ArrowUpRight size={11}/></a></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:14,marginTop:16}}>
                  {data?.published?.length>0&&(
                    <div className="activity-list">
                      <div className="activity-header"><h3>Recent activity</h3></div>
                      <div className="activity-item"><span className="activity-dot view"/><div><div className="activity-text"><b>{totalViews}</b> menu view{totalViews===1?'':'s'}</div><div className="activity-time">All time across your published menus</div></div></div>
                      <div className="activity-item"><span className="activity-dot qr"/><div><div className="activity-text"><b>{totalQr}</b> QR scan{totalQr===1?'':'s'}</div><div className="activity-time">Customers discovering your menu</div></div></div>
                      {data?.published?.length>0&&<div className="activity-item"><span className="activity-dot publish"/><div><div className="activity-text">{data.published[data.published.length-1].slug} was published</div><div className="activity-time">{new Date(data.published[data.published.length-1].published_at).toLocaleString()}</div></div></div>}
                    </div>
                  )}
                  <div className="activity-list">
                    <div className="activity-header"><h3>Quick tips</h3></div>
                    <div className="activity-item"><Star size={14} color="#f59e0b" style={{marginTop:2}}/><div><div className="activity-text">Feature your best dishes with the <b>featured</b> flag</div><div className="activity-time">Featured items stand out to customers</div></div></div>
                    <div className="activity-item"><Globe size={14} color="#286b50" style={{marginTop:2}}/><div><div className="activity-text">Add Arabic translations for bilingual menus</div><div className="activity-time">MenuCraft auto-detects and switches RTL</div></div></div>
                    <div className="activity-item"><QrCode size={14} color="#8b5cf6" style={{marginTop:2}}/><div><div className="activity-text">Print your QR code on tables</div><div className="activity-time">Customers scan and view instantly</div></div></div>
                  </div>
                </div>
              </>
          }
        </main>
      </div>
    </SidebarProvider>
  );
}