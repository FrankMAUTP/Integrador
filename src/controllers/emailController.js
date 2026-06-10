const emailService = require('../services/emailService');

async function sendContact(req, res) {
  const { fromName, fromEmail, subject, message } = req.body || {};
  if (!fromName || !fromEmail || !subject || !message)
    return res.status(400).json({ error: 'Campos incompletos' });
  try {
    await emailService.sendContactMessage({ fromName, fromEmail, subject, message });
    res.json({ ok: true });
  } catch (err) {
    console.error('Contact email error:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'No se pudo enviar el mensaje. Intenta más tarde.' });
  }
}

async function sendCode(req, res) {
  const { toEmail, code } = req.body || {};
  if (!toEmail || !code) return res.status(400).json({ error: 'Campos incompletos' });
  try {
    await emailService.sendRecoveryCode({ toEmail, code });
    res.json({ ok: true });
  } catch (err) {
    console.error('Recovery email error:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'No se pudo enviar el código. Intenta más tarde.' });
  }
}

module.exports = { sendContact, sendCode };
