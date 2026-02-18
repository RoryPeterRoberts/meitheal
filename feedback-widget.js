// ============================================================
// MEITHEAL FEEDBACK WIDGET
// Drop into any member-facing page to add the feedback FAB.
// Requires: supabase.js (getSupabase), js/auth.js (getCachedMember)
// Usage: call initFeedbackWidget() after auth is confirmed
// ============================================================

(function () {
  const TYPES = [
    { id: 'idea',     label: "I'd like to suggest something",  emoji: '💡', hint: '' },
    { id: 'bug',      label: "Something isn't working",        emoji: '🔧', hint: '' },
    { id: 'question', label: 'I have a question',              emoji: '❓', hint: '' },
    { id: 'other',    label: 'Something else',                 emoji: '💬', hint: '' },
  ];

  function injectStyles() {
    if (document.getElementById('mth-fw-styles')) return;
    const style = document.createElement('style');
    style.id = 'mth-fw-styles';
    style.textContent = `
      .mth-fab {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: var(--color-primary);
        color: var(--color-text-inverse);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        box-shadow: var(--shadow-lg);
        transition: all var(--transition-fast);
        z-index: 900;
      }
      .mth-fab:hover {
        background: var(--color-primary-dark);
        transform: scale(1.08);
      }

      .mth-overlay {
        position: fixed;
        inset: 0;
        background: rgba(44, 62, 44, 0.4);
        z-index: 1000;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding: 0 0 24px;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s;
      }
      .mth-overlay.open {
        opacity: 1;
        pointer-events: all;
      }

      .mth-modal {
        background: var(--color-bg-card);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-xl, 20px);
        width: 100%;
        max-width: 480px;
        padding: var(--space-6);
        box-shadow: var(--shadow-xl);
        transform: translateY(24px);
        transition: transform 0.2s;
      }
      .mth-overlay.open .mth-modal {
        transform: translateY(0);
      }

      .mth-modal-title {
        font-family: var(--font-family-heading);
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-bold);
        font-style: italic;
        color: var(--color-text);
        margin-bottom: var(--space-1);
      }
      .mth-modal-sub {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        margin-bottom: var(--space-5);
        line-height: var(--line-height-relaxed);
      }

      .mth-types {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-2);
        margin-bottom: var(--space-4);
      }
      .mth-type-btn {
        background: var(--color-bg-muted);
        border: 2px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: var(--space-3);
        cursor: pointer;
        text-align: left;
        transition: all var(--transition-fast);
        font-family: var(--font-family);
      }
      .mth-type-btn:hover {
        border-color: var(--color-primary-lighter);
        background: var(--color-primary-bg);
      }
      .mth-type-btn.selected {
        border-color: var(--color-primary);
        background: var(--color-primary-bg);
      }
      .mth-type-emoji { font-size: 20px; margin-bottom: var(--space-1); display: block; }
      .mth-type-label {
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text);
        display: block;
      }
      .mth-type-hint {
        font-size: 11px;
        color: var(--color-text-muted);
        display: block;
        margin-top: 2px;
        line-height: 1.3;
      }

      .mth-textarea {
        width: 100%;
        background: var(--color-bg-muted);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        color: var(--color-text);
        font-family: var(--font-family);
        font-size: var(--font-size-sm);
        padding: var(--space-3) var(--space-4);
        resize: none;
        height: 100px;
        line-height: var(--line-height-normal);
        transition: border-color var(--transition-fast);
        outline: none;
        box-sizing: border-box;
        margin-bottom: var(--space-4);
      }
      .mth-textarea:focus {
        border-color: var(--color-primary);
        background: var(--color-bg-card);
      }
      .mth-textarea::placeholder { color: var(--color-text-light); }

      .mth-actions {
        display: flex;
        gap: var(--space-3);
        justify-content: flex-end;
      }
      .mth-btn {
        padding: var(--space-2) var(--space-5);
        border-radius: var(--radius-lg);
        font-family: var(--font-family);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        cursor: pointer;
        transition: all var(--transition-fast);
        border: 1px solid var(--color-border);
      }
      .mth-btn-ghost {
        background: none;
        color: var(--color-text-muted);
      }
      .mth-btn-ghost:hover { color: var(--color-text); }
      .mth-btn-primary {
        background: var(--color-primary);
        color: var(--color-text-inverse);
        border-color: var(--color-primary);
      }
      .mth-btn-primary:hover { background: var(--color-primary-dark); }
      .mth-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

      .mth-toast {
        position: fixed;
        bottom: 88px;
        right: 24px;
        background: var(--color-text);
        color: var(--color-text-inverse);
        padding: var(--space-3) var(--space-5);
        border-radius: var(--radius-lg);
        font-family: var(--font-family);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        box-shadow: var(--shadow-lg);
        z-index: 1100;
        opacity: 0;
        transform: translateY(8px);
        transition: all 0.2s;
        pointer-events: none;
      }
      .mth-toast.show {
        opacity: 1;
        transform: translateY(0);
      }

      .mth-confirm {
        display: none;
        text-align: center;
        padding: var(--space-4) 0 var(--space-2);
      }
      .mth-confirm.show { display: block; }
      .mth-confirm-icon { font-size: 36px; margin-bottom: var(--space-3); }
      .mth-confirm-title {
        font-family: var(--font-family-heading);
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-bold);
        color: var(--color-text);
        margin-bottom: var(--space-2);
      }
      .mth-confirm-body {
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
        line-height: var(--line-height-relaxed);
        margin-bottom: var(--space-5);
      }
      .mth-confirm-actions {
        display: flex;
        gap: var(--space-3);
        justify-content: center;
        flex-wrap: wrap;
      }
      .mth-confirm-link {
        display: inline-block;
        padding: var(--space-2) var(--space-5);
        background: var(--color-primary);
        color: var(--color-text-inverse);
        border-radius: var(--radius-lg);
        font-family: var(--font-family);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        text-decoration: none;
        transition: background var(--transition-fast);
      }
      .mth-confirm-link:hover { background: var(--color-primary-dark); }
    `;
    document.head.appendChild(style);
  }

  function injectHTML() {
    if (document.getElementById('mth-feedback-widget')) return;

    const wrap = document.createElement('div');
    wrap.id = 'mth-feedback-widget';
    wrap.innerHTML = `
      <button class="mth-fab" id="mth-fab" title="Share feedback" aria-label="Share feedback">
        💬
      </button>

      <div class="mth-overlay" id="mth-overlay">
        <div class="mth-modal" role="dialog" aria-modal="true" aria-label="Share feedback">
          <div class="mth-modal-title">What's on your mind?</div>
          <div class="mth-modal-sub">Your thoughts help shape this community.</div>

          <div class="mth-types" id="mth-types">
            ${TYPES.map(t => `
              <button class="mth-type-btn" data-type="${t.id}" onclick="window._mthSelectType('${t.id}')">
                <span class="mth-type-emoji">${t.emoji}</span>
                <span class="mth-type-label">${t.label}</span>
                <span class="mth-type-hint">${t.hint}</span>
              </button>
            `).join('')}
          </div>

          <textarea
            class="mth-textarea"
            id="mth-message"
            placeholder="Write anything — there's no wrong way to say it."
          ></textarea>

          <div class="mth-actions">
            <button class="mth-btn mth-btn-ghost" onclick="window._mthClose()">Cancel</button>
            <button class="mth-btn mth-btn-primary" id="mth-submit" onclick="window._mthSubmit()" disabled>Send</button>
          </div>

          <div class="mth-confirm" id="mth-confirm">
            <div class="mth-confirm-icon">✅</div>
            <div class="mth-confirm-title">Sent — thank you</div>
            <div class="mth-confirm-body">
              Your idea has gone to the community stewards for review.<br>
              If it gets taken forward you'll see it on the Proposals page,<br>
              and you'll be asked to confirm it turned out right once built.
            </div>
            <div class="mth-confirm-actions">
              <a class="mth-confirm-link" href="my-feedback.html">Track your idea →</a>
              <button class="mth-btn mth-btn-ghost" onclick="window._mthClose()">Close</button>
            </div>
          </div>
        </div>
      </div>

      <div class="mth-toast" id="mth-toast"></div>
    `;
    document.body.appendChild(wrap);

    // Close on overlay click
    document.getElementById('mth-overlay').addEventListener('click', function (e) {
      if (e.target === this) window._mthClose();
    });

    // Enable submit when message is typed
    document.getElementById('mth-message').addEventListener('input', function () {
      document.getElementById('mth-submit').disabled = this.value.trim().length === 0;
    });
  }

  let _selectedType = null;
  let _memberId = null;

  window._mthSelectType = function (type) {
    _selectedType = type;
    document.querySelectorAll('.mth-type-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.type === type);
    });
    const msg = document.getElementById('mth-message');
    if (msg && msg.value.trim().length > 0) {
      document.getElementById('mth-submit').disabled = false;
    }
  };

  window._mthClose = function () {
    const overlay = document.getElementById('mth-overlay');
    if (overlay) overlay.classList.remove('open');
    document.getElementById('mth-fab').style.display = '';
    _selectedType = null;
    const msg = document.getElementById('mth-message');
    if (msg) { msg.value = ''; msg.style.display = ''; }
    document.querySelectorAll('.mth-type-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('mth-submit').disabled = true;
    // Reset confirmation screen
    const confirm = document.getElementById('mth-confirm');
    if (confirm) confirm.classList.remove('show');
    const title = document.querySelector('.mth-modal-title');
    const sub   = document.querySelector('.mth-modal-sub');
    const types = document.getElementById('mth-types');
    const actions = document.querySelector('.mth-actions');
    if (title)   title.style.display = '';
    if (sub)     sub.style.display = '';
    if (types)   types.style.display = '';
    if (actions) actions.style.display = '';
    const btn = document.getElementById('mth-submit');
    if (btn) btn.textContent = 'Send';
  };

  window._mthSubmit = async function () {
    const message = document.getElementById('mth-message').value.trim();
    if (!message) return;

    const btn = document.getElementById('mth-submit');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    try {
      await createFeedbackRecord({
        author_id: _memberId,
        message,
        type: _selectedType || 'other',
      });

      // Show confirmation screen inside the modal
      document.getElementById('mth-types').style.display = 'none';
      document.getElementById('mth-message').style.display = 'none';
      document.querySelector('.mth-modal-title').style.display = 'none';
      document.querySelector('.mth-modal-sub').style.display = 'none';
      document.querySelector('.mth-actions').style.display = 'none';
      document.getElementById('mth-confirm').classList.add('show');
    } catch (e) {
      console.error('Feedback error:', e);
      btn.disabled = false;
      btn.textContent = 'Send';
      window._mthShowToast('Something went wrong. Please try again.');
    }
  };

  window._mthShowToast = function (msg) {
    const toast = document.getElementById('mth-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  };

  window.openFeedbackWidget = function () {
    const overlay = document.getElementById('mth-overlay');
    if (overlay) {
      overlay.classList.add('open');
      document.getElementById('mth-fab').style.display = 'none';
      setTimeout(() => document.getElementById('mth-message')?.focus(), 200);
    }
  };

  window.initFeedbackWidget = function (memberId) {
    _memberId = memberId || null;
    injectStyles();
    injectHTML();
    document.getElementById('mth-fab').addEventListener('click', window.openFeedbackWidget);
  };
})();
