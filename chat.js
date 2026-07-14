// api/chat.js  —  Vercel serverless function (Node runtime)
// Keeps the Groq API key server-side and relays the portfolio's Veritas chat to Groq.
// Set an environment variable named GROQ_API_KEY in your Vercel project settings.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ reply: '', error: 'Method not allowed' });
    return;
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    res.status(200).json({
      reply: "The chat isn't configured yet — the site owner needs to add a GROQ_API_KEY environment variable in Vercel."
    });
    return;
  }

  try {
    const { system, messages } = req.body || {};

    // Rebuild a clean, safe message list for Groq (OpenAI-compatible format).
    const msgs = [];
    if (system) msgs.push({ role: 'system', content: String(system) });
    if (Array.isArray(messages)) {
      for (const m of messages) {
        if (m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string') {
          msgs.push({ role: m.role, content: m.content });
        }
      }
    }

    const groq = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: msgs,
        max_tokens: 400,
        temperature: 0.5
      })
    });

    const data = await groq.json();

    if (!groq.ok) {
      res.status(200).json({
        reply: 'Hmm, I hit a snag connecting. Please try again!',
        error: (data && data.error && data.error.message) || 'groq_error'
      });
      return;
    }

    const reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    res.status(200).json({ reply });
  } catch (e) {
    res.status(200).json({ reply: 'Hmm, I hit a snag connecting. Please try again!', error: 'exception' });
  }
};
