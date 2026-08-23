const q = s => document.querySelector(s);

document.querySelectorAll("#chips button").forEach(b => {
  b.onclick = () => b.classList.toggle("active");
});

function profile(x) {
  x = x.toLowerCase();

  if (/japan|tokyo|kyoto/.test(x))
    return ["Japan", 1.3, 1.2, .9, .7];

  if (/kina|kinamuren|beijing|peking/.test(x))
    return ["Kina", 1.35, 1.1, .9, .4];

  if (/florida|orlando|miami/.test(x))
    return ["Florida", .8, 1.1, 1.3, 1.35];

  if (/frankfurt|berlin|paris|london|münchen|munich/.test(x))
    return [x, 1.25, .8, 1, .35];

  if (/italien|rom|venedig|milano|sicilien/.test(x))
    return ["Italien", 1.15, 1.05, 1.05, .65];

  if (/spanien|barcelona|madrid|mallorca|teneriffa|kanarie/.test(x))
    return ["Spanien", .95, 1.1, 1.25, .85];

  if (/grekland|aten|kreta|rhodos|kos/.test(x))
    return ["Grekland", .9, 1.05, 1.35, .8];

  if (/thailand|bangkok|phuket/.test(x))
    return ["Thailand", 1.15, 1.1, 1.35, .7];

  return [x || "Valfri destination", 1, 1, 1, .8];
}

function days() {
  const from = new Date(q("#from").value);
  const to = new Date(q("#to").value);

  if (!q("#from").value || !q("#to").value)
    return 7;

  return Math.max(
    1,
    Math.round((to - from) / 86400000)
  );
}

function priorityText(pri) {
  if (!pri.length)
    return "en balanserad resa";

  return pri.join(", ");
}

function destinationReason(p) {
  const name = p[0];

  if (/Japan/i.test(name))
    return "mycket starkt för kultur, upplevelser och variation, men flygresan gör att budgeten behöver användas medvetet.";

  if (/Kina/i.test(name))
    return "starkt för kultur och stora upplevelser. Längre resväg gör att resans längd blir extra viktig.";

  if (/Florida/i.test(name))
    return "starkt för sol, bad och familjeupplevelser. Disney och andra aktiviteter kan däremot snabbt påverka budgeten.";

  if (/Frankfurt|Berlin|Paris|London|München|Munich/i.test(name))
    return "bra för kultur, mat och upplevelser med relativt kort restid från Europa.";

  if (/Italien/i.test(name))
    return "bra balans mellan kultur, mat, upplevelser och avkoppling.";

  if (/Spanien/i.test(name))
    return "flexibelt för både sol, bad, kultur och familjeresor.";

  if (/Grekland/i.test(name))
    return "särskilt starkt om sol, bad och avkoppling väger tungt.";

  if (/Thailand/i.test(name))
    return "starkt för värme, bad, mat och upplevelser, men den långa resan gör längre vistelser mer attraktiva.";

  return "kan anpassas efter era prioriteringar, men den exakta balansen beror på destinationens prisnivå och utbud.";
}

function budgetAdvice(total, budget, i) {
  const difference = budget - total;

  if (difference >= budget * .15) {
    return i === 0
      ? "Det finns bra marginal i budgeten. Den kan användas för bättre boende eller någon extra upplevelse."
      : "Budgeten ger utrymme för att höja komforten eller lägga till aktiviteter.";
  }

  if (difference >= 0) {
    return "Upplägget håller sig inom budgeten och lämnar en rimlig säkerhetsmarginal.";
  }

  return `Det här upplägget ligger cirka ${Math.abs(difference).toLocaleString("sv-SE")} kr över budgeten. För att få ner kostnaden skulle jag främst justera boende och aktiviteter.`;
}

function compromise(i, pri, p) {
  if (i === 0)
    return `Jag prioriterar ${pri.length ? priorityText(pri) : "en bra helhetsbalans"} och försöker samtidigt hålla nere onödiga kostnader.`;

  if (i === 1)
    return "Här accepterar jag vissa kompromisser i komfort för att få mer resa för pengarna.";

  return "Här tillåter jag en högre kostnad för att maximera antalet upplevelser.";
}

