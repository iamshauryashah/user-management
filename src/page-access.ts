import type { Env } from "./auth";
import { PAGE_CATALOG, PAGE_KEYS, defaultPolicy, policyFromRow } from "./page-catalog";

type Row = { page_key:string;guest:number;standard:number;premium:number;admin:number };
const reply=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});
export async function handlePageAdministration(request:Request,env:Env):Promise<Response>{
  const url=new URL(request.url);
  if(url.pathname==="/api/admin/pages" && request.method==="GET"){
    const rows=await env.DB.prepare("SELECT page_key,guest,standard,premium,admin FROM page_access").all<Row>();
    const byKey=new Map((rows.results||[]).map(row=>[row.page_key,row]));
    return reply({pages:PAGE_CATALOG.map(page=>({...page,policy:policyFromRow(page.key,byKey.get(page.key)),locked:page.key==="admin"}))});
  }
  const matched=url.pathname.match(/^\/api\/admin\/pages\/([a-z0-9-]+)$/);
  if(!matched || request.method!=="POST")return reply({message:"Not found"},404);
  const key=matched[1];
  if(!PAGE_KEYS.has(key))return reply({message:"Unknown page"},404);
  if(key==="admin")return reply({message:"Admin dashboard permissions are permanently admin-only"},403);
  if(request.headers.get("Origin")!==new URL(env.BETTER_AUTH_URL).origin)return reply({message:"Forbidden origin"},403);
  if(!(request.headers.get("Content-Type")||"").toLowerCase().startsWith("application/json"))return reply({message:"JSON required"},415);
  let parsed:unknown;
  try{parsed=await request.json();}catch{return reply({message:"Invalid JSON"},400);}
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))return reply({message:"Invalid policy"},400);
  const p=parsed as Record<string,unknown>,roles=["guest","standard","premium","admin"];
  if(Object.keys(p).length!==4 || !roles.every(role=>typeof p[role]==="boolean"))return reply({message:"Provide four boolean role permissions"},400);
  await env.DB.prepare("INSERT INTO page_access (page_key,guest,standard,premium,admin,updated_at) VALUES (?,?,?,?,?,unixepoch()) ON CONFLICT(page_key) DO UPDATE SET guest=excluded.guest,standard=excluded.standard,premium=excluded.premium,admin=excluded.admin,updated_at=unixepoch()")
    .bind(key,p.guest?1:0,p.standard?1:0,p.premium?1:0,p.admin?1:0).run();
  return reply({ok:true,key,policy:policyFromRow(key,{guest:p.guest?1:0,standard:p.standard?1:0,premium:p.premium?1:0,admin:p.admin?1:0})});
}

export async function checkPageAccess(env:Env,key:string,role:"guest"|"standard"|"premium"|"admin"):Promise<boolean>{
  if(!PAGE_KEYS.has(key))return false;
  if(key==="admin")return role==="admin";
  const row=await env.DB.prepare("SELECT guest,standard,premium,admin FROM page_access WHERE page_key=?").bind(key).first<Row>();
  return policyFromRow(key,row)[role];
}
