let loanTermMonths = 60;
let myChart = null;
let donutChart = null;
let chartType = 'bar';
let calculatedResults = null;

/* ── HELPERS ─────────────────────────────────── */
function formatMoney(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatMoneyShort(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function parseNum(id) {
  return parseFloat(document.getElementById(id).value.replace(/[^0-9.]/g, '')) || 0;
}

function formatInput(el) {
  let raw = el.value.replace(/[^0-9.]/g, '');
  if (!raw) { el.value = ''; return; }
  let parts = raw.split('.');
  parts[0] = Number(parts[0]).toLocaleString('en-US');
  el.value = '$' + parts.join('.');
}

function formatPercent(el) {
  let raw = el.value.replace(/[^0-9.]/g, '');
  el.value = raw;
}

/* ── DOWN PAYMENT SYNC ───────────────────────── */
function syncDownFromDollar() {
  let price = parseNum('vehiclePrice');
  let down = parseNum('downPayment');
  if (price > 0) {
    let pct = ((down / price) * 100).toFixed(1);
    document.getElementById('downPercent').value = pct;
    document.getElementById('downPercentBadge').textContent = pct + '%';
  }
}

function syncDownFromPercent(el) {
  formatPercent(el);
  let price = parseNum('vehiclePrice');
  let pct = parseFloat(el.value) || 0;
  if (price > 0) {
    let down = Math.round(price * pct / 100);
    document.getElementById('downPayment').value = '$' + down.toLocaleString();
    document.getElementById('downPercentBadge').textContent = pct + '%';
  }
}

function setDownPercent(pct) {
  let price = parseNum('vehiclePrice');
  if (price > 0) {
    let down = Math.round(price * pct / 100);
    document.getElementById('downPayment').value = '$' + down.toLocaleString();
    document.getElementById('downPercent').value = pct;
    document.getElementById('downPercentBadge').textContent = pct + '%';
  }
}

/* ── LOAN TERM ───────────────────────────────── */
function setTerm(months, event) {
  loanTermMonths = months;
  document.querySelectorAll('.term-btn').forEach(b => b.classList.remove('active'));
  event.currentTarget.classList.add('active');
}

/* ── LEARN MORE TOGGLES ──────────────────────── */
function toggleLearnMore(id) {
  var el = document.getElementById(id);
  var btn = document.getElementById(id + 'Btn');
  if (el.style.display === 'none') {
    el.style.display = 'block';
    btn.textContent = btn.textContent.replace('📖', '📕');
  } else {
    el.style.display = 'none';
    btn.textContent = btn.textContent.replace('📕', '📖');
  }
}

/* ── CALCULATE ───────────────────────────────── */
function calculate() {
  let vehiclePrice = parseNum('vehiclePrice');
  let downPayment = parseNum('downPayment');
  let tradeIn = parseNum('tradeIn');
  let salesTaxPct = parseFloat(document.getElementById('salesTax').value) || 0;
  let apr = parseFloat(document.getElementById('interestRate').value) || 0;
  let insurance = parseNum('monthlyInsurance');
  let fees = parseNum('fees');

  if (vehiclePrice <= 0 || apr <= 0) {
    alert('Please enter at least a vehicle price and interest rate.');
    return;
  }

  // Calculate sales tax on vehicle price
  let salesTaxAmount = vehiclePrice * (salesTaxPct / 100);

  // Loan amount = price + tax - down payment - trade-in
  let loanAmount = vehiclePrice + salesTaxAmount - downPayment - tradeIn;
  if (loanAmount < 0) loanAmount = 0;

  // Monthly payment calculation
  let monthlyRate = (apr / 100) / 12;
  let n = loanTermMonths;
  let monthlyPayment = 0;
  let totalInterest = 0;

  if (monthlyRate > 0 && n > 0 && loanAmount > 0) {
    monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    totalInterest = (monthlyPayment * n) - loanAmount;
  }

  let totalMonthlyCost = monthlyPayment + insurance;
  let totalCost = vehiclePrice + salesTaxAmount + totalInterest + fees;

  calculatedResults = {
    vehiclePrice, downPayment, tradeIn, salesTaxPct, salesTaxAmount,
    apr, loanAmount, monthlyPayment, totalInterest, insurance,
    fees, totalMonthlyCost, totalCost, loanTermMonths: n
  };

  displayResults();
}

/* ── DISPLAY RESULTS ─────────────────────────── */
function displayResults() {
  let r = calculatedResults;
  document.getElementById('resultsSection').style.display = 'block';

  // Summary narrative
  let termYears = (r.loanTermMonths / 12).toFixed(1).replace('.0', '');
  let summary = `Based on a <strong>${formatMoney(r.vehiclePrice)}</strong> vehicle`;
  if (r.downPayment > 0) summary += ` with <strong>${formatMoney(r.downPayment)}</strong> down`;
  if (r.tradeIn > 0) summary += ` and a <strong>${formatMoney(r.tradeIn)}</strong> trade-in`;
  summary += `, your estimated monthly payment is <strong>${formatMoney(r.monthlyPayment)}</strong> over <strong>${r.loanTermMonths} months</strong> at <strong>${r.apr}% APR</strong>.`;
  summary += ` Over the life of the loan you'll pay <strong>${formatMoney(r.totalInterest)}</strong> in interest`;
  summary += ` — making the true cost of this car <strong>${formatMoney(r.totalCost)}</strong>.`;
  document.getElementById('summaryBox').innerHTML = summary;

  // Monthly breakdown
  document.getElementById('totalMonthlyCost').textContent = formatMoney(r.totalMonthlyCost);
  document.getElementById('monthlyPayment').textContent = formatMoney(r.monthlyPayment);

  if (r.insurance > 0) {
    document.getElementById('insuranceRow').style.display = 'block';
    document.getElementById('monthlyIns').textContent = formatMoney(r.insurance);
  } else {
    document.getElementById('insuranceRow').style.display = 'none';
  }

  // Loan summary
  document.getElementById('loanAmount').textContent = formatMoney(r.loanAmount);
  document.getElementById('totalInterest').textContent = formatMoney(r.totalInterest);
  document.getElementById('salesTaxAmount').textContent = formatMoney(r.salesTaxAmount);

  if (r.fees > 0) {
    document.getElementById('feesRow').style.display = 'block';
    document.getElementById('feesAmount').textContent = formatMoney(r.fees);
  } else {
    document.getElementById('feesRow').style.display = 'none';
  }

  document.getElementById('totalCost').textContent = formatMoney(r.totalCost);

  // Build donut chart
  buildDonutChart();

  // Build amortization data and charts
  buildAmortization();

  // Scroll to results
  document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── DONUT CHART ─────────────────────────────── */
function buildDonutChart() {
  let r = calculatedResults;

  let labels = ['Vehicle Price', 'Interest', 'Sales Tax'];
  let data = [r.vehiclePrice, r.totalInterest, r.salesTaxAmount];
  let colors = ['#7C3AED', '#EC4899', '#14B8A6'];

  if (r.fees > 0) {
    labels.push('Fees');
    data.push(r.fees);
    colors.push('#2563EB');
  }

  let ctx = document.getElementById('donutChart').getContext('2d');
  if (donutChart) donutChart.destroy();

  donutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      cutout: '65%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              return ctx.label + ': ' + formatMoney(ctx.parsed);
            }
          }
        }
      }
    }
  });

  // Center text
  let centerEl = document.getElementById('donutCenter');
  centerEl.innerHTML = `
    <span class="donut-center-amount">${formatMoney(r.totalCost)}</span>
    <span class="donut-center-label">True Cost</span>
  `;

  // Custom legend
  let legendEl = document.getElementById('donutLegend');
  legendEl.innerHTML = '';
  let total = data.reduce((a, b) => a + b, 0);
  for (let i = 0; i < labels.length; i++) {
    let pct = ((data[i] / total) * 100).toFixed(1);
    legendEl.innerHTML += `
      <div class="donut-legend-item">
        <div class="donut-legend-dot" style="background:${colors[i]}"></div>
        <span class="donut-legend-text">${labels[i]}</span>
        <span class="donut-legend-value">${formatMoney(data[i])} (${pct}%)</span>
      </div>
    `;
  }
}

