/* ========================================================= */
const $ = (s, el=document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money = n => "$" + Number(n).toLocaleString("en-US");
const miles = n => Number(n).toLocaleString("en-US") + " mi";
const todayStr = () => new Date().toISOString().slice(0,10);
const fmtDate = d => { if(!d) return ""; const x=new Date(d+"T12:00:00"); return isNaN(x)?d:x.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}); };

/* Car drawing */
const SHAPES = {
  sedan:{b:"M20,110 L20,93 Q22,81 46,77 L112,70 Q142,46 176,41 L250,41 Q281,43 306,68 L360,76 Q382,80 384,96 L384,110 Z",
         w:"M124,70 Q150,51 179,48 L204,48 L204,70 Z M210,48 L240,48 Q263,50 285,70 L210,70 Z", f:[95,310]},
  coupe:{b:"M20,110 L20,95 Q24,83 50,79 L122,72 Q162,43 200,41 L245,43 Q292,51 322,73 L366,80 Q384,84 384,99 L384,110 Z",
         w:"M138,72 Q167,51 200,49 L214,49 L214,72 Z M220,49 L240,50 Q270,56 296,72 L220,72 Z", f:[98,312]},
  suv:  {b:"M18,112 L18,82 Q20,69 40,65 L86,61 L114,32 Q120,26 136,26 L300,26 Q318,26 330,40 L354,63 Q381,67 384,86 L384,112 Z",
         w:"M122,59 L140,34 L205,34 L205,59 Z M212,34 L298,34 Q310,34 318,44 L333,59 L212,59 Z", f:[92,316]},
  truck:{b:"M18,112 L18,83 Q20,71 40,67 L100,63 L124,31 Q128,26 138,26 L218,26 Q225,26 225,34 L225,66 L384,66 L384,112 Z",
         w:"M131,59 L146,34 L176,34 L176,59 Z M182,34 L217,34 L217,59 L182,59 Z", f:[92,322]}
};
function carSVG(car, opts={}){
  const s = SHAPES[car.body] || SHAPES.sedan, uid = "g"+Math.random().toString(36).slice(2,8);
  const wheel = x => `<g><circle cx="${x}" cy="112" r="24" fill="#0C0E10"/><circle cx="${x}" cy="112" r="14" fill="#8A96A3"/><circle cx="${x}" cy="112" r="14" fill="url(#${uid}r)"/><circle cx="${x}" cy="112" r="4" fill="#2A3037"/></g>`;
  return `<svg viewBox="0 0 404 150" role="img" aria-label="${esc(car.year+' '+car.make+' '+car.model)}">
  <defs>
    <linearGradient id="${uid}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>
    <linearGradient id="${uid}w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5E6B78"/><stop offset="1" stop-color="#1A2027"/></linearGradient>
    <radialGradient id="${uid}r"><stop offset=".3" stop-color="#C9D1D8"/><stop offset="1" stop-color="#4A535D"/></radialGradient>
  </defs>
  <ellipse cx="202" cy="136" rx="190" ry="9" fill="#000" opacity=".6"/>
  <path d="${s.b}" fill="${car.color}"/><path d="${s.b}" fill="url(#${uid}b)"/>
  <path d="${s.w}" fill="url(#${uid}w)"/>
  <path d="M30,96 L378,96" stroke="#fff" stroke-opacity=".12" stroke-width="2"/>
  <rect x="368" y="84" width="14" height="6" rx="2" fill="#F3E3B5" opacity=".9"/>
  ${opts.glow?`<ellipse cx="22" cy="89" rx="26" ry="10" fill="#E0242F" opacity=".35"/>`:""}<rect x="20" y="86" width="10" height="6" rx="2" fill="#E0242F"/>
  ${wheel(s.f[0])}${wheel(s.f[1])}
  </svg>`;
}

/* ---------- Cars (loaded from the server) ---------- */
/* On the real site the cars come from the staff page (api/cars.php).
   If the server isn't running (e.g. Live Server preview) we show SAMPLE_CARS from data.js. */
