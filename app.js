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
function accommodationResult(destination, people, duration, text, budget) {
  const t = normalize(text);
  const asksHotel = /hotell|boende|overnatt|övernatt|rum|accommodation/.test(t);

  if (!asksHotel) return "";

  const demoNight = destination === "Göteborg" ? 1450 : destination === "Stockholm" ? 1550 : 1300;
  const nights = Math.max(1, duration - 1);
  const estimated = demoNight * nights;

  return `
    <section class="option accommodation">
      <div class="section-kicker">🏨 BOENDE</div>
      <h3>Boendealternativ</h3>

      <div class="hotel-card">
        <div class="hotel-icon">🏨</div>
        <div class="hotel-main">
          <h3>Hotellpris behöver livekälla</h3>
          <p class="muted">${destination} · ${nights} ${nights === 1 ? "natt" : "nätter"} · ${people} ${people === 1 ? "person" : "personer"}</p>
          <div class="hotel-price">${money(estimated)}</div>
        </div>
      </div>

      <div class="source-note">
        <b>Prisunderlag</b><br>
        <span>Prototypestimat – ingen liveleverantör är ansluten i v1.5.</span>
      </div>

      <p class="muted">I nästa steg ska varje boendepris redovisas med <b>hotellnamn, rumstyp, pris, datum och exakt leverantör/källa</b>. DestyPoint ska inte presentera ett uppskattat pris som om det vore ett hämtat livepris.</p>
    </section>`;
}

function searchLinks(destination) {
  const x = encodeURIComponent(destination);
  return `
    <div class="links">
      <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${x}+hotell">🏨 Sök hotell</a>
      <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${x}+flyg">✈️ Sök flyg</a>
      <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${x}+weekendresa">🧳 Sök weekendresor</a>
      <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${x}+spahotell">💆 Sök spahotell</a>
      <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${x}+hyrbil">🚗 Sök hyrbil</a>
    </div>`;
}

function renderHotel(destination, people, nights, text) {
  const t = normalize(text);
  const asksHotel = /hotell|boende|overnatt|övernatt|rum/.test(t);
  if (!asksHotel) return '';
  const demo = destination === 'Göteborg' ? 1450 : destination === 'Stockholm' ? 1550 : 1290;
  const total = demo * Math.max(1, nights);
  return `
    <section class="card">
      <div class="section-title"><h3>🏨 Boende</h3><span class="gold-line"></span></div>
      <div class="hotel-choice">
        <div class="choice-row">
          <div class="choice-icon">🏨</div>
          <div class="choice-main"><b>Rekommenderat hotell i ${destination}</b><div class="muted">Dubbelrum · ${Math.max(1,nights)} ${nights===1?'natt':'nätter'}</div></div>
          <div class="choice-price">${money(total)}</div>
        </div>
        <div class="source">Prisunderlag: <b>prototypestimat</b> · ingen live-hotellleverantör är ansluten ännu.</div>
      </div>
      <p class="muted">När livebokning kopplas in ska DestyPoint alltid visa <b>hotellnamn, rumstyp, pris, datum och exakt källa/leverantör</b>.</p>
    </section>`;
}

function renderTransport(origin, destination, people, text) {
  if (!isSwedenTrip(destination, text)) return '';
  const e = transportEstimate(origin, destination, people, text);
  return `
    <section class="card">
      <div class="section-title"><h3>🚆 Transport</h3><span class="gold-line"></span></div>
      <p class="muted">Alternativ för resan${origin ? ` från ${origin}` : ''} till ${destination}.</p>
      <div class="transport-choice"><div class="choice-row"><div class="choice-icon">🚆</div><div class="choice-main"><b>Tåg tur & retur</b><div class="muted">Grov uppskattning</div></div><div class="choice-price">${money(e.train)}</div></div></div>
      <div class="transport-choice"><div class="choice-row"><div class="choice-icon">🚗</div><div class="choice-main"><b>Bil tur & retur</b><div class="muted">Schablon för bränsle/energi</div></div><div class="choice-price">${money(e.car)}</div></div></div>
      ${e.boat ? `<div class="transport-choice"><div class="choice-row"><div class="choice-icon">⛴️</div><div class="choice-main"><b>Båt/färja</b><div class="muted">Alternativ</div></div><div class="choice-price">${money(e.boat)}</div></div></div>` : ''}
      <div class="source">Faktiska priser varierar med datum, avgång och fordon.</div>
    </section>`;
}

