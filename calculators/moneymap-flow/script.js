const questions = [
  {
    key: 'emergencyFund',
    title: 'Do you have an emergency fund?',
    text: 'A starter cushion helps you handle surprise expenses without relying on credit cards.',
    icon: '<svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.5-2.9 8.5-7 10-4.1-1.5-7-5.5-7-10V6l7-3z"/><path d="M9 12l2 2 4-5"/></svg>'
  },
  {
    key: 'highInterestDebt',
    title: 'Do you have high-interest debt?',
    text: 'Credit cards and other high-rate debt can quietly eat up money that could go toward goals.',
    icon: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M7 15h4"/></svg>'
  },
  {
    key: 'matchAvailable',
    title: 'Are you getting your full 401(k) match?',
    text: 'If your employer offers a match, it is often one of the highest-impact places to start.',
    icon: '<svg viewBox="0 0 24 24"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-5"/><path d="M12 16V8"/><path d="M16 16v-7"/><path d="M7 9l4-4 3 3 5-5"/></svg>'
  },
  {
    key: 'retirementContributions',
    title: 'Are you contributing to retirement accounts?',
    text: 'Once the basics are covered, IRA, HSA, and retirement contributions can build long-term wealth.',
    icon: '<svg viewBox="0 0 24 24"><path d="M12 21V9"/><path d="M8 13c-3 0-5-2-5-5 3 0 5 2 5 5z"/><path d="M16 13c3 0 5-2 5-5-3 0-5 2-5 5z"/><path d="M12 9c0-3 2-5 5-5 0 3-2 5-5 5z"/></svg>'
  },
  {
    key: 'extraMoney',
    title: 'Do you have extra money available?',
    text: 'After essentials and core savings are handled, extra cash can be directed toward investing or lower-rate debt.',
    icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 6v12"/><path d="M15 8.5c-.7-.7-1.6-1-2.8-1-1.6 0-2.7.8-2.7 2 0 3 5.7 1.4 5.7 4.7 0 1.3-1.1 2.2-3 2.2-1.3 0-2.5-.4-3.3-1.3"/></svg>'
  }
];

const roadmapSteps = [
  { id: 'emergency', label: 'Emergency Fund', short: 'Cash cushion' },
  { id: 'debt', label: 'Debt', short: 'High-interest payoff' },
  { id: 'match', label: '401(k)', short: 'Employer match' },
  { id: 'retirement', label: 'Retirement', short: 'IRA / HSA' },
  { id: 'investing', label: 'Investing', short: 'Build wealth' },
  { id: 'lowDebt', label: 'Low-Interest Debt', short: 'Optimize later' }
];

const recommendations = {
  emergency: {
    title: 'Build your emergency fund',
    text: 'Start by creating a cash cushion so surprise expenses do not knock the rest of your plan off course.',
    primaryLabel: 'Open Savings Goal Planner',
    primaryHref: '../savings/index.html',
    secondaryLabel: 'Estimate home savings',
    secondaryHref: '../mortgage/index.html'
  },
  debt: {
    title: 'Pay off high-interest debt',
    text: 'High-interest balances can grow faster than most investments. Make a payoff plan before adding more complexity.',
    primaryLabel: 'Debt Payoff Calculator Coming Soon',
    disabled: true,
    secondaryLabel: 'Build a cash buffer first',
    secondaryHref: '../savings/index.html'
  },
  match: {
    title: 'Capture your 401(k) match',
    text: 'If a match is available, consider contributing enough to capture it before moving to other long-term goals.',
    primaryLabel: 'Open Investment Calculator',
    primaryHref: '../investment/index.html',
    secondaryLabel: 'Plan monthly savings',
    secondaryHref: '../savings/index.html'
  },
  retirement: {
    title: 'Start retirement accounts',
    text: 'Once your foundation is steady, use tax-advantaged accounts like an IRA or HSA to build long-term momentum.',
    primaryLabel: 'Open Investment Calculator',
    primaryHref: '../investment/index.html',
    secondaryLabel: 'Plan a car purchase',
    secondaryHref: '../car/index.html'
  },
  investing: {
    title: 'Start investing',
    text: 'With your core bases covered, put extra money to work toward long-term growth.',
    primaryLabel: 'Open Investment Calculator',
    primaryHref: '../investment/index.html',
    secondaryLabel: 'Plan a savings goal',
    secondaryHref: '../savings/index.html'
  },
  maintenance: {
    title: 'Stay ready and revisit your next step',
    text: 'Your foundation looks solid. Keep your plan updated and revisit investing, big purchases, or low-interest debt when extra cash appears.',
    primaryLabel: 'Open Investment Calculator',
    primaryHref: '../investment/index.html',
    secondaryLabel: 'Compare mortgage costs',
    secondaryHref: '../mortgage/index.html'
  }
};

let currentStepIndex = 0;
let answers = {};

