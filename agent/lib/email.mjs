export async function sendEmail({ to, from, replyTo, subject, text, html, apiKey }) {
  const body = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: from, name: "LMH update agent" },
    subject,
    content: [
        { type: "text/plain", value: text },
        ...(html ? [{ type: "text/html", value: html }] : []),
      ],
    ...(replyTo ? { reply_to: { email: replyTo } } : {}),
  };
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`SendGrid send failed ${res.status}: ${await res.text()}`);
  }
}
