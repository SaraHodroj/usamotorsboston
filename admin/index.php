<?php
require __DIR__ . '/../config.php';
require __DIR__ . '/../api/lib.php';

if (isset($_GET['logout'])) { $_SESSION = []; session_destroy(); header('Location: ./'); exit; }

$error = '';
$defaultPassword = (ADMIN_PASSWORD === 'change-me-now');
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
  $locked = ($_SESSION['fails'] ?? 0) >= 5 && time() - ($_SESSION['last_fail'] ?? 0) < 300;
  if ($defaultPassword) $error = 'Set a new password in config.php first.';
  elseif ($locked) $error = 'Too many attempts. Wait 5 minutes and try again.';
  elseif (hash_equals(ADMIN_PASSWORD, (string)$_POST['password'])) {
    session_regenerate_id(true);
    $_SESSION['admin'] = true; $_SESSION['fails'] = 0;
    header('Location: ./'); exit;
  } else {
    $_SESSION['fails'] = ($_SESSION['fails'] ?? 0) + 1; $_SESSION['last_fail'] = time();
    $error = 'Wrong password. Try again.';
  }
}
$loggedIn = is_admin();
?><!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Staff | USA Motors</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700;1,800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/style.css">
</head>
<body>
<header class="site">
  <div class="wrap bar">
    <a class="logo" href="../"><span class="mark">USA</span><span><b>USA MOTORS</b><small>Staff area</small></span></a>
    <nav class="main" style="display:flex;position:static;flex-direction:row;background:none;padding:0;border:0">
      <a href="../" target="_blank">View website</a>
      <?php if ($loggedIn): ?><a href="?logout=1">Log out</a><?php endif; ?>
    </nav>
  </div>
</header>

<?php if (!$loggedIn): ?>
<section class="block"><div class="wrap" style="max-width:460px">
  <form class="panel" method="post">
    <h2>Staff login</h2>
    <p class="hint">Enter the staff password to manage offers and see booking requests.</p>
    <?php if ($defaultPassword): ?><div class="notice err">The password hasn't been set yet. Open config.php and change ADMIN_PASSWORD.</div><?php endif; ?>
    <?php if ($error): ?><div class="notice err"><?= htmlspecialchars($error) ?></div><?php endif; ?>
    <label class="f" style="margin-top:16px">Password<input type="password" name="password" required autofocus autocomplete="current-password"></label>
    <button class="btn btn-primary" type="submit" style="margin-top:18px;width:100%">Log in</button>
  </form>
