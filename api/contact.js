function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { name, email, phone, message } = req.body
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Fält saknas' })
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Ogiltig e-postadress' })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API-nyckel saknas' })

  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safePhone = phone ? escapeHtml(phone) : null
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>')

  const html = `
    <p><strong>Namn:</strong> ${safeName}</p>
    <p><strong>E-post:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
    ${safePhone ? `<p><strong>Telefon:</strong> ${safePhone}</p>` : ''}
    <p><strong>Meddelande:</strong><br>${safeMessage}</p>
  `

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Dalboviken Fastigheter <no-reply@hyrhusvagnen.se>',
      to: ['info@dalboviken.se'],
      reply_to: email,
      subject: `Kontaktförfrågan från ${safeName}`,
      html,
    }),
  })

  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    return res.status(500).json({ error: err.message || 'Skickning misslyckades' })
  }

  res.status(200).json({ ok: true })
}
