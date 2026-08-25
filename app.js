/* DestyPoint v2.3
   Visual v2.2 front page + the natural-language travel logic from the v1.5 prototype.
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
  const from = q("#from");
  const to = q("#to");
  if (from) from.value = today;
  if (to) to.value = today;
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

/* ---------- Natural language ---------- */

function parsePeople(text) {
  const t = normalize(text);
  const direct = [
    /(\d+)\s*(?:personer|person|resenärer|resenarer)/,
    /vi\s+(?:är|ar|blir)\s+(\d+)/,
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
  if (/familj|barn|barnfamilj|familjeresa|zoo|djurpark|nojespark|liseberg|grona lund|astrid lindgrens|high chaparral/.test(t)) return "familj";
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
    ["kort restid", /kort restid|snabbt|nara|nära|inte langt|inte långt/],
    ["kultur", /kultur|museum|historia|sevardhet/],
    ["natur", /natur|vandring|skog|fjall|sjö|skargard/],
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
    ["Stockholm", /\bstockholm\b/],["Göteborg", /\bgoteborg\b/],["Malmö", /\bmalmo\b/],
    ["Uppsala", /\buppsala\b/],["Visby", /\bvisby\b/],["Örebro", /\borebro\b/],
    ["Västerås", /\bvasteras\b/],["Linköping", /\blinkoping\b/],["Norrköping", /\bnorrkoping\b/],
    ["Jönköping", /\bjonkoping\b/],["Kalmar", /\bkalmar\b/],["Halmstad", /\bhalmstad\b/],
    ["Helsingborg", /\bhelsingborg\b/],["Kiruna", /\bkiruna\b/],["Åre", /\bare\b/],
    ["Gotland", /\bgotland\b/],["Skåne", /\bskane\b/],["Dalarna", /\bdalarna\b/],
    ["Stockholms skärgård", /skargard/],["Grekland", /\bgrekland\b|\baten\b|\bkreta\b|\brhodos\b|\bkos\b/],
    ["Spanien", /\bspanien\b|\bbarcelona\b|\bmadrid\b|\bmallorca\b|\bteneriffa\b/],
    ["Italien", /\bitalien\b|\brom\b|\bvenedig\b|\bmilano\b/],["Frankrike", /\bfrankrike\b|\bparis\b|\bnice\b/],
    ["Thailand", /\bthailand\b|\bbangkok\b|\bphuket\b/],["Japan", /\bjapan\b|\btokyo\b|\bkyoto\b/],
    ["Kina", /\bkina\b|\bpeking\b|\bbeijing\b/],["Florida", /\bflorida\b|\bmiami\b|\borlando\b/],
    ["London", /\blondon\b/],["Berlin", /\bberlin\b/],["Köpenhamn", /\bkopenhamn\b/]
  ];
  for (const [name, re] of destinations) if (re.test(t)) return name;
  const m = (text || "").match(/(?:till|i)\s+([A-Za-zÅÄÖåäö\- ]{2,40})/i);
  return m ? m[1].trim().replace(/\s+/g, " ") : "Valfri destination";
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
  if (budget && budget < 6000 && !["Stockholm","Göteborg"].includes(destination)) score += 1;
  return Math.min(98, score);
}

/* ---------- Activities ---------- */

const ACTIVITIES = [
  {names:["gröna lund","grona lund"],title:"Gröna Lund",type:"Nöjespark",city:"Stockholm",price:570,link:"https://www.gronalund.com/"},
  {names:["liseberg"],title:"Liseberg",type:"Nöjespark",city:"Göteborg",price:570,link:"https://www.liseberg.se/"},
  {names:["astrid lindgrens värld","astrid lindgrens varld"],title:"Astrid Lindgrens Värld",type:"Familjepark",city:"Vimmerby",price:395,link:"https://www.astridlindgrensvarld.se/"},
  {names:["high chaparral","high chaparall"],title:"High Chaparral",type:"Familjepark",city:"Kulltorp",price:365,link:"https://www.highchaparral.se/"},
  {names:["kolmården","kolmarden"],title:"Kolmårdens djurpark",type:"Djurpark",city:"Kolmården",price:399,link:"https://www.kolmarden.com/"},
  {names:["borås djurpark","boras djurpark"],title:"Borås Djurpark",type:"Djurpark",city:"Borås",price:299,link:"https://www.borasdjurpark.se/"},
  {names:["skansen"],title:"Skansen",type:"Djurpark & friluftsmuseum",city:"Stockholm",price:265,link:"https://www.skansen.se/"}
];

function findActivities(text, destination, tripType) {
  const t = normalize(text);
  const found = ACTIVITIES.filter(a => a.names.some(n => t.includes(normalize(n))));
  if (found.length) return found;
  if (tripType === "familj" && destination === "Stockholm") return ACTIVITIES.filter(a => ["Gröna Lund","Skansen"].includes(a.title));
  if (tripType === "familj" && destination === "Göteborg") return ACTIVITIES.filter(a => a.title === "Liseberg");
  return [];
}

/* ---------- Swedish transport ---------- */

