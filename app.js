/* ResAgent v1.4
   Natural-language trip input
   - Budget and priorities are read from the description
   - Traveller count is read from the description
   - Date fields default to today's date
   - Keeps v1.3 destination / trip-type / activity / Sweden transport logic
*/

const q = (s) => document.querySelector(s);
const qa = (s) => [...document.querySelectorAll(s)];

const MONTHS_SV = [
  "januari","februari","mars","april","maj","juni",
  "juli","augusti","september","oktober","november","december"
];

function todayISO() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function setDefaultDates() {
  const today = todayISO();
  const from = q("#from");
  const to = q("#to");

  if (from) {
    from.value = today;
    from.defaultValue = today;
  }
  if (to) {
    to.value = today;
    to.defaultValue = today;
  }
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

function normalize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/é/g, "e");
}

/* ---------- Natural language parser ---------- */

function parsePeople(text) {
  const t = normalize(text);

  const patterns = [
    /(\d+)\s*(?:personer|person|resen[aä]rer)/,
    /vi\s+ar\s+(\d+)/,
    /vi\s+blir\s+(\d+)/,
    /(\d+)\s+(?:vuxna|barn)/,
  ];

  for (const re of patterns) {
    const m = t.match(re);
    if (m) return Number(m[1]);
  }

  // "två vuxna och två barn" etc.
  const words = {
    en: 1, ett: 1, tva: 2, tre: 3, fyra: 4, fem: 5,
    sex: 6, sju: 7, atta: 8, nio: 9, tio: 10
  };

  let total = 0;
  let found = false;

  for (const [word, n] of Object.entries(words)) {
    const re = new RegExp(`\\b${word}\\s+(?:vuxna|personer|barn)\\b`, "i");
    if (re.test(t)) {
      total += n;
      found = true;
    }
  }

  return found ? total : 1;
}

function parseBudget(text) {
  const t = normalize(text);

  const patterns = [
    /(?:budget|max|maximalt|under|upp till|ca|cirka|runt)\s*(?:pa|på)?\s*([0-9][0-9\s.,]*)\s*(?:kr|kronor)/,
    /([0-9][0-9\s.,]*)\s*(?:kr|kronor)\s*(?:i budget|budget)/,
    /budget(?:en)?\s*(?:ar|är)?\s*([0-9][0-9\s.,]*)/
  ];

  for (const re of patterns) {
    const m = t.match(re);
    if (m) {
      const n = Number(m[1].replace(/[^\d]/g, ""));
      if (n > 0) return n;
    }
  }

  return null;
}

function parseTripType(text) {
  const t = normalize(text);

  if (/\bspa|spahotell|spaweekend|spa resa|sparesa/.test(t)) return "spa";
  if (/\bweekend|weekendres|weekendresa/.test(t)) return "weekend";
  if (/familj|barn|barnfamilj|familjeresa|zoo|djurpark|nojespark|liseberg|grona lund|astrid lindgrens|high chaparall/.test(t)) return "familj";
  if (/romantik|romantisk|parresa|parweekend/.test(t)) return "romantik";
  if (/skidor|skidresa|fjall|fjallresa/.test(t)) return "skidor";
  if (/strand|sol och bad|sol bad|badsemester/.test(t)) return "sol & bad";
  return "balanserad resa";
}

function parsePriorities(text) {
  const t = normalize(text);
  const result = [];

  const rules = [
    ["sol & bad", /sol|bad|strand|varme/],
    ["familj", /familj|barn|barnvan|familjev/],
    ["budget", /billig|budget|prisvard|spara pengar/],
    ["kort restid", /kort restid|snabbt|nara|inte langt|slippa lang resa/],
    ["kultur", /kultur|museum|historia|sevardhet/],
    ["natur", /natur|vandring|skog|fjall|sjo|skargard/],
    ["spa", /spa|relax|massage|bastu/],
    ["mat", /mat|restaurang|matupplevelse|gastronomi/]
  ];

  for (const [label, re] of rules) {
    if (re.test(t)) result.push(label);
  }

  return result;
}

function parseOrigin(text) {
  const t = text || "";
  const m = t.match(/(?:från|fran)\s+([A-Za-zÅÄÖåäö\- ]+?)(?=\s+(?:till|och|för|for|med|i|under|på|pa)\b|[.,]|$)/i);
  return m ? m[1].trim() : null;
}

