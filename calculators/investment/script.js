let investmentType = 'monthly';
let currentMode = 'grow';
let myChart = null;
let chartType = 'bar';
let yearlyData = [];

// ─── ON PAGE LOAD — RESTORE SAVED INPUTS ─────────────────
window.onload = function () {
  const saved = JSON.parse(localStorage.getItem('javierCalc'));
  if (!saved) return;

  if (saved.mode) {
    currentMode = saved.mode;
    if (saved.mode === 'goal') {
      document.getElementById('growMode').style.display = 'none';
      document.getElementById('goalMode').style.display = 'block';
      document.querySelectorAll('.mode-btn')[1].classList.add('active');
      document.querySelectorAll('.mode-btn')[0].classList.remove('active');
    }
  }

  if (saved.lumpsum) setInputValue('lumpsum', saved.lumpsum);
  if (saved.amount) setInputValue('amount', saved.amount);
  if (saved.goalAmount) setInputValue('goalAmount', saved.goalAmount);
  if (saved.goalLumpsum) setInputValue('goalLumpsum', saved.goalLumpsum);
  if (saved.rate) {
    const rateEl = document.getElementById('rate');
    rateEl.dataset.raw = saved.rate;
    rateEl.value = saved.rate + '%';
  }
  if (saved.years) document.getElementById('years').value = saved.years;
  if (saved.inflation) document.getElementById('inflationToggle').checked = true;
  if (saved.investmentType) {
    investmentType = saved.investmentType;
    if (saved.investmentType === 'yearly') {
      document.querySelectorAll('.toggle-btn')[1].classList.add('active');
      document.querySelectorAll('.toggle-btn')[0].classList.remove('active');
      document.getElementById('amountLabel').textContent = 'Yearly Contribution ($)';
      document.getElementById('amountHint').textContent = 'How much will you invest each year? e.g. $6,000';
    } else if (saved.investmentType === 'none') {
      document.querySelectorAll('.toggle-btn')[2].classList.add('active');
      document.querySelectorAll('.toggle-btn')[0].classList.remove('active');
      document.getElementById('contributionGroup').style.display = 'none';
    }
  }
};

function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.dataset.raw = value;
  el.value = '$' + Number(value).toLocaleString('en-US');
}

// ─── SAVE INPUTS ──────────────────────────────────────────
function saveInputs() {
  const data = {
    mode: currentMode,
    investmentType,
    lumpsum: getRaw('lumpsum') || '',
    amount: getRaw('amount') || '',
    goalAmount: getRaw('goalAmount') || '',
    goalLumpsum: getRaw('goalLumpsum') || '',
    rate: getRaw('rate') || '',
    years: document.getElementById('years').value,
    inflation: document.getElementById('inflationToggle').checked,
  };
  localStorage.setItem('javierCalc', JSON.stringify(data));
}

// ─── MODE SWITCHING ───────────────────────────────────────
function setMode(mode, e) {
  currentMode = mode;
  document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');
  document.getElementById('growMode').style.display = mode === 'grow' ? 'block' : 'none';
  document.getElementById('goalMode').style.display = mode === 'goal' ? 'block' : 'none';
  document.getElementById('resultsSection').style.display = 'none';
}

// ─── INVESTMENT TYPE ──────────────────────────────────────
function setType(type, e) {
  investmentType = type;
  document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');
  const contributionGroup = document.getElementById('contributionGroup');
  const label = document.getElementById('amountLabel');
  const hint = document.getElementById('amountHint');
  if (type === 'none') {
    contributionGroup.style.display = 'none';
  } else {
    contributionGroup.style.display = 'flex';
    if (type === 'monthly') {
      label.textContent = 'Monthly Contribution ($)';
      hint.textContent = 'How much will you invest each month? e.g. $500';
    } else {
      label.textContent = 'Yearly Contribution ($)';
      hint.textContent = 'How much will you invest each year? e.g. $6,000';
    }
  }
}

// ─── FORMAT INPUT AS CURRENCY ─────────────────────────────
function formatInput(input) {
  let raw = input.value.replace(/[^0-9]/g, '');
  if (raw === '') { input.value = ''; return; }
  input.dataset.raw = raw;
  input.value = '$' + Number(raw).toLocaleString('en-US');
}

// ─── FORMAT INPUT AS PERCENTAGE ───────────────────────────
function formatPercent(input) {
  let raw = input.value.replace(/[^0-9.]/g, '');
  input.dataset.raw = raw;
  if (raw === '') { input.value = ''; return; }
  input.value = raw + '%';
  setTimeout(() => {
    input.setSelectionRange(input.value.length - 1, input.value.length - 1);
  }, 0);
}

// ─── GET RAW NUMBER ───────────────────────────────────────
function getRaw(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const raw = el.dataset.raw || el.value.replace(/[^0-9.]/g, '');
  return parseFloat(raw);
}

