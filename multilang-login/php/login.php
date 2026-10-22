<?php
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method not allowed');
}

$email = trim((string)($_POST['email'] ?? ''));
$password = (string)($_POST['password'] ?? '');
if ($email === '' || $password === '' || strlen($email) > 254 || strlen($password) > 1024) {
    $_SESSION['login_error'] = 'Enter a valid email and password.';
    header('Location: index.php', true, 303);
    exit;
}

$api = getenv('AUTH_API_URL') ?: 'http://python-auth:8000';
$payload = json_encode(['email' => $email, 'password' => $password]);
$ch = curl_init($api . '/login');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 3,
    CURLOPT_TIMEOUT => 8,
]);
$response = curl_exec($ch);
$status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false || $status >= 500 || $status === 0) {
    $_SESSION['login_error'] = 'Login service is temporarily unavailable.';
    header('Location: index.php', true, 303);
    exit;
}

$data = json_decode($response, true);
if ($status !== 200 || !is_array($data) || empty($data['token'])) {
    $_SESSION['login_error'] = 'Invalid email or password.';
    header('Location: index.php', true, 303);
    exit;
}

session_regenerate_id(true);
setcookie('legend_motors_session', $data['token'], [
    'expires' => time() + 604800,
    'path' => '/',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'httponly' => true,
    'samesite' => 'Lax',
]);
header('Location: /admin', true, 303);
exit;
