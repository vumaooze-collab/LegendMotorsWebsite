<?php
session_start();
$error = $_SESSION['login_error'] ?? '';
unset($_SESSION['login_error']);
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Legends Motors | Admin Login</title>
  <style>
    body{margin:0;background:#f3f3f1;color:#202020;font:16px Arial,sans-serif;min-height:100vh;display:grid;place-items:center}
    main{width:min(360px,calc(100% - 40px));background:#fff;padding:28px;border:1px solid #ddd}
    h1{font-size:22px;margin:0 0 6px}p{color:#666;font-size:14px}
    label{display:block;margin:16px 0 6px;font-size:14px}
    input{box-sizing:border-box;width:100%;padding:12px;border:1px solid #bbb;border-radius:3px;font:inherit}
    button{margin-top:20px;width:100%;padding:12px;background:#292929;color:#fff;border:0;border-radius:3px;font-weight:bold}
    .error{color:#a32121;background:#fff1f1;padding:10px;font-size:14px}
  </style>
</head>
<body>
<main>
  <h1>Legends Motors</h1>
  <p>Dealership management · Administrator sign in</p>
  <?php if ($error !== ''): ?><div class="error"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div><?php endif; ?>
  <form method="post" action="login.php" autocomplete="on">
    <label for="email">Email address</label>
    <input id="email" name="email" type="email" required autocomplete="username">
    <label for="password">Password</label>
    <input id="password" name="password" type="password" required autocomplete="current-password">
    <button type="submit">Sign in</button>
  </form>
</main>
</body>
</html>
