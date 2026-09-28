const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const todayStr = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset()*60000).toISOString().slice(0,10); };
const fmtDate = d => { if(!d) return ""; const x = new Date(d+"T12:00:00"); return isNaN(x) ? d : x.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}); };
const money = n => "$" + Number(n).toLocaleString("en-US");
const has = v => v !== undefined && v !== null && v !== "";

async function api(url, body){
  const res = await fetch(url, body ? { method:"POST", headers:{"Content-Type":"application/json","X-CSRF-Token":CSRF}, body:JSON.stringify(body) } : { cache:"no-store" });
  const out = await res.json().catch(() => ({}));
  if (res.status === 401) { location.reload(); throw new Error("logged out"); }
  if (!res.ok) throw new Error(out.error || "Something went wrong. Try again.");
  return out;
}
function flash(sel, text, bad){ $(sel).innerHTML = `<div class="notice ${bad?"err":"ok"}">${esc(text)}</div>`; }

/* ---------- Tabs ---------- */
const TABS = ["cars","offers","bookings"];
function showTab(t){
  if (!TABS.includes(t)) t = "cars";
  TABS.forEach(x => { $("#tab-"+x).hidden = (x !== t); });
  document.querySelectorAll("[data-tab]").forEach(b => b.setAttribute("aria-pressed", b.dataset.tab === t));
  history.replaceState(null, "", "#" + t);
}
document.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => showTab(b.dataset.tab)));
showTab(location.hash.slice(1));

/* =========================================================
   CARS
   ========================================================= */
let cars = [], editingCarId = null, photos = [], sessionNew = new Set();
const carForm = $("#carForm");

function carTitle(c){ return [c.year, c.make, c.model].filter(Boolean).join(" "); }
function drawCars(){
  $("#carList").innerHTML = cars.length ? cars.map(c => {
    const hidden = c.active === false;
    const th = (c.images && c.images[0]) ? `<img src="../${esc(c.images[0])}" alt="">` : "No photo";
    return `<div class="c-row"><div class="th">${th}</div>
      <div><b>${esc(carTitle(c))}</b><span class="status ${hidden?"off":"live"}">${hidden?"Hidden":"Live"}</span><small>${money(c.price)}${has(c.miles)?" · "+Number(c.miles).toLocaleString("en-US")+" mi":""}</small></div>
      <div class="o-actions"><button class="btn btn-ghost btn-small" data-act="edit" data-id="${esc(c.id)}">Edit</button><button class="btn btn-ghost btn-small" data-act="toggle" data-id="${esc(c.id)}">${hidden?"Show":"Hide"}</button><button class="btn btn-danger btn-small" data-act="delete" data-id="${esc(c.id)}">Delete</button></div></div>`;
  }).join("") : `<div class="empty">No cars yet. Add your first one with the form.</div>`;
}
async function loadCars(){
  try { cars = (await api("../api/cars.php?all=1")).cars || []; drawCars(); }
  catch(e){ $("#carList").innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}

/* photos */
function drawPhotos(){
  $("#photoGrid").innerHTML = photos.map((p, i) => `<div class="ph-item"><img src="../${esc(p)}" alt="Photo ${i+1}">${i===0?`<span class="main-tag">Main</span>`:""}
    <div class="ph-actions">${i===0?"<span></span>":`<button type="button" data-ph="main" data-i="${i}">Make main</button>`}<button type="button" class="rm" data-ph="remove" data-i="${i}">Remove</button></div></div>`).join("");
}
$("#photoGrid").addEventListener("click", e => {
  const b = e.target.closest("button[data-ph]"); if (!b) return;
  const i = +b.dataset.i, p = photos[i];
  if (b.dataset.ph === "main") { photos.unshift(photos.splice(i,1)[0]); }
  else {
    photos.splice(i,1);
    if (sessionNew.has(p)) { sessionNew.delete(p); api("../api/cars.php", {action:"discard", paths:[p]}).catch(()=>{}); }
  }
  drawPhotos();
});
async function shrink(file, maxSide = 1600, quality = 0.85){
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("bad")); i.src = url; });
    const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0,0,w,h); ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise(r => c.toBlob(r, "image/jpeg", quality));
    if (!blob) throw new Error("bad");
    return blob;
  } finally { URL.revokeObjectURL(url); }
}
async function uploadPhotos(files){
  const msg = $("#photoMsg"); const list = [...files];
  let done = 0, failed = [];
  for (const f of list){
    if (photos.length >= 12) { failed.push("You can add up to 12 photos per car."); break; }
    msg.innerHTML = `<div class="notice ok">Uploading photo ${done+1} of ${list.length}…</div>`;
    try {
      const blob = await shrink(f);
      const fd = new FormData(); fd.append("photo", blob, "photo.jpg");
      const res = await fetch("../api/upload.php", { method:"POST", headers:{"X-CSRF-Token":CSRF}, body:fd });
      const out = await res.json().catch(() => ({}));
      if (res.status === 401) { location.reload(); return; }
      if (!res.ok) throw new Error(out.error || "Upload failed.");
      photos.push(out.path); sessionNew.add(out.path); done++; drawPhotos();
    } catch(err){
      failed.push(err.message === "bad" ? `"${f.name}" isn't a photo this browser can read. Use JPG, PNG or WEBP.` : err.message);
    }
  }
  msg.innerHTML = failed.length ? `<div class="notice err">${esc([...new Set(failed)].join(" "))}${done?` (${done} uploaded.)`:""}</div>` : (done ? `<div class="notice ok">${done} photo${done>1?"s":""} added. Press Save car to keep them.</div>` : "");
}
$("#addPhotos").addEventListener("click", () => $("#photoInput").click());
$("#photoInput").addEventListener("change", async e => { const f = e.target.files; if (f.length) await uploadPhotos(f); e.target.value = ""; });

