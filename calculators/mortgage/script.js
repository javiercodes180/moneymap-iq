let loanTerm = 30;
let myChart = null;
let donutChart = null;
let chartType = 'bar';
let calculatedResults = null;
let taxMode = 'estimate';
let insMode = 'estimate';
let zipEstimates = null;

// ─── REGIONAL RATE DATABASE ───────────────────────────────
const zipData = {
  // California
  '9': { rate: 7.1, taxRate: 1.1, insurance: 1800 },
  // New York
  '1': { rate: 7.2, taxRate: 1.7, insurance: 1600 },
  // Texas
  '7': { rate: 6.9, taxRate: 1.8, insurance: 2200 },
  // Florida
  '3': { rate: 7.0, taxRate: 0.9, insurance: 2800 },
  // Default
  'default': { rate: 7.0, taxRate: 1.2, insurance: 1500 }
};

// ─── ON PAGE LOAD ─────────────────────────────────────────
window.onload = function () {
  const infoIcon = document.getElementById('closingInfo');
  const tooltip = document.getElementById('closingTooltip');
  if (infoIcon && tooltip) {
    infoIcon.addEventListener('mouseenter', () => tooltip.classList.add('visible'));
    infoIcon.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
    infoIcon.addEventListener('click', () => tooltip.classList.toggle('visible'));
  }

  const pmiInfo = document.getElementById('pmiInfo');
  if (pmiInfo) {
    pmiInfo.addEventListener('click', () => {
      alert('PMI (Private Mortgage Insurance) is required when your down payment is less than 20% of the home price. It typically costs 0.5–1% of the loan amount per year and protects the lender if you default. Once you reach 20% equity, you can request to remove PMI.');
    });
  }
};

// ─── ZIP CODE HANDLER ─────────────────────────────────────
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

  // Auto fill rate
  const rateEl = document.getElementById('interestRate');
  rateEl.value = data.rate + '%';
  rateEl.dataset.raw = data.rate;
  document.getElementById('rateHint').textContent = `Estimated rate for your area: ${data.rate}%. You can edit this.`;

  // Update tax estimate display
  updateTaxEstimate();
  updateInsEstimate();
}

// ─── TAX MODE ─────────────────────────────────────────────
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
  document.getElementById('taxEstimateDisplay').textContent =
    '$' + Math.round(annualTax).toLocaleString() + '/yr (' + zipEstimates.taxRate + '% of home value)';
}

// ─── INSURANCE MODE ───────────────────────────────────────
function setInsMode(mode, e) {
  insMode = mode;
  document.querySelectorAll('.ins-btn').forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');
  document.getElementById('insEstimateMode').style.display = mode === 'estimate' ? 'block' : 'none';
  document.getElementById('insDollarMode').style.display = mode === 'dollar' ? 'block' : 'none';
}

function updateInsEstimate() {
  if (!zipEstimates) return;
  document.getElementById('insEstimateDisplay').textContent =
    '$' + zipEstimates.insurance.toLocaleString() + '/yr (estimated for your area)';
}

// ─── LOAN TERM ────────────────────────────────────────────
function setTerm(years, e) {
  loanTerm = years;
  document.querySelectorAll('.term-btn').forEach(btn => btn.classList.remove('active'));
  e.target.closest('.term-btn').classList.add('active');
}

// ─── DOWN PAYMENT ─────────────────────────────────────────
function setDownPercent(percent) {
  const homePrice = getRaw('homePrice');
  if (isNaN(homePrice) || homePrice === 0) {
    alert('Please enter a home price first!');
    return;
  }
  const downAmount = homePrice * (percent / 100);
  const el = document.getElementById('downPayment');
  el.dataset.raw = Math.round(downAmount);
  el.value = '$' + Math.round(downAmount).toLocaleString('en-US');
  updateDownPercent();
}

function updateDownPercent() {
  const homePrice = getRaw('homePrice');
  const downPayment = getRaw('downPayment');
  const badge = document.getElementById('downPercentBadge');
  if (!isNaN(homePrice) && !isNaN(downPayment) && homePrice > 0) {
    const percent = ((downPayment / homePrice) * 100).toFixed(1);
    badge.textContent = percent + '%';
  } else {
    badge.textContent = '0%';
  }
}

// ─── FORMAT INPUT ─────────────────────────────────────────
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
  setTimeout(() => {
    input.setSelectionRange(input.value.length - 1, input.value.length - 1);
  }, 0);
}

