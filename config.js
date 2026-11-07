/* Fill these in before publishing.
   radio:   public https address of your radio server (Cloudflare Tunnel or a VPS). Empty = page shows "off air".
   support: your Gumroad (or Ko-fi / Patreon) page where people support and get a Depot key. */
window.IRR = { radio: "", support: "" };
/* for testing: ?radio=http://localhost:8800 */
if (new URLSearchParams(location.search).get("radio")) IRR.radio = new URLSearchParams(location.search).get("radio");
/* on this Mac the page plays the local radio */
if (!IRR.radio && location.hostname === "localhost") IRR.radio = "http://localhost:8800";