// ─── GET GOAL DATE ────────────────────────────────────────
function getGoalDate(years) {
  const date = new Date();
  date.setFullYear(date.getFullYear() + Math.floor(years));
  date.setMonth(date.getMonth() + Math.round((years % 1) * 12));
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
  if (currentMode === 'goal') {
    calculateGoal();
    return;
  }

  const lumpsum = getRaw('lumpsum') || 0;
  const amount = investmentType === 'none' ? 0 : getRaw('amount') || 0;
  const rate = getRaw('rate');
  const years = parseFloat(document.getElementById('years').value);
  const adjustInflation = document.getElementById('inflationToggle').checked;

  if (isNaN(rate) || isNaN(years)) {
    alert('Please fill in Annual Return and Number of Years!');
    return;
  }
  if (lumpsum === 0 && amount === 0) {
    alert('Please enter at least a one-time investment or ongoing contribution!');
    return;
  }

  saveInputs();

  const monthlyRate = rate / 100 / 12;
  const annualRate = rate / 100;
  yearlyData = [];

  for (let year = 1; year <= years; year++) {
    const lumpGrowth = lumpsum * Math.pow(1 + annualRate, year);
    let contribGrowth = 0;
    let contribInvested = 0;

    if (investmentType === 'monthly' && amount > 0) {
      const months = year * 12;
      contribGrowth = amount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
      contribInvested = amount * months;
    } else if (investmentType === 'yearly' && amount > 0) {
      contribGrowth = amount * ((Math.pow(1 + annualRate, year) - 1) / annualRate) * (1 + annualRate);
      contribInvested = amount * year;
    }

    const portfolioValue = lumpGrowth + contribGrowth;
    const totalInvested = lumpsum + contribInvested;
    const growth = portfolioValue - totalInvested;
    const adjustedValue = adjustInflation ? portfolioValue / Math.pow(1.03, year) : null;
    const date = getGoalDate(year);

    yearlyData.push({ year, date, totalInvested, growth, portfolioValue, adjustedValue });
  }

  const final = yearlyData[yearlyData.length - 1];

  // Show results
  document.getElementById('growResults').style.display = 'flex';
  document.getElementById('goalResult').style.display = 'none';
  document.getElementById('resultsSection').style.display = 'block';

  animateCounter('totalInvested', final.totalInvested);
  animateCounter('totalInterest', final.growth);
  animateCounter('finalValue', final.portfolioValue);

  if (adjustInflation && final.adjustedValue) {
    document.getElementById('inflationValue').textContent = formatMoney(final.adjustedValue);
    document.getElementById('inflationBox').style.display = 'flex';
  } else {
    document.getElementById('inflationBox').style.display = 'none';
  }

  generateSummary(final, rate, years, lumpsum, amount, adjustInflation);
  drawChart();
  drawTable();
  document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
}

// ─── GOAL MODE ────────────────────────────────────────────
function calculateGoal() {
  const goal = getRaw('goalAmount');
  const lumpsum = getRaw('goalLumpsum') || 0;
  const rate = getRaw('rate');
  const years = parseFloat(document.getElementById('years').value);
  const adjustInflation = document.getElementById('inflationToggle').checked;

  if (isNaN(goal) || isNaN(rate) || isNaN(years)) {
    alert('Please fill in all fields!');
    return;
  }

  saveInputs();

  const monthlyRate = rate / 100 / 12;
  const months = years * 12;
  const lumpFV = lumpsum * Math.pow(1 + rate / 100, years);
  const remaining = goal - lumpFV;
  let requiredMonthly = 0;
  if (remaining > 0) {
    requiredMonthly = remaining * monthlyRate / ((Math.pow(1 + monthlyRate, months) - 1) * (1 + monthlyRate));
  }

  const totalInvested = lumpsum + requiredMonthly * months;
  const growth = goal - totalInvested;
  const inflationAdjustedTarget = adjustInflation ? goal / Math.pow(1.03, years) : null;
  const goalDate = getGoalDate(years);

  document.getElementById('growResults').style.display = 'none';
  document.getElementById('goalResult').style.display = 'flex';
  document.getElementById('resultsSection').style.display = 'block';

  animateCounter('requiredMonthly', requiredMonthly);
  animateCounter('goalTotalInvested', totalInvested);
  animateCounter('goalGrowth', growth);

  if (adjustInflation && inflationAdjustedTarget) {
    document.getElementById('goalInflationValue').textContent = formatMoney(inflationAdjustedTarget);
    document.getElementById('goalInflationBox').style.display = 'flex';
  } else {
    document.getElementById('goalInflationBox').style.display = 'none';
  }

  // Build chart data
  yearlyData = [];
  for (let year = 1; year <= years; year++) {
    const m = year * 12;
    const contribGrowth = requiredMonthly * ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate) * (1 + monthlyRate);
    const lumpGrowth = lumpsum * Math.pow(1 + rate / 100, year);
    const portfolioValue = contribGrowth + lumpGrowth;
    const totalInv = lumpsum + requiredMonthly * m;
    const date = getGoalDate(year);
    yearlyData.push({ year, date, totalInvested: totalInv, growth: portfolioValue - totalInv, portfolioValue });
  }

  // Summary
  const summaryBox = document.getElementById('summaryBox');
  summaryBox.innerHTML = `To reach your goal of <strong>${formatMoney(goal)}</strong> by <strong>${goalDate}</strong> with a <strong>${rate}% annual return</strong>, you need to save <strong>${formatMoney(requiredMonthly)}/month</strong>. The market does the rest — <strong>${formatMoney(growth)}</strong> of your final balance comes from investment growth, not your own pocket.${adjustInflation ? ` In today's dollars, your inflation-adjusted target is <strong>${formatMoney(inflationAdjustedTarget)}</strong>.` : ''}`;

  drawChart();
  drawTable();
  document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
}

