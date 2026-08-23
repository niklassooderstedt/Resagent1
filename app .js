const q = s => document.querySelector(s);

document.querySelectorAll("#chips button").forEach(button => {
  button.onclick = () => button.classList.toggle("active");
});

function days() {
  const from = new Date(q("#from").value);
  const to = new Date(q("#to").value);
  if (!q("#from").value || !q("#to").value) return 7;
  return Math.max(1, Math.round((to - from) / 86400000));
}

function priorities() {
  return [...document.querySelectorAll("#chips .active")].map(x => x.dataset.v);
}

function parseTrip(text) {
  const lower = text.toLowerCase();
  const peopleMatch = lower.match(/(\d+)\s*(?:personer|person|vuxna|resenärer)/);
  const budgetMatch = lower.match(/(?:max|budget|under)\s*([0-9\s.,]+)\s*(?:kr|kronor)/);

  return {
    people: peopleMatch ? Number(peopleMatch[1]) : null,
    budget: budgetMatch ? Number(budgetMatch[1].replace(/[^0-9]/g, "")) : null
  };
}

function destination(text) {
  if (/japan|tokyo|kyoto/.test(text)) return ["Japan", 86];
  if (/kina|kinamuren|beijing|peking/.test(text)) return ["Kina", 82];
  if (/florida|orlando|miami/.test(text)) return ["Florida", 84];
  if (/spanien|barcelona|madrid|mallorca|teneriffa/.test(text)) return ["Spanien", 89];
  if (/italien|rom|venedig|milano/.test(text)) return ["Italien", 87];
  if (/grekland|aten|kreta|rhodos|kos/.test(text)) return ["Grekland", 92];
  if (/thailand|bangkok|phuket/.test(text)) return ["Thailand", 85];
  if (/frankfurt|berlin|paris|london|münchen|munich/.test(text)) return ["Europa", 88];
  return ["Valfri destination", 78];
}

function bookingLinks(name) {
  const destinationName = encodeURIComponent(name);
  const from = q("#from").value || "";
  const to = q("#to").value || "";
  const people = Number(q("#people").value) || 1;

  const googleFlights =
    "https://www.google.com/travel/flights?q=" +
    encodeURIComponent("flyg till " + name) + "&hl=sv";

  const booking =
    "https://www.booking.com/searchresults.html" +
    "?ss=" + destinationName +
    "&checkin=" + from +
    "&checkout=" + to +
    "&group_adults=" + people +
    "&no_rooms=1";

  const packageSearch =
    "https://www.google.com/search?q=" +
    encodeURIComponent("paketresa " + name + " TUI Ving Apollo");

  return `
    <div class="links">
      <a href="${googleFlights}" target="_blank" rel="noopener noreferrer">✈️ Se flygalternativ</a>
      <a href="${booking}" target="_blank" rel="noopener noreferrer">🏨 Se boenden</a>
      <a href="${packageSearch}" target="_blank" rel="noopener noreferrer">🌴 Se paketresor</a>
      <a href="https://www.rentalcars.com/" target="_blank" rel="noopener noreferrer">🚗 Se hyrbil</a>
    </div>
  `;
}

q("#go").onclick = () => {
  const text = q("#destination").value.trim() || "Valfri destination";
  const parsed = parseTrip(text);
  const result = destination(text.toLowerCase());

  const people = parsed.people || Number(q("#people").value) || 1;
  const budget = parsed.budget || Number(q("#budget").value) || 11000;
  const tripDays = days();
  const selectedPriorities = priorities();

  const priorityText = selectedPriorities.length
    ? selectedPriorities.join(", ")
    : "balanserad resa";

  const html = `
    <div class="thinking">
      <h2>🧠 ResAgent v1.2</h2>
      <p><b>Min första bedömning:</b> Jag tolkar din resebeskrivning som en resa för ${people} resenärer, ${tripDays} dagar och cirka ${budget.toLocaleString("sv-SE")} kr.</p>
      <p><b>Prioriteringar:</b> ${priorityText}.</p>
      <p><b>Min starkaste kandidat:</b> ${result[0]} – ${result[1]}/100.</p>
      <p>Jag försöker hitta bästa helheten mellan upplevelser, komfort, restid och kostnad.</p>
    </div>

    <article class="option">
      <span class="badge">🏆 MIN REKOMMENDATION · ${result[1]}/100</span>
      <h2>${result[0]}</h2>
      <p class="muted">Detta är den destination som bäst matchar den information ResAgent kan tolka i v1.2.</p>

      <div class="break">
        <div><b>Boende</b>${Math.round(budget * 0.34).toLocaleString("sv-SE")} kr</div>
        <div><b>Transport</b>${Math.round(budget * 0.28).toLocaleString("sv-SE")} kr</div>
        <div><b>Mat</b>${Math.round(budget * 0.20).toLocaleString("sv-SE")} kr</div>
        <div><b>Aktiviteter</b>${Math.round(budget * 0.18).toLocaleString("sv-SE")} kr</div>
      </div>

      <p class="muted">
        <b>🔗 Kontrollera och boka</b><br>
        ResAgent har tagit fram ett reseförslag. Här kan du gå vidare till aktuella alternativ, priser och tillgänglighet.
      </p>

      ${bookingLinks(result[0])}

      <div class="good">✓ Budgetram: ${budget.toLocaleString("sv-SE")} kr totalt.</div>
    </article>
  `;

  q("#out").innerHTML = html;
  q("#out").scrollIntoView({ behavior: "smooth" });
};
