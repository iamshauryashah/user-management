export const PAGE_CATALOG = [
  { key:"landing", name:"Shaurya's Websites", url:"https://www.shauryaswebsites.com/" },
  { key:"gerry", name:"Gerry the Salamander", url:"https://gerry.shauryaswebsite.com/" },
  { key:"midterm", name:"Midterm-UJ", url:"https://midterm-uj.shauryaswebsite.com/" },
  { key:"road-to-270", name:"Road to 270", url:"https://presidentialsim.shauryaswebsites.com/" },
  { key:"qed", name:"QED Project", url:"https://qed.shauryaswebsites.com/" },
  { key:"soccer-sim", name:"Soccer Sim", url:"https://soccersim.shauryaswebsites.com/" },
  { key:"army", name:"Army Game", url:"https://army.shauryaswebsite.com/" },
  { key:"touchline", name:"Touchline", url:"https://soccermanager.shauryaswebsites.com/" },
  { key:"feedback", name:"Feedback", url:"https://feedback.shauryaswebsites.com/" },
  { key:"message-board", name:"Message Board", url:"https://secret.shauryaswebsites.com/" },
  { key:"race", name:"Race to Whitehouse", url:"https://race.shauryaswebsite.com/" },
  { key:"about", name:"About Me", url:"https://hello.shauryaswebsite.com/" },
  { key:"admin", name:"Admin Dashboard", url:"https://auth.shauryaswebsites.com/admin" }
] as const;
export type PageKey = (typeof PAGE_CATALOG)[number]["key"];
export const PAGE_KEYS = new Set<string>(PAGE_CATALOG.map(page => page.key));
export type PageRole = "guest" | "standard" | "premium" | "admin";
export type PagePolicy = Record<PageRole, boolean>;
export const DEFAULT_PAGE_POLICY: PagePolicy = { guest:true, standard:true, premium:true, admin:true };
export const ADMIN_PAGE_POLICY: PagePolicy = { guest:false, standard:false, premium:false, admin:true };
export function defaultPolicy(key:string):PagePolicy {
  return { ...(key === "admin" ? ADMIN_PAGE_POLICY : DEFAULT_PAGE_POLICY) };
}
export function policyFromRow(key:string, row: { guest:number;standard:number;premium:number;admin:number }|null|undefined):PagePolicy {
  if(key === "admin")return defaultPolicy(key);
  if(!row)return defaultPolicy(key);
  return {guest:row.guest === 1, standard:row.standard===1,premium:row.premium===1,admin:row.admin===1};
}
