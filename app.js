const q = s => document.querySelector(s);

document.querySelectorAll("#chips button").forEach(b => {
  b.onclick = () => b.classList.toggle("active");
});

function profile(x) {
  x = x.toLowerCase();
  if (/japan|tokyo|kyoto/.test(x)) return ["Japan", 1.3, 1.2, .9, .7];
  if (/kina|kinamuren|beijing|peking/.test(x)) return ["Kina", 1.35, 1.1, .9, .4];
  if (/florida|orlando|miami/.test(x)) return ["Florida", .8, 1.1, 1.3, 1.35];
  if (/frankfurt|berlin|paris|london|münchen|munich/.test(x)) return [x, 1.25, .8, 1, .35];
  if (/italien|rom|venedig|milano|sicilien/.test(x)) return ["Italien", 1.15, 1.05, 1.05, .65];
  if (/spanien|barcelona|madrid|mallorca|teneriffa|kanarie/.test(x)) return ["Spanien", .95, 1.1, 1.25, .85];
  if (/grekland|aten|kreta|rhodos|kos/.test(x)) return ["Grekland", .9, 1.05, 1.35, .8];
  if (/thailand|bangkok|phuket/.test(x)) return ["Thailand", 1.15, 1.1, 1.35, .7];
  return [x || "Valfri destination", 1, 1, 1, .8];
}

function days() {
  if (!q("#from").value || !q("#to").value) return 7;
  return Math.max(1, Math.round((new Date(q("#to").value) - new Date(q("#from").value)) / 86400000));
}

function priorityText(pri) {
  return pri.length ? pri.join(", ") : "en balanserad resa";
}

function destinationReason(p) {
  const name = p[0];
  if (/Japan/i.test(name)) return "mycket starkt för kultur, upplevelser och variation, men flygresan gör att budgeten behöver användas medvetet.";
  if (/Kina/i.test(name)) return "starkt för kultur och stora upplevelser. Längre resväg gör att resans längd blir extra viktig.";
  if (/Florida/i.test(name)) return "starkt för sol, bad och familjeupplevelser. Disney och andra aktiviteter kan däremot snabbt påverka budgeten.";
  if (/Frankfurt|Berlin|Paris|London|München|Munich/i.test(name)) return "bra för kultur, mat och upplevelser med relativt kort restid från Europa.";
  if (/Italien/i.test(name)) return "bra balans mellan kultur, mat, upplevelser och avkoppling.";
  if (/Spanien/i.test(name)) return "flexibelt för både sol, bad, kultur och familjeresor.";
  if (/Grekland/i.test(name)) return "särskilt starkt om sol, bad och avkoppling väger tungt.";
  if (/Thailand/i.test(name)) return "starkt för värme, bad, mat och upplevelser, men den långa resan gör längre vistelser mer attraktiva.";
  return "kan anpassas efter era prioriteringar, men den exakta balansen beror på destinationens prisnivå och utbud.";
}

function seasonAdvice(destination, fromValue) {
  if (!fromValue) return "";
  const month = new Date(fromValue).getMonth() + 1;
  const name = destination.toLowerCase();
  if ((month === 12 || month === 1) && /frankfurt|berlin|paris|london|münchen|munich/.test(name)) return "Resan ligger över jul/nyår, vilket kan göra boende och transport dyrare än normalt.";
  if ((month === 12 || month === 1 || month === 2) && /spanien|grekland/.test(name)) return "Vinterperioden gör att sol- och badmöjligheterna kan vara mer begränsade än under sommarsäsongen.";
  if ((month >= 6 && month <= 8) && /japan|kina/.test(name)) return "Resan ligger under sommarmånaderna. Väder, värme och högsäsong kan påverka upplevelsen och prisnivån.";
  if ((month >= 6 && month <= 8) && /florida/.test(name)) return "Sommarperioden i Florida kan innebära hög värme, fuktighet och risk för kraftiga regn.";
  return "";
}

function smartRecommendation(p, budget, people, ds, pri, fromValue) {
  const perPerson = Math.round(budget / people);
  const season = seasonAdvice(p[0], fromValue);
  const reasons = [];
  if (pri.includes("budget")) reasons.push(`budgeten på ${budget.toLocaleString("sv-SE")} kr (${perPerson.toLocaleString("sv-SE")} kr/person)`);
  if (pri.includes("familj")) reasons.push("familjevänlighet");
  if (pri.includes("sol") || pri.includes("bad")) reasons.push("sol och bad");
  if (pri.includes("kultur")) reasons.push("kultur och upplevelser");
  if (pri.includes("natur")) reasons.push("natur");
  if (pri.includes("kort")) reasons.push("kort restid");

  let conclusion;
  if (budget < people * 3500 && ds >= 10) {
    conclusion = `Med ${people} resenärer och ${ds} dagar är budgeten ganska pressad. Jag skulle prioritera boende och transport tidigt och vara beredd att korta resan eller välja en billigare destination.`;
  } else if (budget < people * 5000 && ds >= 10) {
    conclusion = `Budgeten är möjlig men kräver viss disciplin. För en så lång resa skulle jag undvika onödigt dyra aktiviteter och lägga mest pengar på boende, transport och sådant ni verkligen vill uppleva.`;
  } else if (ds <= 5) {
    conclusion = `Eftersom resan är kort bör ni lägga större vikt vid restid och läge. Det är ofta bättre att betala lite mer för ett bra läge än att spara pengar och förlora mycket tid på transport.`;
  } else {
    conclusion = `Upplägget ser relativt balanserat ut. Jag skulle säkra boende och transport först och sedan använda resten flexibelt till mat och upplevelser.`;
  }

  return `<div class="thinking"><h2>🧠 ResAgent v0.8</h2><p><b>Min första bedömning:</b> ${conclusion}</p><p>Jag tar särskilt hänsyn till ${reasons.length ? reasons.join(", ") : "helheten"}.</p>${season ? `<p>📅 <b>Datum:</b> ${season}</p>` : ""}</div>`;
}

