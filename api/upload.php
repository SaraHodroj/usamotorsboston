<?php
require __DIR__ . '/../config.php';
require __DIR__ . '/lib.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'Not allowed.');
require_admin();
require_csrf();

if (empty($_FILES['photo'])) fail(400, 'No photo arrived. The file may be too big for this server.');
$f = $_FILES['photo'];
if ($f['error'] === UPLOAD_ERR_INI_SIZE || $f['error'] === UPLOAD_ERR_FORM_SIZE) fail(400, 'That photo is too big for this server.');
if ($f['error'] !== UPLOAD_ERR_OK) fail(400, 'The upload failed. Please try again.');
if ($f['size'] > 6 * 1024 * 1024) fail(400, 'That photo is too big (6 MB maximum).');

$info = @getimagesize($f['tmp_name']);
$types = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'];
if (!$info || !isset($types[$info[2]])) fail(400, 'Please upload a JPG, PNG or WEBP photo.');
if ($info[0] > 8000 || $info[1] > 8000) fail(400, 'That photo is too large in pixels. Use a smaller one.');

if (!is_dir(CAR_IMG_DIR)) @mkdir(CAR_IMG_DIR, 0755, true);
if (!is_dir(CAR_IMG_DIR) || !is_writable(CAR_IMG_DIR)) fail(500, 'The images/cars folder is missing or not writable on the server.');

$name = bin2hex(random_bytes(8)) . '.' . $types[$info[2]];
if (!move_uploaded_file($f['tmp_name'], CAR_IMG_DIR . '/' . $name)) fail(500, 'Could not save the photo.');
echo json_encode(['ok' => true, 'path' => 'images/cars/' . $name]);