/* ── AMORTIZATION ────────────────────────────── */
function buildAmortization() {
  let r = calculatedResults;
  let balance = r.loanAmount;
  let monthlyRate = (r.apr / 100) / 12;
  let tableBody = document.getElementById('tableBody');
  tableBody.innerHTML = '';

  let monthlyData = [];

  for (let m = 1; m <= r.loanTermMonths; m++) {
    let interestPmt = balance * monthlyRate;
    let principalPmt = r.monthlyPayment - interestPmt;
    balance -= principalPmt;
    if (balance < 0) balance = 0;

    monthlyData.push({
      month: m,
      payment: r.monthlyPayment,
      principal: principalPmt,
      interest: interestPmt,
      balance: balance
    });

    // Show every 3rd month in table to keep it manageable, plus first and last
    if (m === 1 || m % 3 === 0 || m === r.loanTermMonths) {
      let row = document.createElement('tr');
      row.innerHTML = `
        <td>${m}</td>
        <td>${formatMoney(r.monthlyPayment)}</td>
        <td>${formatMoney(principalPmt)}</td>
        <td>${formatMoney(interestPmt)}</td>
        <td>${formatMoney(balance)}</td>
      `;
      tableBody.appendChild(row);
    }
  }

  // Build yearly aggregated data for charts
  let yearlyPrincipal = [];
  let yearlyInterest = [];
  let yearlyBalance = [];
  let yearLabels = [];

  let yearCount = Math.ceil(r.loanTermMonths / 12);
  for (let y = 0; y < yearCount; y++) {
    let pSum = 0, iSum = 0, lastBal = 0;
    for (let m = y * 12; m < Math.min((y + 1) * 12, r.loanTermMonths); m++) {
      pSum += monthlyData[m].principal;
      iSum += monthlyData[m].interest;
      lastBal = monthlyData[m].balance;
    }
    yearlyPrincipal.push(pSum);
    yearlyInterest.push(iSum);
    yearlyBalance.push(lastBal);
    yearLabels.push('Yr ' + (y + 1));
  }

  calculatedResults.yearlyPrincipal = yearlyPrincipal;
  calculatedResults.yearlyInterest = yearlyInterest;
  calculatedResults.yearlyBalance = yearlyBalance;
  calculatedResults.yearLabels = yearLabels;

  drawChart();
}

