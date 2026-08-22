const $=id=>document.getElementById(id);
document.querySelectorAll("#chips button").forEach(b=>b.onclick=()=>b.classList.toggle("on"));
const profiles=[
 {keys:["kina","kinamuren","beijing","peking"],name:"Kina · Peking & Kinesiska muren",score:91,desc:"Kultur, mat och stora upplevelser. Perfekt om ni vill byta strandsemester mot äventyr."},
 {keys:["tokyo","japan"],name:"Japan · Tokyo & familjeupplevelser",score:88,desc:"Mat, kultur och massor att upptäcka tillsammans. En resa med hög upplevelsefaktor."},
 {keys:["florida","orlando","usa"],name:"Florida · Orlando & västkusten",score:94,desc:"Disney först och sedan strand. Ett starkt alternativ för en familjeresa."}
];
$("go").onclick=()=>{
 const d=$("destination").value.trim()||"valfritt resmål", p=profiles.find(x=>x.keys.some(k=>d.toLowerCase().includes(k)));
 const budget=Number($("budget").value)||0, people=(Number($("adults").value)||1)+(Number($("children").value)||0);
 const name=p?p.name:`${d} · skräddarsydd resa`, score=p?p.score:82, desc=p?p.desc:"ResAgent anpassar upplägget efter platsen ni angav och era prioriteringar.";
 const opts=[
  [name,budget,score,desc,"🥇 BÄSTA MATCHNING"],
  [`${d} · Mer upplevelser`,Math.round(budget*1.11/100)*100,Math.max(70,score-2),"Lite mer budget ger utrymme för bättre boende och fler aktiviteter.","🥈 MER UPPLEVELSER"],
  [`${d} · Budgetsmart`,Math.round(budget*.89/100)*100,Math.max(68,score-5),"Prioriterar pris och lägger pengarna på det ni valt som viktigast.","🥉 BUDGETSMART"]
 ];
 $("list").innerHTML=opts.map(o=>`<article class="card result"><span class="badge">${o[4]} · ${o[2]}/100</span><h3>${o[0]}</h3><p class="price">${o[1].toLocaleString("sv-SE")} kr</p><p class="desc">${o[3]}</p><div class="details">${people} resenärer · simulerat pris · inga riktiga bokningar ännu</div></article>`).join("");
 $("results").classList.remove("hidden"); $("results").scrollIntoView({behavior:"smooth"});
};