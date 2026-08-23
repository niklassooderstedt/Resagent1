const q=s=>document.querySelector(s);

document.querySelectorAll("#chips button").forEach(b=>{
  b.onclick=()=>b.classList.toggle("active")
});

function days(){
  let a=new Date(q("#from").value),
      b=new Date(q("#to").value);
  return Math.max(1,Math.round((b-a)/86400000))
}

function priorities(){
  return [...document.querySelectorAll("#chips .active")]
    .map(x=>x.dataset.v)
}

function parse(t){
  t=t.toLowerCase();

  let m=t.match(/(\d+)\s*(?:personer|person|vuxna|resenärer)/);

  let b=t.match(/(?:max|budget|under)\s*([0-9\s.,]+)\s*(?:kr|kronor)/);

  return{
    people:m?+m[1]:null,
    budget:b?+b[1].replace(/[^0-9]/g,""):null
  }
}

function destination(t){
  if(/japan|tokyo|kyoto/.test(t))return["Japan",86];
  if(/kina|kinamuren|beijing|peking/.test(t))return["Kina",82];
  if(/florida|orlando|miami/.test(t))return["Florida",84];
  if(/spanien|barcelona|madrid|mallorca|teneriffa/.test(t))return["Spanien",89];
  if(/italien|rom|venedig|milano/.test(t))return["Italien",87];
  if(/grekland|aten|kreta|rhodos|kos/.test(t))return["Grekland",92];
  if(/thailand|bangkok|phuket/.test(t))return["Thailand",85];
  if(/frankfurt|berlin|paris|london|münchen|munich/.test(t))return["Europa",88];

  return["Valfri destination",78]
}

/* V1.2 – förbättrade länkar */
function links(n){

  let x=encodeURIComponent(n);

  return`
  <div class="links">

    <a target="_blank"
       rel="noopener noreferrer"
       href="https://www.google.com/travel/flights?q=flyg%20till%20${x}">
       ✈️ Se aktuella flyg
    </a>

    <a target="_blank"
       rel="noopener noreferrer"
       href="https://www.booking.com/searchresults.html?ss=${x}">
       🏨 Se aktuella boenden
    </a>

    <a target="_blank"
       rel="noopener noreferrer"
       href="https://www.skyscanner.se/transport/flights-to/${x}">
       🌍 Jämför resealternativ
    </a>

    <a target="_blank"
       rel="noopener noreferrer"
       href="https://www.rentalcars.com/search-results.do?location=${x}">
       🚗 Se hyrbilar
    </a>

  </div>
  `
}

q("#go").onclick=()=>{

  let text=q("#destination").value.trim();

  let p=parse(text);

  let d=destination(text.toLowerCase());

  let n=p.people || +q("#people").value || 1;

  let b=p.budget || +q("#budget").value || 11000;

  let ds=days();

  let pri=priorities();

  let html=`

  <div class="thinking">

    <h2>🧠 ResAgent v1.2</h2>

    <p>
      <b>Min första bedömning:</b>
      Jag tolkar din resebeskrivning som en resa för
      ${n} resenärer, ${ds} dagar och cirka
      ${b.toLocaleString("sv-SE")} kr.
    </p>

    <p>
      <b>Prioriteringar:</b>
      ${pri.length?pri.join(", "):"balanserad resa"}.
    </p>

    <p>
      <b>Min starkaste kandidat:</b>
      ${d[0]} – ${d[1]}/100.
    </p>

    <p>
      Jag försöker hitta bästa helheten mellan
      upplevelser, komfort, restid och kostnad.
    </p>

  </div>

  <article class="option">

    <span class="badge">
      🏆 MIN REKOMMENDATION · ${d[1]}/100
    </span>

    <h2>${d[0]}</h2>

    <p class="muted">
      Detta är den destination som bäst matchar
      den information ResAgent kan tolka i v1.2.
    </p>

    <div class="break">

      <div>
        <b>Boende</b>
        ${Math.round(b*.34).toLocaleString("sv-SE")} kr
      </div>

      <div>
        <b>Transport</b>
        ${Math.round(b*.28).toLocaleString("sv-SE")} kr
      </div>

      <div>
        <b>Mat</b>
        ${Math.round(b*.20).toLocaleString("sv-SE")} kr
      </div>

      <div>
        <b>Aktiviteter</b>
        ${Math.round(b*.18).toLocaleString("sv-SE")} kr
      </div>

    </div>

    <p class="muted">

      <b>🔗 Nästa steg</b><br>

      ResAgent har hittat ett förslag.
      Kontrollera aktuella priser och tillgänglighet
      hos respektive leverantör innan bokning.

    </p>

    ${links(d[0])}

    <div class="good">
      ✓ Budgetram:
      ${b.toLocaleString("sv-SE")} kr totalt.
    </div>

  </article>

  `;

  q("#out").innerHTML=html;

  q("#out").scrollIntoView({
    behavior:"smooth"
  });
}
