/* ── STATE ───────────────────────────────────── */
let currentGoal = 'emergency';
let currentStrategy = 'hysa';
let calcMode = 'monthly'; // 'monthly' or 'deadline'
let efMonths = 6;
let homeDownPct = 20;
let carDownPct = 20;
let myChart = null;
let chartType = 'line';
let calculatedResults = null;

/* ── HELPERS ─────────────────────────────────── */
function formatMoney(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatMoneyShort(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function parseNum(id) {
  let el = document.getElementById(id);
  if (!el) return 0;
  return parseFloat(el.value.replace(/[^0-9.]/g, '')) || 0;
}

function formatInput(el) {
  let raw = el.value.replace(/[^0-9.]/g, '');
  if (!raw) { el.value = ''; return; }
  let parts = raw.split('.');
  parts[0] = Number(parts[0]).toLocaleString('en-US');
  el.value = '$' + parts.join('.');
}

function formatHelperInput(el) {
  formatInput(el);
}

function formatPercentInput(el) {
  let raw = el.value.replace(/[^0-9.]/g, '');
  if (!raw) { el.value = ''; return; }
  el.value = raw + '%';
  setTimeout(() => {
    let pos = el.value.length - 1;
    el.setSelectionRange(pos, pos);
  }, 0);
}

function getPercentValue(id) {
  return parseFloat(document.getElementById(id).value.replace(/[^0-9.]/g, '')) || 0;
}

function animateValue(el, start, end, duration) {
  let startTime = null;
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    let progress = Math.min((timestamp - startTime) / duration, 1);
    let eased = 1 - Math.pow(1 - progress, 3);
    let current = start + (end - start) * eased;
    el.textContent = formatMoney(current);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ── GOAL SELECTOR ───────────────────────────── */
const GENERIC_GOALS = {
  wedding:         { title: '💍 Plan your wedding budget', desc: 'Enter your target amount and we\'ll build a savings plan to get you there.' },
  travel:          { title: '✈️ Plan your travel fund', desc: 'Enter your trip budget and we\'ll show you how to save for it.' },
  home_improvement:{ title: '🔨 Plan your renovation budget', desc: 'Enter your project budget and we\'ll help you save for it.' },
  education:       { title: '🎓 Plan your education fund', desc: 'Enter your tuition or education goal and we\'ll map out a plan.' },
  family:          { title: '👨‍👩‍👧 Plan for your family', desc: 'Enter your savings target and we\'ll show you how to reach it.' },
  custom:          { title: '⭐ Set your custom goal', desc: 'Enter your target amount below and we\'ll build a personalized savings plan.' }
};

function selectGoal(goal, el) {
  currentGoal = goal;

  // Update card active state
  document.querySelectorAll('.goal-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');

  // Show correct helper
  document.querySelectorAll('.helper-content').forEach(h => h.style.display = 'none');

  if (goal === 'emergency') {
    document.getElementById('helper-emergency').style.display = 'block';
  } else if (goal === 'home') {
    document.getElementById('helper-home').style.display = 'block';
  } else if (goal === 'car') {
    document.getElementById('helper-car').style.display = 'block';
  } else {
    let cfg = GENERIC_GOALS[goal] || GENERIC_GOALS['custom'];
    document.getElementById('genericHelperTitle').textContent = cfg.title;
    document.getElementById('genericHelperDesc').textContent = cfg.desc;
    document.getElementById('helper-generic').style.display = 'block';
  }
}

/* ── HELPER CALCS ────────────────────────────── */
function setEfMonths(n, btn) {
  efMonths = n;
  document.querySelectorAll('#helper-emergency .toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  calcEmergencyFund();
}

function calcEmergencyFund() {
  let expenses = parseNum('efMonthlyExpenses');
  let output = document.getElementById('efOutput');
  let val = document.getElementById('efOutputValue');
  if (expenses > 0) {
    let total = expenses * efMonths;
    val.textContent = formatMoneyShort(total);
    output.style.display = 'flex';
  } else {
    output.style.display = 'none';
  }
}

function setHomeDown(pct, btn) {
  homeDownPct = pct;
  document.querySelectorAll('#helper-home .toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  calcHomeDown();
}

function calcHomeDown() {
  let price = parseNum('homePrice');
  let output = document.getElementById('homeOutput');
  let val = document.getElementById('homeOutputValue');
  if (price > 0) {
    let total = price * homeDownPct / 100;
    // Add rough closing cost estimate (2-3%)
    let closing = price * 0.025;
    let grand = total + closing;
    val.textContent = formatMoneyShort(grand) + ' (incl. ~closing costs)';
    output.style.display = 'flex';
  } else {
    output.style.display = 'none';
  }
}

function setCarDown(pct, btn) {
  carDownPct = pct;
  document.querySelectorAll('#helper-car .toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  calcCarDown();
}

function calcCarDown() {
  let price = parseNum('carPrice');
  let output = document.getElementById('carOutput');
  let val = document.getElementById('carOutputValue');
  if (price > 0) {
    let total = price * carDownPct / 100;
    val.textContent = formatMoneyShort(total);
    output.style.display = 'flex';
  } else {
    output.style.display = 'none';
  }
}

function useHelperAmount(valueElId) {
  let text = document.getElementById(valueElId).textContent;
  let num = parseFloat(text.replace(/[^0-9.]/g, ''));
  if (!isNaN(num)) {
    let goalInput = document.getElementById('goalAmount');
    goalInput.value = '$' + num.toLocaleString('en-US');
    goalInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    goalInput.focus();
  }
}

/* ── CALC MODE ───────────────────────────────── */
function setCalcMode(mode, btn) {
  calcMode = mode;
  document.querySelectorAll('#monthlyContribGroup').forEach(el => el.style.display = mode === 'monthly' ? 'flex' : 'none');
  document.getElementById('monthlyContribGroup').style.display = mode === 'monthly' ? 'flex' : 'none';
  document.getElementById('deadlineGroup').style.display = mode === 'deadline' ? 'flex' : 'none';
  document.querySelectorAll('.toggle-btn').forEach(b => {
    if (b.onclick && b.onclick.toString().includes('setCalcMode')) b.classList.remove('active');
  });
  btn.classList.add('active');
}

/* ── STRATEGY ────────────────────────────────── */
function setStrategy(strategy, btn) {
  currentStrategy = strategy;
  document.querySelectorAll('.input-group .toggle-btn').forEach(b => {
    if (b.onclick && b.onclick.toString().includes('setStrategy')) b.classList.remove('active');
  });
  btn.classList.add('active');

  document.getElementById('explainer-hysa').style.display = strategy === 'hysa' ? 'block' : 'none';
  document.getElementById('explainer-invest').style.display = strategy === 'invest' ? 'block' : 'none';

  // Suggest a default rate
  let rateInput = document.getElementById('annualReturn');
  if (!rateInput.dataset.userTyped) {
    rateInput.value = strategy === 'hysa' ? '4.5%' : '7%';
  }
}

/* ── CALCULATE ───────────────────────────────── */
function calculate() {
  let goalAmount = parseNum('goalAmount');
  let currentSavings = parseNum('currentSavings');
  let annualReturn = getPercentValue('annualReturn');
  let monthlyReturn = annualReturn / 100 / 12;
  let remaining = Math.max(goalAmount - currentSavings, 0);

  if (goalAmount <= 0) {
    alert('Please enter a goal amount.');
    return;
  }

  let monthlyContrib = 0;
  let months = 0;
  let completed = remaining === 0;

  if (completed) {
    monthlyContrib = 0;
    months = 0;
  } else if (calcMode === 'monthly') {
    monthlyContrib = parseNum('monthlyContrib');
    if (monthlyContrib <= 0) { alert('Please enter a monthly contribution.'); return; }

    // How many months to reach goal?
    if (annualReturn === 0 || monthlyReturn === 0) {
      months = Math.ceil(remaining / monthlyContrib);
    } else {
      // FV = PMT * ((1+r)^n - 1)/r + PV*(1+r)^n = goal
      // Solve numerically
      months = 0;
      let balance = currentSavings;
      while (balance < goalAmount && months < 1200) {
        balance = balance * (1 + monthlyReturn) + monthlyContrib;
        months++;
      }
    }
  } else {
    // Deadline mode — calculate required monthly
    let targetDate = document.getElementById('targetDate').value;
    if (!targetDate) { alert('Please select a target date.'); return; }
    let now = new Date();
    let target = new Date(targetDate + '-01');
    months = Math.max(1, Math.round((target - now) / (1000 * 60 * 60 * 24 * 30.4)));

    if (annualReturn === 0 || monthlyReturn === 0) {
      monthlyContrib = remaining / months;
    } else {
      // PMT = PV * r*(1+r)^n / ((1+r)^n - 1) — for savings (future value)
      let factor = (Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn;
      monthlyContrib = remaining / factor;
    }
  }

  // Build yearly data
  let yearlyData = buildYearlyData(currentSavings, monthlyContrib, monthlyReturn, months, goalAmount);
  let totalContributed = monthlyContrib * months;
  let finalBalance = yearlyData.length ? yearlyData[yearlyData.length - 1].balance : currentSavings;
  let totalInterest = completed ? 0 : finalBalance - currentSavings - totalContributed;

  calculatedResults = {
    goalAmount, currentSavings, remaining, monthlyContrib, months,
    annualReturn, totalContributed, totalInterest, yearlyData,
    calcMode, currentGoal, completed, totalSaved: completed ? currentSavings : goalAmount
  };

  displayResults();
}

function buildYearlyData(startBalance, monthly, monthlyRate, totalMonths, goal) {
  let data = [];
  let balance = startBalance;
  let yearCount = Math.ceil(totalMonths / 12);

  if (totalMonths === 0) {
    return [{
      year: 0,
      contributed: 0,
      interest: 0,
      balance: startBalance,
      progress: '100.0'
    }];
  }

  for (let y = 1; y <= yearCount; y++) {
    let monthsThisYear = Math.min(12, totalMonths - (y - 1) * 12);
    let contributed = 0;
    let interestEarned = 0;

    for (let m = 0; m < monthsThisYear; m++) {
      let interest = balance * monthlyRate;
      balance += interest + monthly;
      contributed += monthly;
      interestEarned += interest;
    }

    if (balance > goal) balance = goal;

    data.push({
      year: y,
      contributed: contributed,
      interest: interestEarned,
      balance: balance,
      progress: Math.min(100, (balance / goal * 100)).toFixed(1)
    });
  }
  return data;
}

/* ── DISPLAY RESULTS ─────────────────────────── */
function displayResults() {
  let r = calculatedResults;
  document.getElementById('resultsSection').style.display = 'block';

  // Summary
  let years = Math.floor(r.months / 12);
  let remMonths = r.months % 12;
  let timeStr = years > 0 ? `${years} year${years > 1 ? 's' : ''}` : '';
  if (remMonths > 0) timeStr += (timeStr ? ' and ' : '') + `${remMonths} month${remMonths > 1 ? 's' : ''}`;
  if (r.completed) timeStr = 'Already reached';

  let summary = '';
  if (r.completed) {
    summary = `You've already reached your <strong>${formatMoneyShort(r.goalAmount)}</strong> goal with <strong>${formatMoney(r.currentSavings)}</strong> saved. Required monthly savings: <strong>${formatMoney(0)}/month</strong>.`;
  } else if (r.calcMode === 'monthly') {
    summary = `Saving <strong>${formatMoney(r.monthlyContrib)}/month</strong> at <strong>${r.annualReturn}%</strong> annual return, you'll reach your <strong>${formatMoneyShort(r.goalAmount)}</strong> goal in <strong>${timeStr}</strong>.`;
  } else {
    summary = `To reach your <strong>${formatMoneyShort(r.goalAmount)}</strong> goal in <strong>${timeStr}</strong> at <strong>${r.annualReturn}%</strong> annual return, you need to save <strong>${formatMoney(r.monthlyContrib)}/month</strong>.`;
  }
  if (r.totalInterest > 0) {
    summary += ` Your money will earn <strong>${formatMoney(r.totalInterest)}</strong> in interest along the way.`;
  }
  document.getElementById('summaryBox').innerHTML = summary;

  // Result cards
  let cards = document.getElementById('resultsCards');
  cards.innerHTML = '';

  const makeCard = (label, id, highlight) => {
    let div = document.createElement('div');
    div.className = 'result-box' + (highlight ? ' highlight' : '');
    div.innerHTML = `<span>${label}</span><strong id="${id}">$0.00</strong>`;
    cards.appendChild(div);
  };

  if (r.calcMode === 'monthly') {
    makeCard('Time to Reach Goal', 'resTime', true);
    document.getElementById('resTime').textContent = timeStr;
    makeCard('Monthly Contribution', 'resMonthlySave', false);
    makeCard('Total You\'ll Contribute', 'resTotalContrib', false);
    makeCard('Interest Earned', 'resInterest', false);
    makeCard('Total Saved', 'resTotal', false);
  } else {
    makeCard('Required Monthly Savings', 'resMonthlySave', true);
    makeCard('Time to Reach Goal', 'resTime', false);
    document.getElementById('resTime').textContent = timeStr;
    makeCard('Total You\'ll Contribute', 'resTotalContrib', false);
    makeCard('Interest Earned', 'resInterest', false);
    makeCard('Total Saved', 'resTotal', false);
  }

  // Animate money values
  if (document.getElementById('resMonthlySave'))
    animateValue(document.getElementById('resMonthlySave'), 0, r.monthlyContrib, 1000);
  if (document.getElementById('resTotalContrib'))
    animateValue(document.getElementById('resTotalContrib'), 0, r.totalContributed, 1000);
  if (document.getElementById('resInterest'))
    animateValue(document.getElementById('resInterest'), 0, Math.max(r.totalInterest, 0), 1000);
  if (document.getElementById('resTotal'))
    animateValue(document.getElementById('resTotal'), 0, r.totalSaved, 1000);

  // Table
  buildTable();
  // Chart
  drawChart();

  document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── TABLE ───────────────────────────────────── */
function buildTable() {
  let r = calculatedResults;
  let tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  r.yearlyData.forEach(row => {
    let tr = document.createElement('tr');
    tr.innerHTML = `
      <td>Year ${row.year}</td>
      <td>${formatMoney(row.contributed)}</td>
      <td>${formatMoney(row.interest)}</td>
      <td>${formatMoney(row.balance)}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="flex:1;background:#e8eaf0;border-radius:4px;height:6px;">
            <div style="width:${row.progress}%;background:linear-gradient(90deg,#7C3AED,#EC4899);height:6px;border-radius:4px;"></div>
          </div>
          <span style="font-size:0.78rem;color:#64748b;white-space:nowrap;">${row.progress}%</span>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* ── CHART ───────────────────────────────────── */
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

  let labels = r.yearlyData.map(d => 'Year ' + d.year);
  let balances = r.yearlyData.map(d => d.balance);
  let goalLine = r.yearlyData.map(() => r.goalAmount);

  if (chartType === 'line') {
    myChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Savings Balance',
            data: balances,
            borderColor: '#7C3AED',
            backgroundColor: '#7C3AED15',
            fill: true, tension: 0.3, pointRadius: 4,
            pointBackgroundColor: '#7C3AED'
          },
          {
            label: 'Goal',
            data: goalLine,
            borderColor: '#EC4899',
            borderDash: [6, 4],
            backgroundColor: 'transparent',
            pointRadius: 0, tension: 0
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#0D1B2A', font: { family: 'Inter' } } } },
        scales: {
          x: { ticks: { color: '#64748b', font: { family: 'Inter' } }, grid: { color: '#e8eaf0' } },
          y: {
            ticks: { color: '#64748b', font: { family: 'Inter' }, callback: v => '$' + Number(v).toLocaleString() },
            grid: { color: '#e8eaf0' }
          }
        }
      }
    });
  } else {
    let contributed = r.yearlyData.map(d => d.contributed);
    let interest = r.yearlyData.map(d => d.interest);
    myChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Contributed', data: contributed, backgroundColor: '#7C3AED88', borderColor: '#7C3AED', borderWidth: 1 },
          { label: 'Interest', data: interest, backgroundColor: '#EC489988', borderColor: '#EC4899', borderWidth: 1 }
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
  }
}

/* ── WHAT-IF ─────────────────────────────────── */
function calcWhatIf() {
  let r = calculatedResults;
  let newMonthly = parseNum('whatIfAmount');
  if (!newMonthly || newMonthly <= 0) { alert('Please enter a monthly amount.'); return; }

  let monthlyReturn = r.annualReturn / 100 / 12;
  let balance = r.currentSavings;
  let months = 0;
  while (balance < r.goalAmount && months < 1200) {
    balance = balance * (1 + monthlyReturn) + newMonthly;
    months++;
  }

  let origMonths = r.months;
  let savedMonths = Math.max(0, origMonths - months);
  let savedYears = Math.floor(savedMonths / 12);
  let savedMo = savedMonths % 12;
  let timeStr = savedYears > 0 ? `${savedYears} year${savedYears > 1 ? 's' : ''}` : '';
  if (savedMo > 0) timeStr += (timeStr ? ' and ' : '') + `${savedMo} month${savedMo > 1 ? 's' : ''}`;

  let resultEl = document.getElementById('whatIfResult');
  resultEl.style.display = 'block';

  if (savedMonths > 0) {
    resultEl.innerHTML = `Saving <strong>${formatMoney(newMonthly)}/month</strong> instead, you'd reach your goal in <strong>${months} months</strong> — that's <strong>${timeStr} sooner</strong>! 🎉`;
  } else if (months >= origMonths) {
    resultEl.innerHTML = `At <strong>${formatMoney(newMonthly)}/month</strong> you'd reach your goal in <strong>${months} months</strong> — about the same timeline.`;
  } else {
    resultEl.innerHTML = `At <strong>${formatMoney(newMonthly)}/month</strong>, you'd reach your goal in <strong>${months} months</strong>.`;
  }
}

/* ── SHARE ───────────────────────────────────── */
function shareResults() {
  let r = calculatedResults;
  let years = Math.floor(r.months / 12);
  let remMonths = r.months % 12;
  let timeStr = years > 0 ? `${years} year${years > 1 ? 's' : ''}` : '';
  if (remMonths > 0) timeStr += (timeStr ? ' and ' : '') + `${remMonths} month${remMonths > 1 ? 's' : ''}`;

  let text = `🎯 Savings Goal Planner — MoneyMap IQ\n\n`;
  text += `Goal: ${formatMoney(r.goalAmount)}\n`;
  if (r.currentSavings > 0) text += `Current Savings: ${formatMoney(r.currentSavings)}\n`;
  text += `Monthly Contribution: ${formatMoney(r.monthlyContrib)}\n`;
  text += `Annual Return: ${r.annualReturn}%\n`;
  text += `Time to Goal: ${timeStr}\n`;
  text += `Total Contributed: ${formatMoney(r.totalContributed)}\n`;
  text += `Interest Earned: ${formatMoney(Math.max(r.totalInterest, 0))}\n\n`;
  text += `Plan yours → moneymap-iq.vercel.app`;

  navigator.clipboard.writeText(text).then(() => {
    let btn = document.querySelector('.share-btn');
    btn.textContent = '✅ Copied!';
    setTimeout(() => btn.textContent = '📤 Copy Results to Share', 2000);
  });
}

/* ── URL PARAMS (cross-linking) ──────────────── */
function readUrlParams() {
  let params = new URLSearchParams(window.location.search);
  let goal = params.get('goal');
  let amount = params.get('amount');

  if (goal) {
    let card = document.querySelector(`.goal-card[data-goal="${goal}"]`);
    if (card) {
      selectGoal(goal, card);
    }
  }

  if (amount) {
    let num = parseFloat(amount);
    if (!isNaN(num)) {
      document.getElementById('goalAmount').value = '$' + num.toLocaleString('en-US');
    }
  }
}

/* ── INIT ────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', function () {
  // Set default rate
  document.getElementById('annualReturn').value = '4.5%';

  // Read URL params for cross-linking
  readUrlParams();

  // Mark rate input as user-typed when they type
  document.getElementById('annualReturn').addEventListener('input', function() {
    this.dataset.userTyped = '1';
  });
});
