const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const {DatabaseSync}=require('node:sqlite');

// Run with node --test tests/accounts.test.cjs from the project directory.
// Execute the actual TypeScript handlers against an isolated SQLite database.
// Only platform headers and the D1 transport are replaced; user data is untouched.
function load(file,dependencies){
  const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};
  new Function('require','module','exports',output)(name=>name in dependencies?dependencies[name]:require(name),module,module.exports);
  return module.exports;
}
const sqlite=new DatabaseSync(':memory:');
for(const name of fs.readdirSync('drizzle').filter(name=>name.endsWith('.sql')).sort())sqlite.exec(fs.readFileSync('drizzle/'+name,'utf8'));
const database={
  prepare(sql){return {values:[],bind(...values){return {...this,values}},async first(){return sqlite.prepare(sql).get(...this.values)||null},async all(){return {results:sqlite.prepare(sql).all(...this.values)}},async run(){const result=sqlite.prepare(sql).run(...this.values);return {meta:{changes:Number(result.changes)}}}}},
  async batch(statements){sqlite.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());sqlite.exec('COMMIT');return results}catch(error){sqlite.exec('ROLLBACK');throw error}},
};
let currentHeaders=new Headers();
const auth=load('app/chatgpt-auth.ts',{'next/headers':{headers:async()=>currentHeaders},'next/navigation':{redirect:path=>{throw new Error('REDIRECT:'+path)}}});
const model=load('lib/menucraft/model.ts',{});
const server=load('lib/menucraft/server.ts',{'cloudflare:workers':{env:{DB:database}},'@/app/chatgpt-auth':auth,'./model':model});
const api=load('app/api/workspace/route.ts',{'@/lib/menucraft/server':server,'@/lib/menucraft/model':model});
const signIn=id=>{currentHeaders=new Headers({'oai-authenticated-user-id':id,'oai-authenticated-user-email':id+'@example.test'})};
const post=(body,origin='https://tablemint.test')=>api.POST(new Request('https://tablemint.test/api/workspace',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)}));

test('anonymous requests cannot load or mutate restaurant data',async()=>{
  currentHeaders=new Headers();assert.equal((await api.GET()).status,401);assert.equal((await post({action:'publish',menuId:'anything'})).status,401);
  await assert.rejects(auth.requireChatGPTUser('/dashboard'),/REDIRECT:\/signin-with-chatgpt/);
});
test('sign-in return paths reject external and reserved routes',()=>{
  for(const value of ['https://evil.test','//evil.test','/\\evil.test','/callback','/signout-with-chatgpt'])assert.equal(auth.chatGPTSignInPath(value),'/signin-with-chatgpt?return_to=%2F');
  assert.equal(auth.chatGPTSignInPath('/dashboard'),'/signin-with-chatgpt?return_to=%2Fdashboard');
});
test('new owners get separate empty workspaces and saved setup survives reload',async()=>{
  signIn('alice');const first=await server.workspace();assert.equal(first.setupRequired,true);assert.equal(first.profile.name,'');assert.equal(first.menus[0].items.length,0);
  first.profile.name='Alice Kitchen';first.profile.setupCompleted=true;
  assert.equal((await post({action:'save',state:first})).status,200);
  assert.equal((await server.workspace()).setupRequired,false);
  assert.equal((await server.workspace()).profile.name,'Alice Kitchen');
  signIn('bob');const second=await server.workspace();assert.notEqual(first.slug,second.slug);assert.equal(second.profile.name,'');
  assert.equal((await post({action:'publish',menuId:first.menus[0].id})).status,400);
});
test('cross-origin writes and blank restaurant setup are rejected',async()=>{
  signIn('bob');const workspace=await server.workspace();
  assert.equal((await post({action:'save',state:workspace},'https://evil.test')).status,403);
  assert.equal((await post({action:'save',state:workspace})).status,400);
});
test('publishing requires visible dishes; snapshots stay isolated from drafts',async()=>{
  signIn('alice');const workspace=await server.workspace();const menu=workspace.menus[0];
  assert.equal((await post({action:'publish',menuId:menu.id})).status,400);
  const sample=model.seed().menus[0];menu.categories=sample.categories;menu.items=sample.items;
  assert.equal((await post({action:'save',state:workspace})).status,200);
  assert.equal((await post({action:'publish',menuId:menu.id})).status,200);
  const updated=await server.workspace();updated.menus[0].items[0].name='Private draft';
  assert.equal((await post({action:'save',state:updated})).status,200);
  const published=sqlite.prepare('SELECT snapshot FROM publications WHERE id=?').get(menu.id);
  assert.notEqual(JSON.parse(published.snapshot).menu.items[0].name,'Private draft');
  signIn('bob');assert.equal((await post({action:'restore',versionId:updated.history[0].id})).status,400);
});
test('stale edits do not overwrite newer saves',async()=>{
  signIn('alice');const workspace=await server.workspace();
  assert.equal((await post({action:'save',state:workspace})).status,200);
  assert.equal((await post({action:'save',state:workspace})).status,400);
});
test('activity charts aggregate recent visits without exposing another restaurant',async()=>{
  signIn('alice');const alice=await server.workspace();const today=new Date().toISOString();
  const insert=sqlite.prepare('INSERT INTO events(id,menu_id,kind,created_at) VALUES(?,?,?,?)');
  insert.run(crypto.randomUUID(),alice.menus[0].id,'view',today);
  insert.run(crypto.randomUUID(),alice.menus[0].id,'view',today);
  insert.run(crypto.randomUUID(),alice.menus[0].id,'qr',today);
  insert.run(crypto.randomUUID(),alice.menus[0].id,'view','2000-01-01T00:00:00.000Z');
  insert.run(crypto.randomUUID(),alice.menus[0].id,'write',today);
  const activity=await server.workspace();
  assert.equal(activity.analyticsThrough,today.slice(0,10));
  assert.deepEqual(activity.activity.map(row=>({...row})).sort((a,b)=>a.kind.localeCompare(b.kind)),[{day:today.slice(0,10),kind:'qr',count:1},{day:today.slice(0,10),kind:'view',count:2}]);
  signIn('bob');assert.deepEqual((await server.workspace()).activity,[]);
});