</div></section>
<?php else: ?>
<section class="page-head"><div class="wrap"><h1>Manage your website</h1><p>Add cars, change weekly offers and see booking requests. Changes go live immediately.</p></div></section>
<section class="block"><div class="wrap">
  <div class="seg tabs" role="group" aria-label="Sections">
    <button type="button" data-tab="cars" aria-pressed="true">Cars</button>
    <button type="button" data-tab="offers" aria-pressed="false">Offers</button>
    <button type="button" data-tab="bookings" aria-pressed="false">Booking requests</button>
  </div>

  <!-- CARS -->
  <div id="tab-cars" class="admin-grid">
    <form class="panel" id="carForm" novalidate>
      <h2 id="carFormTitle">Add a new car</h2>
      <p class="hint">Fill in the boxes, add photos, then press Save. The car appears on the website right away.</p>
      <div class="fields">
        <label class="f">Body type<select name="body"><option value="sedan">Sedan</option><option value="suv">SUV</option><option value="truck">Truck</option><option value="coupe">Coupe / sport</option></select></label>
        <label class="f">Year<input name="year" type="number" inputmode="numeric" min="1950" max="2100" placeholder="2021" required></label>
        <label class="f">Make<input name="make" maxlength="40" placeholder="Honda" required></label>
        <label class="f full">Model<input name="model" maxlength="60" placeholder="Accord Sport" required></label>
        <label class="f">Price ($)<input name="price" type="number" inputmode="numeric" min="0" placeholder="26500" required></label>
        <label class="f">Mileage <span class="opt">(optional)</span><input name="miles" type="number" inputmode="numeric" min="0" placeholder="31200"></label>
        <label class="f full">Description<textarea name="desc" maxlength="1500" placeholder="A few sentences about the car"></textarea></label>
      </div>

      <h3 class="sub">Photos</h3>
      <p class="hint" style="margin-bottom:0">The first photo is the main one. Big photos are made smaller automatically.</p>
      <div class="photo-grid" id="photoGrid"></div>
      <button type="button" class="btn btn-ghost btn-small" id="addPhotos">Add photos</button>
      <input type="file" id="photoInput" accept="image/*" multiple class="sr" tabindex="-1" aria-hidden="true">
      <div id="photoMsg" role="status" aria-live="polite"></div>

      <details class="more">
        <summary>More details (optional)</summary>
        <div class="fields">
          <label class="f">Engine<input name="engine" maxlength="60" placeholder="2.0L Turbo I4"></label>
          <label class="f">Transmission<input name="trans" maxlength="40" placeholder="8-speed automatic"></label>
          <label class="f">Drivetrain<input name="drive" maxlength="30" placeholder="AWD"></label>
          <label class="f">Fuel<input name="fuel" maxlength="30" placeholder="Gasoline"></label>
          <label class="f">Fuel economy<input name="mpg" maxlength="40" placeholder="24 city / 33 hwy"></label>
          <label class="f">Small label on the card<input name="badge" maxlength="24" placeholder="Just arrived"></label>
          <label class="f">Exterior color<input name="ext" maxlength="40" placeholder="Black"></label>
          <label class="f">Interior<input name="int" maxlength="40" placeholder="Black leather"></label>
          <label class="f">Seats<input name="seats" type="number" inputmode="numeric" min="1" max="20" placeholder="5"></label>
          <label class="f">VIN<input name="vin" maxlength="17" placeholder="17 characters"></label>
          <label class="f full">Features <span class="opt">(one per line)</span><textarea name="features" placeholder="Sunroof&#10;Heated seats&#10;Backup camera"></textarea></label>
          <label class="f">Drawing color <span class="opt">(only used when there are no photos)</span><input name="color" type="color" value="#6e7780"></label>
        </div>
      </details>

      <label class="f toggle" style="margin-top:18px"><input type="checkbox" name="active" checked> Show on website</label>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">
        <button class="btn btn-primary" type="submit">Save car</button>
        <button class="btn btn-ghost" type="button" id="cancelCar">Clear form</button>
      </div>
      <div id="carMsg" role="status" aria-live="polite"></div>
    </form>
    <div class="panel"><h2>Your cars</h2><p class="hint">Use Hide for a car that is sold or not ready. Hidden cars are kept here but not shown on the website.</p><div id="carList"><div class="empty">Loading…</div></div></div>
  </div>

  <!-- OFFERS -->
  <div id="tab-offers" class="admin-grid" hidden>
    <form class="panel" id="offerForm" novalidate>
      <h2 id="formTitle">Add a new offer</h2>
      <p class="hint">Fill in the boxes and press Save. The offer appears on the website right away.</p>
      <div class="fields" style="grid-template-columns:1fr">
        <label class="f">Offer title<input name="title" maxlength="80" placeholder="e.g. Oil change special" required></label>
        <label class="f">Description<textarea name="description" maxlength="400" placeholder="What's included, any conditions"></textarea></label>
        <div class="fields" style="margin:0">
          <label class="f">Offer price <span class="opt">(optional)</span><input name="price" maxlength="30" placeholder="e.g. $49 or 20% off"></label>
          <label class="f">Regular price <span class="opt">(optional)</span><input name="wasPrice" maxlength="30" placeholder="e.g. $69"></label>
          <label class="f">Small label <span class="opt">(optional)</span><input name="tag" maxlength="24" placeholder="e.g. This week only"></label>
          <label class="f">Ends on <span class="opt">(optional)</span><input name="validUntil" type="date"></label>
        </div>
        <label class="f toggle"><input type="checkbox" name="active" checked> Show on website</label>
        <label class="f toggle"><input type="checkbox" name="featured"> Make this the big featured offer</label>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">
        <button class="btn btn-primary" type="submit">Save offer</button>
        <button class="btn btn-ghost" type="button" id="cancelEdit" hidden>Cancel editing</button>
      </div>
      <div id="offerMsg" role="status" aria-live="polite"></div>
    </form>
    <div class="panel"><h2>Current offers</h2><p class="hint">Offers stop showing automatically after their end date.</p><div id="offerList"><div class="empty">Loading…</div></div></div>
  </div>

  <!-- BOOKINGS -->
  <div id="tab-bookings" hidden>
    <div class="panel"><h2>Booking requests</h2><p class="hint">Requests sent from the Contact page, newest first.</p><div id="bookingList"><div class="empty">Loading…</div></div></div>
  </div>
</div></section>
<script>const CSRF = <?= json_encode(csrf_token()) ?>;</script>
<script src="admin.js"></script>
<?php endif; ?>
</body>
</html>