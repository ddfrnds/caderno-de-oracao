import nodemailer from 'nodemailer';

export async function sendMail(to: string, subject: string, text: string, html: string): Promise<void> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('GMAIL_USER / GMAIL_APP_PASSWORD não configurados');
    }
    console.log(`\n[e-mail simulado em desenvolvimento]\nPara: ${to}\nAssunto: ${subject}\n${text}\n`);
    return;
  }
  const transport = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
  await transport.sendMail({
    from: `"Caderno de Oração" <${user}>`,
    to,
    subject,
    text,
    html,
  });
}
