/* עורך הערות צף לסקיצה
   ----------------------------------------------------------------
   כפתור צף ← "בחירת אלמנט" ← לוחצים על כל אלמנט בדף ← כותבים הערה.
   ההערות נשמרות בקובץ comments.json דרך server.py (או בדפדפן, אם השרת לא זמין).
   קיצורים: C פותח/סוגר מצב בחירה · Esc יציאה · Cmd/Ctrl+Enter שמירה.
   כדי להסיר את העורך: למחוק את השורה שטוענת את הקובץ הזה ב־index.html. */
(function () {
  "use strict";
  var API = "/api/comments", LS = "sketch-comments-v1";
  var comments = [], serverOK = false, picking = false, pinsOn = true, hoverEl = null, saveT = 0;
  var ui = {};

  /* ---------------- styles ---------------- */
  var css = `
  .cm-ui{font-family:"Discovery Fs",system-ui,sans-serif;direction:rtl;color:#000;-webkit-font-smoothing:antialiased}
  .cm-ui *{box-sizing:border-box}
  .cm-dock{position:fixed;left:20px;bottom:20px;z-index:2147483000;display:flex;flex-direction:column-reverse;align-items:flex-start;gap:8px}
  .cm-fab{width:58px;height:58px;border-radius:50%;border:0;cursor:pointer;background:linear-gradient(135deg,#fff 10%,#FCB97D 90%);box-shadow:0 10px 26px rgba(85,52,27,.28);display:grid;place-items:center;position:relative;transition:transform .2s}
  .cm-fab:hover{transform:translateY(-2px)}
  .cm-fab svg{width:26px;height:26px}
  .cm-badge{position:absolute;top:-4px;right:-4px;min-width:22px;height:22px;border-radius:11px;background:#000;color:#fff;font:700 12px/22px system-ui;padding:0 6px;text-align:center}
  .cm-bar{display:none;flex-direction:column;gap:6px;background:rgba(255,255,255,.96);border:1px solid rgba(252,185,125,.6);border-radius:18px;padding:8px;box-shadow:0 14px 34px rgba(85,52,27,.2);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
  .cm-open .cm-bar{display:flex}
  .cm-btn{font:500 14px/1 inherit;font-family:inherit;border:0;border-radius:12px;padding:11px 14px;cursor:pointer;background:#FFF4EA;color:#000;text-align:right;white-space:nowrap;display:flex;align-items:center;gap:8px}
  .cm-btn:hover{background:#FDE3CB}
  .cm-btn[aria-pressed="true"]{background:#000;color:#fff}
  .cm-btn.cm-primary{background:linear-gradient(90deg,#fff 10%,#FCB97D 90%)}
  .cm-btn.cm-danger{background:#fff;color:#B3261E;box-shadow:inset 0 0 0 1px #E8B4B0}
  .cm-status{font-size:12px;color:#5F5850;padding:2px 6px}
  .cm-hl{position:fixed;z-index:2147482990;pointer-events:none;border:2px solid #E8893A;background:rgba(252,185,125,.16);border-radius:6px;transition:all .08s;display:none}
  .cm-hl span{position:absolute;top:-26px;right:-2px;background:#000;color:#fff;font:500 12px/1 system-ui;padding:6px 8px;border-radius:6px;white-space:nowrap;max-width:60vw;overflow:hidden;text-overflow:ellipsis;direction:rtl}
  .cm-picking, .cm-picking *{cursor:crosshair!important}
  .cm-tip{position:fixed;top:84px;left:50%;transform:translateX(-50%);z-index:2147483000;background:#000;color:#fff;padding:10px 16px;border-radius:99px;font-size:14px;display:none;box-shadow:0 8px 20px rgba(0,0,0,.25)}
  .cm-picking-on .cm-tip{display:block}
  .cm-pin{position:fixed;z-index:2147482995;width:28px;height:28px;margin:-14px 0 0 -14px;border-radius:50% 50% 50% 4px;background:#E8893A;color:#fff;font:700 13px/28px system-ui;text-align:center;border:2px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.25);cursor:pointer;padding:0;transform:rotate(0)}
  .cm-pin.cm-done{background:#7A9E7E}
  .cm-pin:hover{transform:scale(1.15)}
  .cm-pop{position:fixed;z-index:2147483001;width:min(340px,calc(100vw - 24px));background:#fff;border-radius:18px;padding:14px;box-shadow:0 20px 50px rgba(85,52,27,.3);border:1px solid rgba(252,185,125,.6);display:grid;gap:10px}
  .cm-pop h4{margin:0;font-size:13px;font-weight:500;color:#5F5850;line-height:1.35}
  .cm-pop h4 b{color:#000}
  .cm-pop textarea{width:100%;min-height:96px;resize:vertical;font:400 16px/1.4 inherit;font-family:inherit;border:1px solid rgba(0,0,0,.15);border-radius:12px;padding:10px;color:#000;background:#fff;direction:rtl}
  .cm-pop textarea:focus{outline:2px solid #FCB97D;outline-offset:1px}
  .cm-row{display:flex;gap:6px;flex-wrap:wrap}
  .cm-row .cm-btn{padding:9px 12px;font-size:13px}
  .cm-panel{position:fixed;top:0;bottom:0;left:0;z-index:2147483002;width:min(400px,100vw);background:#fff;box-shadow:12px 0 40px rgba(85,52,27,.2);transform:translateX(-102%);transition:transform .35s cubic-bezier(.2,.8,.2,1);display:flex;flex-direction:column}
  .cm-panel.cm-show{transform:none}
  .cm-ph{display:flex;align-items:center;gap:8px;padding:16px;border-bottom:1px solid rgba(0,0,0,.08)}
  .cm-ph h3{margin:0 0 0 auto;font-size:20px;font-weight:700}
  .cm-list{flex:1;overflow:auto;padding:12px;display:grid;gap:10px;align-content:start}
  .cm-item{border:1px solid rgba(0,0,0,.1);border-radius:14px;padding:12px;display:grid;gap:6px;cursor:pointer;background:#fff}
  .cm-item:hover{border-color:#FCB97D;background:#FFFAF5}
  .cm-item.cm-done{opacity:.55}
  .cm-item header{display:flex;gap:8px;align-items:center;font-size:12px;color:#5F5850}
  .cm-item header b{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#E8893A;color:#fff;font-size:12px}
  .cm-item.cm-done header b{background:#7A9E7E}
  .cm-item p{margin:0;font-size:15px;line-height:1.4;white-space:pre-wrap}
  .cm-item small{font-size:12px;color:#8A8178;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .cm-empty{color:#5F5850;font-size:15px;padding:20px 8px;line-height:1.5}
  .cm-pf{padding:12px;border-top:1px solid rgba(0,0,0,.08);display:flex;gap:6px;flex-wrap:wrap}
  .cm-flash{animation:cmFlash 1.6s ease-out}
  @keyframes cmFlash{0%,40%{box-shadow:0 0 0 4px #E8893A,0 0 0 12px rgba(252,185,125,.35)}100%{box-shadow:0 0 0 0 transparent}}
  @media (max-width:900px){.cm-dock{bottom:96px;left:12px}.cm-fab{width:52px;height:52px}}
  `;
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  /* ---------------- helpers ---------------- */
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; e.classList.add("cm-ui"); return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function isUI(t) { return t && t.closest && t.closest(".cm-ui"); }
  var STATE = /^(on|cur|is-|cm-|notes-|lenis|wd$|wi$|w$|k$)/;
  var INLINE_SPLIT = ".wd,.wi,.mono-text .w,.ld-ch";

  /* pick a meaningful element: skip the per-word spans the animations create */
  function normalize(t) {
    if (!t || t === document.body || t === document.documentElement) return null;
    if (t.matches && t.matches(INLINE_SPLIT)) t = t.closest("h1,h2,h3,h4,p,li,a,button,blockquote") || t.parentElement;
    if (t.closest && t.closest("svg") && t.tagName.toLowerCase() !== "svg") t = t.closest("svg");
    return t;
  }

  function stableClasses(e) {
    return Array.prototype.filter.call(e.classList, function (c) { return !STATE.test(c) && !/^pin-spacer/.test(c); });
  }
  /* selector that survives the wrappers GSAP adds when pinning (descendant steps, class-based) */
  function selectorFor(e) {
    if (e.id) return "#" + CSS.escape(e.id);
    var parts = [], cur = e;
    while (cur && cur.nodeType === 1 && cur !== document.body) {
      if (cur.id) { parts.unshift("#" + CSS.escape(cur.id)); break; }
      if (cur.classList.contains("pin-spacer")) { cur = cur.parentElement; continue; }
      var tag = cur.tagName.toLowerCase(), cls = stableClasses(cur), seg = tag + cls.slice(0, 2).map(function (c) { return "." + CSS.escape(c); }).join("");
      var p = cur.parentElement;
      if (p) {
        var same = Array.prototype.filter.call(p.children, function (s) { return s.tagName === cur.tagName; });
        if (same.length > 1) seg += ":nth-of-type(" + (same.indexOf(cur) + 1) + ")";
      }
      parts.unshift(seg);
      cur = p;
    }
    var sel = parts.join(" > ");
    try { if (document.querySelector(sel) === e) return sel; } catch (x) {}
    sel = parts.join(" ");
    try { if (document.querySelector(sel) === e) return sel; } catch (x) {}
    return sel;
  }
  function labelFor(e) {
    var alt = e.getAttribute && (e.getAttribute("alt") || e.getAttribute("aria-label"));
    var txt = (alt || e.innerText || e.textContent || "").replace(/\s+/g, " ").trim();
    var KIND = { h1: "כותרת ראשית", h2: "כותרת", h3: "כותרת משנה", p: "פסקה", a: "קישור/כפתור", button: "כפתור", img: "תמונה", li: "פריט ברשימה", section: "סקשן", form: "טופס", input: "שדה", label: "תווית", svg: "גרפיקה", blockquote: "ציטוט", article: "כרטיס" };
    var tag = e.tagName.toLowerCase(), host = /^(span|b|i|em|strong|small|div)$/.test(tag) && e.closest("h1,h2,h3,p,li,a,button,blockquote,label");
    var kind = KIND[tag] || (host && KIND[host.tagName.toLowerCase()]) || "אלמנט";
    return kind + (txt ? ": " + (txt.length > 70 ? txt.slice(0, 70) + "…" : txt) : (e.classList.length ? " ." + stableClasses(e).join(".") : ""));
  }
  function sectionFor(e) {
    var s = e.closest("section,header,footer");
    if (!s) return "";
    var h = s.querySelector("h1,h2,.eyebrow");
    return (s.id ? "#" + s.id + " · " : "") + (h ? h.textContent.replace(/\s+/g, " ").trim().slice(0, 40) : s.className.split(" ")[0]);
  }
  function find(c) { try { return document.querySelector(c.selector); } catch (x) { return null; } }

  /* ---------------- storage ---------------- */
  function load() {
    return fetch(API, { cache: "no-store" }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) { serverOK = true; comments = Array.isArray(d) ? d : []; })
      .catch(function () { serverOK = false; try { comments = JSON.parse(localStorage.getItem(LS) || "[]"); } catch (x) { comments = []; } })
      .then(function () { status(serverOK ? "נשמר בקובץ comments.json" : "שמירה בדפדפן בלבד (השרת לא זמין)"); render(); });
  }
  function save() {
    clearTimeout(saveT);
    status("שומרת…");
    saveT = setTimeout(function () {
      try { localStorage.setItem(LS, JSON.stringify(comments)); } catch (x) {}
      if (!serverOK) { status("נשמר בדפדפן בלבד"); return; }
      fetch(API, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(comments) })
        .then(function (r) { status(r.ok ? "נשמר ✓ " + new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }) : "שגיאה בשמירה"); })
        .catch(function () { status("שגיאה בשמירה, נשמר בדפדפן"); });
    }, 250);
  }
  function status(t) { if (ui.status) ui.status.textContent = t; }
  function nextN() { return comments.reduce(function (m, c) { return Math.max(m, c.n || 0); }, 0) + 1; }

  /* ---------------- UI ---------------- */
  function build() {
    ui.dock = el("div", "cm-dock");
    ui.fab = el("button", "cm-fab", '<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/><path d="M8.5 10.5h7M8.5 13.5h4.5"/></svg><span class="cm-badge" hidden>0</span>');
    ui.fab.type = "button"; ui.fab.setAttribute("aria-label", "עורך הערות"); ui.fab.setAttribute("aria-expanded", "false");
    ui.badge = ui.fab.querySelector(".cm-badge");
    ui.bar = el("div", "cm-bar");
    ui.pick = el("button", "cm-btn cm-primary", "➕ בחירת אלמנט להערה"); ui.pick.type = "button"; ui.pick.setAttribute("aria-pressed", "false");
    ui.listBtn = el("button", "cm-btn", "📋 כל ההערות"); ui.listBtn.type = "button";
    ui.pinsBtn = el("button", "cm-btn", "📍 הסתרת סיכות"); ui.pinsBtn.type = "button";
    ui.status = el("span", "cm-status", "");
    ui.bar.append(ui.pick, ui.listBtn, ui.pinsBtn, ui.status);
    ui.dock.append(ui.fab, ui.bar);
    ui.hl = el("div", "cm-hl", "<span></span>");
    ui.tip = el("div", "cm-tip", "לחצי על כל אלמנט בדף כדי להוסיף הערה · Esc ליציאה");
    ui.pins = el("div", "cm-pins");
    ui.panel = el("aside", "cm-panel");
    ui.panel.setAttribute("aria-label", "רשימת הערות");
    ui.panel.innerHTML = '<div class="cm-ph"><h3>הערות</h3><button type="button" class="cm-btn" data-a="close" aria-label="סגירה">✕</button></div><div class="cm-list"></div><div class="cm-pf"><button type="button" class="cm-btn" data-a="copy">העתקת כל ההערות</button><button type="button" class="cm-btn" data-a="open">רק פתוחות</button><button type="button" class="cm-btn cm-danger" data-a="clear">מחיקת הכול</button></div>';
    ui.list = ui.panel.querySelector(".cm-list");
    document.body.append(ui.dock, ui.hl, ui.tip, ui.pins, ui.panel);
    document.body.classList.add("cm-root");

    ui.fab.addEventListener("click", function () {
      var o = !ui.dock.classList.contains("cm-open");
      ui.dock.classList.toggle("cm-open", o); ui.fab.setAttribute("aria-expanded", String(o));
      if (!o) setPicking(false);
    });
    ui.pick.addEventListener("click", function () { setPicking(!picking); });
    ui.listBtn.addEventListener("click", function () { ui.panel.classList.toggle("cm-show"); render(); });
    ui.pinsBtn.addEventListener("click", function () { pinsOn = !pinsOn; ui.pinsBtn.textContent = pinsOn ? "📍 הסתרת סיכות" : "📍 הצגת סיכות"; ui.pins.style.display = pinsOn ? "" : "none"; });
    ui.panel.addEventListener("click", panelClick);
  }

  var onlyOpen = false;
  function panelClick(e) {
    var b = e.target.closest("[data-a]"), item = e.target.closest(".cm-item");
    if (b) {
      var a = b.getAttribute("data-a");
      if (a === "close") ui.panel.classList.remove("cm-show");
      if (a === "copy") copyAll(b);
      if (a === "open") { onlyOpen = !onlyOpen; b.setAttribute("aria-pressed", String(onlyOpen)); render(); }
      if (a === "clear" && comments.length && confirm("למחוק את כל " + comments.length + " ההערות?")) { comments = []; save(); render(); }
      return;
    }
    if (item) {
      var c = comments.find(function (x) { return x.id === item.getAttribute("data-id"); });
      if (c) goTo(c, true);
    }
  }
  function copyAll(btn) {
    var txt = comments.map(function (c) {
      return "#" + c.n + (c.status === "done" ? " (טופל)" : "") + " · " + (c.section || "") + "\n" + c.label + "\n→ " + c.text;
    }).join("\n\n");
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { btn.textContent = "הועתק ✓"; setTimeout(function () { btn.textContent = "העתקת כל ההערות"; }, 1600); })
      .catch(function () { prompt("העתיקי:", txt); });
  }

  function render() {
    var n = comments.filter(function (c) { return c.status !== "done"; }).length;
    ui.badge.hidden = !comments.length; ui.badge.textContent = n;
    ui.listBtn.textContent = "📋 כל ההערות (" + comments.length + ")";
    var list = comments.filter(function (c) { return !onlyOpen || c.status !== "done"; });
    ui.list.innerHTML = list.length ? list.map(function (c) {
      return '<article class="cm-item' + (c.status === "done" ? " cm-done" : "") + '" data-id="' + c.id + '" tabindex="0"><header><b>' + c.n + "</b><span>" + esc(c.section || "") + "</span></header><p>" + esc(c.text) + "</p><small>" + esc(c.label) + "</small></article>";
    }).join("") : '<p class="cm-empty">אין עדיין הערות. לחצי על "בחירת אלמנט להערה" ואז על כל דבר בדף.</p>';
    // pins
    ui.pins.innerHTML = "";
    comments.forEach(function (c) {
      var p = el("button", "cm-pin" + (c.status === "done" ? " cm-done" : ""), String(c.n));
      p.type = "button"; p.setAttribute("aria-label", "הערה " + c.n + ": " + c.text);
      p._c = c; p.addEventListener("click", function (e) { e.stopPropagation(); openPop(c); });
      ui.pins.appendChild(p);
    });
  }

  /* keep pins glued to their elements (handles pinned/animated sections) */
  function tick() {
    if (pinsOn) {
      Array.prototype.forEach.call(ui.pins.children, function (p) {
        var c = p._c, e = find(c);
        if (!e) { p.style.display = "none"; return; }
        var r = e.getBoundingClientRect();
        var vis = r.width + r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
        p.style.display = vis ? "" : "none";
        if (vis) { p.style.left = (r.left + r.width * (c.ox != null ? c.ox : 1)) + "px"; p.style.top = (r.top + r.height * (c.oy != null ? c.oy : 0)) + "px"; }
      });
    }
    if (ui.pop && ui.pop._el && ui.pop._follow) placePop(ui.pop, ui.pop._el);
    requestAnimationFrame(tick);
  }

  /* ---------------- picking ---------------- */
  function setPicking(on) {
    picking = on;
    ui.pick.setAttribute("aria-pressed", String(on));
    ui.pick.textContent = on ? "✋ ביטול בחירה" : "➕ בחירת אלמנט להערה";
    document.documentElement.classList.toggle("cm-picking", on);
    document.body.classList.toggle("cm-picking-on", on);
    if (!on) { ui.hl.style.display = "none"; hoverEl = null; }
    if (on) { ui.dock.classList.add("cm-open"); closePop(); }
  }
  function showHL(e) {
    var r = e.getBoundingClientRect();
    ui.hl.style.display = "block";
    ui.hl.style.left = r.left - 3 + "px"; ui.hl.style.top = r.top - 3 + "px";
    ui.hl.style.width = r.width + 6 + "px"; ui.hl.style.height = r.height + 6 + "px";
    ui.hl.firstChild.textContent = labelFor(e);
  }
  document.addEventListener("pointermove", function (e) {
    if (!picking || isUI(e.target)) { if (picking) ui.hl.style.display = "none"; return; }
    var t = normalize(document.elementFromPoint(e.clientX, e.clientY));
    if (!t || isUI(t)) return;
    hoverEl = t; showHL(t);
  }, true);
  ["pointerdown", "mousedown", "mouseup", "pointerup", "touchstart"].forEach(function (ev) {
    document.addEventListener(ev, function (e) { if (picking && !isUI(e.target)) { e.preventDefault(); e.stopPropagation(); } }, { capture: true, passive: false });
  });
  document.addEventListener("click", function (e) {
    if (!picking || isUI(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    var t = normalize(document.elementFromPoint(e.clientX, e.clientY)) || hoverEl;
    if (!t) return;
    var r = t.getBoundingClientRect();
    var ox = r.width ? Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) : 1;
    var oy = r.height ? Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) : 0;
    setPicking(false);
    openComposer(t, ox, oy);
  }, true);
  document.addEventListener("keydown", function (e) {
    var typing = /input|textarea|select/i.test(e.target.tagName) || e.target.isContentEditable;
    if (e.key === "Escape") { if (picking) setPicking(false); else if (ui.pop) closePop(); else ui.panel.classList.remove("cm-show"); }
    if (!typing && (e.key === "c" || e.key === "C" || e.key === "ב") && !e.metaKey && !e.ctrlKey && !e.altKey) { ui.dock.classList.add("cm-open"); setPicking(!picking); }
  });

  /* ---------------- popovers ---------------- */
  function placePop(pop, target) {
    var r = target.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight, m = 12;
    var top = r.bottom + 10; if (top + ph > innerHeight - m) top = Math.max(m, r.top - ph - 10);
    if (top < m) top = m;
    var left = r.left + r.width / 2 - pw / 2; left = Math.max(m, Math.min(innerWidth - pw - m, left));
    pop.style.top = top + "px"; pop.style.left = left + "px";
  }
  function closePop() { if (ui.pop) { if (ui.pop._el) ui.pop._el.style.outline = ui.pop._ol || ""; ui.pop.remove(); ui.pop = null; } }
  function mkPop(target, title) {
    closePop();
    var pop = el("div", "cm-pop");
    pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", "הערה");
    pop.innerHTML = "<h4>" + title + "</h4>";
    document.body.appendChild(pop);
    pop._el = target; pop._follow = true; pop._ol = target.style.outline;
    target.style.outline = "2px dashed #E8893A";
    ui.pop = pop;
    return pop;
  }
  function openComposer(target, ox, oy) {
    var pop = mkPop(target, "הערה על <b>" + esc(labelFor(target)) + "</b>");
    pop.insertAdjacentHTML("beforeend", '<textarea placeholder="מה לשנות כאן?" aria-label="תוכן ההערה"></textarea><div class="cm-row"><button type="button" class="cm-btn cm-primary" data-a="save">שמירה</button><button type="button" class="cm-btn" data-a="parent">⬆ לבחור את מה שמסביב</button><button type="button" class="cm-btn" data-a="cancel">ביטול</button></div>');
    var ta = pop.querySelector("textarea");
    placePop(pop, target); setTimeout(function () { ta.focus(); }, 30);
    function doSave() {
      var text = ta.value.trim(); if (!text) { ta.focus(); return; }
      comments.push({ id: "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), n: nextN(), text: text, status: "open",
        selector: selectorFor(target), label: labelFor(target), section: sectionFor(target), ox: +ox.toFixed(3), oy: +oy.toFixed(3),
        viewport: innerWidth + "×" + innerHeight, created: new Date().toISOString() });
      save(); render(); closePop();
    }
    ta.addEventListener("keydown", function (e) { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) doSave(); });
    pop.addEventListener("click", function (e) {
      var a = e.target.closest("[data-a]"); if (!a) return; a = a.getAttribute("data-a");
      if (a === "save") doSave();
      if (a === "cancel") closePop();
      if (a === "parent") { var p = target.parentElement; if (p && p !== document.body) { var v = ta.value; closePop(); openComposer(p, .5, 0); ui.pop.querySelector("textarea").value = v; } }
    });
  }
  function openPop(c) {
    var t = find(c); if (!t) { ui.panel.classList.add("cm-show"); return; }
    var pop = mkPop(t, "<b>#" + c.n + "</b> · " + esc(c.label));
    pop.insertAdjacentHTML("beforeend", '<textarea aria-label="תוכן ההערה"></textarea><div class="cm-row"><button type="button" class="cm-btn cm-primary" data-a="save">עדכון</button><button type="button" class="cm-btn" data-a="done">' + (c.status === "done" ? "↺ פתיחה מחדש" : "✓ טופל") + '</button><button type="button" class="cm-btn cm-danger" data-a="del">מחיקה</button><button type="button" class="cm-btn" data-a="cancel">סגירה</button></div>');
    var ta = pop.querySelector("textarea"); ta.value = c.text;
    placePop(pop, t);
    pop.addEventListener("click", function (e) {
      var a = e.target.closest("[data-a]"); if (!a) return; a = a.getAttribute("data-a");
      if (a === "save") { var v = ta.value.trim(); if (v) { c.text = v; c.updated = new Date().toISOString(); save(); render(); } closePop(); }
      if (a === "done") { c.status = c.status === "done" ? "open" : "done"; save(); render(); closePop(); }
      if (a === "del" && confirm("למחוק את הערה " + c.n + "?")) { comments = comments.filter(function (x) { return x !== c; }); save(); render(); closePop(); }
      if (a === "cancel") closePop();
    });
    ta.addEventListener("keydown", function (e) { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) pop.querySelector('[data-a="save"]').click(); });
  }
  function goTo(c, open) {
    var t = find(c);
    if (!t) { alert("לא מצאתי את האלמנט של הערה " + c.n + " בדף (אולי הוא מופיע רק במובייל/בדסקטופ)."); return; }
    var y = t.getBoundingClientRect().top + scrollY - innerHeight / 2 + t.offsetHeight / 2;
    if (window.__lenis) window.__lenis.scrollTo(Math.max(0, y), { duration: 1 }); else scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    setTimeout(function () {
      t.classList.add("cm-flash"); setTimeout(function () { t.classList.remove("cm-flash"); }, 1700);
      if (open) { if (innerWidth < 700) ui.panel.classList.remove("cm-show"); openPop(c); }
    }, 900);
  }
  document.addEventListener("click", function (e) {
    if (ui.pop && !isUI(e.target) && !picking) closePop();
  });

  /* בכתובת הציבורית העורך מוסתר; אפשר לפתוח אותו עם ?notes=1 (ההערות יישמרו אז בדפדפן בלבד) */
  var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || /\.(localhost|test)$/.test(location.hostname);
  if (!local && !/[?&]notes=1/.test(location.search)) return;
  function init() { build(); load(); requestAnimationFrame(tick); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
