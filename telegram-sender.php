<?php
// ==================================================
// Telegram sender for Alkovoz
// ==================================================

// ---------- НАСТРОЙКИ (ЗАМЕНИТЕ НА СВОИ) ----------
define('BOT_TOKEN', '8577126925:AAFKxUZuaUZIs-b3yJuA_ZiWJHTp27tfLs8'); // Токен вашего бота от @BotFather
define('CHAT_ID', '562345561'); // Ваш личный Chat ID (можно узнать у @userinfobot)
// ---------------------------------------------------

// Разрешаем запросы с любого домена (CORS)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Если это preflight-запрос OPTIONS — сразу выходим
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Проверяем, что пришел POST-запрос
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Метод не поддерживается']);
    exit;
}

// Получаем тело запроса (JSON)
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Некорректный JSON']);
    exit;
}

// Извлекаем поля
$name = trim($data['name'] ?? '');
$phone = trim($data['phone'] ?? '');
$comment = trim($data['comment'] ?? '');
$source = trim($data['source'] ?? 'Сайт');

// Проверка обязательных полей
if (empty($name) || empty($phone)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Имя и телефон обязательны']);
    exit;
}

// Формируем текст сообщения для Telegram
$message = "🚗 *Новая заявка с сайта Alkovoz!*\n\n";
$message .= "👤 *Имя:* $name\n";
$message .= "📱 *Телефон:* $phone\n";
$message .= "💬 *Комментарий:* " . (empty($comment) ? '—' : $comment) . "\n";
$message .= "🕒 *Время:* " . date('d.m.Y H:i:s') . "\n";
$message .= "🌐 *Источник:* $source\n\n";
$message .= "#заявка #alkovoz";

// URL для отправки сообщения через Telegram Bot API
$url = "https://api.telegram.org/bot" . BOT_TOKEN . "/sendMessage";

// Параметры запроса
$postData = [
    'chat_id' => CHAT_ID,
    'text' => $message,
    'parse_mode' => 'Markdown',
    'disable_web_page_preview' => true
];

// Инициализация cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // если на локальном сервере проблемы с SSL

$response = curl_exec($ch);
$error = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Ошибка cURL: ' . $error]);
    exit;
}

$result = json_decode($response, true);

if ($result && $result['ok'] === true) {
    echo json_encode(['success' => true, 'message' => 'Заявка отправлена']);
} else {
    $errorDescription = $result['description'] ?? 'Неизвестная ошибка';
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Ошибка Telegram API: ' . $errorDescription]);
}