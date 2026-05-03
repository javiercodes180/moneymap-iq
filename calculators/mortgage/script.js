let loanTerm = 30;
let myChart = null;
let donutChart = null;
let chartType = 'bar';
let calculatedResults = null;
let taxMode = 'estimate';
let insMode = 'estimate';
let closingPctMode = 'estimate';
let zipEstimates = null;

const zipData = {
  '9': { rate: 7.1, taxRate: 1.1, insurance: 1800, closingPct: 2.5 },
  '1': { rate: 7.2, taxRate: 1.7, insurance: 1600, closingPct: 3.0 },
  '7': { rate: 6.9, taxRate: 1.8, insurance: 2200, closingPct: 2.8 },
  '3': { rate: 7.0, taxRate: 0.9, insurance: 2800, closingPct: 3.2 },
  'default': { rate: 7.0, taxRate: 1.2, insurance: 1500, closingPct: 3.0 }
};

// ─── PMI SECTION TOGGLE ───────────────────────────────────
function showPMISection() {
  document.getElementById('pmiExplainer').style.display = 'block';
  document.getElementById('pmiExplainer').scrollIntoView({ behavior: 'smooth' });
}

function togglePMISection() {
  const section = document.getElementById('pmiExplainer');
  const isVisible = section.style.display !== 'none';
  section.style.display = isVisible ? 'none' : 'block';
}

// ─── CLOSING LEARN MORE ───────────────────────────────────
function toggleClosingLearnMore() {
  const section = document.getElementById('closingLearnMore');
  const btn = document.getElementById('closingLearnMoreBtn');
  const isVisible = section.style.display !== 'none';
  section.style.display = isVisible ? 'none' : 'block';
  btn.textContent = isVisible ? '📖 Learn more about closing costs' : '📖 Hide closing costs info';
}

// ─── CLOSING COST % MODE ──────────────────────────────────
function setClosingPct(mode, e) {
  closingPctMode = mode;
  document.querySelectorAll('.closing-pct-btn').forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');
  document.getElementById('customClosingPct').style.display = mode === 'custom' ? 'block' : 'none';
  updateClosingLabels();
  if (calculatedResults) recalcClosing();
}

function updateClosingLabels() {
  if (closingPctMode === 'custom') {
    document.getElementById('closingLowLabel').textContent = 'Closing Costs';
    document.getElementById('totalCashLowLabel').textContent = 'Total Cash Needed at Close';
    document.getElementById('closingHighBox').style.display = 'none';
    document.getElementById('totalCashHighBox').style.display = 'none';
  } else {
    document.getElementById('closingLowLabel').textContent = 'Closing Costs (Low Est.)';
    document.getElementById('totalCashLowLabel').textContent = 'Total Cash Needed at Close (Low)';
    document.getElementById('closingHighBox').style.display = 'block';
    document.getElementById('totalCashHighBox').style.display = 'block';
  }
}

function recalcClosing() {
  if (!calculatedResults) return;
  const homePrice = calculatedResults.homePrice;
  const downPayment = calculatedResults.downPayment;
  let closingLow, closingHigh;

  if (closingPctMode === 'custom') {
    const pct = getRaw('closingPctInput');
    if (isNaN(pct) || pct === 0) return;
    closingLow = homePrice * (pct / 100);
    closingHigh = closingLow;
  } else {
    const closingPct = zipEstimates ? zipEstimates.closingPct : 3.0;
    closingLow = homePrice * ((closingPct - 0.5) / 100);
    closingHigh = homePrice * ((closingPct + 0.5) / 100);
  }

  document.getElementById('closingLow').textContent = formatMoney(closingLow);
  document.getElementById('closingHigh').textContent = formatMoney(closingHigh);
  document.getElementById('totalCashLow').textContent = formatMoney(downPayment + closingLow);
  document.getElementById('totalCashHigh').textContent = formatMoney(downPayment + closingHigh);
  updateClosingLabels();

  calculatedResults.closingLow = closingLow;
  calculatedResults.closingHigh = closingHigh;
  calculatedResults.totalCashLow = downPayment + closingLow;
  calculatedResults.totalCashHigh = downPayment + closingHigh;
}

// ─── ZIP CODE ─────────────────────────────────────────────
function handleZipInput(input) {
  const zip = input.value.replace(/[^0-9]/g, '');
  input.value = zip;
  const status = document.getElementById('zipStatus');
  if (zip.length === 5) {
    status.textContent = '✅ Estimates loaded!';
    status.style.color = '#14B8A6';
    loadZipEstimates(zip);
  } else {
    status.textContent = '';
    document.getElementById('zipEstimates').style.display = 'none';
  }
}

