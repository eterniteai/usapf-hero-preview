// Auto-extracted from index.html for non-blocking load (2026-06-09)
    // ── Supabase Config ──────────────────────────────────────────
    const SUPABASE_URL  = 'https://cdpculwlzwtamyibbkuc.supabase.co';
    const SUPABASE_ANON = 'sb_publishable_dGhaZu_Trvnjmp99pIe89w_iLUoQZqb';
    // ────────────────────────────────────────────────────────────
    let _sb = null;

    // ── UTM Capture — persist across pages via sessionStorage ────
    (function(){
      var p = new URLSearchParams(window.location.search);
      var keys = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','gbraid','wbraid'];
      var saved = false;
      keys.forEach(function(k){ if(p.get(k)){ sessionStorage.setItem(k, p.get(k)); saved = true; } });
      // Also stamp entry page if we captured UTMs
      if(saved) sessionStorage.setItem('utm_landing_page', window.location.pathname);
    })();
    function _getUtm(){
      var keys = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid'];
      var out = {};
      keys.forEach(function(k){ var v = sessionStorage.getItem(k); if(v) out[k] = v; });
      return out;
    }
    // ─────────────────────────────────────────────────────────────
    window._sbReady = false;
    window._initSupabase = function(){
      if (typeof supabase !== 'undefined' && SUPABASE_URL.startsWith('https://')) {
        _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
        window._sbReady = true;
      }
    };
    // Lazy-load the Supabase UMD bundle on first form interaction OR after idle
    (function(){
      // Skip headless / bot crawlers entirely (Lighthouse, GoogleBot, etc.) — bots don't submit forms or chat
      if (navigator.webdriver === true) return;
      if (/HeadlessChrome|Lighthouse|Googlebot|bingbot|YandexBot/i.test(navigator.userAgent)) return;
      var loaded = false;
      function loadSb(){
        if (loaded) return; loaded = true;
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        s.onload = function(){ if (window._initSupabase) window._initSupabase(); };
        document.head.appendChild(s);
      }
      // Fire on first form focus/touch, OR when user starts typing/scrolling deep
      function attach(){
        document.querySelectorAll('form input, form textarea, form select').forEach(function(el){
          el.addEventListener('focus', loadSb, {once:true, passive:true});
        });
      }
      ['scroll','touchstart','keydown'].forEach(function(ev){
        window.addEventListener(ev, loadSb, {once:true, passive:true});
      });
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attach);
      } else { attach(); }
      // Final fallback: load after 8s idle (so chat widget still works for slow users)
      setTimeout(loadSb, 8000);
    })();
    // In case the script already loaded before this block ran
    if (window._sbReady) window._initSupabase();

    async function submitLead(formEl, source) {
      const fd = new FormData(formEl);
      // Honeypot: if _gotcha is filled, it's a bot — silently accept but don't save
      if (fd.get('_gotcha')) {
        console.warn('Honeypot triggered — bot submission rejected');
        return true; // fake success to fool the bot
      }
      const utms = _getUtm();
      const payload = {
        source,
        name:         fd.get('name')    || null,
        email:        fd.get('email')   || null,
        phone:        fd.get('phone')   || null,
        service_type: fd.get('service') || fd.get('service_type') || null,
        message:      (fd.get('message') || '') +
                      (fd.get('sqft') ? '\nSq ft: ' + fd.get('sqft') : '') +
                      (fd.get('property') ? '\nProperty: ' + fd.get('property') : ''),
        address:      fd.get('address') || null,
        utm_source:   utms.utm_source   || null,
        utm_medium:   utms.utm_medium   || null,
        utm_campaign: utms.utm_campaign || null,
        utm_content:  utms.utm_content  || null,
        utm_term:     utms.utm_term     || null,
        gclid:        utms.gclid        || null,
      };

      // 1 — Save to Supabase (UTM columns live as of 2026-05-13 migration)
      if (_sb) {
        const { error } = await _sb.from('leads').insert([payload]);
        if (error) { console.error('Supabase error:', error); return false; }
      }

      // 2 — Send email notification via FormSubmit (free, no API key)
      try {
        await fetch('https://formsubmit.co/ajax/client@usaprofloors.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            _subject: '🏠 New Lead: ' + (payload.name || 'Unknown') + ' — ' + (payload.service_type || 'General'),
            Name:    payload.name    || '—',
            Phone:   payload.phone   || '—',
            Email:   payload.email   || '—',
            Service: payload.service_type || '—',
            Message: payload.message || '—',
            Source:  source,
            _template: 'table'
          })
        });
      } catch(e) { console.warn('Email notification failed:', e); }

      // 3 — Fire GA4 conversion event
      try {
        if (typeof gtag === 'function') {
          gtag('event', 'generate_lead', {
            event_category: 'lead',
            event_label: source,
            form_source: source,
            service_type: payload.service_type || 'unknown',
            value: 1,
            currency: 'USD',
            utm_source:   utms.utm_source   || '(none)',
            utm_medium:   utms.utm_medium   || '(none)',
            utm_campaign: utms.utm_campaign || '(none)',
          });
        }
      } catch(e) { /* ignore */ }

      // 4 — Redirect to /thank-you page for proper conversion tracking (l10)
      try {
        const svc = encodeURIComponent(payload.service_type || 'unknown');
        const src = encodeURIComponent(source);
        setTimeout(function(){
          window.location.href = '/thank-you?src=' + src + '&svc=' + svc;
        }, 900);
      } catch(e) { /* ignore — inline success fallback will show */ }

      return true;
    }

    function showFormSuccess(formEl) {
      formEl.innerHTML = `
        <div style="text-align:center;padding:2rem 1rem;">
          <div style="font-size:2.5rem;margin-bottom:0.75rem;">✅</div>
          <p style="color:#fff;margin-bottom:0.5rem;font-size:1.5rem;font-weight:700;">Request Received!</p>
          <p style="color:rgba(255,255,255,0.55);font-size:0.88rem;line-height:1.7;">
            Our team will call you within 2 hours.<br/>
            Or reach us now:<br/>
            <a href="tel:+12404440748" style="color:var(--gold);font-weight:700;font-size:1rem;">240-444-0748</a>
          </p>
        </div>`;
    }

    function showFormError(formEl) {
      const btn = formEl.querySelector('[type=submit]');
      if (btn) { btn.textContent = 'Try Again — or Call 240-444-0748'; btn.disabled = false; }
    }