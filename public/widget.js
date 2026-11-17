/* Shared account capability. Add <script defer src="https://auth.shauryaswebsites.com/widget.js"></script> when ready. */
(() => {
  if (window.__shauryaAccountWidget) return;
  window.__shauryaAccountWidget = true;
  const apiRoot = new URL(document.currentScript?.src || "https://auth.shauryaswebsites.com/widget.js").origin;
  const script = document.currentScript;
  // Keep one glass design aligned with the shared app launcher.
  const siteThemes = {
    "www.shauryaswebsites.com": ["dark", "#c4b5fd"],
    "shauryaswebsites.com": ["dark", "#c4b5fd"],
    "gerry.shauryaswebsite.com": ["light", "#0f766e"],
    "midterm-uj.shauryaswebsite.com": ["light", "#798969"],
    "presidentialsim.shauryaswebsites.com": ["light", "#15786e"],
    "soccersim.shauryaswebsites.com": ["dark", "#cdf879"],
    "soccermanager.shauryaswebsites.com": ["light", "#205a43"],
    "army.shauryaswebsite.com": ["light", "#4a5568"],
    "qed.shauryaswebsites.com": ["light", "#285b42"],
    "feedback.shauryaswebsites.com": ["light", "#8b6ee1"],
    "secret.shauryaswebsites.com": ["light", "#5879b5"]
  };
  function appearance() {
    const saved = siteThemes[location.hostname];
    let inferred = "light";
    for (const color of [getComputedStyle(document.body).backgroundColor, getComputedStyle(document.documentElement).backgroundColor]) {
      const rgb = /^rgba?\((\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/.exec(color);
      if (rgb) {
        inferred = (+rgb[1] * 299 + +rgb[2] * 587 + +rgb[3] * 114) / 1000 < 135 ? "dark" : "light";
        break;
      }
    }
    const override = script?.dataset.accountTheme;
    const theme = ["dark", "light"].includes(override) ? override : saved?.[0] || inferred;
    const customAccent = script?.dataset.accountAccent;
    const accent = /^#[0-9a-fA-F]{6}$/.test(customAccent || "") ? customAccent : saved?.[1] || (theme === "dark" ? "#c4b5fd" : "#0f766e");
    return { theme, accent };
  }
  function mount() {
    if (document.getElementById("shaurya-account-widget")) return;
    const host = document.createElement("div");
    host.id = "shaurya-account-widget";
    const {theme, accent} = appearance();
    host.dataset.theme = theme;
    host.style.setProperty("--account-accent", accent);
    if (location.hostname === "gerry.shauryaswebsite.com") host.dataset.palette = "gerry";
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `<style>
      :host {all:initial;position:fixed;top:18px;right:80px;z-index:2147483001;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;--surface:rgba(17,25,46,.48);--trigger:rgba(23,31,51,.58);--edge:rgba(196,181,253,.35);--text:#f0f2fa;--muted:#aab6d1;--field:rgba(23,31,51,.36);--hover:rgba(70,62,100,.55);--accent:var(--account-accent,#c4b5fd);color:var(--text)}
      :host([data-theme="light"]){--surface:rgba(255,255,255,.38);--trigger:rgba(255,255,255,.53);--edge:rgba(29,36,51,.24);--text:#1d2433;--muted:#536077;--field:rgba(255,255,255,.26);--hover:rgba(225,236,231,.70);}
      :host([data-palette="gerry"]){--surface:rgba(245,242,234,.40);--edge:rgba(15,118,110,.32);--field:rgba(255,255,255,.27);--hover:rgba(226,243,240,.68)}
      *,*:before,*:after{box-sizing:border-box}button,input{font:inherit}button{cursor:pointer}
      .trigger{display:grid;place-items:center;width:46px;height:46px;border:1px solid var(--edge);border-radius:14px;background:var(--trigger);color:var(--accent);box-shadow:0 6px 22px #0003;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);padding:0;font-size:19px;font-weight:700}
      .trigger:hover,.trigger[aria-expanded="true"]{border-color:var(--accent);background:var(--hover)}
      .panel{position:absolute;top:56px;right:0;width:min(318px,calc(100vw - 24px));max-height:calc(100dvh - 90px);overflow:auto;padding:22px;border:1px solid var(--edge);border-radius:18px;background:var(--surface);box-shadow:0 18px 60px #0005;backdrop-filter:blur(11px) saturate(120%);-webkit-backdrop-filter:blur(11px) saturate(120%);color:var(--text)}
      [hidden]{display:none!important}h2{font-size:19px;margin:0 0 6px;font-weight:700;letter-spacing:-.3px}.subtitle{font-size:12px;color:var(--muted);margin:0 0 18px;line-height:1.5}
      .tabs{display:flex;gap:5px;margin-bottom:16px}.tabs button{border:0;background:none;color:var(--muted);padding:7px 11px;border-bottom:2px solid transparent}.tabs button.active{color:var(--text);border-color:var(--accent);font-weight:700}
      label{display:block;font-size:12px;font-weight:650;margin:12px 0 6px}label small{color:var(--muted);font-weight:400}
      input{width:100%;border:1px solid var(--edge);background:var(--field);border-radius:9px;color:var(--text);padding:11px;outline:none;font-size:14px}
      :is(input,button):focus-visible{outline:2px solid var(--accent);outline-offset:2px}
      .submit{width:100%;margin-top:17px;padding:12px;border:0;border-radius:9px;background:var(--accent);color:#172036;font-weight:750}
      :host([data-theme="light"]) .submit{color:white}.submit:disabled{opacity:.55;cursor:wait}
      .notice{font-size:12px;line-height:1.45;color:#ffb0b0;margin:11px 0 0}.notice:empty{display:none}
      .member-email{color:var(--muted);font-size:12px;overflow-wrap:anywhere;margin:0 0 10px}
      .admin-link{display:block;padding:10px 0;color:var(--accent);font-size:13px;text-decoration:none;font-weight:700}.admin-link:hover{text-decoration:underline}
      @media(max-width:480px){.panel{padding:18px}}
      @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
    </style>
    <button class="trigger" type="button" aria-label="Account" aria-haspopup="true" aria-expanded="false" aria-controls="shaurya-account-panel"><svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20v-1.5a7 7 0 0 1 14 0V20"/></svg></button>
    <section class="panel" id="shaurya-account-panel" aria-label="Account" hidden>
      <div class="guest">
        <h2>Welcome</h2><p class="subtitle">One identity for every adventure.</p>
        <div class="tabs" role="tablist" aria-label="Account action"><button class="login active" type="button" aria-selected="true">Log in</button><button class="signup" type="button" aria-selected="false">Sign up</button></div>
        <form novalidate>
          <label for="sh-email">Email</label><input id="sh-email" type="email" autocomplete="email" required maxlength="254" placeholder="you@example.com">
          <label for="sh-password">Password</label><input id="sh-password" type="password" autocomplete="current-password" required placeholder="Your password">
          <div class="avatar" hidden><label for="sh-avatar">Avatar name <small>(optional)</small></label><input id="sh-avatar" type="text" maxlength="24" pattern="[A-Za-z0-9_]{3,24}" autocomplete="nickname" placeholder="Unique player name"></div>
          <button class="submit" type="submit">Log in</button>
        </form><p class="notice" role="status" aria-live="polite"></p>
      </div>
      <div class="member" hidden>
        <h2 class="member-name"></h2><p class="member-email"></p><a class="admin-link" href="https://auth.shauryaswebsites.com/admin" target="_blank" rel="noopener noreferrer" hidden>Manage users ↗</a><button class="submit logout" type="button">Log out</button>
        <p class="notice" role="status" aria-live="polite"></p>
      </div>
    </section>`;
    const $ = selector => shadow.querySelector(selector);
    const trigger = $(".trigger"), panel = $(".panel"), guest = $(".guest"), member = $(".member");
    const form = $("form"), button = guest.querySelector(".submit"), pass = $("#sh-password");
    const email = $("#sh-email"), avatar = $("#sh-avatar");
    let flow = "login", memberData = null, busy = false;
    // The account control travels with Navigation, rather than competing with
    // Navigation's obstacle-scored placement. Both controls remain independent.
    let lastPosition = "", pendingPlacement = false;
    function place() {
      if (!panel.hidden) return; // Keep the form steady while someone types.
      const width = innerWidth, height = innerHeight;
      const mobile = width <= 480, margin = mobile ? 12 : 24;
      const size = 46, gap = 10;
      const navHost = document.getElementById("shaurya-app-launcher");
      const navRect = navHost?.shadowRoot?.querySelector(".trigger")?.getBoundingClientRect();
      let x = margin, y = mobile ? 12 : 18;
      if (navRect && navRect.width && navRect.height) {
        // Prefer the inside edge of the navigation icon, keeping both in a row.
        const navCenter = (navRect.left + navRect.right) / 2;
        x = navCenter > width / 2 ? navRect.left - size - gap : navRect.right + gap;
        y = navRect.top;
        // On narrow screens, stack if a side-by-side pair would leave the viewport.
        if (x < margin || x + size > width - margin) {
          x = Math.max(margin, Math.min(width - margin - size, navRect.left));
          y = navRect.top < height / 2 ? navRect.bottom + gap : navRect.top - size - gap;
        }
      } else {
        // Until Navigation loads, reserve its familiar top-right trigger slot.
        x = width - margin - (size * 2 + gap);
      }
      x = Math.max(margin, Math.min(width - margin - size, x));
      y = Math.max(mobile ? 12 : 18, Math.min(height - margin - size, y));
      const signature = [x, y, width, height].join(":");
      if (signature === lastPosition) return;
      lastPosition = signature;
      host.style.left = x + "px";
      host.style.top = y + "px";
      host.style.right = "auto";
      host.style.bottom = "auto";
      // Align and size the popover so it doesn't extend off-screen.
      const panelWidth = Math.min(318, width - 24);
      const panelX = Math.max(12, Math.min(width - 12 - panelWidth, x + size - panelWidth));
      panel.style.left = (panelX - x) + "px";
      panel.style.right = "auto";
      if (y + size + gap + 220 > height && y > height / 2) {
        panel.style.top = "auto";
        panel.style.bottom = "56px";
        panel.style.maxHeight = Math.max(130, y - 20) + "px";
      } else {
        panel.style.top = "56px";
        panel.style.bottom = "auto";
        panel.style.maxHeight = Math.max(130, height - y - size - 22) + "px";
      }
    }
    function schedulePlacement() {
      if (pendingPlacement || !panel.hidden) return;
      pendingPlacement = true;
      requestAnimationFrame(() => { pendingPlacement = false; place(); });
    }
    function say(text, isMember = false) { (isMember ? member : guest).querySelector(".notice").textContent = text; }
    function setOpen(open) {
      panel.hidden = !open;
      trigger.setAttribute("aria-expanded", String(open));
      if (open) (memberData ? member.querySelector(".logout") : email).focus();
      else schedulePlacement();
    }
    function switchFlow(next) {
      flow = next;
      $(".login").classList.toggle("active", next === "login");
      $(".signup").classList.toggle("active", next === "signup");
      $(".login").setAttribute("aria-selected", String(next === "login"));
      $(".signup").setAttribute("aria-selected", String(next === "signup"));
      $(".avatar").hidden = next !== "signup";
      pass.autocomplete = next === "login" ? "current-password" : "new-password";
      pass.minLength = next === "signup" ? 12 : 1;
      button.textContent = next === "login" ? "Log in" : "Create account";
      say("");
    }
    async function fetchJson(path, options = {}) {
      const response = await fetch(apiRoot + path, { credentials:"include", ...options });
      const value = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(value.message || value.error || "Please try again.");
      return value;
    }
    function paint(user) {
      memberData = user;
      member.hidden = !user;
      guest.hidden = !!user;
      if (user) trigger.textContent = (user.avatarName || user.email || "?").charAt(0).toUpperCase();
      else trigger.innerHTML = '<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20v-1.5a7 7 0 0 1 14 0V20"/></svg>';
      trigger.setAttribute("aria-label", user ? "Account: " + (user.avatarName || user.email) : "Log in or sign up");
      if (user) {
        $(".member-name").textContent = user.avatarName || "Your account";
        $(".member-email").textContent = user.email;
        $(".admin-link").hidden = !user.isAdmin;
      }
      host.dispatchEvent(new CustomEvent("shaurya:auth-changed", { bubbles:true, composed:true, detail: { user: user || null } }));
      window.dispatchEvent(new CustomEvent("shaurya:auth-changed", { detail: { user: user || null } }));
    }
    async function refresh() {
      const current = await fetchJson("/api/me");
      paint(current);
    }
    trigger.addEventListener("click", () => setOpen(panel.hidden));
    document.addEventListener("pointerdown", e => { if (!panel.hidden && !e.composedPath().includes(host)) setOpen(false); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !panel.hidden) { setOpen(false); trigger.focus(); } });
    $(".login").addEventListener("click", () => switchFlow("login"));
    $(".signup").addEventListener("click", () => switchFlow("signup"));
    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (busy) return;
      if (!email.reportValidity() || !pass.reportValidity()) return;
      if (flow === "signup" && avatar.value.trim() && !avatar.reportValidity()) return;
      busy = true; button.disabled = true; say("");
      try {
        const data = { email:email.value.trim(), password:pass.value };
        if (flow === "signup" && avatar.value.trim()) data.avatarName = avatar.value.trim();
        const path = flow === "signup" ? "/api/auth/sign-up/email" : "/api/auth/sign-in/email";
        await fetchJson(path, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data) });
        pass.value = "";
        await refresh();
        if (!memberData) throw new Error("Account created, but the session could not be loaded.");
        setOpen(false);
      } catch (error) { say(error instanceof Error ? error.message : "Unable to authenticate."); }
      finally { busy = false; button.disabled = false; }
    });
    $(".logout").addEventListener("click", async () => {
      if (busy) return;
      busy = true; $(".logout").disabled = true; say("", true);
      try {
        await fetchJson("/api/auth/sign-out", { method:"POST", headers:{"Content-Type":"application/json"}, body:"{}" });
        await refresh();
        setOpen(false);
      } catch(error){ say(error instanceof Error ? error.message : "Unable to log out.", true); }
      finally{ busy = false; $(".logout").disabled = false; }
    });
    document.body.append(host);
    place();
    window.addEventListener("resize", schedulePlacement, { passive:true });
    window.addEventListener("scroll", schedulePlacement, { passive:true, capture:true });
    window.addEventListener("load", schedulePlacement, { once:true });
    // Navigation can relocate on scroll; watch its host's inline placement.
    const observer = new MutationObserver(schedulePlacement);
    const observeNav = () => {
      const nav = document.getElementById("shaurya-app-launcher");
      if (nav) {
        observer.observe(nav, { attributes:true, attributeFilter:["style"] });
        schedulePlacement();
        return true;
      }
      return false;
    };
    if (!observeNav()) {
      const startupObserver = new MutationObserver(() => {
        if (observeNav()) startupObserver.disconnect();
      });
      startupObserver.observe(document.body, { childList:true });
      window.addEventListener("load", () => startupObserver.disconnect(), { once:true });
    }
    refresh().catch(() => { /* authentication not deployed; show error upon interaction */ });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once:true });
  else mount();
})();
