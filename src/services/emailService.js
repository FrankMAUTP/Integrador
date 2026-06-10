const { emailDomainExists, sendContactEmail, sendRecoveryEmail } = require('../../utils/mailer');

function createError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function sendContactMessage({ fromName, fromEmail, subject, message }) {
  const valid = await emailDomainExists(fromEmail);
  if (!valid) throw createError('El dominio del correo no existe o no acepta emails', 400);
  await sendContactEmail({ fromName, fromEmail, subject, message });
}

async function sendRecoveryCode({ toEmail, code }) {
  const valid = await emailDomainExists(toEmail);
  if (!valid) throw createError('El dominio del correo no existe o no acepta emails', 400);
  await sendRecoveryEmail({ toEmail, code });
}

module.exports = { sendContactMessage, sendRecoveryCode };
