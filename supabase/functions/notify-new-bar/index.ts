// supabase/functions/notify-new-bar/index.ts
//
// Déclenché par un Database Webhook Supabase sur INSERT dans public.bars.
// Envoie un email à l'admin pour qu'il aille valider (ou refuser) le bar
// dans Supabase Studio (mettre bars.status à 'approved' ou 'rejected').
//
// Setup (voir INTEGRATION_GUIDE.md pour le détail) :
//   1. Créer un compte Resend (resend.com), récupérer une API key
//   2. supabase secrets set RESEND_API_KEY=re_xxx
//   3. supabase functions deploy notify-new-bar --no-verify-jwt
//   4. Dashboard Supabase → Database → Webhooks → New webhook
//        table: bars, event: INSERT, type: HTTP request
//        URL: https://<project-ref>.supabase.co/functions/v1/notify-new-bar

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAIL     = 'loic.bienvenu.pro@gmail.com'
const FROM_EMAIL      = 'MartiniPlease <notifications@martiniplease.fr>' // adapte au domaine vérifié sur Resend
const STUDIO_URL      = Deno.env.get('SUPABASE_STUDIO_URL') ?? '' // optionnel, pour lien direct dans l'email

serve(async (req) => {
  try {
    const payload = await req.json()

    // Format standard d'un Database Webhook Supabase :
    // { type: 'INSERT', table: 'bars', record: {...}, old_record: null }
    const bar = payload.record

    if (!bar) {
      return new Response(JSON.stringify({ error: 'no record in payload' }), { status: 400 })
    }

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY manquant')
      return new Response(JSON.stringify({ error: 'server misconfigured' }), { status: 500 })
    }

    const html = `
      <h2>Nouveau bar créé sur MartiniPlease</h2>
      <p><strong>Nom du bar :</strong> ${escapeHtml(bar.name)}</p>
      <p><strong>Bar ID :</strong> ${bar.id}</p>
      <p><strong>Owner ID :</strong> ${bar.owner_id}</p>
      <p><strong>Créé le :</strong> ${bar.created_at}</p>
      <p>Statut actuel : <strong>${bar.status}</strong></p>
      <p>
        Pour valider ou refuser, modifie la colonne <code>status</code>
        de la table <code>bars</code> (valeurs possibles : <code>approved</code> / <code>rejected</code>).
      </p>
      ${STUDIO_URL ? `<p><a href="${STUDIO_URL}/editor">Ouvrir Supabase Studio</a></p>` : ''}
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: `🍸 Nouveau bar en attente de validation : ${bar.name}`,
        html,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Resend error:', errText)
      return new Response(JSON.stringify({ error: 'email send failed', detail: errText }), { status: 502 })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('notify-new-bar error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}