/* form */
function resetCarForm(discard){
  if (discard && sessionNew.size) api("../api/cars.php", {action:"discard", paths:[...sessionNew]}).catch(()=>{});
  editingCarId = null; photos = []; sessionNew = new Set();
  carForm.reset(); carForm.color.value = "#6e7780"; carForm.active.checked = true;
  $("#carFormTitle").textContent = "Add a new car"; $("#cancelCar").textContent = "Clear form"; $("#photoMsg").innerHTML = "";
  drawPhotos();
}
function startEditCar(c){
  if (sessionNew.size) api("../api/cars.php", {action:"discard", paths:[...sessionNew]}).catch(()=>{});
  editingCarId = c.id; sessionNew = new Set(); photos = [...(c.images || [])];
  ["body","year","make","model","price","miles","desc","engine","trans","drive","fuel","mpg","badge","ext","int","seats","vin"].forEach(k => carForm[k].value = has(c[k]) ? c[k] : "");
  carForm.color.value = /^#[0-9a-f]{6}$/i.test(c.color||"") ? c.color : "#6e7780";
  carForm.features.value = (c.features || []).join("\n");
  carForm.active.checked = c.active !== false;
  if (["engine","trans","drive","fuel","mpg","badge","ext","int","seats","vin","features"].some(k => has(carForm[k].value))) carForm.querySelector("details.more").open = true;
  $("#carFormTitle").textContent = "Edit car"; $("#cancelCar").textContent = "Cancel editing"; $("#carMsg").innerHTML = ""; $("#photoMsg").innerHTML = "";
  drawPhotos(); carForm.scrollIntoView({behavior:"smooth", block:"start"});
}
carForm.addEventListener("submit", async e => {
  e.preventDefault();
  const need = ["year","make","model","price"].find(k => !String(carForm[k].value).trim());
  if (need){ flash("#carMsg", "Please fill in the year, make, model and price.", true); carForm[need].focus(); return; }
  const btn = carForm.querySelector("button[type=submit]"); btn.disabled = true;
  const car = { images: photos, active: carForm.active.checked, features: carForm.features.value.split("\n").map(x => x.trim()).filter(Boolean) };
  ["body","year","make","model","price","miles","desc","engine","trans","drive","fuel","mpg","badge","ext","int","seats","vin","color"].forEach(k => car[k] = carForm[k].value);
  try {
    const wasEdit = !!editingCarId;
    cars = (await api("../api/cars.php", { action:"save", id:editingCarId || "", car })).cars;
    sessionNew = new Set(); drawCars(); resetCarForm(false);
    flash("#carMsg", wasEdit ? "Car updated." : "Car added. It's now on the website.");
  } catch(err){ flash("#carMsg", err.message, true); }
  btn.disabled = false;
});
$("#cancelCar").addEventListener("click", () => resetCarForm(true));
$("#carList").addEventListener("click", async e => {
  const b = e.target.closest("button[data-act]"); if (!b) return;
  const c = cars.find(x => x.id === b.dataset.id); if (!c) return;
  if (b.dataset.act === "edit") return startEditCar(c);
  if (b.dataset.act === "delete" && !confirm(`Delete "${carTitle(c)}" and its photos? This can't be undone.`)) return;
  try {
    cars = (await api("../api/cars.php", { action:b.dataset.act, id:c.id })).cars;
    drawCars();
    if (b.dataset.act === "delete" && editingCarId === c.id) resetCarForm(false);
    flash("#carMsg", b.dataset.act === "delete" ? "Car deleted." : "Car updated.");
  } catch(err){ flash("#carMsg", err.message, true); }
});