/* ── CHARTS ──────────────────────────────────── */
function switchChart(type, event) {
  chartType = type;
  document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
  event.currentTarget.classList.add('active');
  drawChart();
}

function drawChart() {
  let r = calculatedResults;
  let ctx = document.getElementById('myChart').getContext('2d');
  if (myChart) myChart.destroy();

  if (chartType === 'bar') {
    myChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: r.yearLabels,
        datasets: [
          { label: 'Principal', data: r.yearlyPrincipal, backgroundColor: '#7C3AED88', borderColor: '#7C3AED', borderWidth: 1 },
          { label: 'Interest', data: r.yearlyInterest, backgroundColor: '#EC489988', borderColor: '#EC4899', borderWidth: 1 }
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
    myChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: r.yearLabels,
        datasets: [{
          label: 'Remaining Balance',
          data: r.yearlyBalance,
          borderColor: '#7C3AED', backgroundColor: '#7C3AED15',
          fill: true, tension: 0.3, pointRadius: 4,
          pointBackgroundColor: '#7C3AED'
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

/* ── SHARE ────────────────────────────────────── */
function shareResults() {
  let r = calculatedResults;
  let text = `🚗 Car Payment Calculator — MoneyMap IQ\n\n`;
  text += `Vehicle Price: ${formatMoney(r.vehiclePrice)}\n`;
  if (r.downPayment > 0) text += `Down Payment: ${formatMoney(r.downPayment)}\n`;
  if (r.tradeIn > 0) text += `Trade-In: ${formatMoney(r.tradeIn)}\n`;
  text += `Loan Amount: ${formatMoney(r.loanAmount)}\n`;
  text += `APR: ${r.apr}%\n`;
  text += `Term: ${r.loanTermMonths} months\n\n`;
  text += `Monthly Payment: ${formatMoney(r.monthlyPayment)}\n`;
  if (r.insurance > 0) text += `Monthly Insurance: ${formatMoney(r.insurance)}\n`;
  if (r.insurance > 0) text += `Total Monthly Cost: ${formatMoney(r.totalMonthlyCost)}\n`;
  text += `Total Interest: ${formatMoney(r.totalInterest)}\n`;
  text += `True Cost: ${formatMoney(r.totalCost)}\n\n`;
  text += `Calculate yours → moneymap-iq.vercel.app`;

  navigator.clipboard.writeText(text).then(() => {
    let btn = document.querySelector('.share-btn');
    btn.textContent = '✅ Copied!';
    setTimeout(() => btn.textContent = '📤 Copy Results to Share', 2000);
  });
}
