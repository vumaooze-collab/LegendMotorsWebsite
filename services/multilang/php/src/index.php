<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function respond(int $status, array $body): never {
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit;
}
function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    $url = getenv('DATABASE_URL') ?: '';
    if ($url === '') throw new RuntimeException('Database configuration missing');
    $parts = parse_url($url);
    if (!$parts || empty($parts['host']) || empty($parts['path'])) throw new RuntimeException('Invalid database URL');
    $scheme = $parts['scheme'] ?? 'postgresql';
    if (!in_array($scheme, ['postgres', 'postgresql'], true)) throw new RuntimeException('Unsupported database URL scheme');
    parse_str($parts['query'] ?? '', $query);
    $database = rawurldecode(ltrim($parts['path'], '/'));
    if ($database === '' || !preg_match('/^[A-Za-z0-9_.-]+$/', $database)) throw new RuntimeException('Invalid database name');
    $dsn = 'pgsql:host=' . $parts['host'] . ';port=' . ($parts['port'] ?? 5432) . ';dbname=' . $database;
    if (isset($query['sslmode'])) {
        $sslmode = (string)$query['sslmode'];
        $allowedSslModes = ['disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full'];
        if (!in_array($sslmode, $allowedSslModes, true)) throw new RuntimeException('Invalid database SSL mode');
        $dsn .= ';sslmode=' . $sslmode;
    }
    $pdo = new PDO($dsn, rawurldecode($parts['user'] ?? ''), rawurldecode($parts['pass'] ?? ''), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}
function requireInternalKey(): void {
    $expected = getenv('INTERNAL_API_KEY') ?: '';
    $given = trim($_SERVER['HTTP_AUTHORIZATION'] ?? '');
    if (strlen($expected) < 32) respond(503, ['error' => 'Internal API is not configured']);
    if (strncasecmp($given, 'Bearer ', 7) !== 0) respond(401, ['error' => 'Unauthorized']);
    $provided = trim(substr($given, 7));
    if ($provided === '' || str_contains($provided, ' ')) respond(401, ['error' => 'Unauthorized']);
    if (!hash_equals($expected, $provided)) respond(401, ['error' => 'Unauthorized']);
}
try {
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    if ($path === '/health') {
        db()->query('SELECT 1');
        respond(200, ['status' => 'ok', 'service' => 'legends-motors-php', 'database' => 'connected']);
    }
    if ($path === '/api/vehicles' && ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
        $stmt = db()->query(
            'SELECT v."id", v."stockNumber", v."make", v."model", v."variant", v."year", v."price"::text AS "price", v."currency", v."mileage", v."transmission", v."fuelType", v."bodyType", v."color", v."description", v."featured", v."createdAt",
                    COALESCE((SELECT json_agg(json_build_object(\'url\', i."url", \'altText\', i."altText", \'isPrimary\', i."isPrimary") ORDER BY i."displayOrder") FROM "VehicleImage" i WHERE i."vehicleId" = v."id"), \'[]\'::json) AS images
             FROM "Vehicle" v WHERE v."published" = TRUE AND v."status" = \'AVAILABLE\' ORDER BY v."featured" DESC, v."createdAt" DESC LIMIT 100'
        );
        $vehicles = $stmt->fetchAll();
        foreach ($vehicles as &$vehicle) {
            // PDO returns PostgreSQL json columns as strings; normalize the API contract to JSON arrays.
            $decodedImages = json_decode((string)($vehicle['images'] ?? '[]'), true);
            $vehicle['images'] = is_array($decodedImages) ? $decodedImages : [];
        }
        unset($vehicle);
        respond(200, ['data' => $vehicles]);
    }
    if ($path === '/api/internal/vehicles' && ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
        requireInternalKey();
        $stmt = db()->query('SELECT "id", "stockNumber", "make", "model", "year", "price"::text AS "price", "currency", "status", "published", "updatedAt" FROM "Vehicle" ORDER BY "updatedAt" DESC LIMIT 500');
        respond(200, ['data' => $stmt->fetchAll()]);
    }
    respond(404, ['error' => 'Not found']);
} catch (Throwable $e) {
    error_log('PHP API request failed: ' . get_class($e));
    respond(503, ['error' => 'Service temporarily unavailable']);
}