function isSwedenTrip(destination, text) {
  const t = normalize(text);
  const terms = ["sverige","stockholm","goteborg","malmo","uppsala","visby","orebro","vasteras","linkoping","norrkoping","jonkoping","kalmar","halmstad","helsingborg","kiruna","are","gotland","skane","dalarna"];
  return terms.some(x => t.includes(x)) || ["Stockholm","Göteborg","Malmö","Uppsala","Visby","Örebro","Västerås","Linköping","Norrköping","Jönköping","Kalmar","Halmstad","Helsingborg","Kiruna","Åre","Gotland","Skåne","Dalarna"].includes(destination);
}

function transportEstimate(origin, destination, people, text) {
  const t = normalize(text);
  const longTrip = /stockholm.*goteborg|goteborg.*stockholm|stockholm.*malmo|malmo.*stockholm|kiruna/.test(t);
  const trainPerPerson = longTrip ? 650 : 420;
  const train = trainPerPerson * people * 2;
  const car = longTrip ? 2200 : 1300;
  const boat = /visby|gotland|farja|bat|skargard/.test(t) ? 900 * people : null;
  return {train, car, boat};
}

function transportHtml(origin, destination, people, text) {
  if (!isSwedenTrip(destination, text)) return "";
  const est = transportEstimate(origin, destination, people, text);
  return `
    <section class="option">
      <h2>Transport i Sverige</h2>
      <p>DestyPoint tar med <b>bil</b>, <b>tåg</b> och <b>båt/färja</b> som alternativ.</p>
      <div class="break">
        <div><b>Tåg</b>${money(est.train)} tur och retur</div>
        <div><b>Bil</b>${money(est.car)} tur och retur</div>
        ${est.boat ? `<div><b>Båt/färja</b>${money(est.boat)} tur och retur</div>` : ""}
      </div>
      <p class="muted">Tågpriset är en grov uppskattning. Bilkostnaden är en schablon. Faktiska priser varierar.</p>
    </section>`;
}

function activityHtml(activities, people) {
  if (!activities.length) return "";
  return `
    <section class="option">
      <h2>Aktivitet som DestyPoint hittade</h2>
      ${activities.map(a => `
        <div class="good">
          <h3>${a.title}</h3>
          <p class="muted">${a.type} · ${a.city}</p>
          <p>Beräknad entré: <b>${money(a.price * people)}</b> för ${people} personer.</p>
          <p class="muted">Priset är en uppskattning och kan variera.</p>
          <a target="_blank" rel="noopener" href="${a.link}">Se aktuella biljetter</a>
        </div>`).join("")}
    </section>`;
}

function searchLinks(destination) {
  const x = encodeURIComponent(destination);
  return `<div class="links">
    <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${x}+hotell">Sök hotell</a>
    <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${x}+flyg">Sök flyg</a>
    <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${x}+weekendresa">Sök weekendresor</a>
    <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${x}+spahotell">Sök spahotell</a>
    <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${x}+hyrbil">Sök hyrbil</a>
  </div>`;
}

/* ---------- Main ---------- */

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
  const activities = findActivities(text, destination, tripType);
  const effectiveBudget = budget || 11000;
  const budgetText = budget ? money(budget) : "ingen angiven budget";
  const priorityText = priorities.length ? priorities.join(", ") : "tolkas från beskrivningen";
  const originText = origin ? ` från ${origin}` : "";

  q("#out").innerHTML = `
    <div class="thinking">
      <h2>DestyPoint v2.3</h2>
      <h2>Min första bedömning</h2>
      <p>Jag tolkar din resa som <b>${people} ${people === 1 ? "resenär" : "resenärer"}</b>${originText} till <b>${destination}</b>, <b>${duration} ${duration === 1 ? "dag" : "dagar"}</b>.</p>
      <p><b>Resetyp:</b> ${tripType}.</p>
      <p><b>Budget:</b> ${budgetText}.</p>
      <p><b>Prioriteringar:</b> ${priorityText}.</p>
      <p>Jag väger samman destination, budget, restid, aktiviteter och det du själv beskriver.</p>
      <p><b>Min starkaste kandidat:</b> ${destination} – ${score}/100.</p>
    </div>

    <article class="option">
      <span class="badge">MIN REKOMMENDATION · ${score}/100</span>
      <h2>${destination}</h2>
      <p class="muted">DestyPoint har tolkat din beskrivning och anpassat rekommendationen efter dina önskemål.</p>
      <div class="break">
        <div><b>Boende</b>${money(effectiveBudget * .43)}</div>
        <div><b>Transport</b>${money(effectiveBudget * .22)}</div>
        <div><b>Mat</b>${money(effectiveBudget * .15)}</div>
        <div><b>Aktiviteter</b>${money(effectiveBudget * .20)}</div>
      </div>
      ${activityHtml(activities, people)}
      ${transportHtml(origin, destination, people, text)}
      <p class="muted"><b>Nästa steg</b><br>Kontrollera alltid aktuella priser, öppettider och tillgänglighet hos leverantören innan bokning.</p>
      ${searchLinks(destination)}
      <div class="good">✓ DestyPoint har byggt förslaget från din beskrivning.</div>
    </article>`;
  q("#out").scrollIntoView({behavior:"smooth",block:"start"});
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

  document.querySelectorAll(".inspiration-card").forEach(card => {
    card.addEventListener("click", () => {
      const input = q("#destination");
      input.value = card.dataset.prompt || "";
      input.focus();
      input.scrollIntoView({behavior:"smooth",block:"center"});
    });
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
