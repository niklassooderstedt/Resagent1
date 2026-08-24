/* DestyPoint v1.5
   Built from the supplied ResAgent v1.4 CLEAN package.
   v1.5 keeps the working natural-language prototype while:
   - rebranding to DestyPoint
   - removing automatic activity suggestions
   - treating the description field as the single place for trip preferences/budget
   - preparing accommodation results to show hotel/source explicitly
*/

const q = (selector) => document.querySelector(selector);

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/é/g, "e");
}

function todayISO() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function setTodayDates() {
  const today = todayISO();
  if (q("#from")) q("#from").value = today;
  if (q("#to")) q("#to").value = today;
}

function days() {
  const from = q("#from")?.value;
  const to = q("#to")?.value;
  if (!from || !to) return 1;
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

function money(value) {
  return Math.round(value).toLocaleString("sv-SE") + " kr";
}

function parsePeople(text) {
  const t = normalize(text);
  const direct = [
    /(\d+)\s*(?:personer|person|resenärer|resenarer)/,
    /vi\s+(?:ar|är)\s+(\d+)/,
    /(\d+)\s+(?:vuxna|barn)/
  ];
  for (const re of direct) {
    const m = t.match(re);
    if (m) return Number(m[1]);
  }

  const words = { en:1, ett:1, tva:2, tre:3, fyra:4, fem:5, sex:6, sju:7, atta:8, nio:9, tio:10 };
  let total = 0, found = false;
  for (const [word, n] of Object.entries(words)) {
    const re = new RegExp(`\\b${word}\\s+(?:vuxna|barn|personer)\\b`, "i");
    if (re.test(t)) { total += n; found = true; }
  }
  return found ? total : 1;
}

function parseBudget(text) {
  const t = normalize(text);
  const patterns = [
    /(?:budget|max|maximalt|under|upp till|ca|cirka|runt)\s*(?:pa\s*)?([0-9][0-9\s.,]*)\s*(?:kr|kronor)/,
    /([0-9][0-9\s.,]*)\s*(?:kr|kronor)\s*(?:i\s+budget|budget)/,
    /budget(?:en)?\s*(?:ar|är)?\s*([0-9][0-9\s.,]*)/
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m) {
      const value = Number(m[1].replace(/[^\d]/g, ""));
      if (value > 0) return value;
    }
  }
  return null;
}

function parseTripType(text) {
  const t = normalize(text);
  if (/spa|spahotell|spaweekend|spa resa|sparesa/.test(t)) return "spa";
  if (/weekend/.test(t)) return "weekend";
  if (/familj|barn|barnfamilj|familjeresa/.test(t)) return "familj";
  if (/romantik|romantisk|parresa|parweekend/.test(t)) return "romantik";
  if (/skidor|skidresa|fjall|fjällresa/.test(t)) return "skidor";
  if (/sol och bad|sol bad|badsemester|strand/.test(t)) return "sol & bad";
  return "balanserad resa";
}

function parsePriorities(text) {
  const t = normalize(text);
  const rules = [
    ["sol & bad", /sol|bad|strand|varme/],
    ["familj", /familj|barn/],
    ["budget", /budget|billig|prisvard|spara pengar/],
    ["kort restid", /kort restid|snabbt|nara|inte langt/],
    ["kultur", /kultur|museum|historia|sevardhet/],
    ["natur", /natur|vandring|skog|fjall|sjo|skargard/],
    ["spa", /spa|relax|massage|bastu/],
    ["mat", /mat|restaurang|gastronomi/]
  ];
  return rules.filter(([, re]) => re.test(t)).map(([name]) => name);
}

function parseOrigin(text) {
  const raw = text || "";
  const m = raw.match(/(?:från|fran)\s+([A-Za-zÅÄÖåäö\- ]+?)(?=\s+(?:till|och|för|for|med|i|under|på|pa)\b|[.,]|$)/i);
  return m ? m[1].trim() : null;
}

