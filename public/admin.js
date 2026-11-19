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

async function loadPages(){
  const table=$("pages");table.replaceChildren();
  const loading=document.createElement("tr"),loadingCell=td(loading);loadingCell.colSpan=6;loadingCell.textContent="Loading permissions…";table.append(loading);
  try{
    const data=await api("/api/admin/pages");
    table.replaceChildren();
    for(const page of data.pages){
      const tr=document.createElement("tr");
      const nameCell=td(tr);
      const link=document.createElement("a");link.href=page.url;link.target="_blank";link.rel="noopener noreferrer";link.textContent=page.name;nameCell.append(link);
      const inputs={};
      for(const role of ["guest","standard","premium","admin"]){
        const cell=td(tr),label=document.createElement("label");label.className="role";
        const checkbox=document.createElement("input");checkbox.type="checkbox";checkbox.checked=page.policy[role];checkbox.disabled=page.locked;
        checkbox.setAttribute("aria-label",role+" access to "+page.name);
        inputs[role]=checkbox;label.append(checkbox);cell.append(label);
      }
      const action=td(tr),save=document.createElement("button");save.className="save";save.type="button";save.textContent=page.locked?"Locked":"Save";save.disabled=true;
      const dirty=()=>save.disabled=page.locked||["guest","standard","premium","admin"].every(role=>inputs[role].checked===page.policy[role]);
      for(const input of Object.values(inputs))input.addEventListener("change",dirty);
      save.addEventListener("click",async()=>{
        const policy=Object.fromEntries(Object.entries(inputs).map(([role,input])=>[role,input.checked]));
        if(!confirm("Update access to "+page.name+"?"))return;
        save.disabled=true;msg("Saving page access…");
        try{
          await api("/api/admin/pages/"+encodeURIComponent(page.key),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(policy)});
          Object.assign(page.policy,policy);msg("Page access saved.");dirty();
        }catch(error){msg(error.message,true);dirty();}
      });
      action.append(save);table.append(tr);
    }
  }catch(error){table.replaceChildren();const tr=document.createElement("tr"),cell=td(tr);cell.colSpan=6;cell.textContent=error.message;table.append(tr);}
}
$("refreshPages").addEventListener("click",loadPages);
loadPages();

async function loadFeatures(){
 const table=$("features");table.replaceChildren();
 const tr=document.createElement("tr"),cell=td(tr);cell.colSpan=6;cell.textContent="Loading feature permissions…";table.append(tr);
 try{
   const data=await api("/api/admin/features");table.replaceChildren();
   for(const feature of data.features){
     const row=document.createElement("tr"),label=td(row);
     const strong=document.createElement("strong");strong.textContent=feature.site+" · "+feature.name;
     const hint=document.createElement("small");hint.textContent=feature.description;hint.style.display="block";label.append(strong,hint);
     const controls={};
     for(const role of ["guest","standard","premium","admin"]){
       const cell=td(row),wrapper=document.createElement("label");wrapper.className="role";
       const input=document.createElement("input");input.type="checkbox";input.checked=feature.policy[role];input.disabled=feature.locked===true;
       input.setAttribute("aria-label",role+" access to "+feature.name);wrapper.append(input);cell.append(wrapper);controls[role]=input;
     }
     const action=td(row),save=document.createElement("button");save.className="save";save.textContent=feature.locked?"Locked":"Save";save.type="button";save.disabled=true;
     const dirty=()=>{save.disabled=feature.locked||Object.keys(controls).every(role=>controls[role].checked===feature.policy[role]);};
     for(const input of Object.values(controls))input.addEventListener("change",dirty);
     save.addEventListener("click",async()=>{
       if(!confirm("Update "+feature.name+" permissions?"))return;
       const policy=Object.fromEntries(Object.entries(controls).map(([role,input])=>[role,input.checked]));
       save.disabled=true;msg("Saving feature permissions…");
       try{await api("/api/admin/features/"+encodeURIComponent(feature.key),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(policy)});
         Object.assign(feature.policy,policy);msg("Feature access updated.");dirty();
       }catch(error){msg(error.message,true);dirty();}
     });action.append(save);table.append(row);
   }
 }catch(error){table.replaceChildren();const row=document.createElement("tr"),cell=td(row);cell.colSpan=6;cell.textContent=error.message;table.append(row);}
}
$("refreshFeatures").addEventListener("click",loadFeatures);
loadFeatures();
})();
