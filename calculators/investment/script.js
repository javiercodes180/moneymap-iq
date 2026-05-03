let investmentType = 'monthly';
let currentMode = 'grow';
let myChart = null;
let chartType = 'balance';
let yearlyData = [];

function setResultsVisible(isVisible) {
  document.body.classList.toggle('has-results', isVisible);
  const tableSection = document.getElementById('tableSection');
  if (tableSection) tableSection.style.display = isVisible ? 'block' : 'none';
  if (!isVisible) updateHeroSubtext('');
}

function scrollToResultsIfNeeded() {
  if (window.matchMedia('(max-width: 1120px)').matches) {
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function showHeroResult(type) {
  document.getElementById('growHeroResult').style.display = type === 'grow' ? 'block' : 'none';
  document.getElementById('goalHeroResult').style.display = type === 'goal' ? 'block' : 'none';
}

function formatYearsLabel(yearsValue) {
  const label = String(yearsValue).trim();
  return `${label} ${Number(label) === 1 ? 'year' : 'years'}`;
}

function updateHeroSubtext(yearsValue) {
  const text = yearsValue ? `At the end of ${formatYearsLabel(yearsValue)}` : '';
  document.getElementById('growHeroSubtext').textContent = text;
  document.getElementById('goalHeroSubtext').textContent = text;
}

// ─── MODE SWITCHING ───────────────────────────────────────
function setMode(mode, e) {
  currentMode = mode;
  document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
  e.currentTarget.classList.add('active');
  document.getElementById('growMode').style.display = mode === 'grow' ? 'block' : 'none';
  document.getElementById('goalMode').style.display = mode === 'goal' ? 'block' : 'none';
  setResultsVisible(false);
}

// ─── INVESTMENT TYPE ──────────────────────────────────────
function setType(type, e) {
  investmentType = type;
  document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
  e.currentTarget.classList.add('active');
  const contributionGroup = document.getElementById('contributionGroup');
  const label = document.getElementById('amountLabel');
  const hint = document.getElementById('amountHint');
  if (type === 'none') {
    contributionGroup.style.display = 'none';
  } else {
    contributionGroup.style.display = 'flex';
    if (type === 'monthly') {
      label.textContent = 'Monthly Contribution';
      hint.textContent = 'How much will you invest each month? e.g. $500';
    } else {
      label.textContent = 'Yearly Contribution';
      hint.textContent = 'How much will you invest each year? e.g. $6,000';
    }
  }
}

// ─── FORMAT INPUT AS CURRENCY ─────────────────────────────
function formatInput(input) {
  let raw = input.value.replace(/[^0-9]/g, '');
  input.dataset.raw = raw;
  if (raw === '') { input.value = ''; return; }
  input.value = Number(raw).toLocaleString('en-US');
}

// ─── FORMAT INPUT AS PERCENTAGE ───────────────────────────
function formatPercent(input) {
  let raw = input.value.replace(/[^0-9.]/g, '');
  input.dataset.raw = raw;
  if (raw === '') { input.value = ''; return; }
  input.value = raw;
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
  const yearsInput = document.getElementById('years').value;
  const years = parseFloat(yearsInput);
  const adjustInflation = document.getElementById('inflationToggle').checked;

  if (isNaN(rate) || isNaN(years)) {
    alert('Please fill in Annual Return and Number of Years!');
    return;
  }
  if (lumpsum === 0 && amount === 0) {
    alert('Please enter at least a one-time investment or ongoing contribution!');
    return;
  }

  const monthlyRate = rate / 100 / 12;
  const annualRate = rate / 100;
  yearlyData = [];

  for (let year = 1; year <= years; year++) {
    const lumpGrowth = lumpsum * Math.pow(1 + annualRate, year);
    let contribGrowth = 0;
    let contribInvested = 0;

    if (investmentType === 'monthly' && amount > 0) {
      const months = year * 12;
      contribInvested = amount * months;
      contribGrowth = monthlyRate === 0
        ? contribInvested
        : amount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    } else if (investmentType === 'yearly' && amount > 0) {
      contribInvested = amount * year;
      contribGrowth = annualRate === 0
        ? contribInvested
        : amount * ((Math.pow(1 + annualRate, year) - 1) / annualRate) * (1 + annualRate);
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
  setResultsVisible(true);
  showHeroResult('grow');
  updateHeroSubtext(yearsInput);
  document.getElementById('growResults').style.display = 'grid';
  document.getElementById('goalResult').style.display = 'none';

  animateCounter('heroFinalValue', final.portfolioValue);
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
  scrollToResultsIfNeeded();
}

// ─── GOAL MODE ────────────────────────────────────────────
function calculateGoal() {
  const goal = getRaw('goalAmount');
  const lumpsum = getRaw('goalLumpsum') || 0;
  const rate = getRaw('rate');
  const yearsInput = document.getElementById('years').value;
  const years = parseFloat(yearsInput);
  const adjustInflation = document.getElementById('inflationToggle').checked;

  if (isNaN(goal) || isNaN(rate) || isNaN(years)) {
    alert('Please fill in all fields!');
    return;
  }

  const monthlyRate = rate / 100 / 12;
  const months = years * 12;
  const lumpFV = lumpsum * Math.pow(1 + rate / 100, years);
  const remaining = goal - lumpFV;
  let requiredMonthly = 0;
  if (remaining > 0) {
    requiredMonthly = monthlyRate === 0
      ? remaining / months
      : remaining * monthlyRate / ((Math.pow(1 + monthlyRate, months) - 1) * (1 + monthlyRate));
  }

  const totalInvested = lumpsum + requiredMonthly * months;
  const growth = Math.max(0, goal - totalInvested);
  const inflationAdjustedTarget = adjustInflation ? goal / Math.pow(1.03, years) : null;
  const goalDate = getGoalDate(years);
  const alreadyFunded = lumpFV >= goal;

  setResultsVisible(true);
  showHeroResult('goal');
  updateHeroSubtext(yearsInput);
  document.getElementById('growResults').style.display = 'none';
  document.getElementById('goalResult').style.display = 'grid';

  animateCounter('heroRequiredMonthly', requiredMonthly);
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
    const contribGrowth = monthlyRate === 0
      ? requiredMonthly * m
      : requiredMonthly * ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate) * (1 + monthlyRate);
    const lumpGrowth = lumpsum * Math.pow(1 + rate / 100, year);
    const portfolioValue = contribGrowth + lumpGrowth;
    const totalInv = lumpsum + requiredMonthly * m;
    const date = getGoalDate(year);
    yearlyData.push({ year, date, totalInvested: totalInv, growth: Math.max(0, portfolioValue - totalInv), portfolioValue });
  }

  // Summary
  const summaryBox = document.getElementById('summaryBox');
  if (alreadyFunded) {
    summaryBox.innerHTML = `Your starting investment of <strong>${formatMoney(lumpsum)}</strong> is already enough to reach your <strong>${formatMoney(goal)}</strong> goal by <strong>${goalDate}</strong>. Required monthly savings: <strong>${formatMoney(0)}/month</strong>.${adjustInflation ? ` In today's dollars, your inflation-adjusted target is <strong>${formatMoney(inflationAdjustedTarget)}</strong>.` : ''}`;
  } else {
    summaryBox.innerHTML = `To reach your goal of <strong>${formatMoney(goal)}</strong> by <strong>${goalDate}</strong> with a <strong class="text-growth">${rate}% annual return</strong>, you need to save <strong>${formatMoney(requiredMonthly)}/month</strong>. The market does the rest - <strong class="text-growth">${formatMoney(growth)}</strong> of your final balance comes from investment growth, not your own pocket.${adjustInflation ? ` In today's dollars, your inflation-adjusted target is <strong>${formatMoney(inflationAdjustedTarget)}</strong>.` : ''}`;
  }

  drawChart();
  drawTable();
  scrollToResultsIfNeeded();
}

// ─── PLAIN ENGLISH SUMMARY ────────────────────────────────
function generateSummary(final, rate, years, lumpsum, amount, adjustInflation) {
  const growthPercent = ((final.growth / final.totalInvested) * 100).toFixed(0);
  const summaryBox = document.getElementById('summaryBox');
  let text = `If you invest at a <strong class="text-growth">${rate}% annual return</strong> over <strong>${formatYearsLabel(years)}</strong> `;

  if (lumpsum > 0 && amount > 0) {
    text += `starting with <strong>${formatMoney(lumpsum)}</strong> plus <strong>${formatMoney(amount)}/${investmentType === 'monthly' ? 'month' : 'year'}</strong>, `;
  } else if (lumpsum > 0) {
    text += `with a one-time investment of <strong>${formatMoney(lumpsum)}</strong>, `;
  } else {
    text += `contributing <strong>${formatMoney(amount)}/${investmentType === 'monthly' ? 'month' : 'year'}</strong>, `;
  }

  text += `your total balance will reach <strong>${formatMoney(final.portfolioValue)}</strong> by <strong>${final.date}</strong>. `;
  text += `You'll personally invest <strong>${formatMoney(final.totalInvested)}</strong> - the market generates <strong class="text-growth">${formatMoney(final.growth)}</strong> in growth (<strong class="text-growth">${growthPercent}%</strong> return on what you put in).`;

  if (adjustInflation && final.adjustedValue) {
    text += ` Adjusted for inflation, your Total Balance is worth <strong>${formatMoney(final.adjustedValue)}</strong> in today's dollars.`;
  }

  summaryBox.innerHTML = text;
}

// ─── CHART ────────────────────────────────────────────────
function drawChart() {
  const labels = yearlyData.map(d => d.year);
  const invested = yearlyData.map(d => Number(d.totalInvested.toFixed(2)));
  const growth = yearlyData.map(d => Number(d.growth.toFixed(2)));
  const balances = yearlyData.map(d => Number(d.portfolioValue.toFixed(2)));
  const maxValue = Math.max(...balances, ...invested, ...growth, 0);
  const view = chartType || 'balance';

  if (myChart) myChart.destroy();

  const ctx = document.getElementById('myChart').getContext('2d');
  const datasets = [];

  if (view === 'balance') {
    datasets.push(
      {
        type: 'line',
        label: 'Total Balance',
        data: balances,
        borderColor: '#5b2fd6',
        backgroundColor: '#ffffff',
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 5,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#5b2fd6',
        pointBorderWidth: 3,
        tension: 0.28,
        order: 0
      },
      {
        type: 'bar',
        label: 'Total Invested',
        data: invested,
        backgroundColor: '#c9bff4',
        borderColor: '#c9bff4',
        borderWidth: 1,
        borderRadius: 3,
        stack: 'balance',
        order: 1
      },
      {
        type: 'bar',
        label: 'Investment Growth',
        data: growth,
        backgroundColor: '#69bd8d',
        borderColor: '#69bd8d',
        borderWidth: 1,
        borderRadius: 3,
        stack: 'balance',
        order: 1
      }
    );
  } else if (view === 'invested') {
    datasets.push({
      type: 'bar',
      label: 'Total Invested',
      data: invested,
      backgroundColor: '#c9bff4',
      borderColor: '#b5a7ef',
      borderWidth: 1,
      borderRadius: 3
    });
  } else {
    datasets.push({
      type: 'bar',
      label: 'Investment Growth',
      data: growth,
      backgroundColor: '#69bd8d',
      borderColor: '#55a976',
      borderWidth: 1,
      borderRadius: 3
    });
  }

  myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0d1b2a',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          padding: 12,
          callbacks: {
            label: context => `${context.dataset.label}: ${formatMoney(context.parsed.y)}`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#64748b', font: { family: 'Inter' } },
          grid: { color: '#e8eaf0' },
          stacked: view === 'balance',
          title: { display: true, text: 'Years', color: '#64748b', font: { family: 'Inter', weight: '600' } }
        },
        y: {
          beginAtZero: true,
          suggestedMax: maxValue * 1.12,
          ticks: {
            color: '#64748b',
            font: { family: 'Inter' },
            callback: value => {
              if (value === 0) return '$0';
              return '$' + (Number(value) / 1000).toFixed(0) + 'K';
            }
          },
          grid: { color: '#e8eaf0' },
          stacked: view === 'balance',
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
  const chartView = document.getElementById('chartView');
  if (chartView && chartView.value !== type) chartView.value = type;
  if (yearlyData.length > 0) drawChart();
}

// ─── SHARE ────────────────────────────────────────────────
function shareResults() {
  if (yearlyData.length === 0) return;
  const final = yearlyData[yearlyData.length - 1];
  const text = `MoneyMap IQ Investment Calculator Results

- Total Invested: ${formatMoney(final.totalInvested)}
- Investment Growth: ${formatMoney(final.growth)}
- Total Balance: ${formatMoney(final.portfolioValue)}

Try it yourself: https://moneymap-iq.vercel.app/calculators/investment/`;

  navigator.clipboard.writeText(text).then(() => {
    alert('Results copied. Paste anywhere to share.');
  });
}

// ─── FORMAT MONEY ─────────────────────────────────────────
function formatMoney(amount) {
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