function parseDestination(text) {
  const t = normalize(text);
  const destinations = [
    ["Stockholm", /\bstockholm\b/], ["Göteborg", /\bgoteborg\b/],
    ["Malmö", /\bmalmo\b/], ["Uppsala", /\buppsala\b/],
    ["Visby", /\bvisby\b/], ["Örebro", /\borebro\b/],
    ["Västerås", /\bvasteras\b/], ["Linköping", /\blinkoping\b/],
    ["Norrköping", /\bnorrkoping\b/], ["Jönköping", /\bjonkoping\b/],
    ["Kalmar", /\bkalmar\b/], ["Halmstad", /\bhalmstad\b/],
    ["Helsingborg", /\bhelsingborg\b/], ["Kiruna", /\bkiruna\b/],
    ["Åre", /\bare\b/], ["Gotland", /\bgotland\b/],
    ["Skåne", /\bskane\b/], ["Dalarna", /\bdalarna\b/],
    ["Stockholms skärgård", /skargard/], ["Grekland", /\bgrekland\b|\baten\b|\bkreta\b|\brhodos\b|\bkos\b/],
    ["Spanien", /\bspanien\b|\bbarcelona\b|\bmadrid\b|\bmallorca\b|\bteneriffa\b/],
    ["Italien", /\bitalien\b|\brom\b|\bvenedig\b|\bmilano\b/],
    ["Frankrike", /\bfrankrike\b|\bparis\b|\bnice\b/],
    ["Thailand", /\bthailand\b|\bbangkok\b|\bphuket\b/],
    ["Japan", /\bjapan\b|\btokyo\b|\bkyoto\b/],
    ["Florida", /\bflorida\b|\bmiami\b|\borlando\b/],
    ["London", /\blondon\b/], ["Berlin", /\bberlin\b/], ["Köpenhamn", /\bkopenhamn\b/]
  ];
  for (const [name, re] of destinations) if (re.test(t)) return name;
  const m = (text || "").match(/(?:till|i)\s+([A-Za-zÅÄÖåäö\- ]{2,40})/i);
  if (m) return m[1].trim().replace(/\s+/g, " ");
  return "Valfri destination";
}

function scoreDestination(destination, tripType, priorities, budget) {
  let score = 78;
  if (destination === "Stockholm") score = tripType === "spa" ? 94 : tripType === "weekend" ? 92 : tripType === "familj" ? 91 : 88;
  if (destination === "Göteborg") score = tripType === "familj" ? 94 : 89;
  if (destination === "Malmö") score = 87;
  if (destination === "Visby") score = tripType === "weekend" ? 92 : 88;
  if (destination === "Åre") score = tripType === "skidor" ? 96 : 86;
  if (destination === "Grekland") score = 92;
  if (destination === "Spanien") score = 89;
  if (destination === "Italien") score = 88;
  if (destination === "Thailand") score = 87;
  if (destination === "Japan") score = 86;
  if (priorities.includes("budget")) score += 1;
  if (budget && budget < 6000 && !["Stockholm", "Göteborg"].includes(destination)) score += 1;
  return Math.min(98, score);
}

/* ---------- Explicit activities only ---------- */

const ACTIVITIES = [
  { names:["gröna lund","grona lund"], title:"Gröna Lund", type:"Nöjespark", city:"Stockholm", price:570, link:"https://www.gronalund.com/" },
  { names:["liseberg"], title:"Liseberg", type:"Nöjespark", city:"Göteborg", price:570, link:"https://www.liseberg.se/" },
  { names:["astrid lindgrens värld","astrid lindgrens varld"], title:"Astrid Lindgrens Värld", type:"Familjepark", city:"Vimmerby", price:395, link:"https://www.astridlindgrensvarld.se/" },
  { names:["high chaparral","high chaparall"], title:"High Chaparral", type:"Familjepark", city:"Kulltorp", price:365, link:"https://www.highchaparral.se/" },
  { names:["kolmården","kolmarden"], title:"Kolmårdens djurpark", type:"Djurpark", city:"Kolmården", price:399, link:"https://www.kolmarden.com/" },
  { names:["borås djurpark","boras djurpark"], title:"Borås Djurpark", type:"Djurpark", city:"Borås", price:299, link:"https://www.borasdjurpark.se/" },
  { names:["skansen"], title:"Skansen", type:"Djurpark & friluftsmuseum", city:"Stockholm", price:265, link:"https://www.skansen.se/" }
];

