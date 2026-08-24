const $=s=>document.querySelector(s);
function isoToday(){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)}
function days(){const a=$("#from").value,b=$("#to").value;if(!a||!b)return 1;return Math.max(1,Math.round((new Date(b)-new Date(a))/86400000)+1)}
function normalize(s){return String(s||"").toLowerCase().replace(/[åä]/g,"a").replace(/ö/g,"o").replace(/é/g,"e")}
function people(t){const m=normalize(t).match(/(\d+)\s*(personer|person|resenarer|resenärer)/);return m?+m[1]:1}
function destination(t){const n=normalize(t), map=[
["Stockholm",/stockholm/],["Göteborg",/goteborg/],["Malmö",/malmo/],["Helsingborg",/helsingborg/],["Visby",/visby/],
["Uppsala",/uppsala/],["Örebro",/orebro/],["Åre",/\bare\b/],["Gotland",/gotland/],["Grekland",/grekland|aten|kreta|rhodos/],
["Spanien",/spanien|barcelona|madrid|mallorca/],["Italien",/italien|rom|venedig|milano/],["Frankrike",/frankrike|paris|nice/],
["Thailand",/thailand|bangkok|phuket/],["Japan",/japan|tokyo|kyoto/],["London",/london/],["Berlin",/berlin/],["Köpenhamn",/kopenhamn/]];
for(const [name,re] of map)if(re.test(n))return name;return "Valfri destination"}
function origin(t){const m=String(t).match(/(?:från|fran)\s+([A-Za-zÅÄÖåäö -]+?)(?=\s+(?:till|och|för|for|med|i)\b|[,.]|$)/i);return m?m[1].trim():null}
function money(n){return Math.round(n).toLocaleString("sv-SE")+" kr"}
function run(){
 const text=$("#destination").value.trim(); if(!text){$("#destination").focus();return}
 const p=people(text),d=destination(text),o=origin(text),dur=days(),nights=Math.max(1,dur-1);
 const html=`<article class="result-card"><span class="result-badge">✦ DESTYPOINT · MIN FÖRSTA BEDÖMNING</span><h2>${d}</h2><p>Jag tolkar din resa som <b>${p} ${p===1?"person":"personer"}</b>${o?` från <b>${o}</b>`:""} till <b>${d}</b>, ${dur} ${dur===1?"dag":"dagar"}.</p><p>Jag väger samman destination, restid, boende, aktiviteter och det du själv beskriver.</p><div class="stats"><div><b>Boende</b>${money(2100*nights)}</div><div><b>Transport</b>${money(840*p)}</div><div><b>Mat</b>${money(650*p*dur)}</div><div><b>Aktiviteter</b>${money(900*p)}</div></div></article>`;
 $("#out").innerHTML=html;$("#out").scrollIntoView({behavior:"smooth",block:"start"})
}
$("#from").value=isoToday();$("#to").value=isoToday();
$("#go").addEventListener("click",run);
$("#destination").addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key==="Enter")run()});
document.querySelectorAll(".idea").forEach(b=>b.addEventListener("click",()=>{$("#destination").value=b.dataset.idea;$("#destination").focus()}));
