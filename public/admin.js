(() => {
const $=id=>document.getElementById(id), state={users:[],page:0,hasMore:false,q:"",loading:false};
const msg=(text,error=false)=>{const el=$("messagePanel");el.textContent=text;el.classList.toggle("error",error);el.hidden=!text;};
async function api(url,init){
 const res=await fetch(url,{credentials:"same-origin",cache:"no-store",...init});
 const body=await res.json().catch(()=>({}));
 if(!res.ok)throw new Error(body.message||"Request failed");
 return body;
}
function td(tr){const cell=document.createElement("td");tr.append(cell);return cell;}
function render(){
 const body=$("users");body.replaceChildren();
 if(!state.users.length){const tr=document.createElement("tr"),cell=td(tr);cell.colSpan=5;cell.textContent="No matching users found.";body.append(tr);}
 for(const user of state.users){
   const tr=document.createElement("tr"),account=td(tr);
   const title=document.createElement("strong");title.textContent=user.avatarName||"Unnamed player";
   const email=document.createElement("small");email.textContent=user.email;
   account.append(title,email);
   const joined=td(tr);joined.textContent=new Date(user.createdAt*1000).toLocaleDateString();
   const premiumCell=td(tr),adminCell=td(tr),actionCell=td(tr);
   function toggle(cell,value,label){
     const wrapper=document.createElement("label");wrapper.className="role";
     const input=document.createElement("input");input.type="checkbox";input.checked=value;
     const span=document.createElement("span");span.textContent=label;
     wrapper.append(input,span);cell.append(wrapper);return input;
   }
   const premium=toggle(premiumCell,user.isPremium,"Premium"),admin=toggle(adminCell,user.isAdmin,"Admin");
   const save=document.createElement("button");save.className="save";save.type="button";save.textContent="Save";save.disabled=true;
   const dirty=()=>save.disabled=premium.checked===user.isPremium && admin.checked===user.isAdmin;
   premium.addEventListener("change",dirty);admin.addEventListener("change",dirty);
   save.addEventListener("click",async()=>{
     if(!confirm("Update access for "+user.email+"?"))return;
     save.disabled=true;msg("Saving access changes…");
     try{
       await api("/api/admin/users/"+encodeURIComponent(user.id)+"/access",{
         method:"POST",headers:{"Content-Type":"application/json"},
         body:JSON.stringify({isAdmin:admin.checked,isPremium:premium.checked})
       });
       msg("Access updated.");await load();
     }catch(err){msg(err.message,true);save.disabled=false;}
   });
   actionCell.append(save);body.append(tr);
 }
 $("pageText").textContent="Page "+(state.page+1);
 $("prev").disabled=state.page===0;$("next").disabled=!state.hasMore;
}
async function load(){
 if(state.loading)return;
 state.loading=true;$("refresh").disabled=true;
 try{
   const data=await api("/api/admin/users?page="+state.page+"&q="+encodeURIComponent(state.q));
   state.users=data.users;state.hasMore=data.hasMore;
   $("directory").hidden=false;msg("");render();
 }catch(err){msg(err.message,true);if(/required|access/i.test(err.message))$("directory").hidden=true;}
 finally{state.loading=false;$("refresh").disabled=false;}
}
let debounce;
$("search").addEventListener("input",()=>{
 clearTimeout(debounce);debounce=setTimeout(()=>{state.q=$("search").value.trim();state.page=0;load();},250);
});
$("refresh").addEventListener("click",load);
$("prev").addEventListener("click",()=>{if(state.page>0){state.page--;load();}});
$("next").addEventListener("click",()=>{if(state.hasMore){state.page++;load();}});
load();
})();