function findActivities(text) {
  const t = normalize(text);
  // v1.5: never invent an activity from destination/trip type.
  return ACTIVITIES.filter(a => a.names.some(n => t.includes(normalize(n))));
}

/* ---------- Swedish transport ---------- */

function isSwedenTrip(destination, text) {
  const t = normalize(text);
  const terms = ["sverige","stockholm","goteborg","malmo","uppsala","visby","orebro","vasteras","linkoping","norrkoping","jonkoping","kalmar","halmstad","helsingborg","kiruna","are","gotland","skane","dalarna"];
  return terms.some(x => t.includes(x)) ||
    ["Stockholm","Göteborg","Malmö","Uppsala","Visby","Örebro","Västerås","Linköping","Norrköping","Jönköping","Kalmar","Halmstad","Helsingborg","Kiruna","Åre","Gotland","Skåne","Dalarna"].includes(destination);
}

function transportEstimate(origin, destination, people, text) {
  const t = normalize(text);
  const longTrip = /stockholm.*goteborg|goteborg.*stockholm|stockholm.*malmo|malmo.*stockholm|kiruna/.test(t);
  const trainPerPerson = longTrip ? 650 : 420;
  const train = trainPerPerson * people * 2;
  const car = longTrip ? 2200 : 1300;
  const boat = /visby|gotland|farja|bat|skargard/.test(t) ? 900 * people : null;
  return { train, car, boat };
}

function transportHtml(origin, destination, people, text) {
  if (!isSwedenTrip(destination, text)) return "";
  const est = transportEstimate(origin, destination, people, text);
  return `
    <section class="option nested">
      <div class="section-kicker">🇸🇪 TRANSPORT</div>
      <h3>Transport i Sverige</h3>
      <p>DestyPoint tar med 🚗 <b>bil</b>, 🚆 <b>tåg</b> och ⛴️ <b>båt/färja</b> som alternativ.</p>
      <div class="break transport-break">
        <div><b>🚆 Tåg</b>${money(est.train)} tur och retur</div>
        <div><b>🚗 Bil</b>${money(est.car)} tur och retur</div>
        ${est.boat ? `<div><b>⛴️ Båt/färja</b>${money(est.boat)} tur och retur</div>` : ""}
      </div>
      <p class="muted">Tågpriset är en grov uppskattning baserad på typiska SJ-prisnivåer. Bilkostnaden är en schablon för bränsle/energi och körning. Faktiska priser varierar med datum, avgång och fordon.</p>
    </section>`;
}

function activityHtml(activities, people) {
  if (!activities.length) return "";
  return `
    <section class="option nested">
      <div class="section-kicker">🎟️ AKTIVITET</div>
      <h3>Aktivitet du nämnde</h3>
      ${activities.map(a => `
        <div class="good">
          <h3>🎟️ ${a.title}</h3>
          <p class="muted">${a.type} · ${a.city}</p>
          <p>Beräknad entré: <b>${money(a.price * people)}</b> för ${people} personer.</p>
          <p class="muted">Priset är en uppskattning och kan variera med datum och biljettkategori.</p>
          <a class="inline-link" target="_blank" rel="noopener" href="${a.link}">🎟️ Se aktuella biljetter</a>
        </div>`).join("")}
    </section>`;
}

/* ---------- Accommodation ---------- */

