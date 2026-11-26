/**
 * Enquiry form. Sends JSON to the configured endpoint (PUBLIC_FORM_ENDPOINT).
 * Success is only shown when the endpoint confirms receipt. With no endpoint
 * configured, the visitor is told plainly that nothing was sent.
 */
export function initForm() {
  const form = document.querySelector<HTMLFormElement>('[data-enquiry]');
  if (!form) return;
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const buttonLabel = button.querySelector('.btn-label')!;
  const endpoint = form.dataset.endpoint?.trim() ?? '';

  // "Discuss an opportunity" links preselect the matching interest.
  document.querySelectorAll<HTMLAnchorElement>('[data-interest]').forEach((a) => {
    a.addEventListener('click', () => {
      const input = form.querySelector<HTMLInputElement>(`input[name="interest"][value="${a.dataset.interest}"]`);
      if (input) input.checked = true;
    });
  });

  const setStatus = (msg: string, kind: 'ok' | 'error' | 'notice' | '' = '') => {
    status.textContent = msg;
    status.className = 'form-status' + (kind ? ` is-${kind}` : '');
  };

  const validate = () => {
    let firstInvalid: HTMLInputElement | null = null;
    const checks: [string, (v: string) => boolean][] = [
      ['f-name', (v) => v.trim().length > 1],
      ['f-phone', (v) => v.replace(/[^\d]/g, '').length >= 10],
    ];
    for (const [id, test] of checks) {
      const input = form.querySelector<HTMLInputElement>(`#${id}`)!;
      const err = form.querySelector<HTMLElement>(`#${id}-err`)!;
      const ok = test(input.value);
      input.setAttribute('aria-invalid', String(!ok));
      if (ok) input.removeAttribute('aria-describedby');
      else input.setAttribute('aria-describedby', `${id}-err`);
      err.hidden = ok;
      if (!ok && !firstInvalid) firstInvalid = input;
    }
    return firstInvalid;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const invalid = validate();
    if (invalid) { invalid.focus(); setStatus('Please check the highlighted fields.', 'error'); return; }

    if (!endpoint) {
      setStatus(
        'Online enquiries are not connected yet, so this message has not been sent or stored. Please try again soon.',
        'notice',
      );
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    if (data._gotcha) return; // spam trap
    delete data._gotcha;

    button.disabled = true;
    buttonLabel.textContent = 'Sending…';
    setStatus('');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...data, source: 'smpd.in' }),
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      setStatus('Thank you. Your enquiry has reached us and someone from the family will be in touch.', 'ok');
    } catch {
      setStatus('Sorry, your enquiry could not be sent just now. Please try again in a moment.', 'error');
    } finally {
      button.disabled = false;
      buttonLabel.textContent = 'Send enquiry';
    }
  });

  form.querySelectorAll<HTMLInputElement>('#f-name, #f-phone').forEach((input) =>
    // Re-check while typing (not on blur) so the submit button never shifts under a click.
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') validate();
    }),
  );
}
