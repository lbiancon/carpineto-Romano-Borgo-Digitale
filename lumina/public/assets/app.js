document.querySelectorAll('form[data-confirm]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    const message = form.getAttribute('data-confirm');
    if (message && !window.confirm(message)) {
      event.preventDefault();
    }
  });
});

document.querySelectorAll('select[data-submit]').forEach((select) => {
  select.addEventListener('change', () => {
    if (select.form) {
      select.form.submit();
    }
  });
});

const summary = document.querySelector('[data-slot-summary]');
const slotField = document.querySelector('#prenota input[name="slot"]');
document.querySelectorAll('input[type="radio"][name="slot"]').forEach((input) => {
  input.addEventListener('change', () => {
    const card = input.closest('.slot');
    if (summary && card) {
      summary.textContent = card.getAttribute('data-label') || 'Orario selezionato';
    }
    if (slotField) slotField.value = input.value;
  });
});
const prenota = document.querySelector('#prenota');
if (prenota) {
  prenota.addEventListener('submit', (event) => {
    if (!slotField || slotField.value === '') {
      event.preventDefault();
      if (summary) summary.textContent = 'Scegli un orario nella lista.';
    }
  });
}
