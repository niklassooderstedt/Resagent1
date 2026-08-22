const chips=[...document.querySelectorAll(".chip")];
chips.forEach(c=>c.addEventListener("click",()=>c.classList.toggle("active")));

const btn=document.getElementById("startBtn"),results=document.getElementById("results");
const cards=document.getElementById("cards"),title=document.getElementById("resultTitle");
const analysis=document.getElementById("analysisText");

function analyse(){
 const dream=document.getElementById("dream").value.trim();
 const destination=document.getElementById("destination").value.trim();
 const text=(destination+" "+dream).toLowerCase();
 const selected=chips.filter(c=>c.classList.contains("active")).map(c=>c.dataset.value);
 let place=destination||"din drömdestination", ideas=[];

 if(text.includes("kina")||text.includes("kinamuren")||text.includes("beijing")||text.includes("peking")){
   place=destination||"Kina";
   ideas=[
    ["🇨🇳 Beijing + Kinesiska muren","Kultur, historia och stora upplevelser","42 500",91,["Kinesiska muren","Beijing","Kultur"]],
    ["🏯 Beijing + extra upplevelsedagar","Mer tid för mat, sevärdheter och utflykter","47 900",87,["Mat","Historia","Utflykter"]],
    ["✈️ Kina med flexibel resrutt","Färre måsten – mer frihet att anpassa resan","39 800",83,["Flexibelt","Budget","Äventyr"]]
   ];
 } else if(text.includes("florida")||text.includes("disney")){
   place=destination||"Florida";
   ideas=[
    ["Orlando → Fort Myers Beach","Disney först, sedan strand. One-way hyrbil.","58 740",91,["Disney","Strand","Familj"]],
    ["Clearwater Beach","Mer strand per krona, mindre Disney-fokus.","54 200",87,["Strand","Budget","Familj"]],
    ["Orlando + Cocoa Beach","Kortare stranddel och mer tid i Orlando.","56 900",84,["Disney","Strand","Kortare körning"]]
   ];
 } else {
   const family=selected.includes("familj"), base=family?52:44;
   ideas=[
    [`${place} – balanserad resa`,"En mix av det du verkar prioritera, med rimliga kompromisser.",`${base} 900`,90,selected.slice(0,3)],
    [`${place} – upplevelsefokus`,"Mer tid för sevärdheter, lokala upplevelser och utflykter.",`${base+4} 500`,86,["Upplevelser","Utflykter","Lokalt"]],
    [`${place} – budgetalternativ`,"Vi prioriterar pris och lägger pengarna där de gör störst skillnad.",`${base-5} 900`,82,["Budget","Flexibelt","Prisvärt"]]
   ];
 }
 title.textContent=`Jag hittade tre sätt att göra resan till ${place}.`;
 analysis.textContent=`Jag har vägt in destinationen, dina prioriteringar och beskrivningen du skrev. V0.4 är fortfarande en prototyp, men nästa steg är att låta ResAgent hämta riktig information och göra samma analys med aktuella priser.`;
 cards.innerHTML=ideas.map((x,i)=>`<article class="result-card"><div class="badge">${i===0?"🥇 BÄSTA MATCHNING":"🥈 ALTERNATIV"} · ${x[3]}/100</div><h3>${x[0]}</h3><div class="price">${x[2]} kr</div><p class="desc">${x[1]}</p><div class="meta">${x[4].map(t=>`<span class="tag">${t}</span>`).join("")}</div></article>`).join("");
 results.classList.remove("hidden");results.scrollIntoView({behavior:"smooth"});
}
btn.addEventListener("click",analyse);
