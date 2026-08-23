(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);

  const destinationMap = [
    [/japan|tokyo|kyoto/i, ["Japan", 86]],
    [/kina|kinamuren|beijing|peking/i, ["Kina", 82]],
    [/florida|orlando|miami/i, ["Florida", 84]],
    [/spanien|barcelona|madrid|mallorca|teneriffa/i, ["Spanien", 89]],
    [/italien|rom|venedig|milano/i, ["Italien", 87]],
    [/grekland|aten|athen|kreta|rhodos|kos/i, ["Grekland", 92]],
    [/thailand|bangkok|phuket/i, ["Thailand", 85]],
    [/frankfurt|berlin|paris|london|münchen|munich/i, ["Europa", 88]]
  ];

  function getDestination(text) {
    for (const [regex, value] of destinationMap) {
      if (regex.test(text)) return value;
    }
    return ["Valfri destination", 78];
  }

  function parseDescription(text) {
    const people = text.match(/(\d+)\s*(?:personer|person|vuxna|resenärer)/i);
    const budget = text.match(/(?:max|budget|under)\s*([0-9\s.,]+)\s*(?:kr|kronor)/i);
    return {
      people: people ? Number(people[1]) : null,
      budget: budget ? Number(budget[1].replace(/\D/g, "")) : null
    };
  }

  function getDays() {
    const from = $("#from").value;
    const to = $("#to").value;
    if (!from || !to) return 7;
    const a = new Date(from);
    const b = new Date(to);
    return Math.max(1, Math.round((b - a) / 86400000));
  }

  function getPriorities() {
    return [...document.querySelectorAll("#chips button.active")].map(b => b.dataset.v);
  }

  function googleSearch(query) {
    return "https://www.google.com/search?q=" + encodeURIComponent(query);
  }

  function createLinks(destination) {
    const d = encodeURIComponent(destination);
    const from = $("#from").value;
    const to = $("#to").value;
    const people = Number($("#people").value) || 1;

    const flights =
      "https://www.google.com/travel/flights?q=" +
      encodeURIComponent("flyg till " + destination) + "&hl=sv";

    const hotels =
      "https://www.booking.com/searchresults.html?ss=" + d +
      "&checkin=" + encodeURIComponent(from) +
      "&checkout=" + encodeURIComponent(to) +
      "&group_adults=" + people +
      "&no_rooms=1";

    const packageSearch = googleSearch(
      "paketresa " + destination + " TUI Ving Apollo"
    );

    const carSearch = googleSearch(
      "hyrbil " + destination + " Rentalcars Avis Hertz Europcar"
    );

    return `
      <div class="links">
        <a href="${flights}" target="_blank" rel="noopener noreferrer">✈️ Se flygalternativ</a>
        <a href="${hotels}" target="_blank" rel="noopener noreferrer">🏨 Se boenden</a>
        <a href="${packageSearch}" target="_blank" rel="noopener noreferrer">🌴 Se paketresor</a>
        <a href="${carSearch}" target="_blank" rel="noopener noreferrer">🚗 Se hyrbil</a>
      </div>
      <p class="link-note">Länkarna öppnas hos respektive leverantör där aktuella priser och tillgänglighet visas.</p>
    `;
  }

  function runAgent() {
    const text = $("#destination").value.trim() || "Jag vill åka på semester.";
    const parsed = parseDescription(text);
    const [destination, score] = getDestination(text);
    const people = parsed.people || Number($("#people").value) || 1;
    const budget = parsed.budget || Number($("#budget").value) || 11000;
    const tripDays = getDays();
    const priorities = getPriorities();
    const priorityText = priorities.length ? priorities.join(", ") : "balanserad resa";

    const output = $("#out");
    output.innerHTML = `
      <div class="thinking">
        <h2>🧠 ResAgent v1.2</h2>
        <p class="muted"><b>Min första bedömning:</b> ${people} resenärer, ${tripDays} dagar och cirka ${budget.toLocaleString("sv-SE")} kr.</p>
        <p class="muted"><b>Prioriteringar:</b> ${priorityText}.</p>
        <p class="muted"><b>Min starkaste kandidat:</b> ${destination} – ${score}/100.</p>
        <p class="muted">Jag väger samman destination, budget, restid och dina prioriteringar.</p>
      </div>

      <article class="option">
        <span class="badge">🏆 MIN REKOMMENDATION · ${score}/100</span>
        <h2>${destination}</h2>
        <p class="muted">Detta är ResAgents första matchning utifrån din beskrivning.</p>

        <div class="break">
          <div><b>Boende</b>${Math.round(budget * .34).toLocaleString("sv-SE")} kr</div>
          <div><b>Transport</b>${Math.round(budget * .28).toLocaleString("sv-SE")} kr</div>
          <div><b>Mat</b>${Math.round(budget * .20).toLocaleString("sv-SE")} kr</div>
          <div><b>Aktiviteter</b>${Math.round(budget * .18).toLocaleString("sv-SE")} kr</div>
        </div>

        <p class="muted">
          <b>🔗 Nästa steg</b><br>
          Välj en kategori nedan för att gå vidare till aktuella alternativ hos leverantörer.
        </p>

        ${createLinks(destination)}

        <div class="good">✓ Budgetram: ${budget.toLocaleString("sv-SE")} kr totalt.</div>
      </article>
    `;

    output.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("#chips button").forEach(button => {
      button.addEventListener("click", () => button.classList.toggle("active"));
    });

    $("#go").addEventListener("click", runAgent);
  });
})();
