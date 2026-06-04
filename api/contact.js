module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { name, email, phone, message } = req.body
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Fält saknas' })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API-nyckel saknas' })

  const html = `
    <p><strong>Namn:</strong> ${name}</p>
    <p><strong>E-post:</strong> <a href="mailto:${email}">${email}</a></p>
    ${phone ? `<p><strong>Telefon:</strong> ${phone}</p>` : ''}
    <p><strong>Meddelande:</strong><br>${message.replace(/\n/g, '<br>')}</p>
  `

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Dalboviken Fastigheter <no-reply@hyrhusvagnen.se>',
      to: ['info@dalboviken.se'],
      reply_to: email,
      subject: `Kontaktförfrågan från ${name}`,
      html,
    }),
  })

  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    return res.status(500).json({ error: err.message || 'Skickning misslyckades' })
  }

  res.status(200).json({ ok: true })
}
