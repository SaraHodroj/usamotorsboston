<?php
require __DIR__ . '/../config.php';
require __DIR__ . '/lib.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$offers = read_json(OFFERS_FILE, []);
$sort = function ($list) {
  usort($list, fn($a, $b) => (!empty($b['featured']) <=> !empty($a['featured'])) ?: (($b['updatedAt'] ?? 0) <=> ($a['updatedAt'] ?? 0)));
  return $list;
};

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  if (isset($_GET['all'])) { require_admin(); echo json_encode(['offers' => $sort(array_values($offers))]); exit; }
  $today = date('Y-m-d');
  $public = array_filter($offers, fn($o) => ($o['active'] ?? true) && (empty($o['validUntil']) || $o['validUntil'] >= $today));
  echo json_encode(['offers' => $sort(array_values($public))]);
  exit;
}

require_admin();
require_csrf();
$in = body_json();
$action = $in['action'] ?? '';
$id = preg_replace('/[^a-z0-9\-]/', '', strtolower($in['id'] ?? ''));

if ($action === 'save') {
  $o = $in['offer'] ?? [];
  $clean = [
    'title' => clip($o['title'] ?? '', 80),
    'description' => clip($o['description'] ?? '', 400),
    'price' => clip($o['price'] ?? '', 30),
    'wasPrice' => clip($o['wasPrice'] ?? '', 30),
    'tag' => clip($o['tag'] ?? '', 24),
    'validUntil' => valid_date($o['validUntil'] ?? ''),
    'active' => !empty($o['active']),
    'featured' => !empty($o['featured']),
  ];
  if ($clean['title'] === '') fail(400, 'Please give the offer a title.');
  if (!$id || !isset($offers[$id])) { if (count($offers) >= 100) fail(400, 'Too many offers saved. Delete some old ones first.'); $id = bin2hex(random_bytes(6)); }
  if ($clean['featured']) foreach ($offers as $k => $x) $offers[$k]['featured'] = false;
  $clean['id'] = $id;
  $clean['updatedAt'] = (int)round(microtime(true) * 1000);
  $offers[$id] = $clean;
} elseif ($action === 'toggle' && isset($offers[$id])) {
  $offers[$id]['active'] = !($offers[$id]['active'] ?? true);
  $offers[$id]['updatedAt'] = (int)round(microtime(true) * 1000);
} elseif ($action === 'delete' && isset($offers[$id])) {
  unset($offers[$id]);
} else {
  fail(400, 'Unknown request.');
}
write_json(OFFERS_FILE, $offers);
echo json_encode(['ok' => true, 'offers' => $sort(array_values($offers))]);
