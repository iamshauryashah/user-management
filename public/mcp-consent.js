// Only a signed Better Auth OAuth query may authorize this action.
// The server verifies the signature before serving this page; the OAuth endpoint
// verifies it again before issuing any authorization code.
(() => {
  const result = document.getElementById("result");
  const buttons = [document.getElementById("approve"), document.getElementById("deny")];
  async function decide(accept) {
    buttons.forEach(button=>button.disabled=true);
    result.textContent="Checking the authorization request…";
    try {
      const response=await fetch("/api/auth/oauth2/consent",{
        method:"POST",credentials:"same-origin",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({accept,oauth_query:window.location.search.slice(1)})
      });
      const data=await response.json();
      if (!response.ok || !data.redirect || typeof data.url !== "string") {
        throw new Error(data.message||data.error||"Authorization request could not be completed");
      }
      // Redirect comes only from Better Auth's verified OAuth consent response.
      window.location.assign(data.url);
    } catch(e) {
      result.textContent=e.message||"Authorization failed";
      buttons.forEach(button=>button.disabled=false);
    }
  }
  buttons[0].addEventListener("click",()=>decide(true));
  buttons[1].addEventListener("click",()=>decide(false));
})();