function renderActivity(activities, people) {
  if (!activities.length) return '';
  return `
    <section class="card">
      <div class="section-title"><h3>⭐ Aktivitet du nämnde</h3><span class="gold-line"></span></div>
      ${activities.map(a => `<div class="activity-choice"><div class="choice-row"><div class="choice-icon">🎟️</div><div class="choice-main"><b>${a.title}</b><div class="muted">${a.type} · ${a.city}</div></div><div class="choice-price">${money(a.price*people)}</div></div><div class="source">Beräknad entré för ${people} ${people===1?'person':'personer'} · <a href="${a.link}" target="_blank" rel="noopener">Se aktuella biljetter</a></div></div>`).join('')}
    </section>`;
}

function runAgent() {
  const text = q('#destination')?.value.trim() || '';
  if (!text) { q('#destination')?.focus(); return; }

  const people = parsePeople(text);
  const budget = parseBudget(text);
  const tripType = parseTripType(text);
  const priorities = parsePriorities(text);
  const destination = parseDestination(text);
  const origin = parseOrigin(text);
  const score = scoreDestination(destination, tripType, priorities, budget);
  const duration = days();
  const nights = Math.max(1, duration - 1);
  const activities = findActivities(text);
  const estimateBudget = budget || 11000;
  const accommodation = Math.round(estimateBudget * .43);
  const transport = Math.round(estimateBudget * .22);
  const food = Math.round(estimateBudget * .15);
  const activityBudget = Math.round(estimateBudget * .20);
  const tags = [tripType, ...priorities].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4);

  q('#out').innerHTML = `
    <section class="card hero-destination">
      <span class="score-pill">✦ DESTYPOINTS REKOMMENDATION · ${score}/100</span>
      <h2>${destination}</h2>
      <div class="destination-meta">${duration} ${duration===1?'dag':'dagar'} · ${people} ${people===1?'person':'personer'}${origin ? ` · från ${origin}` : ''}</div>
      <div class="tag-row">${tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>
    </section>

    <section class="card">
      <div class="kicker gold">MIN BEDÖMNING</div>
      <h3>Så här har jag tolkat din resa</h3>
      <p>DestyPoint utgår från det du skrev och väger samman destination, restid, budget och önskemål.</p>
      <p><b>Budget:</b> ${budget ? money(budget) : 'ingen angiven budget'}</p>
      <p><b>Prioriteringar:</b> ${priorities.length ? priorities.join(', ') : 'inga särskilda prioriteringar angivna'}</p>
    </section>

    <section class="card">
      <div class="section-title"><h3>Reseöversikt</h3><span class="gold-line"></span></div>
      <div class="summary-grid">
        <div class="summary-box"><b>🏨 Boende</b><strong>${money(accommodation)}</strong></div>
        <div class="summary-box"><b>🚆 Transport</b><strong>${money(transport)}</strong></div>
        <div class="summary-box"><b>🍽️ Mat</b><strong>${money(food)}</strong></div>
        <div class="summary-box"><b>⭐ Aktiviteter</b><strong>${money(activityBudget)}</strong></div>
      </div>
      <div class="source">Budgetfördelningen är en prototypisk uppskattning när användaren inte angett exakta priser.</div>
    </section>

    ${renderHotel(destination, people, nights, text)}
    ${renderTransport(origin, destination, people, text)}
    ${renderActivity(activities, people)}

    <section class="card">
      <div class="section-title"><h3>Nästa steg</h3><span class="gold-line"></span></div>
      <p class="muted">När riktiga leverantörer kopplas in ska DestyPoint kunna gå från rekommendation till bokningsbara alternativ.</p>
      <a class="cta" target="_blank" rel="noopener" href="https://www.google.com/search?q=${encodeURIComponent(destination)}+hotell">Visa boende & priser →</a>
      <a class="cta secondary-cta" target="_blank" rel="noopener" href="https://www.google.com/search?q=${encodeURIComponent(destination)}+resa">Utforska destinationen →</a>
    </section>
    <div class="note">Aktiviteter visas bara när du själv nämner dem. DestyPoint ska aldrig hitta på ett önskemål åt dig.</div>`;

  q('#splash').style.display='none';
  q('#resultsApp').style.display='block';
  window.scrollTo({top:0,behavior:'smooth'});
}

function init() {
  setTodayDates();
  q("#go")?.addEventListener("click", runAgent);
  q("#backToStart")?.addEventListener("click", () => { q("#resultsApp").style.display='none'; q("#splash").style.display='flex'; window.scrollTo({top:0,behavior:'smooth'}); });
  q("#destination")?.addEventListener("keydown", event => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      runAgent();
    }
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
