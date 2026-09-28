<?php
require __DIR__ . '/../config.php';
require __DIR__ . '/lib.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$bookings = read_json(BOOKINGS_FILE, []);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {        // staff page reads the list
  require_admin();
  echo json_encode(['bookings' => array_reverse($bookings)]);
  exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'Not allowed.');

$in = body_json();
if (!empty($in['website'])) { echo json_encode(['ok' => true]); exit; }   // spam bot trap
if (time() - ($_SESSION['last_booking'] ?? 0) < 30) fail(429, 'Please wait a moment before sending another request.');

$b = [
  'name' => clip($in['name'] ?? '', 80),
  'phone' => clip($in['phone'] ?? '', 30),
  'email' => filter_var(clip($in['email'] ?? '', 120), FILTER_VALIDATE_EMAIL) ?: '',
  'service' => clip($in['service'] ?? '', 60),
  'vehicle' => clip($in['vehicle'] ?? '', 80),
  'date' => valid_date($in['date'] ?? ''),
  'time' => clip($in['time'] ?? '', 40),
  'message' => clip($in['message'] ?? '', 1000),
  'sentAt' => (int)round(microtime(true) * 1000),
];
if ($b['name'] === '' || $b['phone'] === '' || $b['service'] === '' || $b['date'] === '' || $b['time'] === '')
  fail(400, 'Please fill in your name, phone, service, date and time.');

$bookings[] = $b;
$bookings = array_slice($bookings, -500);
write_json(BOOKINGS_FILE, $bookings);
$_SESSION['last_booking'] = time();

// Email the shop (if it fails, the request is still saved on the staff page)
$host = preg_replace('/[^a-z0-9\.\-]/i', '', $_SERVER['HTTP_HOST'] ?? 'usamotors.com');
$host = preg_replace('/^www\./', '', $host);
$lines = "New booking request\n\nName: {$b['name']}\nPhone: {$b['phone']}\nEmail: {$b['email']}\nService: {$b['service']}\nVehicle: {$b['vehicle']}\nDate: {$b['date']}\nTime: {$b['time']}\n\nMessage:\n{$b['message']}\n";
$headers = "From: USA Motors Website <no-reply@{$host}>\r\n" . ($b['email'] ? "Reply-To: {$b['email']}\r\n" : '') . "Content-Type: text/plain; charset=UTF-8\r\n";
@mail(SHOP_EMAIL, 'New booking: ' . str_replace(["\n", "\r"], ' ', $b['service'] . ' - ' . $b['name']), $lines, $headers);

echo json_encode(['ok' => true]);
