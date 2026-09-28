USA MOTORS WEBSITE – QUICK GUIDE
================================

UPLOAD TO GODADDY (cPanel Web Hosting)
1. GoDaddy > My Products > Web Hosting > Manage > cPanel Admin > File Manager.
2. Open the public_html folder. Delete any old placeholder files (like index.html or default.html).
3. Upload usamotors-website.zip, right-click it > Extract into public_html. Then delete the zip.
   The files (index.html, css, js, api, admin, data, images, config.php) must sit directly
   inside public_html, not inside an extra folder.
4. Edit config.php (right-click > Edit):
   - ADMIN_PASSWORD: the staff password (use something long)
   - SHOP_EMAIL: where booking requests are emailed
5. Visit your domain. Staff page: yourdomain.com/admin

SECURITY CHECK (do this once after uploading)
Open yourdomain.com/data/bookings.json in your browser. It must say "Forbidden" (or 403).
If it shows text, tell whoever is helping you: the data folder is not protected.

THE STAFF PAGE  (yourdomain.com/admin)
- Cars tab ........ add a car, upload photos, edit, hide (for sold cars), delete
- Offers tab ...... weekly offers
- Booking requests  messages sent from the Contact page
Photos are shrunk automatically when you upload them. The first photo is the main one.

WHAT TO EDIT, AND WHERE
- Cars and their photos ................................. staff page > Cars
- Offers ................................................. staff page > Offers
- Phone, email, address, opening hours ................... js/data.js
- Big photo on the home page ............................. js/data.js (heroImage) + a file in images/
- Page text (services, repair and chains prices) ......... js/app.js  (search for the words to change)
- Colors and fonts ....................................... css/style.css (variables at the very top)
After editing a file, refresh the site with Ctrl+F5 (or Cmd+Shift+R) to see the change.

PREVIEW ON YOUR COMPUTER
- Design only: VS Code > Live Server. The sample cars in js/data.js are shown. The staff page,
  offers and booking form do NOT work this way (they need PHP).
- Everything working: install PHP, open a terminal in this folder and run
      php -S localhost:8000
  then open http://localhost:8000  (staff page: http://localhost:8000/admin/).
  Change ADMIN_PASSWORD in config.php first.

NOTES
- Needs PHP 7.4 or newer (GoDaddy's default is fine).
- The data folder holds cars.json, offers.json, bookings.json. The images/cars folder holds car photos.
  When you upload a new version of the site later, do NOT overwrite the data and images folders,
  or you will lose your live cars, offers and photos.
- If booking emails don't arrive, check spam. Requests are always saved on the staff page anyway.