function getRaw(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const raw = el.dataset.raw || el.value.replace(/[^0-9.]/g, '');
  return parseFloat(raw);
}

// ─── GET PROPERTY TAX ─────────────────────────────────────
function getAnnualTax() {
  const homePrice = getRaw('homePrice');
  if (taxMode === 'estimate') {
    if (zipEstimates) return homePrice * (zipEstimates.taxRate / 100);
    return homePrice * 0.012;
  } else if (taxMode === 'percent') {
    const pct = getRaw('taxPercent');
    return homePrice * (pct / 100);
  } else {
    return getRaw('propertyTax') || 0;
  }
}

// ─── GET INSURANCE ────────────────────────────────────────
function getAnnualInsurance() {
  if (insMode === 'estimate') {
    return zipEstimates ? zipEstimates.insurance : 1500;
  } else {
    return getRaw('insurance') || 0;
  }
}

// ─── ANIMATED COUNTER ─────────────────────────────────────
function animateCounter(elementId, targetValue) {
  const el = document.getElementById(elementId);
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
  const downPayment = getRaw('downPayment') || 0;
  const interestRate = getRaw('interestRate');
  const propertyTax = getAnnualTax();
  const insurance = getAnnualInsurance();

  if (isNaN(homePrice) || isNaN(interestRate)) {
    alert('Please fill in Home Price and Interest Rate!');
    return;
  }

  const loanAmount = homePrice - downPayment;
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = loanTerm * 12;

  let monthlyPI = 0;
  if (monthlyRate === 0) {
    monthlyPI = loanAmount / numPayments;
  } else {
    monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  }

  const monthlyTax = propertyTax / 12;
  const monthlyInsurance = insurance / 12;
  const downPercent = (downPayment / homePrice) * 100;
  const monthlyPMI = downPercent < 20 ? (loanAmount * 0.008) / 12 : 0;
  const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI;
  const totalPaid = monthlyPI * numPayments;
  const totalInterest = totalPaid - loanAmount;
  const totalCost = homePrice + totalInterest + (propertyTax * loanTerm) + (insurance * loanTerm);
  const closingLow = homePrice * 0.02;
  const closingHigh = homePrice * 0.05;
  const totalCashLow = downPayment + closingLow;
  const totalCashHigh = downPayment + closingHigh;

  calculatedResults = {
    homePrice, downPayment, loanAmount, monthlyPI,
    monthlyTax, monthlyInsurance, monthlyPMI,
    totalMonthly, totalInterest, totalCost,
    closingLow, closingHigh, totalCashLow, totalCashHigh,
    interestRate, loanTerm, downPercent, propertyTax, insurance
  };

  // Show results
  document.getElementById('resultsSection').style.display = 'block';

  // Animate numbers
  animateCounter('totalMonthly', totalMonthly);
  animateCounter('principalInterest', monthlyPI);
  animateCounter('monthlyTax', monthlyTax);
  animateCounter('monthlyInsurance', monthlyInsurance);
  animateCounter('loanAmount', loanAmount);
  animateCounter('totalInterest', totalInterest);
  animateCounter('totalCost', totalCost);
  animateCounter('closingLow', closingLow);
  animateCounter('closingHigh', closingHigh);
  animateCounter('totalCashLow', totalCashLow);
  animateCounter('totalCashHigh', totalCashHigh);
  animateCounter('downPaymentDisplay', downPayment);

  // PMI
  if (monthlyPMI > 0) {
    animateCounter('monthlyPMI', monthlyPMI);
    document.getElementById('pmiBox').style.display = 'flex';
  } else {
    document.getElementById('pmiBox').style.display = 'none';
  }

  // Summary
  generateSummary(calculatedResults);

  // Charts
  drawDonutChart(monthlyPI, monthlyTax, monthlyInsurance, monthlyPMI);
  drawMainChart();

  // Table
  buildAmortization(loanAmount, monthlyRate, numPayments, monthlyPI);

  document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
}

// ─── SUMMARY ──────────────────────────────────────────────
function generateSummary(r) {
  const summaryBox = document.getElementById('summaryBox');
  const downPct = r.downPercent.toFixed(0);
  const pmiNote = r.monthlyPMI > 0
    ? ` Since your down payment is under 20%, PMI of <strong>${formatMoney(r.monthlyPMI)}/month</strong> is included.`
    : ' No PMI required — great down payment! ✅';

  summaryBox.innerHTML = `Based on a <strong>${formatMoney(r.homePrice)}</strong> home with <strong>${formatMoney(r.downPayment)}</strong> down (<strong>${downPct}%</strong>), your estimated monthly payment is <strong>${formatMoney(r.totalMonthly)}</strong> over <strong>${r.loanTerm} years</strong> at <strong>${r.interestRate}% interest</strong>. Over the life of the loan you'll pay <strong>${formatMoney(r.totalInterest)}</strong> in interest — making the true cost of your home <strong>${formatMoney(r.totalCost)}</strong>.${pmiNote}`;
}

