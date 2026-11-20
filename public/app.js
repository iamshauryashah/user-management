const el=(id)=>document.getElementById(id);
// Forward the signed OAuth request when sign-in was initiated by ChatGPT.
const oauthQuery=window.location.search.includes("sig=")?window.location.search.slice(1):null;
let mode="signup", checkId=0;
function setMode(next){
  mode=next;
  el("signupTab").classList.toggle("active",next==="signup");
  el("loginTab").classList.toggle("active",next==="login");
  el("signupTab").setAttribute("aria-selected",String(next==="signup"));
  el("loginTab").setAttribute("aria-selected",String(next==="login"));
  el("heading").textContent=next==="signup"?"Create your account":"Welcome back";
  el("submit").textContent=next==="signup"?"Create account":"Log in";
  el("avatarGroup").hidden=next!=="signup";
  el("password").autocomplete=next==="signup"?"new-password":"current-password";
  el("password").minLength=next==="signup"?12:1;
  el("message").textContent="";
}
el("signupTab").addEventListener("click",()=>setMode("signup"));
el("loginTab").addEventListener("click",()=>setMode("login"));
function message(text,good=false,target="message"){
  const node=el(target);node.textContent=text;node.classList.toggle("good",good);
}
async function api(path,options){
  const res=await fetch(path,{credentials:"same-origin",...options});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.message||data.error||"Something went wrong. Try again.");
  return data;
}
async function session(){
  const me=await api("/api/me");
  el("guest").hidden=!!me;el("member").hidden=!me;
  if(me){
    const title=me.avatarName||"Player";
    el("memberHeading").textContent=title;
    el("memberEmail").textContent=me.email;
    el("avatarCircle").textContent=title.charAt(0).toUpperCase();
  }
}
el("avatar").addEventListener("input",async()=>{
  const id=++checkId,name=el("avatar").value.trim();
  if(!name){el("nameStatus").textContent="";return;}
  if(!/^[A-Za-z0-9_]{3,24}$/.test(name)){el("nameStatus").textContent="3–24 characters";return;}
  try{
    const data=await api("/api/avatar-availability?name="+encodeURIComponent(name));
    if(id===checkId)el("nameStatus").textContent=data.available?"✓ Available":"Already taken or reserved";
  }catch{if(id===checkId)el("nameStatus").textContent="Check unavailable";}
});
el("form").addEventListener("submit",async(event)=>{
  event.preventDefault();
  const submit=el("submit"),email=el("email").value.trim(),password=el("password").value,avatarName=el("avatar").value.trim();
  submit.disabled=true;message("");
  try{
    if(mode==="signup"){
      const response=await api("/api/auth/sign-up/email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password,name:avatarName||"Player",...(avatarName?{avatarName}:{}),...(oauthQuery?{oauth_query:oauthQuery}:{})})});
    }else{
      const response=await api("/api/auth/sign-in/email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password,...(oauthQuery?{oauth_query:oauthQuery}:{})})});
      if(response?.redirect && typeof response.url==="string"){window.location.assign(response.url);return;}
    }
    el("password").value="";
    await session();
  }catch(error){message(error.message||"Unable to authenticate");}
  finally{submit.disabled=false;}
});
el("logout").addEventListener("click",async()=>{
  try{await api("/api/auth/sign-out",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});await session();}
  catch(error){message(error.message||"Unable to sign out",false,"memberMessage");}
});
session().catch(()=>message("Unable to check session. Please try again."));
