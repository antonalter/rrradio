/* rrradio, listener page. One shared live stream per station: no skipping,
   no seeking. You choose a station and listen. */
(() => {
  /* the live stream comes from the radio server (config.js); the page itself is static */
  const BASE = (window.IRR && IRR.radio || "").replace(/\/$/, "");
  const $ = s => document.querySelector(s);
  const au = $("#au");
  const esc = t => String(t).replace(/[&<>"']/g, c => "&#" + c.charCodeAt(0) + ";");

  /* the tab icon breathes while the radio is on air: the glow at the tip of the r pulses */
  const fav = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
    let link = document.querySelector("link[rel=icon]"), t0 = 0, iv = null;
    const frame = p => {
      x.fillStyle = "#08080a"; x.fillRect(0, 0, 64, 64);
      const r = 11 + 7 * p, g = x.createRadialGradient(46.5, 20.5, 0, 46.5, 20.5, r);
      g.addColorStop(0, `rgba(185,163,255,${0.45 + 0.4 * p})`); g.addColorStop(1, "rgba(185,163,255,0)");
      x.fillStyle = g; x.fillRect(0, 0, 64, 64);
      x.strokeStyle = "#f2efe9"; x.lineWidth = 4.2; x.beginPath(); x.moveTo(23.5, 52); x.lineTo(23.5, 33); x.arc(36, 33, 12.5, Math.PI, 1.5 * Math.PI); x.stroke();
      x.fillStyle = "#b9a3ff"; x.beginPath(); x.arc(46.9, 20.6, 3.2, 0, 7); x.fill();
      link.href = c.toDataURL("image/png");
    };
    return {
      on() { if (iv) return; t0 = performance.now(); iv = setInterval(() => frame(0.5 - 0.5 * Math.cos((performance.now() - t0) / 2400 * 2 * Math.PI)), 90) },
      off() { clearInterval(iv); iv = null; frame(0.35) }
    };
  })();
  const keep = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v) } catch { } };
  const HUE = [200, 265, 320, 28, 150, 90];
  const PART = { morning: "Morning", afternoon: "Afternoon", evening: "Evening", night: "Night" };
  let data = null, st = keep("irr-st"), on = false, lastId = null, retry = 0;

  /* volume: iPhone and iPad ignore it, the hardware buttons do the job there */
  au.volume = .5;
  if (au.volume !== .5) document.body.classList.add("no-vol");
  au.volume = (+(keep("irr-vol") ?? 80)) / 100;
  $("#vl").value = Math.round(au.volume * 100);
  $("#vl").addEventListener("input", e => { au.volume = e.target.value / 100; keep("irr-vol", e.target.value) });

  const station = () => data?.stations.find(s => s.id === st) || data?.stations[0];
  const hue = () => HUE[Math.max(0, data.stations.findIndex(s => s.id === st)) % HUE.length];

  async function poll() {
    try {
      data = await fetch(BASE + "/api/stations", { cache: "no-store" }).then(r => r.json());
      if (!data.stations.some(s => s.id === st)) st = data.stations[0]?.id;
      render(); window.onRadio && window.onRadio(data, st, on);
    } catch { if ($("#lv")) $("#lv").textContent = "Off air"; document.body.classList.add("offair"); $("#ttl").textContent = "Off air right now"; $("#by").textContent = "The live feed is resting. Try the full interface below, or get the extension." }
  }

  function nav() {
    const n = $("#st");
    if (!n.dataset.k || n.dataset.k !== data.stations.map(s => s.id).join()) {
      n.dataset.k = data.stations.map(s => s.id).join();
      n.innerHTML = "<i></i>" + data.stations.map((s, i) => `<button data-s="${s.id}"><sup>${i + 1}</sup>${esc(s.name)}</button>`).join("");
      /* list the stream addresses for players and smart speakers */
      $("#pls").innerHTML = data.stations.map(s => `<li><a href="${BASE}/listen/${s.id}.m3u">${esc(s.name)} · .m3u</a></li>`).join("");
      
    }
    n.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.s === st));
    const b = n.querySelector(".on"), i = n.querySelector("i");
    if (b) { i.style.width = Math.max(18, b.offsetWidth - 8) + "px"; i.style.transform = `translateX(${b.offsetLeft}px)` }
  }

  /* the artist name fills the empty cover; shrink it until the longest word fits */
  function fit(t) {
    const m = $("#mono"), w = $("#art").clientWidth * .84;
    m.textContent = t; let f = Math.min(110, w * .2);
    m.style.fontSize = f + "px";
    while (f > 18 && (m.scrollWidth > w + 1 || m.scrollHeight > $("#art").clientHeight * .8)) { f *= .9; m.style.fontSize = f + "px" }
  }
  function render() {
    nav();
    const s = station(); if (!s) return;
    const n = s.now, h = hue();
    document.documentElement.style.setProperty("--a", `hsl(${h} 70% 72%)`);
    document.documentElement.style.setProperty("--ag", matchMedia("(prefers-color-scheme: light)").matches ? `hsl(${h} 60% 80%)` : `hsl(${h} 70% 34%)`);
    $("#part").textContent = `${s.name} · ${PART[s.part] || ""}`;
    $("#who").textContent = s.listeners ? `${s.listeners} listening` : s.line;
    if (!n) {
      if (lastId !== "off") { $("#ttl").textContent = "Off air"; $("#by").textContent = "This station has nothing approved yet."; fit(s.name); $("#cov").classList.remove("on"); lastId = "off" }
      $("#next").innerHTML = ""; $("#prog").style.width = "0"; return;
    }
    const left = n.dur - (Date.now() / 1000 - n.started);
    $("#prog").style.width = Math.min(100, Math.max(0, (1 - left / n.dur) * 100)) + "%";
    if (n.id !== lastId) {
      lastId = n.id;
      const t = $("#ttl"); t.classList.add("in"); t.textContent = n.title; void t.offsetWidth; t.classList.remove("in");
      $("#by").textContent = n.artist;
      { const q = encodeURIComponent(n.artist + " " + n.title); $("#save").innerHTML = [["Spotify", `https://open.spotify.com/search/${q}`], ["Apple Music", `https://music.apple.com/search?term=${q}`], ["YouTube Music", `https://music.youtube.com/search?q=${q}`], ["Bandcamp", `https://bandcamp.com/search?q=${q}`]].map(([a, u]) => `<a href="${u}" target="_blank" rel="noopener">${a}</a>`).join("") }
      fit(n.artist);
      const c = $("#cov"); c.classList.remove("on");
      if (n.cover) { c.onload = () => c.classList.add("on"); c.src = `${BASE}/api/cover/${n.id}` } else c.removeAttribute("src");
      const g = $("#glow"); g.classList.remove("d"); void g.offsetWidth; g.classList.add("d");
      if (on) document.title = `${n.artist} · ${n.title} · rrradio`;
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({ title: n.title, artist: n.artist, album: `rrradio ${s.name}`,
          artwork: n.cover ? [{ src: `${BASE}/api/cover/${n.id}`, sizes: "512x512" }] : [{ src: "/icon.png", sizes: "512x512", type: "image/png" }] });
      }
    }
    $("#next").innerHTML = s.next.map(t => `<li><b>${esc(t.title)}</b><span>${esc(t.artist)}</span></li>`).join("");
  }

  /* playback: a live stream, so pausing really means leaving and rejoining live */
  function listen() {
    const s = station(); if (!s) return;
    on = true; document.body.classList.add("on-air");
    document.body.classList.add("tuning"); $("#pp").classList.remove("paused"); $("#pp").classList.add("wait"); $("#ppl").textContent = "Tuning in"; $("#pp").setAttribute("aria-label", "Stop");
    au.src = `${BASE}/stream/${s.id}.mp3?t=${Date.now()}`;
    au.play().catch(e => { if (e.name === "NotAllowedError") stop() });   /* AbortError just means a newer station took over */
  }
  function stop() {
    on = false; document.body.classList.remove("on-air", "tuning"); fav.off();
    au.pause(); au.removeAttribute("src"); au.load();
    $("#pp").classList.add("paused"); $("#pp").classList.remove("wait"); $("#ppl").textContent = "Listen"; $("#pp").setAttribute("aria-label", "Listen");
    document.title = "rrradio";
  }
  au.addEventListener("playing", () => { fav.on(); document.body.classList.remove("tuning"); document.body.classList.remove("offair"); retry = 0; $("#pp").classList.remove("wait"); $("#ppl").textContent = "Live"; render() });
  const recover = () => { if (!on) return; $("#pp").classList.add("wait"); $("#ppl").textContent = "Reconnecting"; setTimeout(() => on && listen(), Math.min(8000, 1000 * ++retry)) };
  au.addEventListener("error", recover);
  au.addEventListener("ended", recover);
  au.addEventListener("stalled", () => { if (on && au.paused) recover() });

  function tune(id) {
    if (!data || id === st || !data.stations.some(s => s.id === id)) return;
    st = id; keep("irr-st", id); lastId = null; render();
    if (on) listen();
  }
  const shift = d => { const L = data.stations, i = L.findIndex(s => s.id === st); tune(L[(i + d + L.length) % L.length].id) };

  /* the landing's station cards call this */
  window.radioPlay = id => { if (id !== st) tune(id); if (!on) listen(); window.onRadio && data && window.onRadio(data, st, true) };
  window.radioStop = () => { stop(); window.onRadio && data && window.onRadio(data, st, false) };
  $("#pp").addEventListener("click", () => on ? stop() : listen());
  $("#st").addEventListener("click", e => { const b = e.target.closest("[data-s]"); if (b) tune(b.dataset.s) });
  addEventListener("keydown", e => {
    if (/INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === " " && !e.target.closest("button")) { e.preventDefault(); on ? stop() : listen() }
    if (e.key === "ArrowRight") shift(1); if (e.key === "ArrowLeft") shift(-1);
    const k = +e.key; if (k >= 1 && data && k <= data.stations.length) tune(data.stations[k - 1].id);
  });
  /* swipe the cover sideways to change station, like turning a dial */
  let x0 = null, y0 = 0;
  const art = $("#art");
  $("#stage").addEventListener("touchstart", e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; art.classList.add("swipe") }, { passive: true });
  $("#stage").addEventListener("touchmove", e => { if (x0 == null) return; const dx = e.touches[0].clientX - x0; if (Math.abs(dx) > Math.abs(e.touches[0].clientY - y0)) art.style.transform = `translateX(${dx * .35}px) rotate(${dx * .015}deg)` }, { passive: true });
  $("#stage").addEventListener("touchend", e => {
    art.classList.remove("swipe"); art.style.transform = "";
    if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) shift(dx < 0 ? 1 : -1);
  });
  if ("mediaSession" in navigator) {
    const ms = navigator.mediaSession, h = (a, f) => { try { ms.setActionHandler(a, f) } catch { } };
    h("play", listen); h("pause", stop); h("stop", stop); h("nexttrack", () => shift(1)); h("previoustrack", () => shift(-1));
  }
  addEventListener("resize", () => data && nav());
  const tick = () => { $("#clk").textContent = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) };
  tick(); setInterval(tick, 15000);
  poll(); setInterval(poll, 5000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) poll() });
})();