let CARS = (typeof SAMPLE_CARS !== "undefined") ? SAMPLE_CARS : [];
async function loadCars(){
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 4000);
  try {
    const r = await fetch("api/cars.php", { cache:"no-store", signal:ctl.signal });
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    if (!Array.isArray(d.cars)) throw new Error("bad data");
    CARS = d.cars;
  } catch(e) { /* keep the sample cars */ }
  clearTimeout(timer);
}
const has = v => v !== undefined && v !== null && v !== "";

/* ---------- Offers (loaded from the server) ---------- */
const live = { offers:[], offersState:"loading" };
fetch("api/offers.php", {cache:"no-store"})
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(d => { live.offers = Array.isArray(d.offers) ? d.offers : []; live.offersState = "ready"; refreshLive(); })
  .catch(() => { live.offersState = "error"; refreshLive(); });

function sortedOffers(all){
  return [...all].sort((a,b)=> (b.featured?1:0)-(a.featured?1:0) || (b.updatedAt||0)-(a.updatedAt||0));
}
function publicOffers(){
  const t = todayStr();
  return sortedOffers(live.offers).filter(o => o.active !== false && (!o.validUntil || o.validUntil >= t));
}
function offerHTML(o, allowFeatured=true){
  const feat = allowFeatured && o.featured;
  const deal = o.price ? `<div class="deal"><b>${esc(o.price)}</b>${o.wasPrice?`<s>${esc(o.wasPrice)}</s>`:""}</div>` : "";
  const valid = o.validUntil ? `<div class="valid">Valid until ${esc(fmtDate(o.validUntil))}</div>` : "";
  if (feat) return `<article class="offer featured"><div>${o.tag?`<span class="tag">${esc(o.tag)}</span>`:""}<h3 style="margin:12px 0 10px">${esc(o.title)}</h3><p>${esc(o.description)}</p></div><div>${deal}${valid}<a class="btn btn-primary" href="#/contact?s=${encodeURIComponent(o.title)}" style="margin-top:18px">Claim this offer</a></div></article>`;
  return `<article class="offer">${o.tag?`<span class="tag">${esc(o.tag)}</span>`:""}<h3>${esc(o.title)}</h3><p>${esc(o.description)}</p>${deal}${valid}<a class="link" href="#/contact?s=${encodeURIComponent(o.title)}" style="align-self:flex-start;margin-top:8px">Book this offer</a></article>`;
}
function renderOffersInto(el){
  const limit = +el.dataset.limit || 0;
  if (live.offersState === "loading") { el.innerHTML = `<div class="empty">Loading this week's offers…</div>`; return; }
  if (live.offersState !== "ready") { el.innerHTML = `<div class="empty">Offers can't be shown right now. Call us at <a href="tel:${BUSINESS.phoneLink}">${esc(BUSINESS.phone)}</a> to hear this week's deals.</div>`; return; }
  let list = publicOffers(); if (limit) list = list.slice(0, limit);
  el.innerHTML = list.length ? `<div class="offers">${list.map(o=>offerHTML(o, !limit)).join("")}</div>`
    : `<div class="empty">New offers are on the way. Check back soon, or call <a href="tel:${BUSINESS.phoneLink}">${esc(BUSINESS.phone)}</a>.</div>`;
}
function refreshLive(){
  document.querySelectorAll("[data-offers]").forEach(renderOffersInto);
}

/* ---------- Photo or drawing ---------- */
/* If a car has photos (images: [...] in data.js) we show them.
   If not, we show the drawing, so nothing is ever blank. */
const carPhotos = c => Array.isArray(c.images) ? c.images.filter(Boolean) : [];
function carVisual(c, i=0){
  const p = carPhotos(c);
  return p.length ? `<img class="photo" src="${esc(p[i]||p[0])}" alt="${esc(c.year+' '+c.make+' '+c.model)}" loading="lazy">` : carSVG(c);
}

