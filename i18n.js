/* rrradio landing: languages, theme, country, prices and the one reminder.
   English is read from the page itself; other languages live in i18n/<code>.json (missing keys stay English). */
(() => {
  const LANGS = { en: "English", es: "Español", pt: "Português", de: "Deutsch", fr: "Français", it: "Italiano", ru: "Русский", ja: "日本語", zh: "中文" };
  /* where each text lives on the page: key → [selector, index] */
  const MAP = {
    "nav.0": [".top .links a", 0], "nav.1": [".top .links a", 1], "nav.2": [".top .links a", 2], "nav.3": [".top .links a", 3], "nav.4": [".top .links a", 4], "cta.top": ["#ctatop"],
    "hero.free": ["#listen .eyebrow span", 2], "hero.h1": ["#listen h1", 0, 1], "hero.lede": ["#listen .lede"], "hero.play": ["#hplay"], "hero.home": ["#listen .cta a", 1],
    "trust.0": ["#listen .trust li", 0], "trust.1": ["#listen .trust li", 1], "trust.2": ["#listen .trust li", 2], "trust.3": ["#listen .trust li", 3], "hero.full": [".device .full"],
    "st.eyebrow": ["#stations .eyebrow"], "st.h2": ["#stations h2"], "st.lede": ["#stations .lede"], "st.also": ["#stations .also"],
    "lad.eyebrow": ["#ladder .eyebrow"], "lad.h2": ["#ladder h2"], "lad.lede": ["#ladder .lede"],
    "ext.eyebrow": ["#extension .eyebrow"], "ext.h2": ["#extension h2"], "ext.lede": ["#extension .lede"], "ext.cta0": ["#extension .cta a", 0], "ext.cta1": ["#extension .cta a", 1],
    "try.eyebrow": ["#try .eyebrow"], "try.h2": ["#try h2"], "try.lede": ["#try .lede"],
    "dep.eyebrow": ["#depot .eyebrow"], "dep.h2": ["#depot h2", 0, 1], "dep.lede": ["#depot .lede"], "dep.tnote": ["#depot .tnote", 0], "dep.tags": ["#depot .tdh b"],
    "pr.l0": [".pr .lb", 0], "pr.l1": [".pr .lb", 1], "pr.l2": [".pr .lb", 2], "pr.e0": [".pr em", 0], "pr.e1": [".pr em", 1], "pr.e2": [".pr em", 2],
    "store.t": ["#storet"], "store.l": ["#storel"], "store.ok": ["#storeok"], "pr.note": ["#pnote"], "pr.bill": ["#pbill"], "pr.hard": [".needc", 0, 1],
    "cmp.eyebrow": ["#compare .eyebrow"], "cmp.h2": ["#compare h2", 0, 1], "cmp.c1": ["#compare th", 1], "cmp.c2": ["#compare th", 2],
    "pro.eyebrow": ["#promises .eyebrow"], "pro.h2": ["#promises h2"], "proof.eyebrow": ["#proof .eyebrow"],
    "mail.eyebrow": ["#mail .eyebrow"], "mail.h2": ["#mail h2"], "mail.lede": ["#mail .lede"], "mail.btn": ["#mailf button"], "mail.note": ["#mailnote"],
    "thx.eyebrow": ["#thanks .eyebrow"], "thx.h2": ["#thanks h2"], "faq.h2": ["#faq h2"], "foot": [".foot span", 0], "nudge.a": ["#nudgea"]
  };
  for (let i = 0; i < 3; i++) Object.assign(MAP, { [`lad.${i}.lb`]: [`.steps3>div:nth-child(${i + 1}) .lb`], [`lad.${i}.b`]: [`.steps3>div:nth-child(${i + 1}) b`], [`lad.${i}.p`]: [`.steps3>div:nth-child(${i + 1}) p`], [`lad.${i}.btn`]: [`.steps3>div:nth-child(${i + 1}) .btn`] });
  for (let i = 0; i < 2; i++) MAP[`lad.${i}.em`] = [`.steps3>div:nth-child(${i + 1}) em`];
  for (let i = 0; i < 4; i++) Object.assign(MAP, { [`ext.st.${i}.b`]: [`#extension .steps li:nth-child(${i + 1}) b`], [`ext.st.${i}.s`]: [`#extension .steps li:nth-child(${i + 1}) span`, 0, 1] });
  for (let i = 0; i < 13; i++) MAP[`cmp.r${i}`] = [`#compare tbody tr:nth-child(${i + 1}) td:first-child`];
  Object.assign(MAP, { "cmp.v0": ["#compare tbody tr:nth-child(5) td:nth-child(3)"], "cmp.v1": ["#compare tbody tr:nth-child(5) td:nth-child(4)"], "cmp.v2": ["#compare tbody tr:nth-child(9) td:nth-child(3)"], "cmp.v3": ["#compare tbody tr:nth-child(10) td:nth-child(3)"], "dep.tnote2": ["#depot .tnote", 1] });
  for (let i = 0; i < 8; i++) Object.assign(MAP, { [`faq.${i}.q`]: [`#faq details:nth-of-type(${i + 1}) summary`], [`faq.${i}.a`]: [`#faq details:nth-of-type(${i + 1}) p`, 0, 1] });
  for (let i = 0; i < 6; i++) Object.assign(MAP, { [`ext.${i}.b`]: [`#extension .grid>div:nth-child(${i + 1}) b`], [`ext.${i}.s`]: [`#extension .grid>div:nth-child(${i + 1}) span`], [`dep.${i}.b`]: [`#depot .grid>div:nth-child(${i + 1}) b`], [`dep.${i}.s`]: [`#depot .grid>div:nth-child(${i + 1}) span`], [`pro.${i}.b`]: [`#promises .grid>div:nth-child(${i + 1}) b`], [`pro.${i}.s`]: [`#promises .grid>div:nth-child(${i + 1}) span`] });
  /* templates the code fills: {start} {month} {year} {life} {founding} {left} {n} {date} */
  const TPL = { "lad.2.em": "Deepot · {start} for your first 3 months", "pr.s0": "then from {month} a month, pay what you want", "pr.s1": "less than paying monthly", "pr.s2": "or {life} after the first hundred",
    "pr.found": "Founding 100: {left} of 100 places left, then {life}", "pr.b0": "Start for {start}", "pr.b1": "Take the year", "pr.b2": "Once, for good", "pr.soon": "Opens at launch",
    "pr.x": "Card payments can't reach your country yet. Write to us and we'll send you a key.", "pr.euro": "Charged {e} in euros",
    "nudge": "Deepot · 3 months for {start}", "proof.h": "On air since {date}.", "live.now": "Live now", "live.n": "{n} listening now", "live.off": "Back soon",
    "st.now": "Now", "st.off": "Off air", "st.tune": "Tune in", "stats.0": "stations on one line", "stats.1": "days on air", "stats.2": "listening right now", "stats.3": "artists on air in the next hour", "stats.4": "ads, ever" };
  const q = ([sel, i = 0]) => document.querySelectorAll(sel)[i];
  const EN = {}; for (const k in MAP) { const e = q(MAP[k]); if (e) EN[k] = MAP[k][2] ? e.innerHTML : txt(e) }
  function txt(e) { const n = [...e.childNodes].find(n => n.nodeType === 3 && n.data.trim()); return n ? n.data : e.textContent }
  function put(e, v, html) { if (html) { e.innerHTML = v; return } const n = [...e.childNodes].find(n => n.nodeType === 3 && n.data.trim()); if (n) n.data = v; else e.textContent = v }
  let D = {};
  window.T = k => D[k] || TPL[k] || EN[k] || null;
  const fill = (k, o) => (window.T(k) || "").replace(/\{(\w+)\}/g, (_, a) => o[a] ?? "");
  function apply() { for (const k in MAP) { const e = q(MAP[k]), v = D[k] || EN[k]; if (e && v != null) put(e, v, MAP[k][2]) } document.documentElement.lang = PRICE.lang; if (window.IRR && IRR.contact) document.querySelectorAll(".contact").forEach(e => e.textContent = IRR.contact); renderPrices(); window.onAir && onAir() }
  async function setLang(l) {
    if (!LANGS[l]) l = "en"; PRICE.lang = l; try { localStorage.setItem("rr-lang", l) } catch { }
    D = {}; if (l !== "en") { try { D = await fetch(`i18n/${l}.json`, { cache: "no-cache" }).then(r => r.ok ? r.json() : {}) } catch { } }
    document.getElementById("lang").value = l; fillCountries(); apply() }
  /* prices: one place renders them all, in the reader's language and currency */
  window.renderPrices = () => {
    const P = PRICE, o = { start: P.fmt("start"), month: P.fmt("month"), year: P.fmt("year"), life: P.fmt("life"), founding: P.fmt("founding"), left: 100 - ((window.IRR && IRR.founding) || 0) };
    const pr = document.querySelectorAll(".pr"), x = P.tier === "X";
    const set = (i, plan, sub, btn) => { const c = pr[i]; if (!c) return; c.querySelector("b").innerHTML = plan === "life" && o.left > 0 ? `${o.founding} <s>${o.life}</s>` : o[plan]; c.querySelector("span:not(.lb)").textContent = sub;
      const a = c.querySelector("[data-buy]"), u = P.buy(plan === "life" && o.left > 0 ? "founding" : plan); a.hidden = x; if (u) { a.href = u; a.target = "_blank"; a.rel = "noopener"; a.textContent = btn; a.classList.remove("soon") } else { a.removeAttribute("target"); a.href = "#depot"; a.textContent = fill("pr.soon", o); a.classList.add("soon") }
      c.title = fill("pr.euro", { e: P.euro(plan === "life" && o.left > 0 ? "founding" : plan) }) };
    set(0, "start", fill("pr.s0", o), fill("pr.b0", o)); set(1, "year", fill("pr.s1", o), fill("pr.b1", o)); set(2, "life", o.left > 0 ? fill("pr.found", o) : fill("pr.s2", o), fill("pr.b2", o));
    const l2 = document.querySelector(".steps3>div:nth-child(3) em"); if (l2) l2.textContent = fill("lad.2.em", o);
    document.getElementById("nudget").textContent = fill("nudge", o);
    const note = document.getElementById("pnote"); note.textContent = x ? fill("pr.x", o) : (D["pr.note"] || EN["pr.note"]);
    const ph = document.getElementById("proofh"); if (ph) ph.textContent = fill("proof.h", { date: new Intl.DateTimeFormat(P.lang, { day: "numeric", month: "long", year: "numeric" }).format(new Date(Date.UTC(2026, 10, 7))) }) };
  function fillCountries() {
    const s = document.getElementById("cty"); if (!s) return; const dn = new Intl.DisplayNames([PRICE.lang], { type: "region" });
    s.innerHTML = PRICE.countries().map(c => [c, dn.of(c)]).sort((a, b) => a[1].localeCompare(b[1], PRICE.lang)).map(([c, n]) => `<option value="${c}">${n}</option>`).join(""); s.value = PRICE.cty }
  /* wiring */
  const ls = document.getElementById("lang"); ls.innerHTML = Object.entries(LANGS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
  ls.onchange = () => setLang(ls.value);
  
  document.getElementById("theme").onclick = () => { const r = document.documentElement, dark = getComputedStyle(r).getPropertyValue("--bg").trim() !== "#efece5", t = dark ? "light" : "dark"; r.dataset.theme = t;
    try { localStorage.setItem("rr-theme", t); localStorage.setItem("rr-day", t === "light" ? "1" : "0") } catch { } const f = document.getElementById("pf"); f && f.contentWindow.location.reload() };
  /* the one reminder: only after most of the page is read, never twice in a week, gone with one tap */
  const nd = document.getElementById("nudge"); let seen = 0; try { seen = +(localStorage.getItem("rr-nudge") || 0) } catch { }
  addEventListener("scroll", () => { if (nd.dataset.done || Date.now() - seen < 6048e5) return; const d = document.documentElement, f = d.scrollTop / (d.scrollHeight - innerHeight), dep = document.getElementById("depot").getBoundingClientRect();
    if (f > .55 && (dep.bottom < 0 || dep.top > innerHeight)) { nd.classList.add("on"); nd.dataset.done = 1; try { localStorage.setItem("rr-nudge", Date.now()) } catch { } setTimeout(() => nd.classList.remove("on"), 12000) } }, { passive: true });
  document.getElementById("nudgex").onclick = () => nd.classList.remove("on");
  document.getElementById("nudgea").onclick = () => nd.classList.remove("on");
  let l0 = new URLSearchParams(location.search).get("lang"); try { l0 = l0 || localStorage.getItem("rr-lang") } catch { }
  l0 = l0 || (navigator.languages || [navigator.language]).map(x => x.slice(0, 2)).find(x => LANGS[x]) || "en";
  setLang(l0);
})();
