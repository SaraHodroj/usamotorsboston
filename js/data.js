/* USA Motors site data.
   Edit this file to change contact details, opening hours and the home page photo.
   Cars are NOT edited here any more: add and edit them on the staff page
   (yourdomain.com/admin, "Cars" tab).
   Save, then re-upload this file to public_html/js/ on GoDaddy. */

/* =========================================================
   EDIT YOUR BUSINESS DETAILS HERE
   ========================================================= */
const BUSINESS = {
  name: "USA Motors",
  phone: "(555) 123-4567",
  phoneLink: "+15551234567",
  email: "info@usamotors.com",
  address: "1234 Main Street, Your City, ST 00000",
  mapsSearch: "USA Motors 1234 Main Street",
  heroImage: "images/background.jpg",  
  hours: [["Monday – Friday","8:00 AM – 6:00 PM"],["Saturday","9:00 AM – 3:00 PM"],["Sunday","Closed"]]
};

/* =========================================================
   SAMPLE CARS (preview only)
   These are shown ONLY when the staff-page system isn't running,
   for example when you preview with Live Server in VS Code.
   On the real website your cars come from the staff page.
   You can leave this list alone.
   ========================================================= */
const SAMPLE_CARS = [
  {id:"f150-19", condition:"used", images:[], year:2019, make:"Ford", model:"F-150 Lariat", body:"truck", color:"#2F3A45", price:31900, miles:58400,
   engine:"3.5L EcoBoost V6", trans:"10-speed automatic", drive:"4x4", fuel:"Gasoline", mpg:"18 city / 23 hwy",
   ext:"Blue Jeans Metallic", int:"Black leather", doors:4, seats:5, vin:"1FTEW1E4XKF000000", badge:"Just arrived",
   desc:"One-owner Lariat crew cab with the 3.5L EcoBoost. Clean history, fresh oil service, and new all-terrain tires. Ready to work or ready for the weekend.",
   features:["Heated & cooled seats","Tow package","Spray-in bedliner","Apple CarPlay","Backup camera","Remote start"]},
  {id:"tahoe-20", condition:"used", images:[], year:2020, make:"Chevrolet", model:"Tahoe LT", body:"suv", color:"#1E1F22", price:38500, miles:47200,
   engine:"5.3L V8", trans:"6-speed automatic", drive:"4WD", fuel:"Gasoline", mpg:"15 city / 22 hwy",
   ext:"Black", int:"Jet Black leather", doors:4, seats:8, vin:"1GNSKBKC0LR000000", badge:"",
   desc:"Full-size, eight-passenger Tahoe with third-row seating and plenty of power. Well kept inside and out, serviced here at USA Motors.",
   features:["Third-row seating","Power liftgate","Bose audio","Rear park assist","Towing package","Heated front seats"]},
  {id:"bmw530-18", condition:"used", images:[], year:2018, make:"BMW", model:"530i xDrive", body:"sedan", color:"#6E7780", price:24900, miles:61900,
   engine:"2.0L Turbo I4", trans:"8-speed automatic", drive:"AWD", fuel:"Gasoline", mpg:"24 city / 33 hwy",
   ext:"Bluestone Metallic", int:"Cognac Dakota leather", doors:4, seats:5, vin:"WBAJA7C5XJW000000", badge:"",
   desc:"Executive comfort with all-wheel drive. Premium package, navigation, and a quiet, smooth ride. Inspected and detailed.",
   features:["Navigation","Heated steering wheel","Sunroof","Parking sensors","LED headlights","Keyless entry"]},
  {id:"charger-21", condition:"used", images:[], year:2021, make:"Dodge", model:"Charger R/T", body:"coupe", color:"#7A1E1E", price:32500, miles:28700,
   engine:"5.7L HEMI V8", trans:"8-speed automatic", drive:"RWD", fuel:"Gasoline", mpg:"16 city / 25 hwy",
   ext:"Octane Red", int:"Black cloth / suede", doors:4, seats:5, vin:"2C3CDXCT3MH000000", badge:"Low miles",
   desc:"HEMI power with low miles. Performance exhaust note, sport-tuned suspension, and a clean interior. A head-turner that still fits the family.",
   features:["Performance exhaust","Uconnect 8.4\" screen","Dual-zone climate","Blind-spot monitoring","Sport mode","20\" wheels"]},
  {id:"wrangler-17", condition:"used", images:[], year:2017, make:"Jeep", model:"Wrangler Unlimited Sahara", body:"suv", color:"#4B5A3A", price:26900, miles:69800,
   engine:"3.6L V6", trans:"5-speed automatic", drive:"4x4", fuel:"Gasoline", mpg:"16 city / 20 hwy",
   ext:"Sarge Green", int:"Black cloth", doors:4, seats:5, vin:"1C4BJWEG3HL000000", badge:"",
   desc:"Four-door Sahara with hard top and a 4x4 system that is ready for trails. Mechanically sound with new brakes all around.",
   features:["Removable hard top","Tow hitch","Bluetooth","Fog lights","All-terrain tires","Cruise control"]},
  {id:"c300-19", condition:"used", images:[], year:2019, make:"Mercedes-Benz", model:"C 300 4MATIC", body:"sedan", color:"#E6E4DE", price:27400, miles:39600,
   engine:"2.0L Turbo I4", trans:"9-speed automatic", drive:"AWD", fuel:"Gasoline", mpg:"23 city / 31 hwy",
   ext:"Polar White", int:"Black MB-Tex", doors:4, seats:5, vin:"55SWF8EB1KU000000", badge:"",
   desc:"Refined, efficient and quiet. Panorama roof, premium package, and a full service history.",
   features:["Panorama roof","Burmester-ready audio","Heated seats","Ambient lighting","Blind-spot assist","Power trunk"]},
  {id:"camry-20", condition:"new", images:[], year:2026, make:"Toyota", model:"Camry SE", body:"sedan", color:"#9EA7B0", price:31200, miles:12,
   engine:"2.5L I4", trans:"8-speed automatic", drive:"FWD", fuel:"Gasoline", mpg:"28 city / 39 hwy",
   ext:"Celestial Silver", int:"Black SofTex", doors:4, seats:5, vin:"4T1G11AK5LU000000", badge:"Factory warranty",
   desc:"Brand-new Camry SE hybrid-ready sedan. Dependable, fuel-efficient and easy to own, with Toyota Safety Sense and full factory warranty.",
   features:["Adaptive cruise","Lane departure alert","Apple CarPlay","Backup camera","Push-button start","Alloy wheels"]},
  {id:"rx350-16", condition:"used", images:[], year:2016, make:"Lexus", model:"RX 350", body:"suv", color:"#3B3530", price:25900, miles:78300,
   engine:"3.5L V6", trans:"8-speed automatic", drive:"AWD", fuel:"Gasoline", mpg:"19 city / 26 hwy",
   ext:"Caviar", int:"Parchment leather", doors:4, seats:5, vin:"2T2BZMCA8GC000000", badge:"",
   desc:"Luxury SUV comfort with Lexus reliability. Premium package, power liftgate, and a very clean cabin.",
   features:["Leather seats","Power liftgate","Moonroof","Heated seats","Blind-spot monitor","Navigation"]}
];
