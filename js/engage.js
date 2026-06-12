/* ==========================================================================
   USA Pro Floors — Shared Engagement Module (city/service landing pages)
   Adds the homepage's conversion machinery to any page with ONE line:
     <script defer src="/js/engage.js"></script>

   What it injects (all USER-CLICK initiated — Google-safe, no auto-redirect):
     1. Ashley/Ash AI assistant (same ElevenLabs agent as the homepage)
     2. A branded, dismissable engagement card (slides up after a delay):
          "Talk to our AI" -> opens the assistant
          "See full services & gallery" -> links to the homepage
     3. A persistent "Full Site" pill linking home

   Brand tokens match the city-page theme: gold #c8960c on dark #0a0a0a.
   Built with safe DOM methods (no innerHTML).
   Author: Goddy - 2026-06-10
   ========================================================================== */
(function () {
  "use strict";

  var HOME = "https://usaprofloors.com/";
  var AGENT_ID = "agent_3801kmx7rm1sekhrjvyg2f26dket";
  var GOLD = "#c8960c";

  function el(tag, props, text) {
    var n = document.createElement(tag);
    if (props) { Object.keys(props).forEach(function (k) { n.setAttribute(k, props[k]); }); }
    if (text != null) { n.textContent = text; }
    return n;
  }

  /* ---- 1. ElevenLabs AI assistant (text + voice, same agent as homepage) ---- */
  function loadAssistant() {
    if (document.querySelector("elevenlabs-convai")) return;
    document.body.appendChild(el("elevenlabs-convai", { "agent-id": AGENT_ID }));
    var s = el("script", { src: "https://unpkg.com/@elevenlabs/convai-widget-embed" });
    s.async = true;
    document.body.appendChild(s);
  }
  function openAssistant() {
    loadAssistant();
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      var w = document.querySelector("elevenlabs-convai");
      if (w && w.shadowRoot) {
        var btn = w.shadowRoot.querySelector("button");
        if (btn) { btn.click(); clearInterval(t); }
      }
      if (tries > 25) clearInterval(t);
    }, 200);
  }

  /* ---- 2. Styles ---- */
  function injectStyles() {
    var css = ""
      + "#upf-engage-card{position:fixed;bottom:20px;left:20px;max-width:330px;z-index:9997;"
      + "background:#0d0d0d;border:1px solid rgba(200,150,12,.35);border-radius:14px;"
      + "box-shadow:0 16px 48px rgba(0,0,0,.5);padding:18px 18px 16px;color:#fff;"
      + "font-family:'Inter',system-ui,sans-serif;transform:translateY(140%);opacity:0;"
      + "transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .45s;}"
      + "#upf-engage-card.show{transform:translateY(0);opacity:1;}"
      + "#upf-engage-card h4{margin:0 0 4px;font-size:1rem;font-weight:800;color:#fff;}"
      + "#upf-engage-card p{margin:0 0 14px;font-size:.85rem;line-height:1.5;color:rgba(255,255,255,.6);}"
      + "#upf-engage-card .upf-row{display:flex;flex-direction:column;gap:8px;}"
      + "#upf-engage-card button,#upf-engage-card a.upf-btn{display:flex;align-items:center;justify-content:center;gap:9px;"
      + "width:100%;border:none;cursor:pointer;border-radius:9px;padding:11px 13px;font-size:.88rem;"
      + "font-weight:700;text-decoration:none;transition:filter .2s,background .2s;font-family:inherit;}"
      + "#upf-engage-card .upf-primary{background:" + GOLD + ";color:#0a0a0a;}"
      + "#upf-engage-card .upf-primary:hover{filter:brightness(1.1);}"
      + "#upf-engage-card .upf-ghost{background:rgba(255,255,255,.06);color:#fff;border:1px solid rgba(255,255,255,.12);}"
      + "#upf-engage-card .upf-ghost:hover{background:rgba(255,255,255,.12);}"
      + "#upf-engage-x{position:absolute;top:10px;right:12px;background:none;border:none;color:rgba(255,255,255,.4);"
      + "font-size:1.1rem;cursor:pointer;line-height:1;padding:0;width:auto;}"
      + "#upf-engage-x:hover{color:#fff;}"
      + "#upf-fullsite{position:fixed;bottom:20px;left:20px;z-index:9996;background:rgba(13,13,13,.92);"
      + "border:1px solid rgba(200,150,12,.3);color:#fff;border-radius:999px;padding:9px 16px;"
      + "font-size:.8rem;font-weight:700;text-decoration:none;font-family:'Inter',system-ui,sans-serif;"
      + "display:none;align-items:center;gap:7px;box-shadow:0 8px 24px rgba(0,0,0,.4);transition:background .2s;}"
      + "#upf-fullsite:hover{background:#1a1a1a;}"
      + "@media(max-width:560px){#upf-engage-card{left:12px;right:12px;bottom:12px;max-width:none;}"
      + "#upf-fullsite{left:12px;bottom:12px;}}";
    document.head.appendChild(el("style", null, css));
  }

  /* ---- 3. Engagement card (slides up; user dismisses; shown once/session) ---- */
  function buildCard() {
    var card = el("div", { id: "upf-engage-card", role: "dialog", "aria-label": "Talk to us or see our full site" });

    var x = el("button", { id: "upf-engage-x", "aria-label": "Close" }, "×");
    var h = el("h4", null, "Questions about your floors?");
    var p = el("p", null, "Chat or talk with our AI assistant, or browse our full gallery, reviews, and services.");

    var row = el("div", { "class": "upf-row" });
    var talk = el("button", { "class": "upf-primary", id: "upf-talk", type: "button" }, "💬  Talk to our AI — instant answers");
    var home = el("a", { "class": "upf-btn upf-ghost", id: "upf-home", href: HOME }, "🏠  See full services & gallery");
    row.appendChild(talk);
    row.appendChild(home);

    card.appendChild(x);
    card.appendChild(h);
    card.appendChild(p);
    card.appendChild(row);
    document.body.appendChild(card);

    var fullsite = el("a", { id: "upf-fullsite", href: HOME }, "🏠  Full Site");
    document.body.appendChild(fullsite);

    function dismiss() {
      card.classList.remove("show");
      try { sessionStorage.setItem("upf_engage_dismissed", "1"); } catch (e) {}
      setTimeout(function () { fullsite.style.display = "inline-flex"; }, 300);
    }
    x.addEventListener("click", dismiss);
    talk.addEventListener("click", function () { openAssistant(); dismiss(); });
    home.addEventListener("click", function () {
      try { sessionStorage.setItem("upf_engage_dismissed", "1"); } catch (e) {}
    });

    var dismissed = false;
    try { dismissed = sessionStorage.getItem("upf_engage_dismissed") === "1"; } catch (e) {}
    var isBot = /bot|crawl|spider|lighthouse|headless/i.test(navigator.userAgent);
    if (dismissed) {
      fullsite.style.display = "inline-flex";
    } else if (!isBot) {
      setTimeout(function () { card.classList.add("show"); }, 9000);
    }
  }

  /* ---- 4. Brand lift: bigger animated logo + CTA pulse + sticky mobile bar ----
     One shared block so all city/service pages upgrade together (Leone 2026-06-11).
     Logo: 42 -> 56px, soft entrance, hover scale. Gold shimmer on "USA PRO".
     CTA: gentle pulse. Mobile: sticky Call / Instant Quote bar (links only, Google-safe). */
  function brandLift() {
    var css = el("style", null,
      ".logo-link img{height:56px!important;width:auto!important;transition:transform .25s ease;animation:upfLogoIn .7s ease both}" +
      ".logo-link:hover img{transform:scale(1.07)}" +
      "@keyframes upfLogoIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}" +
      ".logo-link>span span{background:linear-gradient(90deg," + GOLD + ",#f0c452," + GOLD + ");background-size:200% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:upfShimmer 7s linear infinite}" +
      "@keyframes upfShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}" +
      ".btn-gold{animation:upfPulse 6s ease-in-out infinite}" +
      "@keyframes upfPulse{0%,88%,100%{box-shadow:0 0 0 0 rgba(200,150,12,0)}92%{box-shadow:0 0 0 9px rgba(200,150,12,.28)}96%{box-shadow:0 0 0 0 rgba(200,150,12,0)}}" +
      "#upfStickyBar{position:fixed;left:0;right:0;bottom:0;z-index:9998;display:none;grid-template-columns:1fr 1fr;gap:1px;background:#0a0a0a;border-top:1px solid rgba(200,150,12,.35);padding-bottom:env(safe-area-inset-bottom)}" +
      "#upfStickyBar a{display:flex;align-items:center;justify-content:center;gap:.45rem;padding:.85rem .5rem;font:700 .92rem/1 Inter,system-ui,sans-serif;text-decoration:none;color:#fff;background:#111}" +
      "#upfStickyBar a.q{background:" + GOLD + ";color:#0a0a0a}" +
      "@media(max-width:768px){#upfStickyBar{display:grid}body{padding-bottom:58px}}");
    document.head.appendChild(css);
    if (!document.getElementById("upfStickyBar")) {
      var bar = el("div", { id: "upfStickyBar" });
      var call = el("a", { href: "tel:+12404440748" }, "📞 Call Now");
      var quote = el("a", { href: HOME + "quote/", "class": "q" }, "⚡ Instant Quote");
      bar.appendChild(call); bar.appendChild(quote);
      document.body.appendChild(bar);
    }
  }

  function init() {
    injectStyles();
    buildCard();
    brandLift();
    if ("requestIdleCallback" in window) {
      requestIdleCallback(loadAssistant, { timeout: 6000 });
    } else {
      setTimeout(loadAssistant, 5000);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