function loadZipEstimates(zip) {
  const firstDigit = zip.charAt(0);
  const data = zipData[firstDigit] || zipData['default'];
  zipEstimates = data;
  document.getElementById('estRate').textContent = data.rate + '%';
  document.getElementById('estTax').textContent = data.taxRate + '% of home value/yr';
  document.getElementById('estInsurance').textContent = '$' + data.insurance.toLocaleString() + '/yr';
  document.getElementById('zipEstimates').style.display = 'flex';
  const rateEl = document.getElementById('interestRate');
  rateEl.value = data.rate + '%';
  rateEl.dataset.raw = data.rate;
  document.getElementById('rateHint').textContent = `Estimated rate for your area: ${data.rate}%. You can edit this anytime.`;
  updateTaxEstimate();
  updateInsEstimate();
}

function setTaxMode(mode, e) {
  taxMode = mode;
  document.querySelectorAll('.tax-btn').forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');
  document.getElementById('taxEstimateMode').style.display = mode === 'estimate' ? 'block' : 'none';
  document.getElementById('taxPercentMode').style.display = mode === 'percent' ? 'block' : 'none';
  document.getElementById('taxDollarMode').style.display = mode === 'dollar' ? 'block' : 'none';
}

function updateTaxEstimate() {
  const homePrice = getRaw('homePrice');
  if (!zipEstimates || isNaN(homePrice) || homePrice === 0) return;
  const annualTax = homePrice * (zipEstimates.taxRate / 100);
  document.getElementById('taxEstimateDisplay').textContent = '$' + Math.round(annualTax).toLocaleString() + '/yr (' + zipEstimates.taxRate + '% of home value)';
}

function setInsMode(mode, e) {
  insMode = mode;
  document.querySelectorAll('.ins-btn').forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');
  document.getElementById('insEstimateMode').style.display = mode === 'estimate' ? 'block' : 'none';
  document.getElementById('insDollarMode').style.display = mode === 'dollar' ? 'block' : 'none';
}

function updateInsEstimate() {
  if (!zipEstimates) return;
  document.getElementById('insEstimateDisplay').textContent = '$' + zipEstimates.insurance.toLocaleString() + '/yr (estimated for your area)';
}

function setTerm(years, e) {
  loanTerm = years;
  document.querySelectorAll('.term-btn').forEach(btn => btn.classList.remove('active'));
  e.target.closest('.term-btn').classList.add('active');
}

// ─── DOWN PAYMENT ─────────────────────────────────────────
function setDownPercent(percent) {
  const homePrice = getRaw('homePrice');
  if (isNaN(homePrice) || homePrice === 0) { alert('Please enter a home price first!'); return; }
  const downAmount = homePrice * (percent / 100);
  const dollarEl = document.getElementById('downPayment');
  dollarEl.dataset.raw = Math.round(downAmount);
  dollarEl.value = '$' + Math.round(downAmount).toLocaleString('en-US');
  const percentEl = document.getElementById('downPercent');
  percentEl.dataset.raw = percent;
  percentEl.value = percent + '%';
  updateDownBadge(percent);
}

function syncDownFromDollar() {
  const homePrice = getRaw('homePrice');
  const downPayment = getRaw('downPayment');
  if (!isNaN(homePrice) && homePrice > 0 && !isNaN(downPayment)) {
    const percent = ((downPayment / homePrice) * 100).toFixed(1);
    const percentEl = document.getElementById('downPercent');
    percentEl.dataset.raw = percent;
    percentEl.value = percent + '%';
    updateDownBadge(percent);
  }
}

function syncDownFromPercent(input) {
  let raw = input.value.replace(/[^0-9.]/g, '');
  input.dataset.raw = raw;
  if (raw === '') { input.value = ''; return; }
  input.value = raw + '%';
  const homePrice = getRaw('homePrice');
  if (!isNaN(homePrice) && homePrice > 0) {
    const downAmount = homePrice * (parseFloat(raw) / 100);
    const dollarEl = document.getElementById('downPayment');
    dollarEl.dataset.raw = Math.round(downAmount);
    dollarEl.value = '$' + Math.round(downAmount).toLocaleString('en-US');
    updateDownBadge(raw);
  }
  setTimeout(() => { input.setSelectionRange(input.value.length - 1, input.value.length - 1); }, 0);
}

function updateDownBadge(percent) {
  document.getElementById('downPercentBadge').textContent = parseFloat(percent).toFixed(1) + '%';
}

