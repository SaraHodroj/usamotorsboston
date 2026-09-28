<?php
if (session_status() !== PHP_SESSION_ACTIVE) {
  session_set_cookie_params(['httponly' => true, 'samesite' => 'Strict', 'secure' => !empty($_SERVER['HTTPS']), 'path' => '/']);
  session_start();
}
function read_json($file, $default) {
  if (!is_file($file)) return $default;
  $j = json_decode(file_get_contents($file), true);
  return is_array($j) ? $j : $default;
}
function write_json($file, $data) {
  $tmp = $file . '.tmp';
  if (file_put_contents($tmp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX) === false) fail(500, 'Could not save. Check that the data folder is writable.');
  rename($tmp, $file);
}
function fail($code, $msg) { http_response_code($code); echo json_encode(['error' => $msg]); exit; }
function is_admin() { return !empty($_SESSION['admin']); }
function require_admin() { if (!is_admin()) fail(401, 'Please log in again.'); }
function csrf_token() { if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16)); return $_SESSION['csrf']; }
function require_csrf() {
  $t = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
  if (empty($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], $t)) fail(403, 'Your session expired. Reload the page.');
}
function clip($v, $max) {
  $v = trim(str_replace(["\r", "\0"], '', (string)$v));
  return function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
}
function valid_date($d) { return is_string($d) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $d) ? $d : ''; }
function body_json() { $in = json_decode(file_get_contents('php://input'), true); return is_array($in) ? $in : []; }

if (!defined('CARS_FILE')) define('CARS_FILE', DATA_DIR . '/cars.json');
if (!defined('SITE_ROOT')) define('SITE_ROOT', dirname(__DIR__));
if (!defined('CAR_IMG_DIR')) define('CAR_IMG_DIR', SITE_ROOT . '/images/cars');
const CAR_IMG_RE = '#^images/cars/[a-z0-9_\-]+\.(jpg|jpeg|png|webp)$#';