/*
  Live hotel APIs are not part of the supplied v1.4 prototype.
  v1.5 therefore never pretends a hotel price was fetched live.
  The result explicitly identifies the price status/source.
  When a hotel API is connected, populate hotelResult.source,
  hotelResult.name and hotelResult.price.
*/
function accommodationResult(destination, people, duration, text) {
  const t = normalize(text);
  const asksHotel = /hotell|boende|overnatt|övernatt|rum|accommodation/.test(t);
  if (!asksHotel) return "";

  // v1.5 prototype: no live hotel provider is connected yet.
  // We show the source status explicitly instead of presenting a demo value as live data.
  const nights = Math.max(1, duration - 1);
  const demoNight = destination === "Göteborg" ? 1450 : destination === "Stockholm" ? 1550 : 1300;
  const estimated = demoNight * nights;

  return `
    <section class="hotel-detail">
      <div class="section-kicker">🏨 BOENDE</div>
      <div class="hotel-hero">
        <div class="hotel-icon">🏨</div>
        <div>
          <h3>Boende i ${destination}</h3>
          <div class="muted">${nights} ${nights === 1 ? "natt" : "nätter"} · ${people} ${people === 1 ? "person" : "personer"}</div>
        </div>
      </div>

      <div class="option" style="margin-top:20px">
        <div class="section-head">
          <div>
            <h3>Hotellpris i prototypen</h3>
            <p class="muted">Exempel på hur boenderesultatet kommer att visas.</p>
          </div>
          <div class="price">${money(estimated)}</div>
        </div>
        <div class="source-note">
          <b>Pris-/hotellkälla</b><br>
          Prototypestimat — <b>ingen liveleverantör ansluten i v1.5</b>.
        </div>
      </div>

      <div class="next">
        När riktig hotell-API kopplas in ska DestyPoint alltid visa <b>hotellnamn, rumstyp, pris, datum, villkor och exakt leverantör/källa</b> bredvid priset.
      </div>
    </section>`;
}

function activityHtml(activities, people) {
  if (!activities.length) return "";
  return `
    <section class="detail-card">
      <div class="section-kicker">🎟️ AKTIVITET</div>
      <h3>Aktivitet du själv nämnde</h3>
      ${activities.map(a => `
        <div class="option good">
          <h3>🎟️ ${a.title}</h3>
          <p class="muted">${a.type} · ${a.city}</p>
          <p>Beräknad entré: <b>${money(a.price * people)}</b> för ${people} ${people === 1 ? "person" : "personer"}.</p>
          <a class="inline-link" target="_blank" rel="noopener" href="${a.link}">Se aktuella biljetter →</a>
        </div>`).join("")}
    </section>`;
}

function transportHtml(origin, destination, people, text) {
  if (!isSwedenTrip(destination, text)) return "";
  const est = transportEstimate(origin, destination, people, text);
  return `
    <section class="detail-card">
      <div class="section-kicker">🇸🇪 TRANSPORT</div>
      <h3>Transport i Sverige</h3>
      <p>DestyPoint jämför <b>bil</b>, <b>tåg</b> och vid behov <b>båt/färja</b> som alternativ.</p>
      <div class="transport-grid">
        <div><b>🚆 Tåg</b>${money(est.train)}<br><span class="muted">tur och retur</span></div>
        <div><b>🚗 Bil</b>${money(est.car)}<br><span class="muted">tur och retur</span></div>
        ${est.boat ? `<div><b>⛴️ Båt/färja</b>${money(est.boat)}<br><span class="muted">tur och retur</span></div>` : ""}
      </div>
      <p class="muted">Tågpriset är en grov uppskattning. Bilkostnaden är en schablon. Faktiska priser varierar med datum, avgång och fordon.</p>
    </section>`;
}

function searchLinks(destination) {
  const x = encodeURIComponent(destination);
  return `
    <section class="detail-card">
      <div class="section-kicker">🔗 NÄSTA STEG</div>
      <h3>Kontrollera och boka</h3>
      <p class="muted">När livekällor är anslutna kommer DestyPoint att kunna visa aktuella alternativ direkt i resan. Tills dess kan du kontrollera leverantörerna här.</p>
      <div class="links">
        <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${x}+hotell">🏨 Sök hotell</a>
        <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${x}+flyg">✈️ Sök flyg</a>
        <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${x}+weekendresa">🧳 Sök weekendresor</a>
      </div>
    </section>`;
}

