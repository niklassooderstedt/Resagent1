const $ = id => document.getElementById(id);

document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => chip.classList.toggle("active"));
});

function daysBetween(a,b){
  const d1 = new Date(a), d2 = new Date(b);
  return Math.max(1, Math.round((d2-d1)/86400000));
}
function money(n){ return Math.round(n).toLocaleString("sv-SE") + " kr"; }

function destinationProfile(raw){
  const s = raw.toLowerCase();
  if (s.includes("japan")) return {
    name:"Japan", regions:["Tokyo","Hakone / Fuji","Kyoto","Osaka"],
    family:"Tokyo + Kyoto ger mycket att göra för både vuxna och barn.",
    beach:"Okinawa kan läggas till om sol & bad väger tungt.",
    experience:"Mat, kultur, tåg och Mount Fuji ger hög upplevelsetäthet."
  };
  if (s.includes("kina") || s.includes("kinamuren") || s.includes("beijing") || s.includes("peking")) return {
    name:"Kina", regions:["Beijing","Kinesiska muren","Xi'an","Shanghai"],
    family:"Beijing och muren ger en tydlig familjevänlig kombination av historia och upplevelser.",
    beach:"Kustdagar kan läggas till, men destinationen är främst upplevelse- och kulturdriven.",
    experience:"Kinesiska muren blir en naturlig huvudpunkt och kan kombineras med flera städer."
  };
  if (s.includes("florida") || s.includes("orlando")) return {
    name:"Florida", regions:["Orlando","Clearwater / Gulf Coast","Miami"],
    family:"Disney och andra parker gör Florida särskilt lätt att anpassa för familjer.",
    beach:"Gulf Coast ger en naturlig stranddel.",
    experience:"Parker + strand ger tydlig variation."
  };
  return {
    name:raw || "vald destination",
    regions:[raw || "Huvuddestination","Närliggande område","Alternativ ort"],
    family:"Jag skulle balansera aktiviteter med rimliga resdagar.",
    beach:"Om destinationen har kust kan några stranddagar prioriteras.",
    experience:"Jag skulle bygga resan kring de mest intressanta platserna i och runt destinationen."
  };
}

function buildPlan(profile, days, travelers, budget, priorities, mode){
  const peopleFactor = Math.max(1, travelers/3);
  let share = mode===1 ? .94 : mode===2 ? 1.04 : .78;
  let estimate = budget * share;
  const enough = estimate <= budget;
  let regions = profile.regions;
  let title = mode===1 ? `${profile.name} – balanserad familjeresa`
             : mode===2 ? `${profile.name} – maxa upplevelserna`
             : `${profile.name} – smart på budget`;

  let nights = Math.max(1, Math.round(days/Math.max(1, regions.length)));
  let list = [];
  if(mode===1){
    list = [`${Math.min(4,Math.max(2,nights))} nätter ${regions[0]}`, `${Math.min(3,Math.max(1,nights))} nätter ${regions[1]}`,
            `${Math.min(4,Math.max(2,nights))} nätter ${regions[2]}`, `${Math.max(1,days-9)} lugnare dagar / flexibel del`];
  } else if(mode===2){
    list = [`${regions[0]} – huvudupplevelser`, `${regions[1]} – utflykt / natur`, `${regions[2]} – mat, kultur och stad`, `Extra stopp om tid och budget tillåter`];
  } else {
    list = [`Färre hotellbyten`, `Längre vistelse på ${regions[0]}`, `En större utflykt till ${regions[1]}`, `Flexibla dagar utan dyra bokningar`];
  }

  let text = enough ? "Upplägget håller sig nära er budget och lämnar viss marginal."
                    : "Det här upplägget pressar budgeten; jag skulle justera boende, restempo eller antal dagar.";
  if(priorities.includes("sol") && profile.beach) text += " " + profile.beach;
  if(priorities.includes("familj")) text += " " + profile.family;

  return {title, estimate, text, list};
}

$("analyze").addEventListener("click", () => {
  const destination = $("destination").value.trim();
  const from = $("from").value, to = $("to").value;
  const travelers = Number($("travelers").value) || 1;
  const budget = Number($("budget").value) || 0;
  const days = daysBetween(from,to);
  const priorities = [...document.querySelectorAll(".chip.active")].map(x=>x.dataset.priority);
  const p = destinationProfile(destination);

  $("result").classList.remove("hidden");
  $("resultTitle").textContent = `${p.name} – ${days} dagar`;
  $("reasoning").textContent =
    `Jag har vägt ihop ${travelers} resenärer, ${money(budget)} i totalbudget och era prioriteringar. ` +
    `Jag försöker framför allt skapa en resa med bra balans mellan upplevelser, restid och kostnad.`;

  $("insights").innerHTML =
    `<strong>🧠 ResAgent tänker så här</strong>` +
    `<p>Huvudspår: ${p.regions.slice(0,3).join(" → ")}.</p>` +
    `<p>${p.experience}</p>` +
    `<p>${p.family}</p>`;

  const plans = [
    buildPlan(p,days,travelers,budget,priorities,1),
    buildPlan(p,days,travelers,budget,priorities,2),
    buildPlan(p,days,travelers,budget,priorities,3)
  ];

  plans.forEach((plan,i)=>{
    const n=i+1;
    $(`plan${n}Title`).textContent=plan.title;
    $(`plan${n}Price`).textContent=money(plan.estimate);
    $(`plan${n}Text`).textContent=plan.text;
    $(`plan${n}List`).innerHTML=plan.list.map(x=>`<li>${x}</li>`).join("");
  });

  $("result").scrollIntoView({behavior:"smooth", block:"start"});
});