function parseDestination(text) {
  const t = normalize(text);

  const destinations = [
    ["Stockholm", /\bstockholm\b/],
    ["Göteborg", /\bgoteborg\b/],
    ["Malmö", /\bmalmo\b/],
    ["Uppsala", /\buppsala\b/],
    ["Visby", /\bvisby\b/],
    ["Örebro", /\borebro\b/],
    ["Västerås", /\bvasteras\b/],
    ["Linköping", /\blinkoping\b/],
    ["Norrköping", /\bnorrkoping\b/],
    ["Jönköping", /\bjonkoping\b/],
    ["Kalmar", /\bkalmar\b/],
    ["Halmstad", /\bhalmstad\b/],
    ["Helsingborg", /\bhelsingborg\b/],
    ["Kiruna", /\bkiruna\b/],
    ["Åre", /\bare\b/],
    ["Gotland", /\bgotland\b/],
    ["Skåne", /\bskane\b/],
    ["Dalarna", /\bdalarna\b/],
    ["Stockholms skärgård", /skargard/],
    ["Grekland", /\bgrekland\b|\baten\b|\bkreta\b|\brhodos\b|\bkos\b/],
    ["Spanien", /\bspanien\b|\bbarcelona\b|\bmadrid\b|\bmallorca\b|\bteneriffa\b/],
    ["Italien", /\bitalien\b|\brom\b|\bvenedig\b|\bmilano\b/],
    ["Frankrike", /\bfrankrike\b|\bparis\b|\bnice\b/],
    ["Thailand", /\bthailand\b|\bbangkok\b|\bphuket\b/],
    ["Japan", /\bjapan\b|\btokyo\b|\bkyoto\b/],
    ["Kina", /\bkina\b|\bpeking\b|\bbeijing\b/],
    ["Florida", /\bflorida\b|\bmiami\b|\borlando\b/],
    ["London", /\blondon\b/],
    ["Berlin", /\bberlin\b/],
    ["Köpenhamn", /\bkopenhamn\b/]
  ];

  for (const [name, re] of destinations) {
    if (re.test(t)) return name;
  }

  // Simple "till X" fallback.
  const raw = text || "";
  const m = raw.match(/(?:till|i)\s+([A-Za-zÅÄÖåäö\- ]{2,40})/i);
  if (m) return m[1].trim().replace(/\s+/g, " ");

  return "Valfri destination";
}

/* ---------- Destination scoring ---------- */

