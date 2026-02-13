import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || 'simhal2016@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_TO = process.env.EMAIL_ERRORS_TO || 'simhal2016@gmail.com';

function getTransporter() {
  if (!SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
}

/**
 * Envia email de reporte de erro do frontend
 */
export async function sendErrorReport({ message, stack, source, userAgent, timestamp }) {
  const transport = getTransporter();
  if (!transport) return { ok: false, error: 'SMTP não configurado (SMTP_PASS)' };
  const html = `
    <h2>Erro no VertexAds Financeiro</h2>
    <p><strong>Mensagem:</strong> ${String(message || '').replace(/</g, '&lt;')}</p>
    <p><strong>Origem:</strong> ${String(source || '').replace(/</g, '&lt;')}</p>
    <p><strong>Horário:</strong> ${String(timestamp || new Date().toISOString())}</p>
    <p><strong>User-Agent:</strong> ${String(userAgent || '').replace(/</g, '&lt;')}</p>
    <pre style="background:#f5f5f5;padding:12px;overflow:auto;">${String(stack || '').replace(/</g, '&lt;')}</pre>
  `;
  await transport.sendMail({
    from: `"VertexAds Financeiro" <${SMTP_USER}>`,
    to: EMAIL_TO,
    subject: `[Erro] VertexAds - ${String(message || 'Erro').slice(0, 60)}`,
    html
  });
  return { ok: true };
}

/**
 * Envia email de teste
 */
export async function sendTestEmail() {
  const transport = getTransporter();
  if (!transport) return { ok: false, error: 'SMTP não configurado. Defina SMTP_PASS no .env (use App Password do Gmail).' };
  await transport.sendMail({
    from: `"VertexAds Financeiro" <${SMTP_USER}>`,
    to: EMAIL_TO,
    subject: '[VertexAds] Teste de envio de email',
    html: '<p>Envio de email de teste configurado com sucesso.</p><p>O sistema de reporte de erros está funcionando.</p>'
  });
  return { ok: true };
}
