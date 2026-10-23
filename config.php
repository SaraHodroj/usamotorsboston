<?php
define('ADMIN_PASSWORD', '-');

// Booking requests from the Contact page are emailed here.
define('SHOP_EMAIL', '-');

// Your time zone (used for offer end dates).
date_default_timezone_set('America/New_York');

/* ----- No need to change anything below ----- */
define('DATA_DIR', __DIR__ . '/data');
define('OFFERS_FILE', DATA_DIR . '/offers.json');
define('BOOKINGS_FILE', DATA_DIR . '/bookings.json');
