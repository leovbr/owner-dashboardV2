const PRODUCTS = [
  ['1 potong ayam original', 8000],
  ['1 ayam spicy tanpa nasi', 11000],
  ['1 ayam spicy pakai nasi', 13000],
  ['1 ayam geprek tanpa nasi', 11000],
  ['1 ayam geprek pakai nasi', 13000],
  ['1 jamur crispy', 5000],
  ['1 tusuk bakso', 1000],
  ['1 sambal geprek saja', 3000],
  ['1 nasi saja', 3000],
  ['1 cup usus ayam', 5000],
  ['1 hati rampela', 5000]
];

const STORAGE_KEY = 'owner_dashboard_reports_v1';
const $ = id => document.getElementById(id);
const money = value => 'Rp' + Math.round(Number(value) || 0).toLocaleString('id-ID');

function today() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function getReports() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function saveReports(reports) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

function renderSales() {
  $('salesList').innerHTML = PRODUCTS.map((product, i) => `
    <div class="sale-row">
      <div>
        <div class="sale-name">${product[0]}</div>
        <div class="sale-price">${money(product[1])} / pcs</div>
      </div>
      <input class="qty-input" data-index="${i}" type="number" min="0" step="1" value="0" inputmode="numeric" aria-label="Jumlah ${product[0]}">
      <div class="row-total" id="rowTotal-${i}">${money(0)}</div>
    </div>`).join('');

  document.querySelectorAll('.qty-input').forEach(input => input.addEventListener('input', calculate));
}

function renderExpenses(expenses = []) {
  const list = $('expenseList');
  list.innerHTML = '';
  if (!expenses.length) addExpenseRow();
  else expenses.forEach(item => addExpenseRow(item.name, item.amount));
}

function addExpenseRow(name = '', amount = '') {
  const row = document.createElement('div');
  row.className = 'expense-row';
  row.innerHTML = `
    <input class="expense-input expense-name" type="text" placeholder="Contoh: bahan / transport" value="${escapeHtml(name)}">
    <input class="expense-input expense-amount" type="number" min="0" step="100" placeholder="Rp0" value="${amount || ''}" inputmode="numeric">
    <button class="expense-remove" type="button" title="Hapus">×</button>`;
  row.querySelectorAll('input').forEach(input => input.addEventListener('input', calculate));
  row.querySelector('.expense-remove').addEventListener('click', () => {
    row.remove();
    if (!document.querySelector('.expense-row')) addExpenseRow();
    calculate();
  });
  $('expenseList').appendChild(row);
}

function calculate() {
  let income = 0;
  document.querySelectorAll('.qty-input').forEach((input, i) => {
    const qty = Math.max(0, Number(input.value) || 0);
    const total = qty * PRODUCTS[i][1];
    income += total;
    const target = $(`rowTotal-${i}`);
    if (target) target.textContent = money(total);
  });

  let expenses = 0;
  document.querySelectorAll('.expense-amount').forEach(input => expenses += Math.max(0, Number(input.value) || 0));
  $('incomeTotal').textContent = money(income);
  $('expenseTotal').textContent = money(expenses);
  $('profitTotal').textContent = money(income - expenses);
  return { income, expenses, profit: income - expenses };
}

function getFormData() {
  const totals = calculate();
  return {
    date: $('reportDate').value || today(),
    sales: PRODUCTS.map((product, i) => ({ name: product[0], price: product[1], qty: Math.max(0, Number(document.querySelector(`[data-index="${i}"]`).value) || 0) })),
    expenses: [...document.querySelectorAll('.expense-row')].map(row => ({
      name: row.querySelector('.expense-name').value.trim(),
      amount: Math.max(0, Number(row.querySelector('.expense-amount').value) || 0)
    })).filter(x => x.name || x.amount),
    ...totals,
    updatedAt: new Date().toISOString()
  };
}

function loadForm(report) {
  $('reportDate').value = report.date || today();
  document.querySelectorAll('.qty-input').forEach((input, i) => input.value = report.sales?.[i]?.qty || 0);
  renderExpenses(report.expenses || []);
  calculate();
}

function saveReport() {
  const data = getFormData();
  const reports = getReports();
  reports[data.date] = data;
  saveReports(reports);
  renderHistory();
  alert(`Laporan ${data.date} berhasil disimpan.`);
}

function openReport(date) {
  const report = getReports()[date];
  if (!report) return;
  loadForm(report);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteReport(date) {
  const reports = getReports();
  if (!reports[date]) return;
  if (!confirm(`Hapus laporan ${date}?`)) return;
  delete reports[date];
  saveReports(reports);
  renderHistory();
}

function renderHistory() {
  const reports = getReports();
  const entries = Object.values(reports).sort((a, b) => b.date.localeCompare(a.date));
  const list = $('historyList');
  if (!entries.length) {
    list.innerHTML = '<div class="history-empty">Belum ada laporan tersimpan.</div>';
    return;
  }
  list.innerHTML = entries.map(report => `
    <div class="history-item">
      <div>
        <div class="history-date">${formatDate(report.date)}</div>
        <div class="sale-price">Pendapatan ${money(report.income)} · Pengeluaran ${money(report.expenses)}</div>
      </div>
      <div class="history-actions">
        <span class="history-profit">${money(report.profit)}</span>
        <button type="button" data-open="${report.date}">Buka</button>
        <button type="button" data-delete="${report.date}">Hapus</button>
      </div>
    </div>`).join('');

  list.querySelectorAll('[data-open]').forEach(btn => btn.addEventListener('click', () => openReport(btn.dataset.open)));
  list.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => deleteReport(btn.dataset.delete)));
}

function resetForm() {
  $('reportDate').value = today();
  document.querySelectorAll('.qty-input').forEach(input => input.value = 0);
  renderExpenses();
  calculate();
}

function clearHistory() {
  if (!Object.keys(getReports()).length) return;
  if (!confirm('Hapus semua riwayat laporan?')) return;
  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
}

function formatDate(date) {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(`${date}T00:00:00`));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}

$('reportDate').value = today();
renderSales();
renderExpenses();
renderHistory();
calculate();

$('addExpense').addEventListener('click', () => addExpenseRow());
$('saveReport').addEventListener('click', saveReport);
$('clearForm').addEventListener('click', resetForm);
$('clearHistory').addEventListener('click', clearHistory);
$('reportDate').addEventListener('change', () => {
  const report = getReports()[$('reportDate').value];
  if (report) loadForm(report);
});