function updateDownPercent() { syncDownFromDollar(); }

// ─── FORMAT ───────────────────────────────────────────────
function formatInput(input) {
  let raw = input.value.replace(/[^0-9]/g, '');
  if (raw === '') { input.value = ''; return; }
  input.dataset.raw = raw;
  input.value = '$' + Number(raw).toLocaleString('en-US');
}

function formatPercent(input) {
  let raw = input.value.replace(/[^0-9.]/g, '');
  input.dataset.raw = raw;
  if (raw === '') { input.value = ''; return; }
  input.value = raw + '%';
  setTimeout(() => { input.setSelectionRange(input.value.length - 1, input.value.length - 1); }, 0);
}

function getRaw(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const raw = el.dataset.raw || el.value.replace(/[^0-9.]/g, '');
  return parseFloat(raw);
}

function getAnnualTax() {
  const homePrice = getRaw('homePrice');
  if (taxMode === 'estimate') return zipEstimates ? homePrice * (zipEstimates.taxRate / 100) : homePrice * 0.012;
  else if (taxMode === 'percent') return homePrice * (getRaw('taxPercent') / 100);
  else return getRaw('propertyTax') || 0;
}

function getAnnualInsurance() {
  if (insMode === 'estimate') return zipEstimates ? zipEstimates.insurance : 1500;
  return getRaw('insurance') || 0;
}

// ─── ANIMATED COUNTER ─────────────────────────────────────
function animateCounter(elementId, targetValue) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const duration = 1500;
  const steps = 60;
  const increment = targetValue / steps;
  let current = 0;
  let step = 0;
  const timer = setInterval(() => {
    step++;
    current = step === steps ? targetValue : current + increment;
    el.textContent = formatMoney(current);
    if (step >= steps) clearInterval(timer);
  }, duration / steps);
}