/* =========================================================
   OFFERS
   ========================================================= */
let offers = [], editingId = null;
function drawOffers(){
  const t = todayStr();
  $("#offerList").innerHTML = offers.length ? offers.map(o => {
    const expired = o.validUntil && o.validUntil < t;
    const st = expired ? `<span class="status exp">Ended</span>` : o.active === false ? `<span class="status off">Hidden</span>` : `<span class="status live">Live</span>`;
    return `<div class="o-row"><div><b>${esc(o.title)}</b>${st}${o.featured?`<span class="status feat">Featured</span>`:""}<small>${o.price?esc(o.price)+" · ":""}${o.validUntil?"ends "+esc(fmtDate(o.validUntil)):"no end date"}</small></div>
      <div class="o-actions"><button class="btn btn-ghost btn-small" data-act="edit" data-id="${esc(o.id)}">Edit</button><button class="btn btn-ghost btn-small" data-act="toggle" data-id="${esc(o.id)}">${o.active===false?"Show":"Hide"}</button><button class="btn btn-danger btn-small" data-act="delete" data-id="${esc(o.id)}">Delete</button></div></div>`;
  }).join("") : `<div class="empty">No offers yet. Add your first one with the form.</div>`;
}
async function loadOffers(){
  try { offers = (await api("../api/offers.php?all=1")).offers || []; drawOffers(); }
  catch(e){ $("#offerList").innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
const form = $("#offerForm");
function resetForm(){ editingId = null; form.reset(); form.active.checked = true; $("#formTitle").textContent = "Add a new offer"; $("#cancelEdit").hidden = true; }
function startEdit(o){
  editingId = o.id;
  ["title","description","price","wasPrice","tag","validUntil"].forEach(k => form[k].value = o[k] || "");
  form.active.checked = o.active !== false; form.featured.checked = !!o.featured;
  $("#formTitle").textContent = "Edit offer"; $("#cancelEdit").hidden = false; $("#offerMsg").innerHTML = "";
  form.scrollIntoView({behavior:"smooth", block:"start"});
}
form.addEventListener("submit", async e => {
  e.preventDefault();
  if (!form.title.value.trim()){ flash("#offerMsg", "Please give the offer a title.", true); form.title.focus(); return; }
  const btn = form.querySelector("button[type=submit]"); btn.disabled = true;
  const offer = { title:form.title.value, description:form.description.value, price:form.price.value, wasPrice:form.wasPrice.value, tag:form.tag.value, validUntil:form.validUntil.value, active:form.active.checked, featured:form.featured.checked };
  try {
    const wasEdit = !!editingId;
    offers = (await api("../api/offers.php", { action:"save", id:editingId || "", offer })).offers;
    drawOffers(); resetForm(); flash("#offerMsg", wasEdit ? "Offer updated." : "Offer added. It's now on the website.");
  } catch(err){ flash("#offerMsg", err.message, true); }
  btn.disabled = false;
});
$("#cancelEdit").addEventListener("click", resetForm);
$("#offerList").addEventListener("click", async e => {
  const b = e.target.closest("button[data-act]"); if (!b) return;
  const o = offers.find(x => x.id === b.dataset.id); if (!o) return;
  if (b.dataset.act === "edit") return startEdit(o);
  if (b.dataset.act === "delete" && !confirm(`Delete "${o.title}"? This can't be undone.`)) return;
  try {
    offers = (await api("../api/offers.php", { action:b.dataset.act, id:o.id })).offers;
    drawOffers(); if (b.dataset.act === "delete" && editingId === o.id) resetForm();
    flash("#offerMsg", b.dataset.act === "delete" ? "Offer deleted." : "Offer updated.");
  } catch(err){ flash("#offerMsg", err.message, true); }
});

/* =========================================================
   BOOKINGS
   ========================================================= */
async function loadBookings(){
  try {
    const list = (await api("../api/booking.php")).bookings || [];
    $("#bookingList").innerHTML = list.length ? list.slice(0,100).map(b => `<div class="booking"><b>${esc(b.name)}</b> · <a href="tel:${esc(b.phone)}">${esc(b.phone)}</a>${b.email?` · ${esc(b.email)}`:""}<br>${esc(b.service)} on ${esc(fmtDate(b.date))}, ${esc(b.time)}${b.vehicle?` · ${esc(b.vehicle)}`:""}${b.message?`<br><span style="color:var(--ink-2)">${esc(b.message)}</span>`:""}<br><small style="color:var(--ink-2)">Sent ${new Date(b.sentAt).toLocaleString("en-US")}</small></div>`).join("") : `<div class="empty">No booking requests yet.</div>`;
  } catch(e){ $("#bookingList").innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}

loadCars(); loadOffers(); loadBookings();
