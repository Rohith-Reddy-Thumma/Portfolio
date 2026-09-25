// Vercel serverless function: /api/chat
// Matches the contract your index.html already uses:
//   request body:  { system, messages }
//   response body: { reply }
// Keeps the OpenAI API key server-side. The browser never sees it.
// Requires an OPENAI_API_KEY environment variable set in the Vercel project settings.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { system, messages } = req.body || {};

  if (!Array.isArray(messages)) {
    res.status(400).json({ error: 'messages must be an array' });
    return;
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 400,
        messages: [
          { role: 'system', content: system || '' },
          ...messages,
        ],
      }),
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      res.status(openaiRes.status).json({ error: data.error?.message || 'OpenAI request failed' });
      return;
    }

    const reply = data.choices?.[0]?.message?.content || '';
    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: 'Upstream request failed' });
  }
}