function scoreDestination(destination, tripType, priorities, budget) {
  let score = 78;

  if (destination === "Stockholm") {
    score = 88;
    if (tripType === "spa") score = 94;
    if (tripType === "weekend") score = 92;
    if (tripType === "familj") score = 91;
  }

  if (destination === "Göteborg") {
    score = tripType === "familj" ? 94 : 89;
  }

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

/* ---------- Activities / parks ---------- */

const SWEDISH_ACTIVITIES = [
  {
    names: ["gröna lund", "grona lund"],
    title: "Gröna Lund",
    type: "Nöjespark",
    city: "Stockholm",
    price: 570,
    link: "https://www.gronalund.com/"
  },
  {
    names: ["liseberg"],
    title: "Liseberg",
    type: "Nöjespark",
    city: "Göteborg",
    price: 570,
    link: "https://www.liseberg.se/"
  },
  {
    names: ["astrid lindgrens värld", "astrid lindgrens varld"],
    title: "Astrid Lindgrens Värld",
    type: "Familjepark",
    city: "Vimmerby",
    price: 395,
    link: "https://www.astridlindgrensvarld.se/"
  },
  {
    names: ["high chaparral", "high chaparall"],
    title: "High Chaparral",
    type: "Familjepark",
    city: "Kulltorp",
    price: 365,
    link: "https://www.highchaparral.se/"
  },
  {
    names: ["kolmården", "kolmarden"],
    title: "Kolmårdens djurpark",
    type: "Djurpark",
    city: "Kolmården",
    price: 399,
    link: "https://www.kolmarden.com/"
  },
  {
    names: ["borås djurpark", "boras djurpark"],
    title: "Borås Djurpark",
    type: "Djurpark",
    city: "Borås",
    price: 299,
    link: "https://www.borasdjurpark.se/"
  },
  {
    names: ["skansen"],
    title: "Skansen",
    type: "Djurpark & friluftsmuseum",
    city: "Stockholm",
    price: 265,
    link: "https://www.skansen.se/"
  }
];

function findActivities(text, destination, tripType) {
  const t = normalize(text);
  const found = SWEDISH_ACTIVITIES.filter(a =>
    a.names.some(n => t.includes(normalize(n)))
  );

  if (found.length) return found;

  if (tripType === "familj") {
    if (destination === "Stockholm") return SWEDISH_ACTIVITIES.filter(a =>
      ["Gröna Lund","Skansen"].includes(a.title)
    );
    if (destination === "Göteborg") return SWEDISH_ACTIVITIES.filter(a =>
      a.title === "Liseberg"
    );
  }

  return [];
}

/* ---------- Swedish transport ---------- */

function isSwedenTrip(destination, text) {
  const t = normalize(text);
  return [
    "stockholm","goteborg","malmo","uppsala","visby","orebro",
    "vasteras","linkoping","norrkoping","jonkoping","kalmar",
    "halmstad","helsingborg","kiruna","are","gotland","skane",
    "dalarna","sverige","sweden"
  ].some(x => t.includes(x)) || [
    "Stockholm","Göteborg","Malmö","Uppsala","Visby","Örebro",
    "Västerås","Linköping","Norrköping","Jönköping","Kalmar",
    "Halmstad","Helsingborg","Kiruna","Åre","Gotland","Skåne",
    "Dalarna"
  ].includes(destination);
}

function transportEstimate(origin, destination, people, text) {
  const t = normalize(text);

  const longTrip = /stockholm.*goteborg|goteborg.*stockholm|malmo.*stockholm|stockholm.*malmo|kiruna/.test(t);
  const baseTrain = longTrip ? 650 : 420;
  const train = baseTrain * people * 2;
  const car = longTrip ? 2200 : 1300;
  const boat = /visby|gotland|farja|bat|skargard/.test(t) ? 900 * people : null;

  return { train, car, boat };
}

/* ---------- UI helpers ---------- */

function hideOldInput(selector) {
  const el = q(selector);
  if (!el) return;

  // IMPORTANT: Only hide the actual control. Do not hide parent containers,
  // because the existing HTML may wrap several fields in one shared card.
  el.style.display = "none";

  // Hide a directly associated label, if present.
  const id = el.id;
  if (id) {
    qa(`label[for="${id}"]`).forEach(label => label.style.display = "none");
  }
}

function hideOldSections() {
  // v1.4 uses the description field as the single source of information.
  // Keep the existing HTML structure intact and hide only the old controls.
  hideOldInput("#budget");
  hideOldInput("#people");

  const chips = q("#chips");
  if (chips) chips.style.display = "none";

  // Hide labels/headings belonging to the removed controls without touching
  // the surrounding form/card.
  qa("label, h3, h4, p, legend").forEach(el => {
    const txt = normalize(el.textContent).replace(/\s+/g, " ").trim();

    if (
      txt === "totalbudget (kr)" ||
      txt === "vad ar viktigast?" ||
      txt.includes("v1.3 anvander") ||
      txt.includes("v1.3 använder")
    ) {
      el.style.display = "none";
    }
  });
}

function setVersionLabels() {
  qa("body *").forEach(el => {
    if (el.children.length === 0 && /ResAgent v1\.3/i.test(el.textContent)) {
      el.textContent = el.textContent.replace(/ResAgent v1\.3/gi, "ResAgent v1.4");
    }
    if (el.children.length === 0 && /\bv1\.3\b/i.test(el.textContent)) {
      el.textContent = el.textContent.replace(/\bv1\.3\b/gi, "v1.4");
    }
  });
}

function links(destination) {
  const x = encodeURIComponent(destination);
  return `
    <div class="links">
      <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${x}+hotell">🏨 Sök hotell</a>
      <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${x}+flyg">✈️ Sök flyg</a>
      <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${x}+weekendresa">🧳 Sök weekendresor</a>
      <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${x}+spahotell">💆 Sök spahotell</a>
      <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${x}+hyrbil">🚗 Sök hyrbil</a>
    </div>
  `;
}

function activityHtml(activities, people) {
  if (!activities.length) return "";

  return `
    <section class="option">
      <h2>🎟️ Aktivitet som ResAgent hittade</h2>
      ${activities.map(a => `
        <div class="activity-card">
          <h3>🎟️ ${a.title}</h3>
          <p class="muted">${a.type} · ${a.city}</p>
          <p>Beräknad entré: <b>${money(a.price * people)}</b> för ${people} personer.</p>
          <p class="muted">Priset är en uppskattning och kan variera med datum och biljettkategori.</p>
          <a class="action-link" target="_blank" rel="noopener" href="${a.link}">🎟️ Se aktuella biljetter</a>
        </div>
      `).join("")}
    </section>
  `;
}

function transportHtml(origin, destination, people, text) {
  if (!isSwedenTrip(destination, text)) return "";

  const est = transportEstimate(origin, destination, people, text);

  return `
    <section class="option">
      <h2>🇸🇪 Transport i Sverige</h2>
      <p>ResAgent tar med 🚗 <b>bil</b>, 🚆 <b>tåg</b> och ⛴️ <b>båt/färja</b> som alternativ.</p>

      <div class="transport-grid">
        <div><b>🚆 Tåg</b><br>${money(est.train)} tur och retur</div>
        <div><b>🚗 Bil</b><br>${money(est.car)} tur och retur</div>
        ${est.boat ? `<div><b>⛴️ Båt/färja</b><br>${money(est.boat)} tur och retur</div>` : ""}
      </div>

      <p class="muted">
        Tågpriset är en grov uppskattning baserad på typiska SJ-prisnivåer.
        Bilkostnaden är en schablon för bränsle/energi och körning.
        Faktiska priser varierar med datum, avgång och fordon.
      </p>
    </section>
  `;
}

/* ---------- Main agent ---------- */

function runAgent() {
  const text = q("#destination")?.value.trim() || "";

  if (!text) {
    if (q("#destination")) q("#destination").focus();
    return;
  }

  const people = parsePeople(text);
  const budget = parseBudget(text);
  const tripType = parseTripType(text);
  const priorities = parsePriorities(text);
  const destination = parseDestination(text);
  const origin = parseOrigin(text);
  const score = scoreDestination(destination, tripType, priorities, budget);
  const duration = days();
  const activities = findActivities(text, destination, tripType);

  // Keep the old input fields harmless if the existing HTML still has them.
  const hiddenBudget = q("#budget");
  if (hiddenBudget && budget) hiddenBudget.value = budget;

  const hiddenPeople = q("#people");
  if (hiddenPeople) hiddenPeople.value = people;

  const effectiveBudget = budget || 11000;

  const budgetText = budget
    ? money(budget)
    : "ingen angiven budget";

  const priorityText = priorities.length
    ? priorities.join(", ")
    : "ResAgent tolkar prioriteringarna från din beskrivning.";

  const originText = origin ? ` från ${origin}` : "";

  const html = `
    <div class="thinking">
      <h2>🧠 ResAgent v1.4</h2>

      <h2>Min första bedömning</h2>

      <p>
        Jag tolkar din resa som
        <b>${people} ${people === 1 ? "resenär" : "resenärer"}</b>
        ${originText}
        till <b>${destination}</b>,
        <b>${duration} ${duration === 1 ? "dag" : "dagar"}</b>.
      </p>

      <p><b>Resetyp:</b> ${tripType}.</p>
      <p><b>Budget:</b> ${budgetText}.</p>
      <p><b>Prioriteringar:</b> ${priorityText}</p>

      <p>
        Jag väger samman destination, budget, restid, aktiviteter
        och det du själv beskriver.
      </p>

      <p><b>Min starkaste kandidat:</b> ${destination} – ${score}/100.</p>
    </div>

    <article class="option">
      <span class="badge">🏆 MIN REKOMMENDATION · ${score}/100</span>

      <h2>${destination}</h2>

      <p class="muted">
        ResAgent har tolkat din beskrivning och anpassat rekommendationen
        efter dina önskemål.
      </p>

      <div class="break">
        <div><b>Boende</b>${money(effectiveBudget * 0.43)}</div>
        <div><b>Transport</b>${money(effectiveBudget * 0.22)}</div>
        <div><b>Mat</b>${money(effectiveBudget * 0.15)}</div>
        <div><b>Aktiviteter</b>${money(effectiveBudget * 0.20)}</div>
      </div>

      ${activityHtml(activities, people)}
      ${transportHtml(origin, destination, people, text)}

      <p class="muted">
        <b>🔗 Nästa steg</b><br>
        Kontrollera alltid aktuella priser, öppettider och tillgänglighet
        hos leverantören innan bokning.
      </p>

      ${links(destination)}

      <div class="good">✓ ResAgent har byggt förslaget från din beskrivning.</div>
    </article>
  `;

  const out = q("#out");
  if (out) {
    out.innerHTML = html;
    out.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/* ---------- Startup ---------- */

function init() {
  setDefaultDates();
  hideOldSections();
  setVersionLabels();

  const go = q("#go");
  if (go) {
    go.onclick = runAgent;
  }

  // Allow Enter / Cmd+Enter in the description field.
  const input = q("#destination");
  if (input) {
    input.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        runAgent();
      }
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
