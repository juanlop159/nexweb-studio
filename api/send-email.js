export const config = { runtime: 'edge' };

const ALLOWED_TYPES = ['new_client','client_suspended','payment_overdue','support_request','lead_capture','join_request'];

function buildEmailHtml(type, data) {
  const base = (title, body) => `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0a0f1e;color:#e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#2563eb,#38bdf8);padding:24px 32px;">
        <h1 style="margin:0;font-size:20px;color:#fff;">NexWeb Studio</h1>
        <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">Notificación del sistema</p>
      </div>
      <div style="padding:32px;">
        <h2 style="margin:0 0 16px;font-size:18px;color:#38bdf8;">${title}</h2>
        ${body}
      </div>
      <div style="padding:16px 32px;background:#04060d;font-size:12px;color:#64748b;">
        NexWeb Studio · Plataforma de negocios mexicanos
      </div>
    </div>`;

  const row = (label, value) =>
    `<tr><td style="padding:8px 0;color:#94a3b8;font-size:14px;">${label}</td><td style="padding:8px 0;color:#e2e8f0;font-size:14px;font-weight:500;">${value}</td></tr>`;

  switch (type) {
    case 'new_client':
      return base('🎉 Nuevo cliente registrado', `
        <table style="width:100%;border-collapse:collapse;">
          ${row('Negocio:', data.name || '-')}
          ${row('Plan:', data.plan || '-')}
          ${row('Ciudad:', data.city || '-')}
          ${data.phone ? row('Teléfono:', data.phone) : ''}
          ${data.email ? row('Email:', data.email) : ''}
        </table>
        <a href="https://nexweb-studio.vercel.app/nexweb-admin.html" style="display:inline-block;margin-top:20px;padding:10px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;">Ver en Admin →</a>`);

    case 'client_suspended':
      return base('⚠️ Cliente suspendido', `
        <table style="width:100%;border-collapse:collapse;">
          ${row('Negocio:', data.name || '-')}
          ${data.reason ? row('Razón:', data.reason) : ''}
        </table>`);

    case 'payment_overdue':
      return base('🔴 Pago vencido', `
        <table style="width:100%;border-collapse:collapse;">
          ${row('Negocio:', data.name || '-')}
          ${row('Mes:', data.month || '-')}
          ${row('Monto:', data.amount ? '$' + data.amount + ' MXN' : '-')}
        </table>
        <a href="https://nexweb-studio.vercel.app/nexweb-admin.html" style="display:inline-block;margin-top:20px;padding:10px 24px;background:#dc2626;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;">Gestionar pago →</a>`);

    case 'support_request':
      return base('💬 Solicitud de soporte', `
        <table style="width:100%;border-collapse:collapse;">
          ${row('Negocio:', data.businessName || '-')}
          ${row('Asunto:', data.subject || '-')}
        </table>
        <div style="margin-top:16px;padding:16px;background:#0f172a;border-radius:8px;border-left:3px solid #38bdf8;">
          <p style="margin:0;font-size:14px;color:#cbd5e1;">${(data.description || '').replace(/\n/g,'<br>')}</p>
        </div>`);

    case 'lead_capture':
      return base('🚀 Nuevo lead en el landing', `
        <table style="width:100%;border-collapse:collapse;">
          ${row('Nombre:', data.name || '-')}
          ${row('WhatsApp:', data.phone || '-')}
          ${data.email ? row('Email:', data.email) : ''}
          ${row('Fuente:', data.source || 'landing')}
        </table>
        <a href="https://wa.me/521${(data.phone||'').replace(/\D/g,'')}" style="display:inline-block;margin-top:20px;padding:10px 24px;background:#22c55e;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;">Contactar por WhatsApp →</a>`);

    case 'join_request':
      return base('🏪 Solicitud para unirse a la red', `
        <table style="width:100%;border-collapse:collapse;">
          ${row('Negocio:', data.name || '-')}
          ${row('Giro:', data.type || '-')}
          ${row('WhatsApp:', data.phone || '-')}
          ${data.city ? row('Ciudad:', data.city) : ''}
        </table>
        <a href="https://nexweb-studio.vercel.app/nexweb-admin.html" style="display:inline-block;margin-top:20px;padding:10px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;">Ver en Admin →</a>`);

    default:
      return base('Notificación', `<p style="color:#cbd5e1;">${JSON.stringify(data)}</p>`);
  }
}

function getSubject(type, data) {
  switch (type) {
    case 'new_client':      return `🎉 Nuevo cliente: ${data.name || ''}`;
    case 'client_suspended':return `⚠️ Cliente suspendido: ${data.name || ''}`;
    case 'payment_overdue': return `🔴 Pago vencido: ${data.name || ''} — ${data.month || ''}`;
    case 'support_request': return `💬 Soporte: ${data.subject || ''} (${data.businessName || ''})`;
    case 'lead_capture':    return `🚀 Nuevo lead: ${data.name || ''}`;
    case 'join_request':    return `🏪 Solicitud de unión: ${data.name || ''}`;
    default:                return 'NexWeb Studio — Notificación';
  }
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { type, data = {}, to } = body;

  if (!type || !ALLOWED_TYPES.includes(type)) {
    return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 });
  }

  const RESEND_KEY = process.env.RESEND_API_KEY;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'juanlop159@gmail.com';

  if (!RESEND_KEY) {
    // Graceful degradation: log but don't fail
    console.log('[send-email] RESEND_API_KEY not set, skipping email:', type, data);
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const recipient = to || ADMIN_EMAIL;
  const subject = getSubject(type, data);
  const html = buildEmailHtml(type, data);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'NexWeb Studio <notificaciones@nexweb.studio>',
        to: [recipient],
        subject,
        html
      })
    });

    const result = await res.json();

    if (!res.ok) {
      console.error('[send-email] Resend error:', result);
      return new Response(JSON.stringify({ error: result }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    console.error('[send-email] Fetch error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
