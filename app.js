(() => {
"use strict";

const q = s => document.querySelector(s);
const VERSION = "v1.3";

const PARKS = [
["Astrid Lindgrens Värld","Vimmerby","Familjepark",1990,"https://astridlindgrensvarld.se/"],
["High Chaparral","Kulltorp","Familjepark",1776,"https://www.highchaparral.se/"],
["Liseberg","Göteborg","Nöjespark",2050,"https://www.liseberg.se/"],
["Gröna Lund","Stockholm","Nöjespark",2280,"https://www.gronalund.com/"],
["Kolmårdens djurpark","Kolmården","Djurpark",2116,"https://www.kolmarden.com/"],
["Borås Djurpark","Borås","Djurpark",null,"https://www.borasdjurpark.se/"],
["Skånes Djurpark","Höör","Djurpark",null,"https://www.skanesdjurpark.se/"],
["Furuvik","Gävle","Djur- och nöjespark",1976,"https://www.furuvik.se/"],
["Skara Sommarland","Skara","Sommarland",1996,"https://www.sommarland.se/"],
["Leksand Sommarland","Leksand","Sommarland",1980,"https://www.leksandsommarland.se/"],
["Tosselilla","Tomelilla","Sommarland",1650,"https://www.tosselilla.se/"],
["Kneippbyn","Visby","Familjepark",1900,"https://kneippbyn.se/"],
["Universeum","Göteborg","Vetenskapscenter",1140,"https://www.universeum.se/"],
["Skansen","Stockholm","Friluftsmuseum",610,"https://www.skansen.se/"],
["Junibacken","Stockholm","Familjeupplevelse",null,"https://www.junibacken.se/"],
["Tomteland","Mora","Familjepark",null,"https://www.tomteland.se/"],
["Nordens Ark","Hunnebostrand","Djurpark",null,"https://nordensark.se/"]
];

const esc = s => String(s).replace(/[&<>"']/g, c => ({
"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
}[c]));

const val = (id, fallback="") => {
  const e=q(id); return e ? String(e.value||"").trim() : fallback;
};
const num = (id, fallback) => {
  const n=Number(val(id).replace(/[^\d]/g,""));
  return Number.isFinite(n)&&n>0?n:fallback;
};

function days(){
  const a=val("#from"), b=val("#to");
  if(!a||!b)return 1;
  return Math.max(1,Math.round((new Date(b)-new Date(a))/86400000));
}

function priorities(){
  return [...document.querySelectorAll("#chips .active")].map(x=>x.dataset.v||x.textContent.trim());
}

function parse(text){
  const t=text.toLowerCase();
  const pm=t.match(/(\d+)\s*(?:personer|person|vuxna|resenärer|resenarer)/i);
  const bm=t.match(/(?:max|budget|under|för)\s*([0-9\s.,]+)\s*(?:kr|kronor)/i);
  const adults=t.match(/(\d+)\s*vuxna?/i);
  const children=t.match(/(\d+)\s*barn/i);
  let people=pm?+pm[1]:null;
  if(!people&&(adults||children)) people=(adults?+adults[1]:0)+(children?+children[1]:0);

  return {
    people,
    budget:bm?+bm[1].replace(/[^\d]/g,""):null,
    adults:adults?+adults[1]:null,
    children:children?+children[1]:null,
    sweden:/\bsverige\b|stockholm|göteborg|malmö|vimmerby|kulltorp|kolmården|borås|skara|leksand|visby|mora|gävle|tomelilla|höör|hunnebostrand/i.test(t),
    spa:/\bspa\b|spahotell|wellness|relax/i.test(t),
    weekend:/weekend|weekendresa/i.test(t),
    family:/familj|barn|familjeresa|kids/i.test(t),
    zoo:/djurpark|zoo|safari/i.test(t),
    amusement:/nöjespark|sommarland|vattenpark|karusell/i.test(t)
  };
}

function parkFor(text){
  const t=text.toLowerCase();
  return PARKS.find(p => p[0].toLowerCase().split(" ").some(k=>k.length>3&&t.includes(k))) ||
    PARKS.find(p => t.includes(p[1].toLowerCase()));
}

function destination(text,p){
  const t=text.toLowerCase();
  const list=[
    [/stockholm/,"Stockholm",92],[/göteborg|goteborg/,"Göteborg",91],
    [/malmö|malmo/,"Malmö",89],[/vimmerby/,"Vimmerby",94],
    [/kulltorp|high chaparral/,"Kulltorp",93],[/kolmården|kolmarden/,"Kolmården",94],
    [/borås|boras/,"Borås",88],[/skara/,"Skara",88],[/leksand/,"Leksand",88],
    [/visby|gotland/,"Gotland",90],[/mora/,"Mora",87],[/gävle|gavle/,"Gävle",87],
    [/japan|tokyo|kyoto/,"Japan",86],[/kina|kinamuren|beijing|peking/,"Kina",82],
    [/florida|orlando|miami/,"Florida",84],[/spanien|barcelona|madrid|mallorca|teneriffa/,"Spanien",89],
    [/italien|rom|venedig|milano/,"Italien",87],[/grekland|aten|kreta|rhodos|kos/,"Grekland",92],
    [/thailand|bangkok|phuket/,"Thailand",85],
    [/frankfurt|berlin|paris|london|münchen|munich/,"Europa",88]
  ];
  for(const x of list) if(x[0].test(t)) return [x[1],x[2]];
  if(p.spa&&p.sweden)return["Svensk spa-weekend",91];
  if(p.weekend&&p.sweden)return["Svensk weekend",89];
  if(p.family&&p.sweden)return["Sverige",86];
  return["Valfri destination",78];
}

function kr(n){return Math.round(n).toLocaleString("sv-SE")+" kr";}
function search(qry){return "https://www.google.com/search?q="+encodeURIComponent(qry);}

function parkSection(park,p,people){
  if(!park)return "";
  const family=park[3];
  let estimate=family ? Math.round(family*(people/4)) : null;
  return `<h3>🎟️ Aktivitet som ResAgent hittade</h3>
  <div class="activity-card">
    <b>🎟️ ${esc(park[0])}</b>
    <span>${esc(park[2])} · ${esc(park[1])}</span>
    <p>${estimate?`Beräknad entré: <b>${kr(estimate)}</b> för ${people} personer.`:"Aktuellt entrépris behöver kontrolleras."}</p>
    <small>Priset är en uppskattning och kan variera med datum och biljettkategori.</small>
    <br><a class="activity-link" target="_blank" rel="noopener" href="${park[4]}">🎟️ Se aktuella biljetter</a>
  </div>`;
}

function transport(p,dest){
  if(!p.sweden)return "";
  return `<div class="transport-box"><h3>🇸🇪 Transport i Sverige</h3>
  <p>ResAgent tar med <b>🚗 bil</b>, <b>🚆 tåg</b> och <b>⛴️ båt/färja</b> som alternativ.</p>
  <div class="mini-links">
  <a target="_blank" rel="noopener" href="${search("SJ tåg "+dest)}">🚆 Tåg</a>
  <a target="_blank" rel="noopener" href="${search("körtid bil till "+dest)}">🚗 Bil</a>
  <a target="_blank" rel="noopener" href="${search("färja "+dest)}">⛴️ Båt</a>
  </div></div>`;
}

function run(){
  const text=val("#destination","Valfri destination");
  const p=parse(text);
  const people=p.people||num("#people",1);
  const budget=p.budget||num("#budget",11000);
  const pri=priorities();
  const park=parkFor(text);
  let [dest,score]=destination(text,p);
  if(park)score=Math.max(score,94);

  let lodging=.34,trans=.28,food=.20,act=.18;
  if(p.spa){lodging=.43;trans=.22;food=.15;act=.20;}
  if(p.family||p.zoo||p.amusement){lodging=.31;trans=.25;food=.19;act=.25;}

  const html=`<div class="thinking">
    <span class="version-pill">🧠 ResAgent ${VERSION}</span>
    <h2>Min första bedömning</h2>
    <p>Jag tolkar din resa som <b>${people} resenär${people===1?"":"er"}</b>, <b>${days()} dagar</b> och cirka <b>${kr(budget)}</b>.</p>
    <p><b>Resetyp:</b> ${p.weekend?"weekend, ":""}${p.spa?"spa, ":""}${p.family?"familj, ":""}${p.zoo?"djurpark, ":""}${p.amusement?"nöjespark":"balanserad resa"}.</p>
    <p><b>Prioriteringar:</b> ${pri.length?esc(pri.join(", ")):"balanserad resa"}.</p>
    <p><b>Min starkaste kandidat:</b> ${esc(dest)} – ${score}/100.</p>
    <p>Jag väger samman destination, budget, restid, aktiviteter och dina prioriteringar.</p>
  </div>
  <article class="option">
    <span class="badge">🏆 MIN REKOMMENDATION · ${score}/100</span>
    <h2>${esc(dest)}</h2>
    <div class="break">
      <div><b>Boende</b>${kr(budget*lodging)}</div>
      <div><b>Transport</b>${kr(budget*trans)}</div>
      <div><b>Mat</b>${kr(budget*food)}</div>
      <div><b>Aktiviteter</b>${kr(budget*act)}</div>
    </div>
    ${parkSection(park,p,people)}
    ${transport(p,dest)}
    <p class="muted"><b>🔗 Nästa steg</b><br>Kontrollera alltid aktuella priser och tillgänglighet hos leverantören innan bokning.</p>
    <div class="links">
      <a target="_blank" rel="noopener" href="${search(dest+" hotell")}">🏨 Sök hotell</a>
      <a target="_blank" rel="noopener" href="${search(dest+" flyg")}">✈️ Sök flyg</a>
      ${p.sweden?`<a target="_blank" rel="noopener" href="${search("weekend "+dest)}">🧳 Sök weekendresor</a>`:""}
      ${p.spa?`<a target="_blank" rel="noopener" href="${search("spahotell "+dest)}">🧖 Sök spahotell</a>`:""}
      ${p.sweden?`<a target="_blank" rel="noopener" href="${search("biluthyrning "+dest)}">🚗 Sök hyrbil</a>`:""}
    </div>
    <div class="good">✓ Budgetram: <b>${kr(budget)}</b> totalt.</div>
  </article>`;

  const out=q("#out");
  if(out){out.innerHTML=html;out.scrollIntoView({behavior:"smooth"});}
}

function style(){
  if(q("#v13style"))return;
  const s=document.createElement("style");s.id="v13style";
  s.textContent=`
  .activity-card,.transport-box{background:#f1f4fa;border-radius:20px;padding:18px;margin:14px 0}
  .activity-card span{display:block;color:#6f7a95;margin-top:5px}
  .activity-link,.mini-links a{display:inline-block;text-decoration:none;font-weight:700;background:#fff;color:#172b4d;padding:10px 14px;border-radius:14px;margin:5px 5px 0 0}
  .version-pill{display:inline-block;font-weight:800;background:#e9eef8;color:#172b4d;padding:7px 12px;border-radius:999px}
  .links{display:flex;flex-direction:column;gap:10px;margin:18px 0}
  .links a{display:block;text-align:center;text-decoration:none;font-weight:800;background:#172b4d;color:#fff;padding:14px;border-radius:16px}
  `;
  document.head.appendChild(s);
}

function init(){
  style();
  document.querySelectorAll("#chips button").forEach(b=>b.addEventListener("click",()=>b.classList.toggle("active")));
  const go=q("#go");
  if(!go)return;
  go.onclick=null;
  go.addEventListener("click",e=>{e.preventDefault();run();});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();