// ─── MAIN CALCULATE ───────────────────────────────────────
function calculate() {
  const homePrice = getRaw('homePrice');
  const rawDownPayment = getRaw('downPayment') || 0;
  const downPayment = Math.min(Math.max(rawDownPayment, 0), homePrice || 0);
  const rawInterestRate = getRaw('interestRate');
  const loanAmount = Math.max(homePrice - downPayment, 0);
  const interestRate = loanAmount === 0 && isNaN(rawInterestRate) ? 0 : rawInterestRate;
  const propertyTax = getAnnualTax();
  const insurance = getAnnualInsurance();

  if (isNaN(homePrice) || isNaN(interestRate)) { alert('Please fill in Home Price and Interest Rate!'); return; }

  const monthlyRate = interestRate / 100 / 12;
  const numPayments = loanTerm * 12;

  let monthlyPI = 0;
  if (loanAmount === 0) monthlyPI = 0;
  else if (monthlyRate === 0) monthlyPI = loanAmount / numPayments;
  else monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);

  const monthlyTax = propertyTax / 12;
  const monthlyInsurance = insurance / 12;
  const downPercent = (downPayment / homePrice) * 100;
  const monthlyPMI = loanAmount > 0 && downPercent < 20 ? (loanAmount * 0.005) / 12 : 0;
  const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI;
  const totalPaid = monthlyPI * numPayments;
  const totalInterest = totalPaid - loanAmount;
  const totalCost = homePrice + totalInterest + (propertyTax * loanTerm) + (insurance * loanTerm);

  const closingPct = zipEstimates ? zipEstimates.closingPct : 3.0;
  let closingLow, closingHigh;
  if (closingPctMode === 'custom') {
    const pct = getRaw('closingPctInput');
    closingLow = homePrice * ((pct || 3) / 100);
    closingHigh = closingLow;
  } else {
    closingLow = homePrice * ((closingPct - 0.5) / 100);
    closingHigh = homePrice * ((closingPct + 0.5) / 100);
  }
  const totalCashLow = downPayment + closingLow;
  const totalCashHigh = downPayment + closingHigh;

  calculatedResults = {
    homePrice, downPayment, loanAmount, monthlyPI,
    monthlyTax, monthlyInsurance, monthlyPMI,
    totalMonthly, totalInterest, totalCost,
    closingLow, closingHigh, totalCashLow, totalCashHigh,
    interestRate, loanTerm, downPercent, propertyTax, insurance
  };

  updateClosingLabels();
  document.getElementById('resultsSection').style.display = 'block';

  // Animate main numbers
  animateCounter('totalMonthly', totalMonthly);
  animateCounter('principalInterest', monthlyPI);
  animateCounter('monthlyTax', monthlyTax);
  animateCounter('monthlyInsurance', monthlyInsurance);
  animateCounter('loanAmount', loanAmount);
  animateCounter('totalInterest', totalInterest);
  animateCounter('totalCost', totalCost);
  animateCounter('downPaymentDisplay', downPayment);

  // Closing — set directly to avoid ghost bug
  document.getElementById('closingLow').textContent = formatMoney(closingLow);
  document.getElementById('closingHigh').textContent = formatMoney(closingHigh);
  document.getElementById('totalCashLow').textContent = formatMoney(totalCashLow);
  document.getElementById('totalCashHigh').textContent = formatMoney(totalCashHigh);

  // PMI — show box first, THEN animate
  if (monthlyPMI > 0) {
    document.getElementById('pmiBox').style.display = 'block';
    document.getElementById('pmiExplainer').style.display = 'block';
    // Small delay so element is visible before animation starts
    setTimeout(() => { animateCounter('monthlyPMI', monthlyPMI); }, 50);
  } else {
    document.getElementById('pmiBox').style.display = 'none';
    document.getElementById('pmiExplainer').style.display = 'none';
  }

  generateSummary(calculatedResults);
  drawDonutChart(monthlyPI, monthlyTax, monthlyInsurance, monthlyPMI, totalMonthly);
  drawMainChart();
  buildAmortization(loanAmount, monthlyRate, numPayments, monthlyPI);
  if (window.matchMedia('(max-width: 1120px)').matches) {
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ─── SUMMARY ──────────────────────────────────────────────
function generateSummary(r) {
  const summaryBox = document.getElementById('summaryBox');
  const downPct = r.downPercent.toFixed(0);
  const pmiNote = r.monthlyPMI > 0
    ? ` Since your down payment is under 20%, PMI of <strong>${formatMoney(r.monthlyPMI)}/month</strong> is added — <a href="#pmiExplainer" onclick="showPMISection()" style="color:#a78bfa">learn more about PMI</a>.`
    : ' No PMI required — great down payment! ✅';

  summaryBox.innerHTML = `Based on a <strong>${formatMoney(r.homePrice)}</strong> home with <strong>${formatMoney(r.downPayment)}</strong> down (<strong>${downPct}%</strong>), your estimated monthly payment is <strong>${formatMoney(r.totalMonthly)}</strong> over <strong>${r.loanTerm} years</strong> at <strong>${r.interestRate}% interest</strong>. Over the life of the loan you'll pay <strong>${formatMoney(r.totalInterest)}</strong> in interest — making the true cost of your home <strong>${formatMoney(r.totalCost)}</strong>.${pmiNote}`;
}

// ─── DONUT CHART ──────────────────────────────────────────
function drawDonutChart(monthlyPI, monthlyTax, monthlyInsurance, monthlyPMI, totalMonthly) {
  if (donutChart) donutChart.destroy();
  const ctx = document.getElementById('donutChart').getContext('2d');

  const labels = ['Principal & Interest', 'Property Tax', 'Insurance'];
  const data = [monthlyPI, monthlyTax, monthlyInsurance];
  const colors = ['#7C3AED', '#EC4899', '#14B8A6'];

  if (monthlyPMI > 0) {
    labels.push('PMI');
    data.push(monthlyPMI);
    colors.push('#2563EB');
  }

  donutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverBorderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              const pct = ((value / totalMonthly) * 100).toFixed(1);
              return ` ${formatMoney(value)} (${pct}%)`;
            }
          }
        }
      }
    }
  });

  // Center label
  const centerEl = document.getElementById('donutCenter');
  centerEl.innerHTML = `
    <span class="donut-center-amount">${formatMoney(totalMonthly)}</span>
    <span class="donut-center-label">per month</span>
  `;

  // Custom white legend
  const legendEl = document.getElementById('donutLegend');
  legendEl.innerHTML = '';
  labels.forEach((label, i) => {
    const value = data[i];
    const pct = ((value / totalMonthly) * 100).toFixed(0);
    legendEl.innerHTML += `
      <div class="donut-legend-item">
        <div class="donut-legend-dot" style="background:${colors[i]}"></div>
        <span class="donut-legend-text">${label}</span>
        <span class="donut-legend-value">${formatMoney(value)} (${pct}%)</span>
      </div>
    `;
  });
}

