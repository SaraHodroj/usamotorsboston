<?php
require __DIR__ . '/../config.php';
require __DIR__ . '/lib.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$cars = read_json(CARS_FILE, []);

function sorted_cars($cars) {                       // newest added first
  $list = array_values($cars);
  usort($list, fn($a, $b) => ($b['addedAt'] ?? 0) <=> ($a['addedAt'] ?? 0));
  return $list;
}
function referenced_images($cars, $exceptId = '') {
  $used = [];
  foreach ($cars as $id => $c) { if ($id === $exceptId) continue; foreach (($c['images'] ?? []) as $p) $used[$p] = true; }
  return $used;
}
function delete_image_file($rel) {                  // only ever deletes files inside images/cars
  if (!is_string($rel) || !preg_match(CAR_IMG_RE, $rel)) return;
  $full = SITE_ROOT . '/' . $rel;
  if (is_file($full)) @unlink($full);
}
function num($v, $min, $max) {
  if ($v === '' || $v === null || !is_numeric($v)) return null;
  $n = (int)round((float)$v);
  return ($n < $min || $n > $max) ? null : $n;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  if (isset($_GET['all'])) { require_admin(); echo json_encode(['cars' => sorted_cars($cars)]); exit; }
  $public = array_filter($cars, fn($c) => ($c['active'] ?? true) !== false);
  echo json_encode(['cars' => sorted_cars($public)]);
  exit;
}

require_admin();
require_csrf();
$in = body_json();
$action = $in['action'] ?? '';
$id = preg_replace('/[^a-z0-9\-]/', '', strtolower((string)($in['id'] ?? '')));

if ($action === 'save') {
  $c = $in['car'] ?? [];
  $features = [];
  foreach ((is_array($c['features'] ?? null) ? $c['features'] : []) as $f) { $f = clip($f, 60); if ($f !== '') $features[] = $f; }
  $images = [];
  foreach ((is_array($c['images'] ?? null) ? $c['images'] : []) as $p) { if (is_string($p) && preg_match(CAR_IMG_RE, $p) && !in_array($p, $images, true)) $images[] = $p; }

  $clean = [
    'condition' => (($c['condition'] ?? '') === 'new') ? 'new' : 'used',
    'body'      => in_array($c['body'] ?? '', ['sedan', 'suv', 'truck', 'coupe'], true) ? $c['body'] : 'sedan',
    'year'      => num($c['year'] ?? null, 1950, 2100),
    'make'      => clip($c['make'] ?? '', 40),
    'model'     => clip($c['model'] ?? '', 60),
    'price'     => num($c['price'] ?? null, 0, 100000000),
    'miles'     => num($c['miles'] ?? null, 0, 2000000),
    'desc'      => clip($c['desc'] ?? '', 1500),
    'engine'    => clip($c['engine'] ?? '', 60),
    'trans'     => clip($c['trans'] ?? '', 40),
    'drive'     => clip($c['drive'] ?? '', 30),
    'fuel'      => clip($c['fuel'] ?? '', 30),
    'mpg'       => clip($c['mpg'] ?? '', 40),
    'ext'       => clip($c['ext'] ?? '', 40),
    'int'       => clip($c['int'] ?? '', 40),
    'seats'     => num($c['seats'] ?? null, 1, 20),
    'doors'     => num($c['doors'] ?? null, 1, 6),
    'vin'       => strtoupper(preg_replace('/[^A-Za-z0-9]/', '', clip($c['vin'] ?? '', 17))),
    'badge'     => clip($c['badge'] ?? '', 24),
    'color'     => preg_match('/^#[0-9a-fA-F]{6}$/', (string)($c['color'] ?? '')) ? $c['color'] : '#6E7780',
    'features'  => array_slice($features, 0, 20),
    'images'    => array_slice($images, 0, 12),
    'active'    => !empty($c['active']),
  ];
  if ($clean['year'] === null || $clean['make'] === '' || $clean['model'] === '' || $clean['price'] === null)
    fail(400, 'Please fill in the year, make, model and price.');

  $isNew = (!$id || !isset($cars[$id]));
  if ($isNew) {
    if (count($cars) >= 300) fail(400, 'Too many cars saved. Delete some sold cars first.');
    $id = 'c' . bin2hex(random_bytes(5));
    $clean['addedAt'] = (int)round(microtime(true) * 1000);
  } else {
    $clean['addedAt'] = $cars[$id]['addedAt'] ?? (int)round(microtime(true) * 1000);
    $keep = array_flip($clean['images']);
    $others = referenced_images($cars, $id);
    foreach (($cars[$id]['images'] ?? []) as $old) { if (!isset($keep[$old]) && !isset($others[$old])) delete_image_file($old); }
  }
  $clean['id'] = $id;
  $cars[$id] = $clean;

} elseif ($action === 'toggle' && isset($cars[$id])) {
  $cars[$id]['active'] = !(($cars[$id]['active'] ?? true) !== false);

} elseif ($action === 'delete' && isset($cars[$id])) {
  $others = referenced_images($cars, $id);
  foreach (($cars[$id]['images'] ?? []) as $old) { if (!isset($others[$old])) delete_image_file($old); }
  unset($cars[$id]);

} elseif ($action === 'discard') {                  // photos uploaded but never saved on a car
  $used = referenced_images($cars);
  foreach ((is_array($in['paths'] ?? null) ? $in['paths'] : []) as $p) { if (is_string($p) && !isset($used[$p])) delete_image_file($p); }
  echo json_encode(['ok' => true]); exit;

} else {
  fail(400, 'Unknown request.');
}
write_json(CARS_FILE, $cars);
echo json_encode(['ok' => true, 'cars' => sorted_cars($cars)]);
