import {workspace,save,owner,db} from '@/lib/menucraft/server';
import {stateSchema} from '@/lib/menucraft/model';

export async function GET(){
  try{
    return Response.json(await workspace(),{headers:{'Cache-Control':'private, no-store'}});
  }catch(e){
    const unauthorized=e instanceof Error&&e.message==='Unauthorized';
    return Response.json({error:unauthorized?'Please log in to continue.':'Your workspace could not be loaded. Please try again.'},{status:unauthorized?401:500});
  }
}

export async function POST(request:Request){
  try{
    if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Invalid origin'},{status:403});
    const raw=await request.text();
    if(raw.length>2000000)return Response.json({error:'Workspace too large'},{status:413});
    const body=JSON.parse(raw) as {action?:string;state?:unknown;menuId?:string;versionId?:string};

    const actor=await owner();
    const recent=await db().prepare('SELECT COUNT(*) AS count FROM events WHERE menu_id=? AND kind=? AND created_at>?')
      .bind(actor.id,'write',new Date(Date.now()-60000).toISOString()).first<{count:number}>();
    if((recent?.count||0)>120)return Response.json({error:'Too many requests. Try again shortly.'},{status:429});
    await db().prepare('INSERT INTO events(id,menu_id,kind,created_at) VALUES(?,?,?,?)')
      .bind(crypto.randomUUID(),actor.id,'write',new Date().toISOString()).run();

    if(body.action==='save'){
      const state=stateSchema.parse(body.state);
      if(!state.profile.name.trim())return Response.json({error:'Enter your restaurant name before saving.'},{status:400});
      return Response.json({revision:await save(state)});
    }

    const r=await owner();

    if(body.action==='publish'){
      const row=await db().prepare('SELECT data FROM records WHERE restaurant_id=? AND id=? AND kind=?')
        .bind(r.id,body.menuId,'menu').first<{data:string}>();
      if(!row)throw new Error('Menu not found');
      const menu=JSON.parse(row.data);
      if(!JSON.parse(r.profile).name.trim()||!menu.items.some((item:{hidden:boolean})=>!item.hidden))return Response.json({error:'Add your restaurant name and at least one visible dish before publishing.'},{status:400});
      const snapshot=JSON.stringify({profile:JSON.parse(r.profile),menu}),date=new Date().toISOString();
      await db().batch([
        db().prepare('INSERT INTO publications(id,restaurant_id,slug,snapshot,published_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET snapshot=excluded.snapshot,published_at=excluded.published_at WHERE publications.restaurant_id=excluded.restaurant_id')
          .bind(menu.id,r.id,menu.slug,snapshot,date),
        db().prepare('INSERT INTO versions(id,restaurant_id,menu_id,snapshot,created_at) VALUES(?,?,?,?,?)')
          .bind(crypto.randomUUID(),r.id,menu.id,snapshot,date),
      ]);
      return Response.json({ok:true});
    }

    if(body.action==='restore'){
      const v=await db().prepare('SELECT snapshot FROM versions WHERE id=? AND restaurant_id=?')
        .bind(body.versionId,r.id).first<{snapshot:string}>();
      if(!v)throw new Error('Version not found');
      const snapshot=JSON.parse(v.snapshot);
      return Response.json({menu:snapshot.menu});
    }

    if(body.action==='deleteMenu'){
      const row=await db().prepare('SELECT id FROM records WHERE restaurant_id=? AND id=? AND kind=?')
        .bind(r.id,body.menuId,'menu').first();
      if(!row)throw new Error('Menu not found');
      await db().batch([
        db().prepare('DELETE FROM records WHERE restaurant_id=? AND id=? AND kind=?').bind(r.id,body.menuId,'menu'),
        db().prepare('DELETE FROM publications WHERE restaurant_id=? AND id=?').bind(r.id,body.menuId),
        db().prepare('DELETE FROM versions WHERE restaurant_id=? AND menu_id=?').bind(r.id,body.menuId),
      ]);
      return Response.json({ok:true});
    }

    return Response.json({error:'Unknown action'},{status:400});
  }catch(e){
    if(e instanceof Error&&e.message==='Unauthorized')return Response.json({error:'Please log in to continue.'},{status:401});
    return Response.json({error:String(e)},{status:400});
  }
}