/* ---------- Pages ---------- */
const pageHead = (t, p) => `<section class="page-head"><div class="wrap"><h1>${t}</h1>${p?`<p>${p}</p>`:""}</div></section>`;
const condLabel = c => c.condition==="new" ? "New" : "Pre-owned";
const specBits = c => [has(c.miles) ? miles(c.miles) : "", c.drive, String(c.trans||"").split(" ").slice(0,2).join(" ")].filter(Boolean);
const carCard = c => `<button class="car" data-car="${esc(c.id)}" aria-label="View ${esc(c.year+' '+c.make+' '+c.model)}">
  <div class="stage ${carPhotos(c).length?"has-photo":""}"><div class="tags"><span class="tag-c ${c.condition==="new"?"new":""}">${condLabel(c)}</span>${c.badge?`<span class="tag-b">${esc(c.badge)}</span>`:""}</div>${carVisual(c)}</div>
  <div class="info"><span class="yr">${esc(c.year)} ${esc(c.make)}</span><h3>${esc(c.model)}</h3>
  ${specBits(c).length ? `<div class="specline">${specBits(c).map(x=>`<span>${esc(x)}</span>`).join("")}</div>` : ""}
  <div class="row"><span class="price">${money(c.price)}</span><span class="more">View details</span></div></div></button>`;

