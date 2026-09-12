'use client';
import {useState} from 'react';
import {Area,AreaChart,Bar,BarChart,CartesianGrid,Legend,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import type {Menu} from '@/lib/menucraft/model';

type Activity={day:string;kind:'view'|'qr';count:number};
const dateLabel=(day:string)=>new Intl.DateTimeFormat('en',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(day+'T00:00:00Z'));

export default function DashboardCharts({activity=[],through,menus}:{activity?:Activity[];through?:string;menus:Menu[]}){
  const [days,setDays]=useState(30);
  const end=new Date((through||new Date().toISOString().slice(0,10))+'T00:00:00Z');
  const timeline=Array.from({length:days},(_,index)=>{
    const date=new Date(end);date.setUTCDate(date.getUTCDate()-(days-1-index));
    const day=date.toISOString().slice(0,10);
    return {day,views:activity.filter(row=>row.day===day&&row.kind==='view').reduce((sum,row)=>sum+row.count,0),qr:activity.filter(row=>row.day===day&&row.kind==='qr').reduce((sum,row)=>sum+row.count,0)};
  });
  const totals=timeline.reduce((sum,day)=>({views:sum.views+day.views,qr:sum.qr+day.qr}),{views:0,qr:0});
  const menuCounts=menus.map(menu=>({id:menu.id,name:menu.name,items:menu.items.length}));
  const totalItems=menuCounts.reduce((sum,menu)=>sum+menu.items,0);
  return <div className="dashboard-charts">
    <section className="dashboard-chart-card" aria-labelledby="activity-chart-title">
      <div className="dashboard-chart-heading"><div><h2 id="activity-chart-title">Menu activity</h2><p>Recorded visits over time</p></div>
        <div className="chart-range" role="group" aria-label="Activity time range">{[7,30].map(range=><button key={range} aria-pressed={days===range} onClick={()=>setDays(range)}>{range} days</button>)}</div>
      </div>
      <div className="chart-totals" aria-live="polite"><span><strong>{totals.views.toLocaleString()}</strong> direct views</span><span><strong>{totals.qr.toLocaleString()}</strong> QR scans</span></div>
      <div className="chart-canvas">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={timeline} margin={{top:12,right:14,bottom:0,left:-20}} accessibilityLayer>
            <defs><linearGradient id="views-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2f7653" stopOpacity={.22}/><stop offset="100%" stopColor="#2f7653" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid vertical={false} stroke="#e9eee6" strokeDasharray="4 4"/>
            <XAxis dataKey="day" tickFormatter={dateLabel} minTickGap={32} axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#718074'}}/>
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#718074'}}/>
            <Tooltip labelFormatter={label=>dateLabel(String(label))} contentStyle={{borderRadius:12,borderColor:'#dce5d8',fontSize:13}}/>
            <Legend iconType="circle" wrapperStyle={{fontSize:12,paddingTop:12}}/>
            <Area type="monotone" name="Direct views" dataKey="views" stroke="#2f7653" strokeWidth={2.5} fill="url(#views-fill)" isAnimationActive={false}/>
            <Area type="monotone" name="QR scans" dataKey="qr" stroke="#c57c38" strokeWidth={2.5} strokeDasharray="5 3" fill="transparent" isAnimationActive={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="chart-note">{totals.views+totals.qr===0?'No visits in this period. Publish a menu and share its link or QR code.':'Each menu load is counted once as a direct view or a QR scan. Repeat visits are included.'} Dates use UTC.</p>
      <details className="chart-data"><summary>View activity data</summary><div><table><caption>Last {days} days (UTC)</caption><thead><tr><th>Date</th><th>Direct views</th><th>QR scans</th></tr></thead><tbody>{timeline.map(day=><tr key={day.day}><td>{dateLabel(day.day)}</td><td>{day.views}</td><td>{day.qr}</td></tr>)}</tbody></table></div></details>
    </section>
    <section className="dashboard-chart-card" aria-labelledby="menus-chart-title">
      <div className="dashboard-chart-heading"><div><h2 id="menus-chart-title">Items by menu</h2><p>Your current saved menu collection</p></div></div>
      <div className="chart-totals"><span><strong>{totalItems.toLocaleString()}</strong> items across {menus.length} menus</span></div>
      {totalItems>0?<div className="menu-chart-scroll"><div style={{height:Math.max(240,menuCounts.length*44)}}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={menuCounts} layout="vertical" margin={{top:8,right:20,bottom:0,left:0}} accessibilityLayer>
            <CartesianGrid horizontal={false} stroke="#e9eee6" strokeDasharray="4 4"/>
            <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#718074'}}/>
            <YAxis type="category" dataKey="id" width={105} tickFormatter={id=>{const name=menuCounts.find(menu=>menu.id===id)?.name||'';return name.length>15?name.slice(0,14)+'…':name}} axisLine={false} tickLine={false} tick={{fontSize:12,fill:'#526258'}}/>
            <Tooltip labelFormatter={id=>menuCounts.find(menu=>menu.id===String(id))?.name||String(id)} cursor={{fill:'#f2f5ee'}} contentStyle={{borderRadius:12,borderColor:'#dce5d8',fontSize:13}}/>
            <Bar dataKey="items" name="Items" fill="#78936a" radius={[0,5,5,0]} maxBarSize={24} isAnimationActive={false}/>
          </BarChart>
        </ResponsiveContainer>
      </div></div>:<div className="chart-empty"><strong>Your menu starts with one dish.</strong><p>Add items to see how your menus compare.</p></div>}
      <p className="chart-note">Includes hidden and unavailable items in saved drafts.</p>
      <details className="chart-data"><summary>View item counts</summary><div><table><caption>Items by saved menu</caption><thead><tr><th>Menu</th><th>Items</th></tr></thead><tbody>{menuCounts.map(menu=><tr key={menu.id}><td>{menu.name}</td><td>{menu.items}</td></tr>)}</tbody></table></div></details>
    </section>
  </div>;
}