// ─── DONUT CHART (payment breakdown) ─────────────────────
function drawDonutChart(monthlyPI, monthlyTax, monthlyInsurance, monthlyPMI) {
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
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#888', font: { size: 11 } }
        }
      }
    }
  });
}

// ─── MAIN CHART ───────────────────────────────────────────
function drawMainChart() {
  if (myChart) myChart.destroy();
  const ctx = document.getElementById('myChart').getContext('2d');

  if (chartType === 'bar') {
    // Over time — principal vs interest per year
    const years = [];
    const principalData = [];
    const interestData = [];
    let balance = calculatedResults.loanAmount;
    const monthlyRate = calculatedResults.interestRate / 100 / 12;

    for (let year = 1; year <= loanTerm; year++) {
      let yPrincipal = 0;
      let yInterest = 0;
      for (let month = 1; month <= 12; month++) {
        if ((year - 1) * 12 + month > loanTerm * 12) break;
        const interest = balance * monthlyRate;
        const principal = calculatedResults.monthlyPI - interest;
        yInterest += interest;
        yPrincipal += principal;
        balance = Math.max(balance - principal, 0);
      }
      years.push('Yr ' + year);
      principalData.push(yPrincipal.toFixed(2));
      interestData.push(yInterest.toFixed(2));
    }

    myChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [
          {
            label: 'Principal',
            data: principalData,
            backgroundColor: '#7C3AED88',
            borderColor: '#7C3AED',
            borderWidth: 1,
          },
          {
            label: 'Interest',
            data: interestData,
            backgroundColor: '#EC489988',
            borderColor: '#EC4899',
            borderWidth: 1,
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#ffffff' } } },
        scales: {
          x: {
            stacked: true,
            ticks: { color: '#888' },
            grid: { color: '#2a2a3a' }
          },
          y: {
            stacked: true,
            ticks: { color: '#888', callback: v => '$' + Number(v).toLocaleString() },
            grid: { color: '#2a2a3a' }
          }
        }
      }
    });
  } else {
    // Breakdown doughnut
    drawDonutChart(
      calculatedResults.monthlyPI,
      calculatedResults.monthlyTax,
      calculatedResults.monthlyInsurance,
      calculatedResults.monthlyPMI
    );
  }
}

// ─── SWITCH CHART ─────────────────────────────────────────
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
    let yearlyPrincipal = 0;
    let yearlyInterest = 0;

    for (let month = 1; month <= 12; month++) {
      if ((year - 1) * 12 + month > numPayments) break;
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPI - interestPayment;
      yearlyInterest += interestPayment;
      yearlyPrincipal += principalPayment;
      balance -= principalPayment;
    }

    if (balance < 0) balance = 0;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>Year ${year}</td>
      <td>${formatMoney(yearlyPrincipal)}</td>
      <td>${formatMoney(yearlyInterest)}</td>
      <td>${formatMoney(Math.max(balance, 0))}</td>
    `;
    tbody.appendChild(row);
  }
}

// ─── SHARE ────────────────────────────────────────────────
function shareResults() {
  if (!calculatedResults) return;
  const r = calculatedResults;
  const text = `🏠 Mortgage Calculator — MoneyMap IQ

- Home Price: ${formatMoney(r.homePrice)}
- Down Payment: ${formatMoney(r.downPayment)} (${r.downPercent.toFixed(0)}%)
- Loan Amount: ${formatMoney(r.loanAmount)}
- Monthly Payment: ${formatMoney(r.totalMonthly)}
- Total Interest Paid: ${formatMoney(r.totalInterest)}
- Total Cash to Close: ${formatMoney(r.totalCashLow)} – ${formatMoney(r.totalCashHigh)}

Try it yourself: https://moneymap-iq.vercel.app/calculators/mortgage/`;

  navigator.clipboard.writeText(text).then(() => {
    alert('✅ Results copied! Paste anywhere to share.');
  });
}

// ─── FORMAT MONEY ─────────────────────────────────────────
function formatMoney(amount) {
  if (isNaN(amount)) return '$0.00';
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}