/* Wasul email submissions through FormSubmit. */
'use strict';

(function () {
  const RECIPIENT_EMAIL   = 'omar-b@wosol.net';      // مستلم طلبات التسجيل
  const REGISTRATION_CC   = 'esraa.f@wosol.net';     // نسخة من طلبات التسجيل
  const CONTACT_RECIPIENT = 'info@wosol.net';        // مستلم نماذج التواصل
  const CONTACT_CC        = 'omar-b@wosol.net';      // نسخة من نماذج التواصل

  const endpointFor = email => `https://formsubmit.co/ajax/${encodeURIComponent(email)}`;

  function readableName(name) {
    return String(name || '')
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function collectFormData(form, subject, cc) {
    const data = new FormData(form);
    data.set('_subject', subject);
    if (cc) data.set('_cc', cc);
    data.set('_template', 'table');
    data.set('_captcha', 'true');
    data.set('_honeypot', '');
    data.append('_next', window.location.href);

    const namedEntries = [...data.entries()]
      .filter(([key]) => !key.startsWith('_'))
      .map(([key, value]) => `${readableName(key)}: ${value || '-'}`);

    data.set('form_source', document.title || window.location.pathname);
    data.set('sent_at', new Date().toLocaleString('ar-SA'));
    data.set('summary', namedEntries.join('\n'));

    return data;
  }

  /**
   * @param {HTMLFormElement} form
   * @param {string} subject
   * @param {{to?: string, cc?: string}} [options] المستلم ونسخته — الافتراضي RECIPIENT_EMAIL
   */
  async function submitForm(form, subject, options = {}) {
    const now = Date.now();
    const last = parseInt(sessionStorage.getItem('_wasul_last_submit') || '0', 10);
    if (now - last < 30000) {
      throw new Error('يرجى الانتظار 30 ثانية قبل إرسال طلب آخر');
    }
    sessionStorage.setItem('_wasul_last_submit', String(now));

    const response = await fetch(endpointFor(options.to || RECIPIENT_EMAIL), {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: collectFormData(form, subject, options.cc),
    });

    if (!response.ok) {
      throw new Error(`Email submit failed with status ${response.status}`);
    }

    return response.json().catch(() => ({}));
  }

  window.WASUL_EMAIL = {
    recipient: RECIPIENT_EMAIL,
    registrationCc: REGISTRATION_CC,
    contactRecipient: CONTACT_RECIPIENT,
    contactCc: CONTACT_CC,
    submitForm,
  };
})();