q("#go").onclick = () => {

  const destination =
    q("#destination").value.trim() || "Valfri destination";

  const p = profile(destination);

  const people =
    Math.max(1, Number(q("#people").value) || 1);

  const budget =
    Number(q("#budget").value) || 10000;

  const ds = days();

  const pri = [
    ...document.querySelectorAll("#chips .active")
  ].map(x => x.dataset.v);

  const out = q("#out");

  /*
    ResAgent v0.8
    ----------------
    Detta är fortfarande en lokal prototyp.
    Algoritmen simulerar ett resonemang utifrån
    destination, budget, reslängd och prioriteringar.
  */

  let text = `
    <div class="thinking">
      <h2>🧠 ResAgent tänker så här</h2>

      <p>
        <b>Destination:</b> ${p[0]}
      </p>

      <p>
        Jag väger ihop ${people} resenärer,
        ${ds} dagar och en totalbudget på
        ${budget.toLocaleString("sv-SE")} kr.
      </p>

      <p>
        <b>Era prioriteringar:</b>
        ${priorityText(pri)}.
      </p>

      <p>
        ${destinationReason(p)}
      </p>

      <p>
        Jag försöker därför hitta den bästa kompromissen
        mellan upplevelser, vila, boende, transport och kostnad
        – inte bara det billigaste alternativet.
      </p>
    </div>
  `;

  /*
    Tre olika strategier.
    Varje strategi använder samma grunddata men
    gör olika prioriteringar.
  */

  [0.86, 1, 1.14].forEach((m, i) => {

    let total =
      Math.round((budget * m) / 10) * 10;

    /*
      Enkel kostnadsfördelning.
      Boende påverkas av resans längd.
    */

    let accommodation =
      Math.round(total * .34 / 10) * 10;

    let transport =
      Math.round(total * .28 / 10) * 10;

    let food =
      Math.round(total * .20 / 10) * 10;

    let activities =
      total - accommodation - transport - food;

    /*
      Matchningspoäng.
      Prioriteringar påverkar resultatet.
    */

    let score =
      78 +
      (pri.includes("familj") ? p[3] * 4 : 0) +
      (pri.includes("kultur") ? p[1] * 4 : 0) +
      (pri.includes("natur") ? p[2] * 3 : 0) +
      (pri.includes("sol") ? p[4] * 4 : 0) +
      (pri.includes("bad") ? p[4] * 4 : 0) -
      i * 2;

    /*
      Kortare resor får en liten fördel
      när resan är kort.
    */

    if (ds <= 5 && i === 1)
      score += 2;

    if (ds >= 10 && i === 2)
      score += 2;

    score = Math.min(97, Math.round(score));

    let name =
      i === 0
        ? "smart budget"
        : i === 1
          ? "balanserad"
          : "mest upplevelse";

    let badge =
      i === 0
        ? "🥇 BÄSTA MATCHNING"
        : i === 1
          ? "🥈 BÄST BALANS"
          : "🥉 MEST UPPLEVELSE";

    let description =
      i === 0
        ? "Maximerar värdet inom budgeten."
        : i === 1
          ? "Balanserar upplevelser, vila och kostnad."
          : "Ger mer utrymme för aktiviteter och upplevelser.";

    text += `
      <article class="option">

        <span class="badge">
          ${badge} · ${score}/100
        </span>

        <h2>
          ${p[0]} – ${name}
        </h2>

        <div class="price">
          ${total.toLocaleString("sv-SE")} kr
        </div>

        <p class="muted">
          ${description}
        </p>

        <div class="break">
          <div>
            <b>Boende</b>
            ${accommodation.toLocaleString("sv-SE")} kr
          </div>

          <div>
            <b>Transport</b>
            ${transport.toLocaleString("sv-SE")} kr
          </div>

          <div>
            <b>Mat</b>
            ${food.toLocaleString("sv-SE")} kr
          </div>

          <div>
            <b>Aktiviteter</b>
            ${activities.toLocaleString("sv-SE")} kr
          </div>
        </div>

        <p>
          <b>🧠 Varför?</b>
          ${compromise(i, pri, p)}
        </p>

        <p>
          ${budgetAdvice(total, budget, i)}
        </p>

        ${
          total > budget
            ? `
              <div class="warn">
                ⚠️ Detta alternativ ligger över budget.
                Det visar vilken kompromiss som krävs för
                mer komfort eller fler upplevelser.
              </div>
            `
            : `
              <div class="good">
                ✓ Detta alternativ ryms inom budgeten.
              </div>
            `
        }

      </article>
    `;
  });

  out.innerHTML = text;

  out.scrollIntoView({
    behavior: "smooth"
  });
};const q=s=>document.querySelector(s);document.querySelectorAll("#chips button").forEach(b=>b.onclick=()=>b.classList.toggle("active"));function profile(x){x=x.toLowerCase();if(/japan|tokyo|kyoto/.test(x))return["Japan",1.3,1.2,.9,.7];if(/kina|kinamuren|beijing|pek/.test(x))return["Kina",1.35,1.1,.9,.4];if(/florida|orlando|miami/.test(x))return["Florida",.8,1,1.3,1.35];if(/frankfurt|berlin|paris|london/.test(x))return[x,1.25,.8,1,.35];return[q("#destination").value,1,1,1,.8]}function days(){return Math.max(1,Math.round((new Date(q("#to").value)-new Date(q("#from").value))/86400000))}q("#go").onclick=()=>{let d=q("#destination").value.trim()||"Valfri destination",p=profile(d),n=+q("#people").value||1,b=+q("#budget").value||10000,ds=days(),pri=[...document.querySelectorAll("#chips .active")].map(x=>x.dataset.v),out=q("#out");let txt=`<div class="thinking"><h2>🧠 ResAgent tänker så här</h2><p><b>Destination:</b> ${p[0]}</p><p>Jag väger ihop ${n} resenärer, ${ds} dagar och ${b.toLocaleString("sv-SE")} kr.</p><p>Prioriteringar: <b>${pri.length?pri.join(", "):"balanserad resa"}</b>.</p><p>Jag försöker hitta bästa kompromissen mellan upplevelser, restid, boende och kostnad – inte bara det billigaste.</p></div>`;[.86,1,1.14].forEach((m,i)=>{let total=Math.round(b*m/10)*10,l=Math.round(total*.34/10)*10,t=Math.round(total*.28/10)*10,f=Math.round(total*.2/10)*10,a=total-l-t-f,score=Math.min(97,Math.round(82+(pri.includes("familj")?p[3]*3:0)+(pri.includes("kultur")?p[1]*3:0)+(pri.includes("natur")?p[2]*2:0)+(pri.includes("sol")?p[4]*3:0)-i*2));let name=i==0?"smart budget":i==1?"balanserad":"mest upplevelse";txt+=`<article class="option"><span class="badge">${i==0?"🥇 BÄSTA PRISVÄRDE":i==1?"🥈 BÄST BALANS":"🥉 MEST UPPLEVELSE"} · ${score}/100</span><h2>${p[0]} – ${name}</h2><div class="price">${total.toLocaleString("sv-SE")} kr</div><p class="muted">${i==0?"Maximerar värdet inom budgeten.":i==1?"Balanserar upplevelser, vila och kostnad.":"Ger mer utrymme för upplevelser och bekvämlighet."}</p><div class="break"><div><b>Boende</b>${l.toLocaleString("sv-SE")} kr</div><div><b>Transport</b>${t.toLocaleString("sv-SE")} kr</div><div><b>Mat</b>${f.toLocaleString("sv-SE")} kr</div><div><b>Aktiviteter</b>${a.toLocaleString("sv-SE")} kr</div></div>${total>b?'<div class="warn">⚠️ Detta upplägg ligger över budget och visar vilken kompromiss som krävs för mer upplevelser.</div>':""}</article>`});out.innerHTML=txt;out.scrollIntoView({behavior:"smooth"})}