// ─── MAIN CHART ───────────────────────────────────────────
function drawMainChart() {
  if (myChart) myChart.destroy();
  const ctx = document.getElementById('myChart').getContext('2d');
  const monthlyRate = calculatedResults.interestRate / 100 / 12;

  if (chartType === 'bar') {
    const years = [], principalData = [], interestData = [];
    let balance = calculatedResults.loanAmount;
    for (let year = 1; year <= loanTerm; year++) {
      let yP = 0, yI = 0;
      for (let month = 1; month <= 12; month++) {
        if ((year - 1) * 12 + month > loanTerm * 12) break;
        const interest = balance * monthlyRate;
        const principal = calculatedResults.monthlyPI - interest;
        yI += interest; yP += principal;
        balance = Math.max(balance - principal, 0);
      }
      years.push('Yr ' + year);
      principalData.push(yP.toFixed(2));
      interestData.push(yI.toFixed(2));
    }
    myChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [
          { label: 'Principal', data: principalData, backgroundColor: '#7C3AED88', borderColor: '#7C3AED', borderWidth: 1 },
          { label: 'Interest', data: interestData, backgroundColor: '#EC489988', borderColor: '#EC4899', borderWidth: 1 }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#0D1B2A', font: { family: 'Inter' } } } },
        scales: {
          x: { stacked: true, ticks: { color: '#64748b', font: { family: 'Inter' } }, grid: { color: '#e8eaf0' } },
          y: { stacked: true, ticks: { color: '#64748b', font: { family: 'Inter' }, callback: v => '$' + Number(v).toLocaleString() }, grid: { color: '#e8eaf0' } }
        }
      }
    });
  } else {
    const years = [], balanceData = [];
    let balance = calculatedResults.loanAmount;
    for (let year = 1; year <= loanTerm; year++) {
      for (let month = 1; month <= 12; month++) {
        if ((year - 1) * 12 + month > loanTerm * 12) break;
        const interest = balance * monthlyRate;
        const principal = calculatedResults.monthlyPI - interest;
        balance = Math.max(balance - principal, 0);
      }
      years.push('Yr ' + year);
      balanceData.push(balance.toFixed(2));
    }
    myChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: years,
        datasets: [{
          label: 'Remaining Balance', data: balanceData,
          borderColor: '#7C3AED', backgroundColor: '#7C3AED15',
          borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#0D1B2A', font: { family: 'Inter' } } } },
        scales: {
          x: { ticks: { color: '#64748b', font: { family: 'Inter' } }, grid: { color: '#e8eaf0' } },
          y: { ticks: { color: '#64748b', font: { family: 'Inter' }, callback: v => '$' + Number(v).toLocaleString() }, grid: { color: '#e8eaf0' } }
        }
      }
    });
  }
}

function switchChart(type, e) {
  chartType = type;
  document.querySelectorAll('.chart-btn').forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');
  if (calculatedResults) drawMainChart();
}

// ─── AMORTIZATION TABLE ───────────────────────────────────
function buildAmortization(loanAmount, monthlyRate, numPayments, monthlyPI) {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';
  let balance = loanAmount;
  for (let year = 1; year <= loanTerm; year++) {
    let yP = 0, yI = 0;
    for (let month = 1; month <= 12; month++) {
      if ((year - 1) * 12 + month > numPayments) break;
      const iP = balance * monthlyRate;
      const pP = monthlyPI - iP;
      yI += iP; yP += pP; balance -= pP;
    }
    if (balance < 0) balance = 0;
    const row = document.createElement('tr');
    row.innerHTML = `<td>Year ${year}</td><td>${formatMoney(yP)}</td><td>${formatMoney(yI)}</td><td>${formatMoney(Math.max(balance, 0))}</td>`;
    tbody.appendChild(row);
  }
}

function shareResults() {
  if (!calculatedResults) return;
  const r = calculatedResults;
  const text = `🏠 Mortgage Calculator — MoneyMap IQ\n\n• Home Price: ${formatMoney(r.homePrice)}\n• Down Payment: ${formatMoney(r.downPayment)} (${r.downPercent.toFixed(0)}%)\n• Loan Amount: ${formatMoney(r.loanAmount)}\n• Monthly Payment: ${formatMoney(r.totalMonthly)}\n• Total Interest Paid: ${formatMoney(r.totalInterest)}\n• Total Cash to Close: ${formatMoney(r.totalCashLow)} – ${formatMoney(r.totalCashHigh)}\n\nTry it yourself: https://moneymap-iq.vercel.app/calculators/mortgage/`;
  navigator.clipboard.writeText(text).then(() => { alert('✅ Results copied! Paste anywhere to share.'); });
}

function formatMoney(amount) {
  if (isNaN(amount)) return '$0.00';
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