function runAgent() {
  const text = q("#destination")?.value.trim() || "";
  if (!text) { q("#destination")?.focus(); return; }

  const people = parsePeople(text);
  const budget = parseBudget(text);
  const tripType = parseTripType(text);
  const priorities = parsePriorities(text);
  const destination = parseDestination(text);
  const origin = parseOrigin(text);
  const score = scoreDestination(destination, tripType, priorities, budget);
  const duration = days();
  const activities = findActivities(text);

  const budgetForEstimate = budget || 11000;
  const budgetText = budget ? money(budget) : "ingen angiven budget";
  const priorityText = priorities.length ? priorities.join(", ") : "inga särskilda prioriteringar angivna";
  const originText = origin ? ` från ${origin}` : "";
  const nights = Math.max(1, duration - 1);

  const tags = [];
  if (/flyg|flyga|flygresa/.test(normalize(text))) tags.push("✈️ Flyg");
  if (/hotell|boende|övernatt|overnatt/.test(normalize(text))) tags.push("🏨 Hotell");
  if (/kultur|museum|historia/.test(normalize(text))) tags.push("🏛️ Kultur");
  if (/mat|restaurang|gastronomi/.test(normalize(text))) tags.push("🍽️ Mat");
  if (/sol|bad|strand/.test(normalize(text))) tags.push("☀️ Sol & bad");
  if (/spa/.test(normalize(text))) tags.push("♨️ Spa");

  const total = budget || Math.round(budgetForEstimate * .0 + (destination === "Helsingborg" ? 0 : 0));
  const accommodationEstimate = budget ? Math.round(budget * .43) : 0;
  const transportEstimateValue = budget ? Math.round(budget * .22) : 0;
  const foodEstimate = budget ? Math.round(budget * .15) : 0;
  const activityEstimate = budget ? Math.round(budget * .20) : 0;

  const html = `
    <div class="thinking">
      <div class="section-kicker">🧠 DESTYPOINT v1.5</div>
      <h2>Min första bedömning</h2>
      <p>Jag tolkar din resa som <b>${people} ${people === 1 ? "resenär" : "resenärer"}</b>${originText} till <b>${destination}</b>, <b>${duration} ${duration === 1 ? "dag" : "dagar"}</b>.</p>
      <p><b>Resetyp:</b> ${tripType}.</p>
      <p><b>Budget:</b> ${budgetText}.</p>
      <p><b>Prioriteringar:</b> ${priorityText}.</p>
      <p class="muted">Jag väger samman destination, budget, restid, aktiviteter och det du själv beskriver.</p>
    </div>

    <article class="recommendation">
      <span class="badge">🏆 MIN REKOMMENDATION · ${score}/100</span>
      <h2 class="destination-title">${destination}</h2>
      <p class="intro">DestyPoint har tolkat din beskrivning och anpassat rekommendationen efter det du angav.</p>

      ${tags.length ? `<div class="tags">${tags.map((tag,i)=>`<span class="tag ${i===0?'gold':''}">${tag}</span>`).join("")}</div>` : ""}

      <section class="detail-card">
        <div class="section-kicker">RESEÖVERSIKT</div>
        ${budget ? `<div class="price-row"><div><b>🏨 Boende</b><br><span class="muted">${nights} ${nights===1?'natt':'nätter'}</span></div><div class="price">${money(accommodationEstimate)}</div></div>
        <div class="price-row"><div><b>🚆 Transport</b><br><span class="muted">tur och retur</span></div><div class="price">${money(transportEstimateValue)}</div></div>
        <div class="price-row"><div><b>🍽️ Mat</b><br><span class="muted">uppskattning</span></div><div class="price">${money(foodEstimate)}</div></div>
        <div class="price-row"><div><b>⭐ Aktiviteter</b><br><span class="muted">endast sådant du nämnt</span></div><div class="price">${money(activityEstimate)}</div></div>
        <div class="price-row"><div><b>Total budget</b><br><span class="muted">inkl. uppskattade kostnader</span></div><div class="price">${money(budget)}</div></div>` : `<div class="next">Ingen totalbudget angavs. DestyPoint visar därför inga påhittade totalsummor.</div>`}
      </section>

      ${accommodationResult(destination, people, duration, text)}
      ${activityHtml(activities, people)}
      ${transportHtml(origin, destination, people, text)}
      ${searchLinks(destination)}
    </article>`;

  const out = q("#out");
  if (out) { out.innerHTML = html; out.scrollIntoView({behavior:"smooth",block:"start"}); }
}

function init() {
  setTodayDates();
  q("#go")?.addEventListener("click", runAgent);
  q("#destination")?.addEventListener("keydown", event => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      runAgent();
    }
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
