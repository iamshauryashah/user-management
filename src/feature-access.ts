import type { Env } from "./auth";

export const FEATURE_CATALOG = [
  { key: "touchline-auto-ready", site: "Touchline", name: "Auto-ready", description: "Automatically mark a club ready on a timer.", locked: false },
  { key: "feedback-drag-drop", site: "Feedback", name: "Move feedback cards", description: "Drag feedback cards between Kanban columns and change their status. Admin-only.", locked: true }
] as const;
const featureKeys = new Set<string>(FEATURE_CATALOG.map(f=>f.key));
type Role = "guest" | "standard" | "premium" | "admin";
type Policy = Record<Role,boolean>;
const defaults: Policy = { guest:false, standard:false, premium:true, admin:true };
const adminOnly: Policy = { guest:false, standard:false, premium:false, admin:true };
const fixedAdminFeature = (key:string) => key === "feedback-drag-drop";
type Row = { guest:number; standard:number; premium:number; admin:number };
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body), {status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});
const policy=(row:Row|null|undefined):Policy=>row?{guest:row.guest===1,standard:row.standard===1,premium:row.premium===1,admin:row.admin===1}:{...defaults};

export async function evaluateFeature(env:Env,key:string,role:Role):Promise<boolean>{
  if(!featureKeys.has(key))return false;
  if(fixedAdminFeature(key))return role==="admin";
  const row=await env.DB.prepare("SELECT guest,standard,premium,admin FROM feature_access WHERE feature_key=?").bind(key).first<Row>();
  return policy(row)[role];
}
export async function handleFeatureAdmin(request:Request,env:Env):Promise<Response>{
 const url=new URL(request.url);
 if(url.pathname==="/api/admin/features"&&request.method==="GET"){
  const rows=await env.DB.prepare("SELECT feature_key,guest,standard,premium,admin FROM feature_access").all<Row & {feature_key:string}>();
  const byKey=new Map((rows.results||[]).map(row=>[row.feature_key,row]));
  return reply({features:FEATURE_CATALOG.map(feature=>({...feature,policy:feature.locked?{...adminOnly}:policy(byKey.get(feature.key))}))});
 }
 const match=url.pathname.match(/^\/api\/admin\/features\/([a-z0-9-]+)$/);
 if(!match||request.method!=="POST")return reply({message:"Not found"},404);
 const key=match[1];if(!featureKeys.has(key))return reply({message:"Unknown feature"},404);
 if(fixedAdminFeature(key))return reply({message:"Feedback card management is permanently admin-only"},403);
 if(request.headers.get("Origin")!==new URL(env.BETTER_AUTH_URL).origin)return reply({message:"Forbidden origin"},403);
 if(!(request.headers.get("Content-Type")||"").toLowerCase().startsWith("application/json"))return reply({message:"JSON required"},415);
 let parsed:unknown;try{parsed=await request.json();}catch{return reply({message:"Invalid JSON"},400);}
 if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))return reply({message:"Invalid policy"},400);
 const p=parsed as Record<string,unknown>, roles=["guest","standard","premium","admin"] as const;
 if(Object.keys(p).length!==4||!roles.every(role=>typeof p[role]==="boolean"))return reply({message:"Four boolean role permissions required"},400);
 await env.DB.prepare("INSERT INTO feature_access (feature_key,guest,standard,premium,admin,updated_at) VALUES (?,?,?,?,?,unixepoch()) ON CONFLICT(feature_key) DO UPDATE SET guest=excluded.guest,standard=excluded.standard,premium=excluded.premium,admin=excluded.admin,updated_at=unixepoch()")
 .bind(key,p.guest?1:0,p.standard?1:0,p.premium?1:0,p.admin?1:0).run();
 return reply({ok:true,key,policy:p});
}