function budgetAdvice(total, budget, i) {
  const difference = budget - total;
  if (difference >= budget * .15) return i === 0 ? "Det finns bra marginal i budgeten. Den kan användas för bättre boende eller någon extra upplevelse." : "Budgeten ger utrymme för att höja komforten eller lägga till aktiviteter.";
  if (difference >= 0) return "Upplägget håller sig inom budgeten och lämnar en rimlig säkerhetsmarginal.";
  return `Det här upplägget ligger cirka ${Math.abs(difference).toLocaleString("sv-SE")} kr över budgeten. För att få ner kostnaden skulle jag främst justera boende och aktiviteter.`;
}

function compromise(i, pri) {
  if (i === 0) return `Jag prioriterar ${pri.length ? priorityText(pri) : "en bra helhetsbalans"} och försöker samtidigt hålla nere onödiga kostnader.`;
  if (i === 1) return "Här accepterar jag vissa kompromisser i komfort för att få mer resa för pengarna.";
  return "Här tillåter jag en högre kostnad för att maximera antalet upplevelser.";
}

q("#go").onclick = () => {
  const destination = q("#destination").value.trim() || "Valfri destination";
  const fromValue = q("#from").value;
  const toValue = q("#to").value;
  const out = q("#out");

  if (fromValue && toValue && new Date(toValue) <= new Date(fromValue)) {
    out.innerHTML = `<div class="thinking"><h2>⚠️ Kontrollera datumen</h2><p>Till-datumet måste vara senare än från-datumet.</p></div>`;
    return;
  }

  const p = profile(destination);
  const people = Math.max(1, Number(q("#people").value) || 1);
  const budget = Number(q("#budget").value) || 10000;
  const ds = days();
  const pri = [...document.querySelectorAll("#chips .active")].map(x => x.dataset.v);

  let text = smartRecommendation(p, budget, people, ds, pri, fromValue);
  text += `<div class="thinking"><p><b>Destination:</b> ${p[0]}</p><p>Jag väger ihop ${people} resenärer, ${ds} dagar och en totalbudget på ${budget.toLocaleString("sv-SE")} kr.</p><p><b>Budget per person:</b> ${Math.round(budget / people).toLocaleString("sv-SE")} kr.</p><p><b>Era prioriteringar:</b> ${priorityText(pri)}.</p><p>${destinationReason(p)}</p></div>`;

  [0.86, 1, 1.14].forEach((m, i) => {
    const total = Math.round((budget * m) / 10) * 10;
    const accommodation = Math.round(total * .34 / 10) * 10;
    const transport = Math.round(total * .28 / 10) * 10;
    const food = Math.round(total * .20 / 10) * 10;
    const activities = total - accommodation - transport - food;

    let score = 78 +
      (pri.includes("familj") ? p[3] * 4 : 0) +
      (pri.includes("kultur") ? p[1] * 4 : 0) +
      (pri.includes("natur") ? p[2] * 3 : 0) +
      (pri.includes("sol") ? p[4] * 4 : 0) +
      (pri.includes("bad") ? p[4] * 4 : 0);

    if (pri.includes("budget") && i === 0) score += 4;
    if (pri.includes("kort") && ds <= 7 && i === 0) score += 2;
    score -= i * 2;
    if (ds <= 5 && i === 1) score += 2;
    if (ds >= 10 && i === 2) score += 2;
    score = Math.min(97, Math.round(score));

    const name = i === 0 ? "smart budget" : i === 1 ? "balanserad" : "mest upplevelse";
    const badge = i === 0 ? "🥇 BÄSTA MATCHNING" : i === 1 ? "🥈 BÄST BALANS" : "🥉 MEST UPPLEVELSE";
    const description = i === 0 ? "Maximerar värdet inom budgeten." : i === 1 ? "Balanserar upplevelser, vila och kostnad." : "Ger mer utrymme för aktiviteter och upplevelser.";

    text += `<article class="option"><span class="badge">${badge} · ${score}/100</span><h2>${p[0]} – ${name}</h2><div class="price">${total.toLocaleString("sv-SE")} kr</div><p class="muted">${description}</p><div class="break"><div><b>Boende</b>${accommodation.toLocaleString("sv-SE")} kr</div><div><b>Transport</b>${transport.toLocaleString("sv-SE")} kr</div><div><b>Mat</b>${food.toLocaleString("sv-SE")} kr</div><div><b>Aktiviteter</b>${activities.toLocaleString("sv-SE")} kr</div></div><p><b>🧠 Varför?</b> ${compromise(i, pri)}</p><p>${budgetAdvice(total, budget, i)}</p>${total > budget ? `<div class="warn">⚠️ Detta alternativ ligger över budget. Det visar vilken kompromiss som krävs för mer komfort eller fler upplevelser.</div>` : `<div class="good">✓ Detta alternativ ryms inom budgeten.</div>`}</article>`;
  });

  out.innerHTML = text;
  out.scrollIntoView({ behavior: "smooth" });
};
