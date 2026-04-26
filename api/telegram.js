function sanitizeForTelegram(text) {
  if (text == null || text === '') return '—';
  return String(text).replace(/[\u0000-\u001F\\]/g, ' ').slice(0, 2000);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return res.status(500).json({
      error: 'Сервер не настроен: задайте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в Vercel',
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch {
      return res.status(400).json({ error: 'Некорректный JSON' });
    }
  }
  const { name, phone, comment, source = 'Сайт' } = body || {};

  if (!name || !phone) {
    return res.status(400).json({ error: 'Имя и телефон обязательны' });
  }

  const safeName = sanitizeForTelegram(name);
  const safePhone = sanitizeForTelegram(phone);
  const safeComment = sanitizeForTelegram(comment);
  const safeSource = sanitizeForTelegram(source);

  const message =
    `Новая заявка с сайта Алко 24 Онлайн\n\n` +
    `Имя: ${safeName}\n` +
    `Телефон: ${safePhone}\n` +
    `Комментарий: ${safeComment}\n` +
    `Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}\n` +
    `Источник: ${safeSource}`;

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();
    if (data.ok) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ error: data.description || 'Telegram API error' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