function startFlow() {
  document.getElementById('questionCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function selectAnswer(answer) {
  const step = questions[currentStepIndex];
  answers[step.key] = answer;
  document.querySelectorAll('#answerGrid .toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.answer === answer);
  });
  document.getElementById('nextBtn').disabled = false;
  updateRecommendation();
}

function goNext() {
  if (!answers[questions[currentStepIndex].key]) return;
  if (currentStepIndex < questions.length - 1) {
    currentStepIndex += 1;
    renderQuestion();
  } else {
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function goBack() {
  if (currentStepIndex === 0) return;
  currentStepIndex -= 1;
  renderQuestion();
}

function resetFlow() {
  answers = {};
  currentStepIndex = 0;
  renderQuestion();
  updateRecommendation();
  document.getElementById('questionCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function getRecommendationId() {
  if (answers.emergencyFund !== 'yes') return 'emergency';
  if (answers.highInterestDebt !== 'no') return 'debt';
  if (answers.matchAvailable !== 'yes') return 'match';
  if (answers.retirementContributions !== 'yes') return 'retirement';
  if (answers.extraMoney === undefined || answers.extraMoney === 'yes') return 'investing';
  return 'maintenance';
}

function getRoadmapStatuses(recommendationId) {
  const currentIndex = roadmapSteps.findIndex(step => step.id === recommendationId);
  return roadmapSteps.map((step, index) => {
    if (recommendationId === 'maintenance') {
      return index < roadmapSteps.length - 1 ? 'Done' : 'Next';
    }
    if (index < currentIndex) return 'Done';
    if (index === currentIndex) return 'Focus now';
    if (index === currentIndex + 1) return 'Next';
    return 'Later';
  });
}

function renderQuestion() {
  const step = questions[currentStepIndex];
  const selected = answers[step.key];
  const progress = Math.round(((currentStepIndex + 1) / questions.length) * 100);
  const questionCard = document.getElementById('questionCard');

  questionCard.classList.remove('is-visible');
  window.setTimeout(() => {
    document.getElementById('questionKicker').textContent = `Question ${currentStepIndex + 1} of ${questions.length}`;
    document.getElementById('progressCount').textContent = `${progress}%`;
    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('questionIcon').innerHTML = step.icon;
    document.getElementById('questionTitle').textContent = step.title;
    document.getElementById('questionText').textContent = step.text;
    document.getElementById('backBtn').disabled = currentStepIndex === 0;
    document.getElementById('nextBtn').textContent = currentStepIndex === questions.length - 1 ? 'See My Next Step' : 'Next';
    document.getElementById('nextBtn').disabled = !selected;
    document.querySelectorAll('#answerGrid .toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.answer === selected);
    });
    questionCard.classList.add('is-visible');
  }, 120);
}

function renderRoadmap(recommendationId) {
  const statuses = getRoadmapStatuses(recommendationId);
  const roadmap = document.getElementById('roadmapList');
  roadmap.innerHTML = roadmapSteps.map((step, index) => {
    const status = statuses[index];
    const statusClass = status.toLowerCase().replace(/\s+/g, '-');
    return `
      <article class="roadmap-step status-${statusClass}">
        <span class="roadmap-node" aria-hidden="true">${index + 1}</span>
        <div>
          <h3>${step.label}</h3>
          <p>${step.short}</p>
        </div>
        <span class="roadmap-status">${status}</span>
      </article>
    `;
  }).join('');
}

function renderRecommendation(recommendationId) {
  const recommendation = recommendations[recommendationId];
  const actions = document.getElementById('recommendationActions');

  document.getElementById('recommendationTitle').textContent = recommendation.title;
  document.getElementById('recommendationText').textContent = recommendation.text;
  document.getElementById('recommendationStatus').textContent = recommendationId === 'maintenance' ? 'Next' : 'Focus now';

  const primary = recommendation.disabled
    ? `<span class="calculate-btn disabled-cta" aria-disabled="true">${recommendation.primaryLabel}</span>`
    : `<a class="calculate-btn" href="${recommendation.primaryHref}">${recommendation.primaryLabel}</a>`;

  const secondary = recommendation.secondaryHref
    ? `<a class="share-btn secondary-cta" href="${recommendation.secondaryHref}">${recommendation.secondaryLabel}</a>`
    : '';

  actions.innerHTML = primary + secondary;
}

function updateRecommendation() {
  const recommendationId = getRecommendationId();
  renderRoadmap(recommendationId);
  renderRecommendation(recommendationId);
}

function toggleCalcDropdown() {
  const dropdown = document.querySelector('.mmiq-dropdown');
  dropdown.classList.toggle('active');
}

document.addEventListener('click', function(event) {
  const dropdown = document.querySelector('.mmiq-dropdown');
  if (dropdown && !dropdown.contains(event.target)) {
    dropdown.classList.remove('active');
  }
});

window.addEventListener('DOMContentLoaded', function() {
  renderQuestion();
  updateRecommendation();
});
