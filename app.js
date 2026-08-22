const $=id=>document.getElementById(id);
document.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>b.classList.toggle('active')));

$('startBtn').addEventListener('click',()=>{
  $('start').classList.add('hidden'); $('work').classList.remove('hidden'); $('worklog').innerHTML='';
  const tasks=['Tolkar era önskemål','Jämför destinationer och flygalternativ','Söker familjevänliga boenden','Kontrollerar transport och one-way','Räknar totalbudget','Väger alternativen mot era prioriteringar','Försöker förbättra bästa resultatet'];
  let i=0;
  const timer=setInterval(()=>{
    if(i>0)$('worklog').lastElementChild.classList.add('done');
    if(i<tasks.length){const d=document.createElement('div');d.className='log';d.textContent='✦ '+tasks[i]+' …';$('worklog').appendChild(d);i++}
    else{clearInterval(timer);$('worklog').lastElementChild.classList.add('done');setTimeout(()=>{$('work').classList.add('hidden');$('results').classList.remove('hidden');window.scrollTo(0,0)},500)}
  },600);
});

document.querySelectorAll('.details').forEach(b=>b.addEventListener('click',()=>{$('results').classList.add('hidden');$('detail').classList.remove('hidden');window.scrollTo(0,0)}));
$('backBtn').addEventListener('click',()=>{$('detail').classList.add('hidden');$('results').classList.remove('hidden');window.scrollTo(0,0)});
$('changeBtn').addEventListener('click',()=>{
  const v=$('change').value.trim();
  $('reply').textContent=v?'🧠 Jag skulle nu räkna om hela resan utifrån: “'+v+'”. Nästa steg är att koppla denna funktion till riktig AI och live-data.':'Skriv vad du vill ändra först.';
});
