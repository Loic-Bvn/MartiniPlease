// supabase/functions/send-welcome-email/index.ts
//
// Appelée directement depuis le front (useAuth.js → signUp()) juste après
// la création du bar lors d'une INSCRIPTION initiale — pas lors de l'ajout
// d'un bar supplémentaire par un utilisateur déjà existant (createNewBar()
// n'appelle jamais cette fonction, donc pas de doublon possible).
//
// Setup :
//   1. RESEND_API_KEY déjà configuré (partagé avec notify-new-bar)
//   2. supabase functions deploy send-welcome-email --no-verify-jwt

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL      = 'MartiniPlease <notifications@martiniplease.fr>'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Preflight CORS — le navigateur envoie ça avant le vrai POST
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, barName } = await req.json()

    if (!email || !barName) {
      return new Response(JSON.stringify({ error: 'email et barName requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY manquant')
      return new Response(JSON.stringify({ error: 'server misconfigured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const html = `
      <h2>Bienvenue sur MartiniPlease, ${escapeHtml(barName)} ! 🍸</h2>
      <p>Merci de t'être inscrit·e.</p>
      <p>
        Ton bar <strong>${escapeHtml(barName)}</strong> est en cours de validation
        (généralement sous 24 à 48h). Tu recevras l'accès dès que ce sera bon.
      </p>
      <p>À très vite !</p>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: `Bienvenue sur MartiniPlease, ${barName} !`,
        html,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Resend error:', errText)
      return new Response(JSON.stringify({ error: 'email send failed', detail: errText }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-welcome-email error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}