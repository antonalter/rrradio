/* Fill these in before publishing.
   radio:   public https address of your radio server (Cloudflare Tunnel or a VPS). Empty = page shows "off air".
   support: your Gumroad (or Ko-fi / Patreon) page where people support and get a Deepot key. */
window.IRR = { radio: "https://rrradio-radio.rrradio.workers.dev", support: "", newsletter: "", contact: "", founding: 0,
  /* Lemon Squeezy checkout links, filled at launch: start (€3 first 3 months), year, life (€59), founding (€39, first 100) */
  buy: { start: "", year: "", life: "", founding: "" },
  /* legal notice: who runs rrradio (required in the EU before taking payments) */
  legal: { name: "", address: "", email: "" } };
/* newsletter: a signup URL, e.g. https://buttondown.com/api/emails/embed-subscribe/<your-name> */
/* for testing: ?radio=http://localhost:8800 */
if (new URLSearchParams(location.search).get("radio")) IRR.radio = new URLSearchParams(location.search).get("radio");
/* on this Mac the page plays the local radio */
if (!IRR.radio && location.hostname === "localhost") IRR.radio = "http://localhost:8800";
