/* rrradio landing, 2026-11 layer: the "on air now" longread under the radio, station DNA on the stop cards,
   and the gate that hands the reader over to the free extension. Everything here is read-only and public:
   track facts come from MusicBrainz, the artist story from Wikipedia (CC BY-SA, linked). */
(() => {
  const RB = ((window.IRR && IRR.radio) || "").replace(/\/$/, "");
  const $ = s => document.querySelector(s), E = t => String(t ?? "").replace(/[&<>"']/g, c => "&#" + c.charCodeAt(0) + ";");
  const HUES = { fresh: 192, clock: 152, global: 36, club: 318, cellar: 96, tube: 18, taste: 40 };

  /* each stop: a motto, a mission and its DNA. The seven stops are interchanges: each gathers its taste from the
     smaller stations on its branch lines, and Deepot at the end of the line gathers all of them. */
  const DNA = window.RR_DNA = {
    fresh: { motto: "Everything new lands here first.", mission: "New records from the artists on air and their nearest neighbours, the week they come out. The departure board of the whole line.", dna: ["new releases", "nearest neighbours", "every genre", "weekly board"] },
    clock: { motto: "Quiet enough to think.", mission: "Background for work, reading and sleep: calm and mostly instrumental, gathered from every room on the line.", dna: ["ambient", "modern classical", "soft IDM", "library music", "downtempo"] },
    global: { motto: "The world keeps time on a groove.", mission: "Grooves and cycles from Africa, Asia, Latin America and Eastern Europe: the records that never made the export charts.", dna: ["ethio-jazz", "afrobeat", "highlife", "tropicália", "anatolian rock", "cumbia"] },
    club: { motto: "Three clubs under one square.", mission: "Electronic music from Detroit to bass: house, electro and techno, the classics next to this week's twelve-inches. The interchange for the club lines.", dna: ["detroit techno", "chicago house", "electro", "acid", "bass"] },
    cellar: { motto: "Noise that turns into rhythm.", mission: "The labyrinth: dark, experimental and industrial, musique concrète and sound art. For getting lost on purpose.", dna: ["industrial", "musique concrète", "EBM", "dark ambient", "sound art"] },
    tube: { motto: "Doors of perception.", mission: "Psych, classic and folk rock, no wave, punk, post-punk and shoegaze: guitars that open something.", dna: ["psych", "folk rock", "no wave", "post-punk", "shoegaze"] },
    taste: { motto: "The end of the line. The best of all of it.", mission: "The overview radio: the best of every station, all day. For supporters it turns into their own radio, tuned by hand.", dna: ["the best of every stop", "all day long", "tuned by hand in Diggers Depot"] }
  };

  /* ---------- station DNA on the stop cards (the cards are redrawn by the page every 30 s) ---------- */
  const cards = $("#cards");
  const dress = () => cards && cards.querySelectorAll(".stop").forEach(b => {
    const d = DNA[b.dataset.id]; if (!d || b.querySelector(".mot")) return;
    b.querySelector(".tx")?.insertAdjacentHTML("beforeend", `<span class="mot">${E(d.motto)}</span><span class="dnal">${d.dna.map(E).join(" · ")}</span>`);
  });
  if (cards) new MutationObserver(dress).observe(cards, { childList: true });

  /* ---------- small rings that call the eye to what matters ---------- */
  const RINGS = [[".now .gin h3", "50%", "-10%", "150px"], ["#free .head h2", "-14px", "40%", "120px"], ["#free .ways a:first-child", "-6px", "50%", "90px"], [".depot .head", "86%", "34%", "230px", "tun"], [".places .deal .btn", "50%", "50%", "120px"], [".gin .btn.hot", "50%", "50%", "110px"]];
  const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle("on", e.isIntersecting)), { threshold: .6 }) : null;
  RINGS.forEach(([sel, x, y, sz, kind]) => { const el = $(sel); if (!el || el.querySelector(":scope>.rings")) return; el.classList.add("rrg"); el.style.setProperty("--rx", x); el.style.setProperty("--ry", y); el.style.setProperty("--rs", sz);
    el.insertAdjacentHTML("afterbegin", kind === "tun" ? '<span class="rings tun" aria-hidden="true">' + "<i></i>".repeat(6) + '</span>' : '<span class="rings" aria-hidden="true"><i></i><i></i><i></i></span>'); io ? io.observe(el) : el.classList.add("on") });

  /* ---------- the longread ---------- */
  const now = $("#now"); if (!now) return;
  let data = null, shown = "", ask = 0;
  const lang = () => (document.documentElement.lang || "en").slice(0, 2);
  const ch = () => { try { return localStorage.getItem("rr-ch") } catch { return null } };
  const station = () => data && (data.stations.find(s => s.id === ch()) || data.stations[0]);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const J = u => fetch(u, { headers: { Accept: "application/json" } }).then(r => r.ok ? r.json() : null).catch(() => null);
  const cache = (k, v) => { try { if (v === undefined) return JSON.parse(sessionStorage.getItem(k) || "null"); sessionStorage.setItem(k, JSON.stringify(v)) } catch { return null } };
  const q = s => encodeURIComponent(s);
  const clean = t => String(t || "").replace(/\s*[\(\[][^)\]]*(remaster|edit|version|mix|live|mono|stereo)[^)\]]*[\)\]]/gi, "").replace(/_/g, " ").trim();

  /* MusicBrainz: the recording, its earliest proper release, the label, and the artist's own links.
     One request a second, as MusicBrainz asks. */
  async function facts(artist, title) {
    const key = "rrmb:" + artist + "|" + title, c = cache(key); if (c) return c;
    const out = { album: "", year: "", label: "", cat: "", type: "", mbid: "", rel: "", country: "", since: "", genres: [], links: {} };
    const r = await J(`https://musicbrainz.org/ws/2/recording?query=${q(`recording:"${clean(title)}" AND artist:"${artist}"`)}&fmt=json&limit=10`);
    const recs = (r && r.recordings || []).filter(x => x.score >= 80);
    let best = null;
    for (const x of recs) for (const v of x.releases || []) {
      const t = (v["release-group"] || {})["primary-type"] || "", sec = (v["release-group"] || {})["secondary-types"] || [];
      const rank = (v.status === "Official" ? 0 : 2) + (t === "Album" ? 0 : t === "EP" ? .5 : t === "Single" ? 1 : 1.5) + (sec.length ? 2 : 0);
      const y = +(v.date || "9999").slice(0, 4);
      if (!best || rank < best.rank || (rank === best.rank && y < best.y)) best = { rank, y, v, t, x };
    }
    if (recs[0]) out.mbid = ((recs[0]["artist-credit"] || [])[0] || {}).artist?.id || "";
    if (best) {
      out.album = best.v.title; out.year = best.y < 9999 ? String(best.y) : ""; out.type = best.t; out.rel = best.v.id;
      await wait(1100);
      const rel = await J(`https://musicbrainz.org/ws/2/release/${best.v.id}?inc=labels&fmt=json`);
      const li = rel && (rel["label-info"] || []).find(l => l.label && l.label.name);
      if (li) { out.label = li.label.name; out.cat = li["catalog-number"] && li["catalog-number"] !== "[none]" ? li["catalog-number"] : "" }
    }
    if (out.mbid) {
      await wait(1100);
      const a = await J(`https://musicbrainz.org/ws/2/artist/${out.mbid}?inc=url-rels+genres&fmt=json`);
      if (a) {
        out.country = (a.area || {}).name || ""; out.since = ((a["life-span"] || {}).begin || "").slice(0, 4);
        out.genres = (a.genres || []).sort((x, y) => y.count - x.count).slice(0, 6).map(g => g.name);
        for (const rel of a.relations || []) {
          const u = (rel.url || {}).resource || ""; if (!u) continue;
          const k = /bandcamp\.com/.test(u) ? "Bandcamp" : /discogs\.com/.test(u) ? "Discogs" : /wikidata\.org/.test(u) ? "wikidata" : /soundcloud\.com/.test(u) ? "SoundCloud" : /instagram\.com/.test(u) ? "Instagram" : /rateyourmusic\.com/.test(u) ? "RYM" : rel.type === "official homepage" ? "Website" : "";
          if (k && !out.links[k]) out.links[k] = u;
        }
      }
    }
    cache(key, out); return out;
  }

  /* Wikipedia: the intro of the artist's article, in the page language when there is one */
  const MUSIC = /(band|musician|singer|composer|producer|\bDJ\b|group|duo|trio|artist|rapper|guitarist|pianist|ensemble|orchestra|группа|музыкант|композитор|певица|певец|продюсер|диджей)/i;
  async function story(artist, wikidata) {
    const L = lang(), key = "rrwp:" + L + ":" + artist, c = cache(key); if (c) return c;
    let site = L === "en" ? ["en"] : [L, "en"], found = null;
    if (wikidata) {
      const id = wikidata.split("/").pop();
      const w = await J(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${id}&props=sitelinks&format=json&origin=*`);
      const sl = w && w.entities && w.entities[id] && w.entities[id].sitelinks || {};
      for (const s of site) if (sl[s + "wiki"]) { found = { l: s, t: sl[s + "wiki"].title }; break }
    }
    if (!found) look: for (const s of site) for (const t of [artist, artist + " (band)", artist + " (musician)"]) {
      const sm = await J(`https://${s}.wikipedia.org/api/rest_v1/page/summary/${q(t.replace(/ /g, "_"))}`);
      if (sm && sm.type === "standard" && MUSIC.test((sm.description || "") + " " + (sm.extract || ""))) { found = { l: s, t: sm.title }; break look }
    }
    let out = null;
    if (found) {
      const x = await J(`https://${found.l}.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro=1&explaintext=1&pithumbsize=640&redirects=1&titles=${q(found.t)}&format=json&origin=*`);
      const p = x && x.query && Object.values(x.query.pages || {})[0];
      if (p && p.extract) out = { text: p.extract, img: p.thumbnail && p.thumbnail.source, url: `https://${found.l}.wikipedia.org/wiki/${q(found.t.replace(/ /g, "_"))}`, lang: found.l };
    }
    cache(key, out || {}); return out;
  }

  function links(a, t, f) {
    const L = [];
    if (f.links.Website) L.push(["Website", f.links.Website]);
    L.push(["Bandcamp", f.links.Bandcamp || `https://bandcamp.com/search?q=${q(a)}`]);
    L.push(["Discogs", f.links.Discogs || `https://www.discogs.com/search/?q=${q(a + " " + t)}&type=all`]);
    if (f.links.SoundCloud) L.push(["SoundCloud", f.links.SoundCloud]);
    L.push(["YouTube", `https://www.youtube.com/results?search_query=${q(a + " " + t)}`]);
    L.push(["Last.fm", `https://www.last.fm/music/${q(a).replace(/%20/g, "+")}`]);
    L.push(["MusicBrainz", f.mbid ? `https://musicbrainz.org/artist/${f.mbid}` : `https://musicbrainz.org/search?query=${q(a)}&type=artist`]);
    if (f.links.RYM) L.push(["RYM", f.links.RYM]);
    if (f.label) L.push([f.label + " · label", `https://www.discogs.com/search/?q=${q(f.label)}&type=label`]);
    return L.map(([n, u]) => `<a href="${E(u)}" target="_blank" rel="noopener">${E(n)}<i>↗</i></a>`).join("");
  }

  async function render(force) {
    const s = station(); if (!s || !s.now) return;
    const tk = s.id + ":" + s.now.id; if (tk === shown && !force) return; shown = tk; const my = ++ask;
    const a = s.now.artist, t = s.now.title, d = DNA[s.id] || {};
    now.style.setProperty("--h", HUES[s.id] ?? 200);
    $("#nst").textContent = s.name; $("#nmot").textContent = d.motto || s.line;
    $("#nart").textContent = a; $("#ntr").innerHTML = `“${E(clean(t))}”`;
    $("#ncov").src = s.now.cover ? `${RB}/api/cover/${s.now.id}` : ""; $("#ncov").hidden = !s.now.cover;
    $("#nmis").textContent = d.mission || s.line;
    $("#ndna").innerHTML = (d.dna || []).map(x => `<li>${E(x)}</li>`).join("");
    $("#nnext").innerHTML = (s.next || []).slice(0, 4).map(n => `<li><b>${E(n.artist)}</b><span>${E(clean(n.title))}</span><em>${Math.round(n.dur / 60)} min</em></li>`).join("");
    $("#nmeta").innerHTML = `<div><dt>Track</dt><dd>${E(clean(t))}</dd></div><div><dt>Artist</dt><dd>${E(a)}</dd></div><div class="ld"><dt>Album</dt><dd>…</dd></div><div class="ld"><dt>Label</dt><dd>…</dd></div>`;
    $("#nlinks").innerHTML = links(a, t, { links: {} });
    $("#nbio").innerHTML = `<p class="ld">Reading up on ${E(a)}…</p>`;
    gate();
    const f = await facts(a, t); if (my !== ask) return;
    const row = (k, v) => v ? `<div><dt>${k}</dt><dd>${v}</dd></div>` : "";
    $("#nmeta").innerHTML = row("Track", E(clean(t))) + row("Artist", E(a) + (f.country || f.since ? `<small>${E([f.country, f.since && "since " + f.since].filter(Boolean).join(", "))}</small>` : ""))
      + row(f.type === "Single" ? "Single" : f.type === "EP" ? "EP" : "Album", f.album && `${E(f.album)}${f.year ? `<small>${E(f.year)}</small>` : ""}`)
      + row("Label", f.label && `${E(f.label)}${f.cat ? `<small>${E(f.cat)}</small>` : ""}`)
      + row("Sound", f.genres.length && f.genres.map(E).join(" · "))
      + row("On air at", `${E(s.name)}`);
    $("#nlinks").innerHTML = links(a, t, f);
    const w = await story(a, f.links.wikidata); if (my !== ask) return;
    if (w && w.text) {
      const ps = w.text.split(/\n+/).filter(p => p.trim().length > 40).slice(0, 5);
      $("#nbio").innerHTML = (w.img ? `<img class="nimg" src="${E(w.img)}" alt="" loading="lazy">` : "") + ps.map((p, i) => `<p${i ? "" : ` class="drop"`}>${E(p)}</p>`).join("")
        + `<p class="src">From <a href="${E(w.url)}" target="_blank" rel="noopener">Wikipedia</a>, CC BY-SA. Read on ↗</p>`;
    } else $("#nbio").innerHTML = `<p class="drop">${E(a)} is on air at ${E(s.name)} right now. There is no encyclopedia page for them yet, which on rrradio is usually a good sign: the links on the left go to their records, their label and everyone who wrote about them.</p>`;
    gate();
  }

  /* the gate: about a third of the story is open, the rest sits under frosted glass with the way in */
  function gate() {
    setTimeout(() => {
      const lr = $("#lr"), g = now.querySelector(".gate"); if (!lr || !g) return;
      /* about a third, and always the first lines of the story */
      const body = now.querySelector(".nbody"), first = now.querySelector("#nbio p");
      const read = body && first ? body.offsetTop + 230 : 0; /* the first lines of the story stay readable */
      const open = Math.max(Math.round(lr.scrollHeight * .3), read, Math.min(560, lr.scrollHeight));
      now.style.setProperty("--open", open + "px");
    }, 0);
  }
  addEventListener("resize", gate); setInterval(gate, 3000);

  async function poll() {
    try { data = await fetch(RB + "/api/stations", { cache: "no-store" }).then(r => r.json()) } catch { return }
    render();
  }
  addEventListener("storage", e => { if (e.key === "rr-ch") render() });
  /* the language can change after the page loads: read the story again in the new one */
  new MutationObserver(() => render(true)).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  poll(); setInterval(poll, 15000); setInterval(() => { if (data && ch() && !shown.startsWith(ch() + ":")) render() }, 1500);
})();