const PAGES = {
home(){
  const hero = CARS.find(c=>c.body==="coupe") || CARS[0] || {body:"sedan", color:"#7A1E1E", year:"", make:"", model:"USA Motors"};
  const heroBg = BUSINESS.heroImage ? encodeURI(String(BUSINESS.heroImage)).replace(/'/g,"%27").replace(/\(/g,"%28").replace(/\)/g,"%29") : "";
  const icon = {
    insp:'<svg viewBox="0 0 24 24"><path d="M9 11l2 2 4-4"/><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>',
    repair:'<svg viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/></svg>',
    chain:'<svg viewBox="0 0 24 24"><rect x="2" y="9" width="9" height="6" rx="3"/><rect x="13" y="9" width="9" height="6" rx="3"/><path d="M9 12h6"/></svg>'};
  return `
    <section class="hero${heroBg ? " has-bg" : ""}"${heroBg ? ` style="background-image:url('${esc(heroBg)}')"` : ""}>
    <div class="wrap">
      <div class="hero-grid">
        <div>
          <h1>Your trusted car sales &amp; auto repair shop</h1>
          <p class="lead">New and pre-owned vehicles, full-service auto repair and state inspections, all under one roof.</p>
          <div class="hero-actions"><a class="btn btn-primary" href="#/inventory">Browse inventory</a><a class="btn btn-light" href="#/contact">Schedule appointment</a></div>
        </div>
                ${heroBg ? "" : `<div class="hero-car">${carSVG(hero, {glow:true})}</div>`}
      </div>
    </div>
  </section>
  <div class="facts"><div class="wrap">
    <div><strong>${CARS.length ? CARS.length+(CARS.length===1?" vehicle":" vehicles") : "New arrivals"}</strong>${CARS.length ? "in stock now" : "added often"}</div>
    <div><strong>State inspection</strong>while you wait</div>
    <div><strong>Full auto repair</strong>all makes &amp; models</div>
    <div><strong>Weekly offers</strong>new deals every week</div>
  </div></div>
  <section class="block"><div class="wrap">
    <div class="sec-title"><div><h2>Featured vehicles</h2><p>A few of the cars available today. Tap any car for full details and pricing.</p></div><a class="link" href="#/inventory">See all vehicles</a></div>
    ${CARS.length ? `<div class="cars">${CARS.slice(0,3).map(carCard).join("")}</div>` : `<div class="empty">New vehicles are being added. Call us to hear what's arriving.</div>`}
  </div></section>
  <section class="block alt"><div class="wrap">
    <div class="sec-title"><div><h2>Our services</h2><p>Keep your car safe, legal and running right.</p></div></div>
    <div class="svc-grid">
      <a class="svc" href="#/inspection"><span class="ico">${icon.insp}</span><h3>State inspection</h3><p>Official state safety and emissions inspections, usually done while you wait.</p><span class="go">Learn more</span></a>
      <a class="svc" href="#/repair"><span class="ico">${icon.repair}</span><h3>Auto repair</h3><p>Diagnostics, brakes, engine, suspension, A/C and routine maintenance for all makes.</p><span class="go">Learn more</span></a>
    </div>
  </div></section>
  <section class="block"><div class="wrap">
    <div class="sec-title"><div><h2>This week's offers</h2><p>Limited-time deals on service and vehicles.</p></div><a class="link" href="#/offers">All offers</a></div>
    <div data-offers data-limit="3"></div>
  </div></section>`;
},
inventory(params){
  const c = params.get("c"); invCond = (c==="new"||c==="used") ? c : "all";
  const types = ["all","sedan","suv","truck","coupe"], label = {all:"All types",sedan:"Sedans",suv:"SUVs",truck:"Trucks",coupe:"Coupes & sport"};
  const conds = [["all","All vehicles"],["new","New"],["used","Pre-owned"]];
  return pageHead("Our inventory","Every vehicle is inspected by our own mechanics before it's offered for sale.") + `
  <section class="block"><div class="wrap">
    <div class="inv-bar">
      <div class="seg" role="group" aria-label="Condition">${conds.map(([k,l])=>`<button data-cond="${k}" aria-pressed="${k===invCond}">${l}</button>`).join("")}</div>
      <label class="sr" for="sort">Sort</label>
      <select id="sort"><option value="new">Newest first</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="miles">Lowest mileage</option></select>
    </div>
    <div class="chips" role="group" aria-label="Body type" style="margin:-8px 0 26px">
      ${types.map(t=>`<button class="chip" data-type="${t}" aria-pressed="${t===invType}">${label[t]}</button>`).join("")}
    </div>
    <p class="count" id="carCount"></p>
    <div class="cars" id="carGrid"></div>
  </div></section>`;
},
inspection(){
  return pageHead("State inspection","Licensed state inspection station. Most inspections are finished while you wait.") + `
  <section class="block"><div class="wrap two">
    <div class="prose">
      <h2>What we check</h2>
      <p>A state inspection makes sure your vehicle is safe on the road and meets emissions standards. Our certified inspectors follow the official state checklist, including:</p>
      <ul class="check">
        <li>Brakes, parking brake and brake lines</li><li>Tires, wheels and tread depth</li>
        <li>Headlights, tail lights, turn signals and brake lights</li><li>Steering, suspension and wheel alignment</li>
        <li>Windshield, wipers and mirrors</li><li>Horn, seat belts and exhaust system</li>
        <li>Emissions / on-board diagnostics (OBD) test where required</li>
      </ul>
      <h3>What to bring</h3>
      <ul><li>Valid vehicle registration</li><li>Proof of current insurance</li><li>Driver's license</li></ul>
      <h3>If your vehicle doesn't pass</h3>
      <p>We'll explain exactly what failed and give you a written quote. Our repair shop can usually fix the issue the same day, and the re-inspection is quick.</p>
    </div>
    <aside class="aside">
      <h3>Inspection details</h3>
      <dl><dt>Typical time</dt><dd>20–40 minutes</dd><dt>Appointment</dt><dd>Walk-ins welcome</dd><dt>Re-inspection</dt><dd>Available</dd><dt>Fee</dt><dd>State-set rate</dd></dl>
      <a class="btn btn-primary" style="width:100%" href="#/contact?s=State%20inspection">Book an inspection</a>
      <p style="font-size:14px;margin:14px 0 0">Or call <a href="tel:${BUSINESS.phoneLink}">${esc(BUSINESS.phone)}</a> to check today's wait time.</p>
    </aside>
  </div></section>`;
},
repair(){
  const rows = [["Diagnostic scan & check-engine light","from $89"],["Oil & filter change (synthetic)","from $69"],["Brake pads (per axle)","from $179"],["Wheel alignment","from $99"],["A/C check & recharge","from $129"],["Battery test & replacement","from $149"]];
  return pageHead("Auto repair","Experienced mechanics, clear quotes and quality parts, for every make and model.") + `
  <section class="block"><div class="wrap two">
    <div class="prose">
      <h2>What we fix</h2>
      <ul class="check">
        <li><b>Engine &amp; diagnostics</b> — check-engine lights, tune-ups, timing belts, cooling systems</li>
        <li><b>Brakes</b> — pads, rotors, calipers, brake fluid and ABS issues</li>
        <li><b>Suspension &amp; steering</b> — shocks, struts, control arms, alignment</li>
        <li><b>Transmission &amp; drivetrain</b> — fluid service, clutches, CV axles, differentials</li>
        <li><b>Electrical</b> — batteries, alternators, starters, lighting and wiring</li>
        <li><b>A/C &amp; heating</b> — recharge, leak detection, compressor repair</li>
        <li><b>Routine maintenance</b> — oil changes, filters, fluids, tire rotation</li>
      </ul>
      <h3>Common service prices</h3>
      <div class="table-wrap"><table class="price-table"><thead><tr><th>Service</th><th>Price</th></tr></thead>
      <tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}</tbody></table></div>
      <p style="color:var(--ink-2);font-size:15px">Final price depends on your vehicle. You approve every quote before we start work.</p>
    </div>
    <aside class="aside">
      <h3>How it works</h3>
      <ol class="steps" style="margin-bottom:22px">
        <li><div><b>Book or drop in</b><span>Tell us what's going on with your car.</span></div></li>
        <li><div><b>We diagnose</b><span>You get a clear quote before any work.</span></div></li>
        <li><div><b>You approve</b><span>No surprises on the final bill.</span></div></li>
      </ol>
      <a class="btn btn-primary" style="width:100%" href="#/contact?s=Auto%20repair">Book a repair</a>
    </aside>
  </div></section>`;
},
offers(){
  return pageHead("This week's offers","Limited-time deals on service, inspections and vehicles. New offers every week.") +
  `<section class="block"><div class="wrap"><div data-offers></div></div></section>`;
},
contact(params){
  const pre = params.get("s") || "";
  const opts = ["Test drive","Vehicle purchase","State inspection","Auto repair","Chains","Other"];
  const sel = opts.find(o => pre.toLowerCase().includes(o.toLowerCase())) || (pre ? "Other" : "");
  return pageHead("Contact &amp; booking","Call, visit, or book a time below and we'll confirm your appointment.") + `
  <section class="block"><div class="wrap contact-grid">
    <div class="card-dark">
      <h2>Visit the shop</h2>
      <div class="item"><small>Phone</small><a href="tel:${BUSINESS.phoneLink}">${esc(BUSINESS.phone)}</a></div>
      <div class="item"><small>Email</small><a href="mailto:${BUSINESS.email}">${esc(BUSINESS.email)}</a></div>
      <div class="item"><small>Address</small><span>${esc(BUSINESS.address)}</span><br><a class="link" style="font-size:14px;color:#fff;text-decoration:underline" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BUSINESS.mapsSearch)}">Get directions</a></div>
      <div class="item"><small>Opening hours</small><table class="hours">${BUSINESS.hours.map(h=>`<tr><td>${h[0]}</td><td>${h[1]}</td></tr>`).join("")}</table></div>
    </div>
    <form class="book" id="bookForm" novalidate>
      <h2>Book an appointment</h2>
      <p style="color:var(--ink-2);margin:0">Pick a service and a time that works. We'll call to confirm.</p>
      <div class="fields">
        <label class="f">Full name<input name="name" required autocomplete="name"></label>
        <label class="f">Phone<input name="phone" type="tel" required autocomplete="tel"></label>
        <label class="f full">Email <span class="opt">(optional)</span><input name="email" type="email" autocomplete="email"></label>
        <label class="f">Service<select name="service" required><option value="">Choose a service</option>${opts.map(o=>`<option ${o===sel?"selected":""}>${o}</option>`).join("")}</select></label>
        <label class="f">Your vehicle <span class="opt">(optional)</span><input name="vehicle" placeholder="e.g. 2015 Honda Accord"></label>
        <label class="f">Preferred date<input name="date" type="date" min="${todayStr()}" required></label>
        <label class="f">Preferred time<select name="time" required><option value="">Choose a time</option><option>Morning (8–11 AM)</option><option>Midday (11 AM–2 PM)</option><option>Afternoon (2–6 PM)</option></select></label>
        <label class="f full">Message <span class="opt">(optional)</span><textarea name="message" placeholder="Tell us about the car or what you need">${pre && sel==="Other" ? esc("About: "+pre) : ""}</textarea></label>
      </div>
      <input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">
      <button class="btn btn-primary" type="submit" style="margin-top:20px">Request appointment</button>
      <div id="bookMsg" role="status" aria-live="polite"></div>
    </form>
  </div></section>`;
}
};

/* ---------- Inventory behaviour ---------- */
let invType = "all", invSort = "new", invCond = "all";
function drawInventory(){
  const grid = $("#carGrid"); if (!grid) return;
  let list = CARS.filter(c => (invType==="all" || c.body===invType) && (invCond==="all" || c.condition===invCond));
  const s = {new:(a,b)=>(b.year||0)-(a.year||0), low:(a,b)=>(a.price||0)-(b.price||0), high:(a,b)=>(b.price||0)-(a.price||0), miles:(a,b)=>(has(a.miles)?a.miles:1e9)-(has(b.miles)?b.miles:1e9)}[invSort];
  list.sort(s);
  const cnt = $("#carCount"); if (cnt) cnt.textContent = `${list.length} vehicle${list.length===1?"":"s"} found`;
  grid.innerHTML = list.length ? list.map(carCard).join("") : `<div class="empty" style="grid-column:1/-1">No vehicles of this type right now. Call us, we may have one arriving soon.</div>`;
}
function openCar(id){
  const c = CARS.find(x=>x.id===id); if(!c) return;
  const d = $("#sticker"); d.dataset.vid = c.id;
  const specs = [["Condition",condLabel(c)],["Year",c.year],["Make",c.make],["Model",c.model],["Mileage",has(c.miles)?miles(c.miles):""],["Engine",c.engine],["Transmission",c.trans],["Drivetrain",c.drive],["Fuel",c.fuel],["Fuel economy",c.mpg],["Exterior",c.ext],["Interior",c.int],["Seats",c.seats],["VIN",c.vin]].filter(r => has(r[1]));
  const feats = Array.isArray(c.features) ? c.features.filter(Boolean) : [];
  d.innerHTML = `<div class="st-top"><span>Vehicle details</span><button class="st-close" data-close>Close</button></div>
  <div class="st-body">
    <div class="st-left">
      <div class="st-stage ${carPhotos(c).length?"has-photo":""}"><div class="tags"><span class="tag-c ${c.condition==="new"?"new":""}">${condLabel(c)}</span></div><div id="stMain">${carVisual(c)}</div></div>
      ${carPhotos(c).length>1 ? `<div class="thumbs">${carPhotos(c).map((p,i)=>`<button type="button" class="thumb" data-thumb="${i}" aria-label="Photo ${i+1}" aria-pressed="${i===0}"><img src="${esc(p)}" alt=""></button>`).join("")}</div>` : ""}
      <span class="yr">${esc(c.year)} ${esc(c.make)}</span>
      <h2 id="stTitle">${esc(c.model)}</h2>
      <div class="st-price"><b>${money(c.price)}</b><small>${condLabel(c)}${has(c.miles)?" · "+miles(c.miles):""}</small></div>
      ${c.desc ? `<p>${esc(c.desc).replace(/\n/g,"<br>")}</p>` : ""}
    </div>
    <div class="st-right">
      <h3>Specifications</h3>
      <table class="specs">${specs.map(s=>`<tr><th>${s[0]}</th><td>${esc(s[1])}</td></tr>`).join("")}</table>
      ${feats.length ? `<h3>Features</h3>
      <ul class="feat">${feats.map(f=>`<li>${esc(f)}</li>`).join("")}</ul>` : ""}
      <div class="st-actions">
        <a class="btn btn-primary" href="#/contact?s=${encodeURIComponent("Test drive: "+c.year+" "+c.make+" "+c.model)}" data-close>Book a test drive</a>
        <a class="btn btn-ghost" href="tel:${BUSINESS.phoneLink}">Call ${esc(BUSINESS.phone)}</a>
      </div>
    </div>
  </div>`;
  d.showModal();
}
$("#sticker").addEventListener("click", e => {
  const t = e.target.closest("[data-thumb]"); if (!t) return;
  const car = CARS.find(x => x.id === $("#sticker").dataset.vid); if (!car) return;
  $("#stMain").innerHTML = carVisual(car, +t.dataset.thumb);
  $("#sticker").querySelectorAll(".thumb").forEach(b => b.setAttribute("aria-pressed", b === t));
});
$("#sticker").addEventListener("click", e => { if (e.target.closest("[data-close]") || e.target === e.currentTarget) $("#sticker").close(); });

/* ---------- Booking ---------- */
async function submitBooking(form){
  const msg = $("#bookMsg"), data = Object.fromEntries(new FormData(form));
  const missing = ["name","phone","service","date","time"].filter(k => !String(data[k]||"").trim());
  if (missing.length){ msg.innerHTML = `<div class="notice err">Please fill in your name, phone, service, date and time.</div>`; form.querySelector(`[name="${missing[0]}"]`).focus(); return; }
  const btn = form.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Sending…";
  const fallback = `<div class="notice err">We couldn't send your request online. Please call <a href="tel:${BUSINESS.phoneLink}">${esc(BUSINESS.phone)}</a> and we'll book you in.</div>`;
  try {
    const res = await fetch("api/booking.php", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(data) });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) { msg.innerHTML = out.error ? `<div class="notice err">${esc(out.error)}</div>` : fallback; btn.disabled=false; btn.textContent="Request appointment"; return; }
    form.reset();
    msg.innerHTML = `<div class="notice ok">Thanks, ${esc(data.name.split(" ")[0])}. Your request for ${esc(data.service.toLowerCase())} on ${esc(fmtDate(data.date))} was sent. We'll call you to confirm.</div>`;
  } catch(e){ msg.innerHTML = fallback; }
  btn.disabled = false; btn.textContent = "Request appointment";
}

