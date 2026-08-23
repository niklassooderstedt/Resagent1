const q=s=>document.querySelector(s);
document.querySelectorAll("#chips button").forEach(b=>b.onclick=()=>b.classList.toggle("active"));

const esc=x=>String(x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function profile(x){
 x=x.toLowerCase();
 if(/japan|tokyo|kyoto/.test(x))return["Japan",1.3,1.2,.9,.7,1.45,1.35];
 if(/kina|kinamuren|beijing|peking/.test(x))return["Kina",1.35,1.1,.9,.4,1.4,1.2];
 if(/florida|orlando|miami/.test(x))return["Florida",.8,1.25,1.3,1.35,1.5,1.45];
 if(/frankfurt|berlin|paris|london|münchen|munich/.test(x))return[x,1.25,.95,.8,.35,.65,1];
 if(/italien|rom|venedig|milano|sicilien/.test(x))return["Italien",1.15,1.05,1.05,1.05,.8,1.05];
 if(/spanien|barcelona|madrid|mallorca|teneriffa|kanarie/.test(x))return["Spanien",1,1.15,1.25,1.3,.85,1];
 if(/grekland|aten|kreta|rhodos|kos/.test(x))return["Grekland",1.05,1.1,1.2,1.4,.9,.95];
 if(/thailand|bangkok|phuket/.test(x))return["Thailand",1.15,1.1,1.35,1.4,1.45,1.05];
 return[x||"Valfri destination",1,1,1,.8,1,1];
}
function days(){
 if(!q("#from").value||!q("#to").value)return 7;
 return Math.max(1,Math.round((new Date(q("#to").value)-new Date(q("#from").value))/86400000));
}
function month(){return q("#from").value?new Date(q("#from").value+"T00:00:00").getMonth()+1:new Date().getMonth()+1}
function season(p,m){
 let f=1, summer=[6,7,8].includes(m), winter=[12,1,2].includes(m);
 if(p[0]==="Thailand"&&winter)f+=.18;
 if(p[0]==="Florida"&&winter)f+=.12;
 if(p[0]==="Japan"&&[3,4,10,11].includes(m))f+=.08;
 if(summer&&p[4]>1.1)f+=.1;
 if(winter&&p[4]<.6)f-=.08;
 return f;
}
function reason(p){
 if(/Japan/i.test(p[0]))return"mycket starkt för kultur och upplevelser, men den långa resan och högre kostnaden kräver mer tid och budget.";
 if(/Kina/i.test(p[0]))return"starkt för kultur och stora upplevelser, men den långa resan gör budget och reslängd extra viktiga.";
 if(/Florida/i.test(p[0]))return"starkt för sol, familj och aktiviteter, men flyg och aktiviteter kan snabbt pressa budgeten.";
 if(/Frankfurt|Berlin|Paris|London|München|Munich/i.test(p[0]))return"starkt för kultur, mat och upplevelser med relativt kort restid, men svagare för sol och bad.";
 if(/Italien/i.test(p[0]))return"en bra kompromiss mellan kultur, mat, familj och avkoppling.";
 if(/Spanien/i.test(p[0]))return"flexibelt för sol, bad, familj och kultur och lättare att anpassa efter budget.";
 if(/Grekland/i.test(p[0]))return"särskilt starkt när sol, bad och avkoppling väger tungt.";
 if(/Thailand/i.test(p[0]))return"starkt för värme, bad, mat och natur, men den långa resan gör längre vistelser mer attraktiva.";
 return"kan fungera bra, men den exakta balansen beror på prisnivå, säsong och utbud.";
}
function candidates(base){
 const keys=base[6]>1.3?["spanien","grekland","italien"]:base[0]==="Japan"?["thailand","spanien","italien"]:["spanien","grekland","italien"];
 return [base,...keys.map(profile)].filter((p,i,a)=>a.findIndex(x=>x[0].toLowerCase()===p[0].toLowerCase())===i).slice(0,4);
}
function score(p,pri,n,b,d,m){
 let s=68;
 if(pri.includes("sol"))s+=p[4]*7;
 if(pri.includes("familj"))s+=p[2]*6;
 if(pri.includes("kultur"))s+=p[1]*6;
 if(pri.includes("natur"))s+=p[3]*5;
 if(pri.includes("kort"))s+=(1.5-p[5])*7;
 if(pri.includes("budget"))s+=(1.4-p[6])*8;
 let pp=b/n, pressure=p[6]*(d/7);
 if(pp<3000&&pressure>1.2)s-=10;
 if(pp>=5000&&pressure<1.5)s+=3;
 if(p[5]>1.3&&d<7)s-=7;
 if(p[5]>1.3&&d>=10)s+=4;
 return Math.min(97,Math.max(45,Math.round(s*season(p,m))));
}
q("#go").onclick=()=>{
 const input=q("#destination").value.trim()||"Valfri destination",base=profile(input),n=Math.max(1,+q("#people").value||1),b=Math.max(0,+q("#budget").value||10000),d=days(),m=month(),pri=[...document.querySelectorAll("#chips .active")].map(x=>x.dataset.v),out=q("#out");
 if(q("#from").value&&q("#to").value&&new Date(q("#to").value)<new Date(q("#from").value)){out.innerHTML='<div class="thinking"><h2>⚠️ Kontrollera datumen</h2><p>Hemresan måste ligga efter avresan.</p></div>';out.scrollIntoView({behavior:"smooth"});return}
 const names={sol:"sol & bad",familj:"familj",budget:"budget",kultur:"kultur",natur:"natur",kort:"kort restid"},pt=pri.length?pri.map(x=>names[x]).join(", "):"en balanserad resa";
 const list=candidates(base).map(p=>({p,s:score(p,pri,n,b,d,m)})).sort((a,z)=>z.s-a.s),best=list[0],pp=Math.round(b/n);
 let text=`<div class="thinking"><h2>🧠 ResAgent v0.9</h2><p><b>Min första bedömning:</b> Jag väger ihop ${n} resenärer, ${d} dagar, ${b.toLocaleString("sv-SE")} kr och era prioriteringar – ${pt}.</p><p><b>Budget:</b> ${b.toLocaleString("sv-SE")} kr totalt (${pp.toLocaleString("sv-SE")} kr/person).</p><p><b>Min starkaste kandidat:</b> ${esc(best.p[0])} – ${best.s}/100. ${reason(best.p)}</p></div>`;
 text+=`<article class="option"><span class="badge">🏆 MIN REKOMMENDATION · ${best.s}/100</span><h2>${esc(best.p[0])}</h2><p class="muted">Inte bara billigast – bäst total matchning mot era önskemål.</p><div class="break">${list.map((x,i)=>`<div><b>${i+1}. ${esc(x.p[0])}</b>Matchning: ${x.s}/100</div>`).join("")}</div><p><b>🎯 Vad vinner ni?</b> ${best.s>=85?"En mycket stark matchning mot era prioriteringar.":"En bra helhetslösning med rimliga kompromisser."}</p><p><b>⚖️ Vad offrar ni?</b> ${best.p[5]>1.3?"Mer restid och en större del av budgeten går till transport.":best.p[4]<.7&&pri.includes("sol")?"Sol och bad är den tydligaste svagheten.":best.p[6]>1.25?"Mindre budgetmarginal.":"Ingen enskild nackdel dominerar."}</p></article>`;
 [.86,1,1.14].forEach((m,i)=>{let total=Math.round(b*m/10)*10,ac=Math.round(total*.34/10)*10,tr=Math.round(total*.28/10)*10,food=Math.round(total*.2/10)*10,act=total-ac-tr-food;text+=`<article class="option"><span class="badge">${i===0?"🥇 BÄSTA PRISVÄRDE":i===1?"🥈 BÄST BALANS":"🥉 MEST UPPLEVELSE"}</span><h2>${esc(best.p[0])} – ${i===0?"smart budget":i===1?"balanserad":"mest upplevelse"}</h2><div class="price">${total.toLocaleString("sv-SE")} kr</div><p class="muted">${i===0?"Minimerar kostnaden.":i===1?"Min rekommenderade kompromiss.":"Ger mer utrymme för upplevelser och bekvämlighet."}</p><div class="break"><div><b>Boende</b>${ac.toLocaleString("sv-SE")} kr</div><div><b>Transport</b>${tr.toLocaleString("sv-SE")} kr</div><div><b>Mat</b>${food.toLocaleString("sv-SE")} kr</div><div><b>Aktiviteter</b>${act.toLocaleString("sv-SE")} kr</div></div>${total>b?`<div class="warn">⚠️ Över budget – detta är priset för mer komfort eller fler upplevelser.</div>`:`<div class="good">✓ Ryms inom budgeten.</div>`}</article>`});
 out.innerHTML=text;out.scrollIntoView({behavior:"smooth"});
};