// ─── PLAIN ENGLISH SUMMARY ────────────────────────────────
function generateSummary(final, rate, years, lumpsum, amount, adjustInflation) {
  const growthPercent = ((final.growth / final.totalInvested) * 100).toFixed(0);
  const summaryBox = document.getElementById('summaryBox');
  let text = `If you invest at a <strong>${rate}% annual return</strong> over <strong>${years} years</strong> `;

  if (lumpsum > 0 && amount > 0) {
    text += `starting with <strong>${formatMoney(lumpsum)}</strong> plus <strong>${formatMoney(amount)}/${investmentType === 'monthly' ? 'month' : 'year'}</strong>, `;
  } else if (lumpsum > 0) {
    text += `with a one-time investment of <strong>${formatMoney(lumpsum)}</strong>, `;
  } else {
    text += `contributing <strong>${formatMoney(amount)}/${investmentType === 'monthly' ? 'month' : 'year'}</strong>, `;
  }

  text += `your total balance will reach <strong>${formatMoney(final.portfolioValue)}</strong> by <strong>${final.date}</strong>. `;
  text += `You'll personally invest <strong>${formatMoney(final.totalInvested)}</strong> — the market generates <strong>${formatMoney(final.growth)}</strong> in growth (<strong>${growthPercent}%</strong> return on what you put in).`;

  if (adjustInflation && final.adjustedValue) {
    text += ` Adjusted for inflation, your Total Balance is worth <strong>${formatMoney(final.adjustedValue)}</strong> in today's dollars.`;
  }

  summaryBox.innerHTML = text;
}

// ─── CHART ────────────────────────────────────────────────
function drawChart() {
  const labels = yearlyData.map(d => 'Year ' + d.year);
  const invested = yearlyData.map(d => d.totalInvested.toFixed(2));
  const growth = yearlyData.map(d => d.growth.toFixed(2));

  if (myChart) myChart.destroy();

  const ctx = document.getElementById('myChart').getContext('2d');
  myChart = new Chart(ctx, {
    type: chartType,
    data: {
      labels,
      datasets: [
        {
          label: 'Total Invested',
          data: invested,
          backgroundColor: '#60a5fa88',
          borderColor: '#60a5fa',
          borderWidth: 2,
          fill: chartType === 'line',
        },
        {
          label: 'Investment Growth',
          data: growth,
          backgroundColor: '#a78bfa88',
          borderColor: '#a78bfa',
          borderWidth: 2,
          fill: chartType === 'line',
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#ffffff' } } },
      scales: {
        x: {
          ticks: { color: '#888' },
          grid: { color: '#2a2a3a' },
          stacked: chartType === 'bar',
        },
        y: {
          ticks: { color: '#888', callback: value => '$' + Number(value).toLocaleString() },
          grid: { color: '#2a2a3a' },
          stacked: chartType === 'bar',
        }
      }
    }
  });
}

// ─── TABLE ────────────────────────────────────────────────
function drawTable() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';
  yearlyData.forEach(d => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>Year ${d.year}</td>
      <td>${d.date}</td>
      <td>${formatMoney(d.totalInvested)}</td>
      <td>${formatMoney(d.growth)}</td>
      <td>${formatMoney(d.portfolioValue)}</td>
    `;
    tbody.appendChild(row);
  });
}

// ─── CHART TOGGLE ─────────────────────────────────────────
function switchChart(type, e) {
  chartType = type;
  document.querySelectorAll('.chart-btn').forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');
  drawChart();
}

// ─── SHARE ────────────────────────────────────────────────
function shareResults() {
  if (yearlyData.length === 0) return;
  const final = yearlyData[yearlyData.length - 1];
  const text = `💰 Javier's Investment Calculator Results

- Total Invested: ${formatMoney(final.totalInvested)}
- Investment Growth: ${formatMoney(final.growth)}
- Total Balance: ${formatMoney(final.portfolioValue)}

Try it yourself: https://investment-calculator-zeta-ten.vercel.app/`;

  navigator.clipboard.writeText(text).then(() => {
    alert('✅ Results copied! Paste anywhere to share.');
  });
}

// ─── FORMAT MONEY ─────────────────────────────────────────
function formatMoney(amount) {
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}