/* ---------- Footer & router ---------- */
$("#footer").innerHTML = `
  <div><h4>USA Motors</h4><p style="max-width:30em">New and pre-owned vehicle sales, auto repair, state inspection and chains.</p><p>${esc(BUSINESS.address)}<br><a style="display:inline" href="tel:${BUSINESS.phoneLink}">${esc(BUSINESS.phone)}</a></p></div>
  <div><h4>Explore</h4><a href="#/inventory">All vehicles</a><a href="#/inventory?c=used">Pre-owned vehicles</a><a href="#/offers">Weekly offers</a><a href="#/contact">Contact &amp; booking</a></div>
  <div><h4>Services</h4><a href="#/inspection">State inspection</a><a href="#/repair">Auto repair</a><a href="#/chains">Chains</a></div>
  <div class="fine"><span>© ${new Date().getFullYear()} Developed By Sara Hodroj, For more info contact sara.hodroj8@gmail.com</span><a href="admin/" style="display:inline">Staff login</a></div>`;

let currentRoute = "";
function router(){
  const raw = location.hash.replace(/^#\/?/, "");
  const [path, qs] = raw.split("?");
  const route = PAGES[path] ? path : "home";
  const params = new URLSearchParams(qs || "");
  currentRoute = route;
  $("#app").innerHTML = PAGES[route](params);
  window.scrollTo(0,0);
  document.querySelectorAll("nav.main a").forEach(a => { if (a.dataset.r===route) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current"); });
  $("#nav").classList.remove("open"); $("#menuBtn").setAttribute("aria-expanded","false");
  if (route==="inventory") drawInventory();
  const bf = $("#bookForm"); if (bf) bf.addEventListener("submit", e => { e.preventDefault(); submitBooking(bf); });
  document.title = ({home:"USA Motors | Pre-Owned Cars, Auto Repair & State Inspection",inventory:"Pre-Owned Vehicles | USA Motors",inspection:"State Inspection | USA Motors",repair:"Auto Repair | USA Motors",chains:"Tire & Snow Chains | USA Motors",offers:"Weekly Offers | USA Motors",contact:"Contact & Booking | USA Motors"})[route];
  refreshLive();
}
document.addEventListener("click", e => {
  const car = e.target.closest("[data-car]"); if (car) { openCar(car.dataset.car); return; }
  const chip = e.target.closest(".chip[data-type]");
  const seg = e.target.closest(".seg button[data-cond]");
  if (seg){ invCond = seg.dataset.cond; document.querySelectorAll(".seg button").forEach(b=>b.setAttribute("aria-pressed", b===seg)); drawInventory(); return; }
  if (chip){ invType = chip.dataset.type; document.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed", c===chip)); drawInventory(); }
});
document.addEventListener("change", e => { if (e.target.id==="sort"){ invSort = e.target.value; drawInventory(); } });
$("#menuBtn").addEventListener("click", () => { const n=$("#nav"); n.classList.toggle("open"); $("#menuBtn").setAttribute("aria-expanded", n.classList.contains("open")); });
window.addEventListener("hashchange", router);
loadCars().then(router);
