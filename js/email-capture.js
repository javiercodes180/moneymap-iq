// ============================================================
// MoneyMap IQ — Email Capture Utility
// Add this file to your /js/ folder and include it on every page:
// <script src="/js/email-capture.js"></script>
// ============================================================

const KIT_API_KEY = 'uOF-w_idN4uiOVogO1meVg';

const KIT_FORMS = {
  homepage:    '9421313',
  savings:     '9421321',
  investment:  '9421334',
  mortgage:    '9421341',
  car:         '9421344',
  flow:        '9421345',
  debt:        '9421348',
};

const KIT_TAGS = {
  homepage:    'homepage-hero',
  savings:     'post-results-savings',
  investment:  'post-results-investment',
  mortgage:    'post-results-mortgage',
  car:         'post-results-car',
  flow:        'post-results-flow',
  debt:        'post-results-debt',
};

// ── Core submit function ──────────────────────────────────────
// Submits an email to a Kit form with an optional tag.
// Returns true on success, false on failure.

async function submitToKit(email, formKey) {
  if (!email || !email.includes('@')) return false;

  const formId = KIT_FORMS[formKey];
  const tag    = KIT_TAGS[formKey];

  if (!formId) {
    console.error('Unknown form key:', formKey);
    return false;
  }

  try {
    const res = await fetch(
      `https://api.convertkit.com/v3/forms/${formId}/subscribe`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key:      KIT_API_KEY,
          email:        email,
          tags:         [tag],
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      return data.subscription ? true : false;
    }
    return false;
  } catch (e) {
    console.error('Kit submission error:', e);
    return false;
  }
}

// ── Homepage hero capture ─────────────────────────────────────
// Place this HTML in index.html between hero stats and calculator grid:
//
// <div class="email-capture-strip">
//   <p class="capture-headline">Get your free MoneyMap Starter Kit</p>
//   <p class="capture-sub">Your first 5 money moves — plain English, no jargon</p>
//   <div class="capture-row">
//     <input type="email" id="hero-email" placeholder="your@email.com" />
//     <button onclick="handleHeroSubmit()">Send it free</button>
//   </div>
//   <p id="hero-msg" class="capture-msg"></p>
// </div>

async function handleHeroSubmit() {
  const input = document.getElementById('hero-email');
  const msg   = document.getElementById('hero-msg');
  const btn   = document.querySelector('.email-capture-strip button');
  if (!input || !msg) return;

  const email = input.value.trim();
  if (!email) {
    msg.textContent = 'Please enter your email address.';
    msg.style.color = '#EC4899';
    return;
  }

  btn.textContent = 'Sending...';
  btn.disabled = true;

  const ok = await submitToKit(email, 'homepage');

  if (ok) {
    msg.textContent = '✓ Check your inbox — your free guide is on its way!';
    msg.style.color = '#10b981';
    input.value = '';
  } else {
    msg.textContent = 'Something went wrong — please try again.';
    msg.style.color = '#EC4899';
  }

  btn.textContent = 'Send it free';
  btn.disabled = false;
}

// ── Post-results capture (all calculators) ────────────────────
// Add this HTML to each calculator page, hidden by default:
//
// <div id="results-capture" class="results-email-capture" style="display:none;">
//   <p class="capture-headline">Save your results + get your plan</p>
//   <p class="capture-sub">We'll email you a summary and a free checklist of next steps.</p>
//   <div class="capture-row">
//     <input type="email" id="results-email" placeholder="your@email.com" />
//     <button onclick="handleResultsSubmit()">Email me this</button>
//   </div>
//   <p id="results-msg" class="capture-msg"></p>
// </div>
//
// Then call showEmailCapture('savings') after results render in each calculator's JS.

function showEmailCapture(formKey) {
  const el = document.getElementById('results-capture');
  if (!el) return;
  el.style.display = 'block';
  el.dataset.formKey = formKey;
}

async function handleResultsSubmit() {
  const el    = document.getElementById('results-capture');
  const input = document.getElementById('results-email');
  const msg   = document.getElementById('results-msg');
  const btn   = el ? el.querySelector('button') : null;
  if (!el || !input || !msg) return;

  const email   = input.value.trim();
  const formKey = el.dataset.formKey || 'homepage';

  if (!email) {
    msg.textContent = 'Please enter your email address.';
    msg.style.color = '#EC4899';
    return;
  }

  if (btn) { btn.textContent = 'Sending...'; btn.disabled = true; }

  const ok = await submitToKit(email, formKey);

  if (ok) {
    el.innerHTML = `
      <p class="capture-success">
        ✓ Your results are on their way — check your inbox!
      </p>`;
  } else {
    msg.textContent = 'Something went wrong — please try again.';
    msg.style.color = '#EC4899';
    if (btn) { btn.textContent = 'Email me this'; btn.disabled = false; }
  }
}

// ── Footer persistent bar ─────────────────────────────────────
// Add this HTML inside your footer on every page:
//
// <div class="footer-capture">
//   <div class="footer-capture-text">
//     <strong>The MoneyMap Weekly</strong>
//     <span>One money tip, every Friday. Free.</span>
//   </div>
//   <div class="capture-row">
//     <input type="email" id="footer-email" placeholder="your@email.com" />
//     <button onclick="handleFooterSubmit()">Subscribe</button>
//   </div>
//   <p id="footer-msg" class="capture-msg"></p>
// </div>

async function handleFooterSubmit() {
  const input = document.getElementById('footer-email');
  const msg   = document.getElementById('footer-msg');
  const btn   = document.querySelector('.footer-capture button');
  if (!input || !msg) return;

  const email = input.value.trim();
  if (!email) {
    msg.textContent = 'Please enter your email address.';
    msg.style.color = '#EC4899';
    return;
  }

  if (btn) { btn.textContent = 'Subscribing...'; btn.disabled = true; }

  const ok = await submitToKit(email, 'homepage');

  if (ok) {
    msg.textContent = '✓ You\'re in! Check your inbox for your first email.';
    msg.style.color = '#10b981';
    input.value = '';
  } else {
    msg.textContent = 'Something went wrong — please try again.';
    msg.style.color = '#EC4899';
  }

  if (btn) { btn.textContent = 'Subscribe'; btn.disabled = false; }
}
