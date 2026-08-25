const toast = document.getElementById('toast');
const input = document.querySelector('.placeholder');
const cards = document.querySelectorAll('.card');

function showToast(message){
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=>toast.classList.remove('show'), 2400);
}

cards.forEach(card => {
  card.addEventListener('click', () => {
    cards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    input.textContent = card.dataset.prompt;
    showToast('Inspiration vald — fyll gärna i detaljerna.');
  });
});

document.getElementById('createBtn').addEventListener('click', () => {
  const from = document.getElementById('fromDate').value;
  const to = document.getElementById('toDate').value;
  if(!input.textContent.trim() || input.textContent === 'Beskriv din resa...'){
    showToast('Beskriv först vilken resa du vill skapa.');
    return;
  }
  if(from && to && new Date(to) < new Date(from)){
    showToast('Till-datumet kan inte vara före från-datumet.');
    return;
  }
  showToast('Din resa är redo att börja skapas.');
});
