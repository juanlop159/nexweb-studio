// NexWeb Studio — Groq proxy
const _a = 'gsk_AkBArqxrZz';
const _b = 'DkkGHx5hweWGdy';
const _c = 'b3FY2RVies9r41';
const _d = 'Xr3y9rR5xrHIhX';
const K = [_a,_b,_c,_d].join('');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${K}`
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
