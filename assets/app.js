/* ==========================================================================
   Nota Tiket — logika aplikasi
   Form isian, pratinjau langsung, unduh/bagikan PDF, mode "Atur posisi".
   Tidak memakai database: data master dari config.js, posisi dari layout.js.
   ========================================================================== */
(function () {
  "use strict";

  var E = window.NotaEngine;
  var PDFLib = window.PDFLib;
  var CFG = window.NOTA_CONFIG;
  var LAIN = "__lain";
  var KUNCI_DESAIN = "notaTiket.desain";

  var ICON_PLANE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22.6 12C22.6 11.2 21.8 10.9 20.6 10.9L15.2 10.9L9.6 3.4L7.4 3.4L10.4 10.9L5.4 10.9L3.4 7.6L1.9 7.6L2.9 11.3L1.4 12L2.9 12.7L1.9 16.4L3.4 16.4L5.4 13.1L10.4 13.1L7.4 20.6L9.6 20.6L15.2 13.1L20.6 13.1C21.8 13.1 22.6 12.8 22.6 12Z"/></svg>';
  var ICON_X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>';
  var ICON_SWAP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5h15.5L16 5M20 15.5H4.5L8 19"/></svg>';
  var STATUS_LABEL = { "LUNAS": "Lunas", "DP": "DP / uang muka", "BELUM LUNAS": "Belum lunas" };
  var TIPE_DARI_SAPAAN = { "Tn.": "Dewasa", "Ny.": "Dewasa", "Nn.": "Dewasa", "An.": "Anak", "Bayi": "Bayi" };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var IDX, MAX_F, MAX_P;
  var state;
  // DS: semua desain nota (berwarna, sederhana, ...). D() = desain yang sedang dipakai.
  var DS = {}, DLIST = [], desainId = "";
  var editing = false, selId = null, drag = null, printing = false, titleBefore = "";
  var zoomIdx = 0, ZOOMS = [1, 1.25, 1.5, 2, 2.5];
  var assets = { logo: null };
  var queued = false, dirty = false;
  var OPT = {};
  function D() { return DS[desainId]; }

  /* ---------------------------------------------------------------- utilitas */
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function isoDate(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function todayISO() { return isoDate(new Date()); }
  function addDaysISO(n) { var d = new Date(); d.setDate(d.getDate() + n); return isoDate(d); }
  function autoNomor() {
    var d = new Date();
    return (CFG.nota.prefix || "NT") + "-" + String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate()) +
      "-" + pad(d.getHours()) + pad(d.getMinutes());
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function digits(s) { return String(s == null ? "" : s).replace(/\D/g, ""); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function round1(v) { return Math.round(Number(v) * 10) / 10; }
  function getPath(o, p) { return p.split(".").reduce(function (a, k) { return a == null ? undefined : a[k]; }, o); }
  function setPath(o, p, v) {
    var ks = p.split("."), last = ks.pop();
    ks.reduce(function (a, k) { if (a[k] == null) a[k] = {}; return a[k]; }, o)[last] = v;
  }
  function fetchBytes(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("Tidak bisa memuat " + url + " (" + r.status + ")");
      return r.arrayBuffer();
    }).then(function (b) { return new Uint8Array(b); });
  }
  function imageSize(url) {
    return new Promise(function (res, rej) {
      var img = new Image();
      img.onload = function () { res({ w: img.naturalWidth, h: img.naturalHeight }); };
      img.onerror = function () { rej(new Error("Gambar tidak bisa dibaca")); };
      img.src = url;
    });
  }

  var toastTimer;
  function toast(msg, bad) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.toggle("bad", !!bad);
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, bad ? 5200 : 3200);
  }

  /* ------------------------------------------------------------ state awal */
  function newFlight() {
    return {
      maskapai: "", maskapaiLain: "", nomor: "",
      dari: "", dariKode: "", dariKota: "", dariNegara: "", dariBandara: "", terminalDari: "",
      ke: "", keKode: "", keKota: "", keNegara: "", keBandara: "", terminalKe: "",
      tanggal: "", berangkat: "", tiba: "", kelas: CFG.kelas[0] || "", bagasi: "", pesawat: ""
    };
  }
  // pasangan isian asal <-> tujuan, dipakai saat menukar rute / membuat rute pulang
  var PASANGAN = [["dari", "ke"], ["dariKode", "keKode"], ["dariKota", "keKota"], ["dariNegara", "keNegara"],
    ["dariBandara", "keBandara"], ["terminalDari", "terminalKe"]];
  function newPax() { return { sapaan: CFG.sapaan[0] || "", nama: "", tipe: CFG.tipePenumpang[0] || "", tiket: "", harga: 0 }; }
  function freshState() {
    return {
      nomor: autoNomor(), tanggal: todayISO(),
      pemesan: { nama: "", hp: "", email: "" }, pnr: "",
      penerbangan: [newFlight()], penumpang: [newPax()],
      biayaLayanan: 0, diskon: 0, metode: CFG.metodeBayar[0] || "", status: CFG.statusBayar[0] || "LUNAS", dp: 0, catatan: ""
    };
  }
  function sampleState() {
    var s = freshState();
    s.tanggal = "2026-10-16";
    s.pemesan = { nama: "MANIN/ROKAYAH BT ROHMAN MRS", hp: "0812-3456-7890", email: "" };
    s.pnr = "FD7B5U";
    // contoh rute Timur Tengah sesuai tiket: Surabaya - Kuala Lumpur - Doha - Hail
    s.penerbangan = [
      Object.assign(newFlight(), { maskapai: "MH", nomor: "MH 872", dari: "SUB", ke: "KUL", terminalDari: "2", terminalKe: "1", tanggal: "2026-10-18", berangkat: "15:50", tiba: "19:30", kelas: "Ekonomi", bagasi: "30 kg", pesawat: "BOEING 737 MAX 8" }),
      Object.assign(newFlight(), { maskapai: "QR", nomor: "QR 4992", dari: "KUL", ke: "DOH", terminalDari: "1", terminalKe: "", tanggal: "2026-10-19", berangkat: "03:10", tiba: "05:45", kelas: "Ekonomi", bagasi: "30 kg", pesawat: "AIRBUS A330-300" }),
      Object.assign(newFlight(), { maskapai: "QR", nomor: "QR 1228", dari: "DOH", ke: "HAS", terminalDari: "", terminalKe: "", tanggal: "2026-10-19", berangkat: "14:25", tiba: "16:35", kelas: "Ekonomi", bagasi: "30 kg", pesawat: "AIRBUS A330-300" })
    ];
    s.penumpang = [
      { sapaan: "Ny.", nama: "MANIN/ROKAYAH BT ROHMAN MRS", tipe: "Dewasa", tiket: "232 5899282788", harga: 13250000 }
    ];
    s.biayaLayanan = 0;
    s.metode = CFG.metodeBayar.indexOf("Transfer Bank") >= 0 ? "Transfer Bank" : s.metode;
    return s;
  }
  function hasData() {
    return !!(state.pemesan.nama || state.pnr ||
      state.penerbangan.some(function (f) { return f.maskapai || f.dari || f.ke || f.tanggal; }) ||
      state.penumpang.some(function (p) { return p.nama || p.harga; }));
  }

  /* ------------------------------------------------------------- dropdown */
  function buildOptionCache() {
    OPT.maskapai = (CFG.maskapai || []).map(function (g) {
      return '<optgroup label="' + esc(g.grup) + '">' + g.daftar.map(function (m) {
        return '<option value="' + esc(m.kode) + '">' + esc(m.nama) + " (" + esc(m.kode) + ")</option>";
      }).join("") + "</optgroup>";
    }).join("");
    // kode dulu agar tetap terlihat saat teks terpotong, lalu gaya tiket: Kota, NEGARA (Bandara)
    OPT.bandara = (CFG.bandara || []).map(function (g) {
      return '<optgroup label="' + esc(g.grup) + '">' + g.daftar.map(function (b) {
        return '<option value="' + esc(b.kode) + '">' + esc(b.kode) + " – " + esc(b.kota) + (b.negara ? ", " + esc(b.negara) : "") +
          (b.nama ? " (" + esc(b.nama) + ")" : "") + "</option>";
      }).join("") + "</optgroup>";
    }).join("");
  }
  function simpleOptions(list, placeholder) {
    return (placeholder ? '<option value="">' + esc(placeholder) + "</option>" : "") +
      list.map(function (v) { return '<option value="' + esc(v) + '">' + esc(v) + "</option>"; }).join("");
  }
  function selectHtml(id, field, inner, value) {
    // value dipasang setelah render (lihat applyValues) agar aman untuk teks apa pun
    return '<select id="' + id + '" data-f="' + field + '" data-v="' + esc(value || "") + '">' + inner + "</select>";
  }
  function inputHtml(id, field, value, extra) {
    return '<input id="' + id + '" data-f="' + field + '" value="' + esc(value == null ? "" : value) + '"' + (extra ? " " + extra : "") + ">";
  }
  function fieldHtml(label, id, control, extraClass) {
    return '<div class="field' + (extraClass ? " " + extraClass : "") + '"><label for="' + id + '">' + label + "</label>" + control + "</div>";
  }
  function applyValues(root) {
    $$("select[data-v]", root).forEach(function (s) {
      var v = s.getAttribute("data-v");
      s.value = v;
      if (s.value !== v) s.value = "";
      s.removeAttribute("data-v");
    });
  }

  /* --------------------------------------------------------- penerbangan */
  function airportCode(kode, lainKode) {
    if (kode === LAIN) return String(lainKode || "").trim().toUpperCase();
    return kode || "";
  }
  function routeSum(f) {
    var a = airportCode(f.dari, f.dariKode), b = airportCode(f.ke, f.keKode);
    if (!a || !b) return "";
    return esc(a) + ICON_PLANE + esc(b);
  }
  function flightHtml(f, i) {
    var p = "f" + i, n = i + 1;
    var lainM = f.maskapai === LAIN, lainD = f.dari === LAIN, lainK = f.ke === LAIN;
    return '<div class="item" data-i="' + i + '">' +
      '<div class="item-head"><span class="item-title">Penerbangan ' + n + '</span><span class="item-sum" data-sum>' + routeSum(f) + "</span>" +
      (state.penerbangan.length > 1 ? '<button type="button" class="icon-btn" data-act="hapus" aria-label="Hapus penerbangan ' + n + '" title="Hapus">' + ICON_X + "</button>" : "") +
      "</div>" +
      '<div class="grid g-2">' +
        fieldHtml("Maskapai", p + "m", selectHtml(p + "m", "maskapai", '<option value="">Pilih maskapai</option>' + OPT.maskapai + '<option value="' + LAIN + '">Lainnya (ketik sendiri)</option>', f.maskapai)) +
        fieldHtml("No. penerbangan", p + "n", inputHtml(p + "n", "nomor", f.nomor, 'class="caps" spellcheck="false" autocapitalize="characters" placeholder="Contoh: QG 711"')) +
      "</div>" +
      '<div data-lain="maskapai"' + (lainM ? "" : " hidden") + ">" +
        fieldHtml("Nama maskapai", p + "ml", inputHtml(p + "ml", "maskapaiLain", f.maskapaiLain, 'placeholder="Nama maskapai"')) +
      "</div>" +
      '<div class="grid g-route">' +
        fieldHtml("Dari", p + "d", selectHtml(p + "d", "dari", '<option value="">Pilih bandara asal</option>' + OPT.bandara + '<option value="' + LAIN + '">Lainnya (ketik sendiri)</option>', f.dari)) +
        '<button type="button" class="icon-btn" data-act="tukar" aria-label="Tukar asal dan tujuan penerbangan ' + n + '" title="Tukar asal dan tujuan">' + ICON_SWAP + "</button>" +
        fieldHtml("Ke", p + "k", selectHtml(p + "k", "ke", '<option value="">Pilih bandara tujuan</option>' + OPT.bandara + '<option value="' + LAIN + '">Lainnya (ketik sendiri)</option>', f.ke)) +
      "</div>" +
      '<div class="grid g-lain" data-lain="dari"' + (lainD ? "" : " hidden") + ">" +
        fieldHtml("Kode asal", p + "dk", inputHtml(p + "dk", "dariKode", f.dariKode, 'class="caps" maxlength="4" spellcheck="false" placeholder="TIF"')) +
        fieldHtml("Kota asal", p + "dc", inputHtml(p + "dc", "dariKota", f.dariKota, 'placeholder="Nama kota"')) +
        fieldHtml("Negara", p + "dn", inputHtml(p + "dn", "dariNegara", f.dariNegara, 'class="caps" maxlength="2" spellcheck="false" placeholder="SA"')) +
        fieldHtml("Nama bandara", p + "db", inputHtml(p + "db", "dariBandara", f.dariBandara, 'placeholder="Contoh: Taif Intl"')) +
      "</div>" +
      '<div class="grid g-lain" data-lain="ke"' + (lainK ? "" : " hidden") + ">" +
        fieldHtml("Kode tujuan", p + "kk", inputHtml(p + "kk", "keKode", f.keKode, 'class="caps" maxlength="4" spellcheck="false" placeholder="TIF"')) +
        fieldHtml("Kota tujuan", p + "kc", inputHtml(p + "kc", "keKota", f.keKota, 'placeholder="Nama kota"')) +
        fieldHtml("Negara", p + "kn", inputHtml(p + "kn", "keNegara", f.keNegara, 'class="caps" maxlength="2" spellcheck="false" placeholder="SA"')) +
        fieldHtml("Nama bandara", p + "kb", inputHtml(p + "kb", "keBandara", f.keBandara, 'placeholder="Contoh: Taif Intl"')) +
      "</div>" +
      '<div class="grid g-2">' +
        fieldHtml("Terminal asal <em>opsional</em>", p + "td", inputHtml(p + "td", "terminalDari", f.terminalDari, 'maxlength="12" spellcheck="false" placeholder="Contoh: 2"')) +
        fieldHtml("Terminal tujuan <em>opsional</em>", p + "tk", inputHtml(p + "tk", "terminalKe", f.terminalKe, 'maxlength="12" spellcheck="false" placeholder="Contoh: 1"')) +
      "</div>" +
      '<div class="grid g-3">' +
        fieldHtml("Tanggal terbang", p + "t", inputHtml(p + "t", "tanggal", f.tanggal, 'type="date"')) +
        fieldHtml("Berangkat", p + "b", inputHtml(p + "b", "berangkat", f.berangkat, 'type="time"')) +
        fieldHtml("Tiba", p + "a", inputHtml(p + "a", "tiba", f.tiba, 'type="time"')) +
      "</div>" +
      '<div class="grid g-2">' +
        fieldHtml("Kelas", p + "c", selectHtml(p + "c", "kelas", simpleOptions(CFG.kelas, "Pilih kelas"), f.kelas)) +
        fieldHtml("Bagasi", p + "g", selectHtml(p + "g", "bagasi", simpleOptions(CFG.bagasi, "Pilih bagasi"), f.bagasi)) +
      "</div>" +
      fieldHtml("Tipe pesawat / Equipment <em>opsional</em>", p + "ps", inputHtml(p + "ps", "pesawat", f.pesawat, 'class="caps" spellcheck="false" placeholder="Contoh: BOEING 737 MAX 8"')) +
    "</div>";
  }
  function renderFlights() {
    var host = $("#listTerbang");
    host.innerHTML = state.penerbangan.map(flightHtml).join("");
    applyValues(host);
    updateListButtons();
  }

  function onFlight(el) {
    var item = el.closest(".item"), key = el.getAttribute("data-f");
    if (!item || !key) return;
    var f = state.penerbangan[Number(item.getAttribute("data-i"))];
    var val = el.value;
    if (/^(nomor|dariKode|keKode|dariNegara|keNegara|pesawat)$/.test(key)) val = val.toUpperCase();
    var prev = f[key];
    f[key] = val;
    if (key === "maskapai") {
      var cur = String(f.nomor || "").trim().toUpperCase();
      var prevCode = prev && prev !== LAIN ? prev.toUpperCase() : "";
      if (val && val !== LAIN && (!cur || cur === prevCode)) {
        f.nomor = val + " ";
        $('[data-f="nomor"]', item).value = f.nomor;
      }
      $('[data-lain="maskapai"]', item).hidden = val !== LAIN;
    }
    if (key === "dari") $('[data-lain="dari"]', item).hidden = val !== LAIN;
    if (key === "ke") $('[data-lain="ke"]', item).hidden = val !== LAIN;
    if (/^(dari|ke|dariKode|keKode)$/.test(key)) $("[data-sum]", item).innerHTML = routeSum(f);
    clearInvalid(el);
    if (key === "ke" || key === "dari") clearInvalid($('[data-f="ke"]', item));
    changed();
  }

  function swapFlight(i) {
    var f = state.penerbangan[i];
    PASANGAN.forEach(function (p) { var t = f[p[0]]; f[p[0]] = f[p[1]]; f[p[1]] = t; });
    renderFlights();
    changed();
  }
  /** penerbangan balik dari satu penerbangan: asal & tujuan (termasuk terminal) ditukar */
  function balikDari(f) {
    var nf = newFlight();
    nf.maskapai = f.maskapai;
    nf.maskapaiLain = f.maskapaiLain;
    nf.nomor = f.maskapai && f.maskapai !== LAIN ? f.maskapai + " " : "";
    nf.kelas = f.kelas;
    nf.bagasi = f.bagasi;
    PASANGAN.forEach(function (p) { nf[p[0]] = f[p[1]]; nf[p[1]] = f[p[0]]; });
    return nf;
  }
  function addFlight(ret) {
    var sisa = MAX_F - state.penerbangan.length;
    if (sisa <= 0) return;
    var awal = state.penerbangan.length;
    if (ret) {
      // rute pulang = semua penerbangan berangkat dibalik urutannya (contoh SUB-KUL-JED -> JED-KUL-SUB)
      var isi = state.penerbangan.filter(function (f) { return f.dari || f.ke; });
      isi.slice().reverse().slice(0, sisa).forEach(function (f) { state.penerbangan.push(balikDari(f)); });
      if (state.penerbangan.length === awal) state.penerbangan.push(newFlight());
    } else {
      state.penerbangan.push(newFlight());
    }
    renderFlights();
    var item = $('#listTerbang .item[data-i="' + awal + '"]');
    if (item) {
      item.scrollIntoView({ block: "nearest" });
      var target = ret ? $('[data-f="tanggal"]', item) : $('[data-f="maskapai"]', item);
      if (target) target.focus({ preventScroll: true });
    }
    if (ret && state.penerbangan.length - awal > 1) toast("Rute pulang ditambahkan (" + (state.penerbangan.length - awal) + " penerbangan). Lengkapi tanggal, jam, dan nomor penerbangannya.");
    changed();
  }

  /* ----------------------------------------------------------- penumpang */
  function paxHtml(p, i) {
    var id = "p" + i, n = i + 1;
    return '<div class="item" data-i="' + i + '">' +
      '<div class="item-head"><span class="item-title">Penumpang ' + n + "</span>" +
      (state.penumpang.length > 1 ? '<button type="button" class="icon-btn" data-act="hapus" aria-label="Hapus penumpang ' + n + '" title="Hapus">' + ICON_X + "</button>" : "") +
      "</div>" +
      '<div class="grid g-pax">' +
        fieldHtml("Sapaan", id + "s", selectHtml(id + "s", "sapaan", simpleOptions(CFG.sapaan, "–"), p.sapaan)) +
        fieldHtml("Nama penumpang", id + "n", inputHtml(id + "n", "nama", p.nama, 'placeholder="Contoh: MANIN/ROKAYAH BT ROHMAN MRS" autocapitalize="words"')) +
      "</div>" +
      '<div class="grid g-pax2">' +
        fieldHtml("Tipe", id + "t", selectHtml(id + "t", "tipe", simpleOptions(CFG.tipePenumpang), p.tipe)) +
        fieldHtml("No. tiket <em>opsional</em>", id + "k", inputHtml(id + "k", "tiket", p.tiket, 'placeholder="Contoh: 232 5899282788" spellcheck="false" inputmode="text"')) +
        fieldHtml("Harga", id + "h", '<div class="money"><span aria-hidden="true">Rp</span>' +
          inputHtml(id + "h", "harga", p.harga ? E.angka(p.harga) : "", 'inputmode="numeric" placeholder="0"') + "</div>") +
      "</div>" +
    "</div>";
  }
  function renderPax() {
    var host = $("#listPax");
    host.innerHTML = state.penumpang.map(paxHtml).join("");
    applyValues(host);
    updateListButtons();
  }
  function onPax(el) {
    var item = el.closest(".item"), key = el.getAttribute("data-f");
    if (!item || !key) return;
    var p = state.penumpang[Number(item.getAttribute("data-i"))];
    if (key === "harga") p.harga = formatMoney(el);
    else p[key] = el.value;
    if (key === "sapaan") {
      var t = TIPE_DARI_SAPAAN[el.value];
      if (t && CFG.tipePenumpang.indexOf(t) >= 0) { p.tipe = t; $('[data-f="tipe"]', item).value = t; }
    }
    clearInvalid(el);
    changed();
  }
  function addPax() {
    if (state.penumpang.length >= MAX_P) return;
    state.penumpang.push(newPax());
    renderPax();
    var item = $('#listPax .item[data-i="' + (state.penumpang.length - 1) + '"]');
    if (item) { item.scrollIntoView({ block: "nearest" }); $('[data-f="nama"]', item).focus({ preventScroll: true }); }
    changed();
  }

  function updateListButtons() {
    var fullF = state.penerbangan.length >= MAX_F, fullP = state.penumpang.length >= MAX_P;
    $("#btnTambahTerbang").disabled = fullF;
    $("#btnRutePulang").disabled = fullF;
    $("#btnTambahPax").disabled = fullP;
    $("#btnTambahTerbang").title = fullF ? "Maksimal " + MAX_F + " penerbangan per nota" : "";
    $("#btnTambahPax").title = fullP ? "Maksimal " + MAX_P + " penumpang per nota" : "";
  }

  /* ---------------------------------------------------------- isian uang */
  function formatMoney(inp) {
    var raw = inp.value, caret = inp.selectionStart == null ? raw.length : inp.selectionStart;
    var before = digits(raw.slice(0, caret)).length;
    var d = digits(raw).replace(/^0+(?=\d)/, "").slice(0, 13);
    var n = d ? Number(d) : 0;
    var out = d ? E.angka(n) : "";
    if (inp.value !== out) {
      inp.value = out;
      var pos = 0, count = 0;
      while (pos < out.length && count < before) { if (/\d/.test(out.charAt(pos))) count++; pos++; }
      try { inp.setSelectionRange(pos, pos); } catch (e) { /* jenis input tanpa caret */ }
    }
    return n;
  }

  /* ----------------------------------------------- isian tetap & status */
  function fillStatic() {
    $$("[data-bind]").forEach(function (inp) {
      var v = getPath(state, inp.getAttribute("data-bind"));
      if (inp.hasAttribute("data-money")) inp.value = v ? E.angka(v) : "";
      else inp.value = v == null ? "" : v;
    });
    renderStatus();
  }
  function renderStatus() {
    $("#segStatus").innerHTML = CFG.statusBayar.map(function (s) {
      var on = state.status === s;
      return '<label class="' + (on ? "on" : "") + '"><input type="radio" name="status" value="' + esc(s) + '"' + (on ? " checked" : "") + ">" +
        esc(STATUS_LABEL[s] || s) + "</label>";
    }).join("");
    $("#fieldDp").hidden = state.status !== "DP";
  }
  function onBind(inp) {
    var path = inp.getAttribute("data-bind"), v;
    if (inp.hasAttribute("data-money")) v = formatMoney(inp);
    else v = inp.value;
    if (path === "pnr") v = v.toUpperCase();
    setPath(state, path, v);
    clearInvalid(inp);
    changed();
  }

  function clearInvalid(el) { if (el && el.getAttribute("aria-invalid")) el.removeAttribute("aria-invalid"); }
  function changed() { dirty = true; schedule(); }

  /* ----------------------------------------------------------- validasi */
  function validate() {
    var errs = [];
    function bad(el, msg) { if (el) el.setAttribute("aria-invalid", "true"); errs.push({ el: el, msg: msg }); }
    function q(kind, i, f) { return $("#" + kind + ' .item[data-i="' + i + '"] [data-f="' + f + '"]'); }

    if (desainId !== "sederhana" && !String(state.pemesan.nama).trim()) bad($("#fPemesan"), "nama pemesan");
    state.penerbangan.forEach(function (f, i) {
      var filled = f.maskapai || f.dari || f.ke || f.tanggal || String(f.nomor).trim();
      if (!filled && i > 0) return;
      var n = " penerbangan " + (i + 1);
      if (!f.maskapai) bad(q("listTerbang", i, "maskapai"), "maskapai" + n);
      else if (f.maskapai === LAIN && !String(f.maskapaiLain).trim()) bad(q("listTerbang", i, "maskapaiLain"), "nama maskapai" + n);
      if (!f.dari) bad(q("listTerbang", i, "dari"), "bandara asal" + n);
      else if (f.dari === LAIN && !String(f.dariKode).trim()) bad(q("listTerbang", i, "dariKode"), "kode bandara asal" + n);
      if (!f.ke) bad(q("listTerbang", i, "ke"), "bandara tujuan" + n);
      else if (f.ke === LAIN && !String(f.keKode).trim()) bad(q("listTerbang", i, "keKode"), "kode bandara tujuan" + n);
      var a = airportCode(f.dari, f.dariKode), b = airportCode(f.ke, f.keKode);
      if (a && b && a === b) bad(q("listTerbang", i, "ke"), "asal dan tujuan" + n + " masih sama");
      if (!f.tanggal) bad(q("listTerbang", i, "tanggal"), "tanggal" + n);
    });
    state.penumpang.forEach(function (p, i) {
      if (!String(p.nama).trim() && !p.harga && i > 0) return;
      if (!String(p.nama).trim()) bad(q("listPax", i, "nama"), "nama penumpang " + (i + 1));
    });
    if (desainId !== "sederhana") {
      var h = E.hitung(state);
      if (!h.subtotal) bad(q("listPax", 0, "harga"), "harga tiket");
      if (state.status === "DP") {
        if (!state.dp) bad($("#fDp"), "nominal DP");
        else if (state.dp >= h.total) bad($("#fDp"), "nominal DP harus lebih kecil dari total");
      }
    }
    return errs;
  }
  function showErrors(errs) {
    var names = errs.map(function (e) { return e.msg; });
    var text = names.slice(0, 3).join(", ") + (names.length > 3 ? ", dan " + (names.length - 3) + " lainnya" : "");
    toast("Periksa dulu: " + text + ".", true);
    document.body.classList.remove("preview-open");
    var first = errs[0] && errs[0].el;
    if (first) {
      first.scrollIntoView({ block: "center" });
      setTimeout(function () { first.focus({ preventScroll: true }); }, 60);
    }
  }

  /* ------------------------------------------------------------ pratinjau */
  function imagesInfo() {
    return assets.logo ? { logo: { url: assets.logo.url, width: assets.logo.width, height: assets.logo.height } } : null;
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; render(); });
  }
  function render() {
    var d = D();
    var vm = E.buildViewModel(state, CFG, IDX);
    var images = imagesInfo();
    var edit = editing && !printing;
    var res = E.computeOps(vm, d.layout, d.measure, { editor: edit, images: images });
    $("#sheetOverlay").innerHTML = E.renderSvg(res.ops, { images: images });
    $("#sheetBoxes").innerHTML = edit ? boxesSvg(res.boxes) : "";
    updateSummary(vm);
  }
  function boxesSvg(boxes) {
    var out = "", selected = null;
    boxes.forEach(function (b) {
      var cls = "ebox" + (b.id === selId ? " on" : "") + (b.hidden ? " off" : "");
      out += '<rect class="' + cls + '" data-id="' + esc(b.id) + '" x="' + round1(b.x - 0.7) + '" y="' + round1(b.y - 0.6) +
        '" width="' + round1(b.w + 1.4) + '" height="' + round1(b.h + 1.2) + '" rx="0.6"/>';
      if (b.id === selId) selected = b;
    });
    if (selected) {
      var label = selected.label, size = 2.5, w = D().measure.width(label, size / E.MM_PER_PT, true) + 2;
      var lx = Math.max(0.5, Math.min(209.5 - w, selected.x - 0.7)), ly = selected.y - 4.4 < 0.5 ? selected.y + selected.h + 1 : selected.y - 4.4;
      out += '<rect class="elabel-bg" x="' + round1(lx) + '" y="' + round1(ly) + '" width="' + round1(w) + '" height="3.4" rx="0.6"/>' +
        '<text class="elabel" x="' + round1(lx + 1) + '" y="' + round1(ly + 2.45) + '">' + esc(label) + "</text>";
    }
    return out;
  }
  function updateSummary(vm) {
    var h = vm.angka;
    $("#tSubtotal").textContent = E.rupiah(h.subtotal);
    $("#tTotal").textContent = E.rupiah(h.total);
    $("#tTerbilang").textContent = vm.ringkasan.terbilang;
    $("#stubTotal").textContent = E.rupiah(h.total);
    $("#stubPax").textContent = vm.penumpang.length + " penumpang";
    var f = vm.penerbangan.filter(function (x) { return x.asal && x.tujuan; });
    var route = $("#stubRoute");
    if (!f.length) { route.className = "stub-route empty"; route.textContent = "Rute belum diisi"; return; }
    // ringkas rute: asal -> tujuan akhir, pulang-pergi bila kembali ke asal, plus kota transit
    var first = f[0], last = f[f.length - 1], pp = f.length > 1 && last.tujuan === first.asal;
    var nPergi = pp ? Math.ceil(f.length / 2) : f.length;
    var tujuan = f[nPergi - 1].tujuan;
    var transit = f.slice(0, nPergi - 1).map(function (x) { return x.tujuan; })
      .filter(function (k, i, a) { return k && k !== first.asal && k !== tujuan && a.indexOf(k) === i; });
    var info = [pp ? "pulang-pergi" : "", transit.length ? "via " + transit.join(", ") : ""].filter(Boolean).join(" ");
    route.className = "stub-route";
    route.innerHTML = "<span>" + esc(first.asal) + "</span>" + ICON_PLANE + "<span>" + esc(tujuan) + "</span>" +
      (info ? "<small>" + esc(info) + "</small>" : "");
  }

  function fitPaper() {
    var sc = $("#stageScroll"), cs = getComputedStyle(sc);
    var aw = sc.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var ah = sc.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (aw <= 0) return;
    var small = window.matchMedia("(max-width: 899px)").matches;
    var fit = small ? aw : Math.min(aw, ah * 210 / 297);
    var w = Math.max(220, fit * ZOOMS[zoomIdx]);
    $("#paper").style.setProperty("--paper-w", w + "px");
    $("#zoomVal").textContent = Math.round((w / (210 / 25.4 * 96)) * 100) + "%";
    $("#zoomOut").disabled = zoomIdx === 0;
    $("#zoomIn").disabled = zoomIdx === ZOOMS.length - 1;
  }

  function setBackground() {
    var d = D(), url = d.test ? d.test.url : d.previewUrl;
    var bg = $("#sheetBg");
    if (url) bg.setAttribute("href", url); else bg.removeAttribute("href");
    $("#sheet").classList.toggle("mono", d.mono);
    var note = $("#stageNote");
    note.textContent = d.test ? "Master uji coba (sementara)" : "Pratinjau desain " + d.nama.toLowerCase();
    note.classList.toggle("test", !!d.test);
    $("#btnMasterAsli").hidden = !d.test;
  }

  /* ---------------------------------------------------------- pilihan desain */
  function buildDesigns() {
    var list = CFG.desain && CFG.desain.length ? CFG.desain : [{
      id: "berwarna", nama: "Berwarna", keterangan: "", master: CFG.master, font: CFG.font, layout: "NOTA_LAYOUT", fileLayout: "layout.js"
    }];
    list.forEach(function (c) {
      var src = window[c.layout];
      if (!src || !src.elemen) { console.warn("Posisi isian " + c.layout + " tidak ditemukan; desain " + c.id + " dilewati."); return; }
      var m = c.master || null, f = c.font || {};
      DS[c.id] = {
        id: c.id, cfg: c, nama: c.nama || c.id, keterangan: c.keterangan || "",
        asli: src, layout: clone(src), varName: c.layout, fileName: c.fileLayout || c.id + ".js",
        mono: !!f.standar, fonts: null, measure: null,
        masterFile: m && m.file ? m.file : "",
        previewUrl: m ? m.preview || (/\.(png|jpe?g)$/i.test(m.file || "") ? m.file : "") : "",
        masterPromise: null, test: null
      };
      DLIST.push(DS[c.id]);
    });
  }
  async function ensureFonts(d) {
    if (d.fonts) return;
    var f = d.cfg.font || {};
    if (f.standar) {
      d.fonts = { regular: new E.StandardFont(f.standar), bold: new E.StandardFont(f.standarTebal || f.standar) };
    } else {
      var b = await Promise.all([fetchBytes(f.regular), fetchBytes(f.bold || f.regular)]);
      d.fonts = { regular: new E.NotaFont(b[0]), bold: new E.NotaFont(b[1]) };
    }
    d.measure = E.makeMeasure(d.fonts);
  }
  function masterBytes(d) {
    if (d.test) return Promise.resolve(d.test.bytes);
    if (!d.masterFile) return Promise.resolve(null);
    if (!d.masterPromise) {
      d.masterPromise = fetchBytes(d.masterFile).catch(function (e) {
        d.masterPromise = null;
        throw new Error("Desain master tidak bisa dimuat (" + d.masterFile + "). " + e.message);
      });
    }
    return d.masterPromise;
  }
  function renderTabs() {
    var host = $("#desainTabs");
    host.hidden = DLIST.length < 2;
    host.innerHTML = DLIST.map(function (d) {
      var on = d.id === desainId;
      return '<button type="button" role="tab" aria-selected="' + on + '" data-desain="' + esc(d.id) + '">' +
        '<i class="thumb ' + (d.mono ? "thumb-mono" : "thumb-warna") + '" aria-hidden="true"></i>' +
        '<span class="tab-text"><strong>' + esc(d.nama) + "</strong><span>" + esc(d.keterangan) + "</span></span></button>";
    }).join("");
  }
  async function setDesain(id) {
    var d = DS[id];
    if (!d) return;
    try { await ensureFonts(d); }
    catch (e) { toast("Font desain " + d.nama + " tidak bisa dimuat. " + e.message, true); return; }
    desainId = id;
    try { localStorage.setItem(KUNCI_DESAIN, id); } catch (e) { /* penyimpanan browser tidak tersedia */ }
    selId = null;
    renderTabs();
    setBackground();
    renderEditorList();
    renderEditorSel();
    updateEditorTexts();
    schedule();
    masterBytes(d).catch(function () { /* ditampilkan saat unduh */ });
  }

  /* ---------------------------------------------------------------- cetak */
  function onPrint() {
    var errs = editing ? [] : validate();
    if (errs.length) { showErrors(errs); return; }
    var vm = E.buildViewModel(state, CFG, IDX);
    printing = true;
    render();
    titleBefore = document.title;
    document.title = fileName(vm).replace(/\.pdf$/, "");
    window.print();
  }
  function afterPrint() {
    if (!printing) return;
    printing = false;
    if (titleBefore) document.title = titleBefore;
    schedule();
  }

  /* ---------------------------------------------------------------- PDF */
  function fileName(vm) {
    var base = (CFG.nota.namaFile || "Nota") + " " + (vm.nota.nomor || "") + (vm.pemesan.nama ? " - " + vm.pemesan.nama : "");
    return base.replace(/[\\\/:*?"<>|]+/g, "").replace(/\s+/g, " ").trim() + ".pdf";
  }
  async function makePdf() {
    var d = D();
    await ensureFonts(d);
    var vm = E.buildViewModel(state, CFG, IDX);
    var res = E.computeOps(vm, d.layout, d.measure, { images: imagesInfo() });
    var master = await masterBytes(d);
    var bytes = await E.renderPdf(res.ops, {
      PDFLib: PDFLib,
      master: master ? { bytes: master } : null,
      pageMm: CFG.kertasMm || [210, 297],
      fonts: d.fonts,
      images: assets.logo ? { logo: { bytes: assets.logo.bytes } } : null,
      meta: {
        title: "Nota pembelian tiket " + (vm.nota.nomor || "") + (vm.pemesan.nama ? " - " + vm.pemesan.nama : ""),
        author: CFG.profil.nama, subject: "Nota pembelian tiket pesawat", creator: CFG.profil.website || "Nota Tiket"
      }
    });
    return { bytes: bytes, name: fileName(vm) };
  }
  function saveBlob(bytes, name, type) {
    var blob = new Blob([bytes], { type: type || "application/pdf" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = name; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
  }
  function setBusy(btn, on, label) {
    if (!btn) return;
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = label; btn.classList.add("busy"); btn.setAttribute("aria-busy", "true"); }
    else { btn.textContent = btn.dataset.label || btn.textContent; btn.classList.remove("busy"); btn.removeAttribute("aria-busy"); }
  }
  async function onDownload(btn) {
    var errs = editing ? [] : validate();
    if (errs.length) { showErrors(errs); return; }
    setBusy(btn, true, "Membuat PDF…");
    try {
      var out = await makePdf();
      saveBlob(out.bytes, out.name);
      dirty = false;
      toast(editing ? "PDF uji posisi diunduh." : "PDF diunduh: " + out.name);
    } catch (e) {
      console.error(e);
      toast("PDF gagal dibuat. " + (e && e.message ? e.message : ""), true);
    } finally {
      setBusy(btn, false);
    }
  }
  function canShareFiles() {
    try {
      return !!(navigator.canShare && navigator.share &&
        navigator.canShare({ files: [new File(["x"], "x.pdf", { type: "application/pdf" })] }));
    } catch (e) { return false; }
  }
  async function onShare(btn) {
    var errs = validate();
    if (errs.length) { showErrors(errs); return; }
    setBusy(btn, true, "Menyiapkan…");
    try {
      var out = await makePdf();
      var file = new File([out.bytes], out.name, { type: "application/pdf" });
      await navigator.share({ files: [file], title: out.name.replace(/\.pdf$/, "") });
      dirty = false;
    } catch (e) {
      if (!e || e.name !== "AbortError") { console.error(e); toast("Gagal membagikan PDF. Coba tombol Unduh PDF.", true); }
    } finally {
      setBusy(btn, false);
    }
  }

  /* ----------------------------------------------------- mode atur posisi */
  function findEl(id) { return D().layout.elemen.filter(function (e) { return e.id === id; })[0]; }
  function setEditing(on) {
    editing = on;
    document.body.classList.toggle("editing", on);
    $("#notaForm").hidden = on;
    $("#editor").hidden = !on;
    $("#btnAtur").setAttribute("aria-pressed", on ? "true" : "false");
    if (!on) selId = null;
    renderEditorList();
    renderEditorSel();
    schedule();
  }
  function selectEl(id) {
    selId = id;
    renderEditorList();
    renderEditorSel();
    var li = $('#editorList li[data-id="' + id + '"]');
    if (li) li.scrollIntoView({ block: "nearest" });
    schedule();
  }
  function updateEditorTexts() {
    var d = D();
    $("#editorDesain").textContent = d.nama;
    $$(".editor-file").forEach(function (n) { n.textContent = d.fileName; });
    $("#btnUnduhLayout").textContent = "Unduh " + d.fileName;
  }
  function renderEditorList() {
    if (!editing) return;
    $("#editorList").innerHTML = D().layout.elemen.map(function (el) {
      return '<li data-id="' + esc(el.id) + '" class="' + (el.id === selId ? "on" : "") + (el.sembunyi ? " off" : "") + '">' +
        '<input type="checkbox"' + (el.sembunyi ? "" : " checked") + ' aria-label="Tampilkan ' + esc(el.label || el.id) + '">' +
        '<button type="button">' + esc(el.label || el.id) + "</button></li>";
    }).join("");
  }
  function numField(label, key, val) {
    return '<div class="field"><label for="es-' + key + '">' + label + '</label><input id="es-' + key + '" type="number" step="0.1" inputmode="decimal" data-k="' + key + '" value="' + round1(val) + '"></div>';
  }
  function renderEditorSel() {
    var host = $("#editorSel"), el = findEl(selId);
    if (!editing) return;
    if (!el) { host.innerHTML = '<p class="muted">Klik kotak di pratinjau atau pilih dari daftar isian.</p>'; return; }
    var withSize = /^(teks|paragraf|daftar|stempel)$/.test(el.tipe), withWH = el.tipe === "logo";
    host.innerHTML = "<strong>" + esc(el.label || el.id) + '</strong><div class="grid">' +
      numField("X (mm)", "x", el.x) + numField("Y (mm)", "y", el.y) +
      (withSize ? numField("Huruf (pt)", "ukuran", el.ukuran || 8) : "") +
      (withWH ? numField("Lebar (mm)", "w", el.w) + numField("Tinggi (mm)", "h", el.h) : "") + "</div>";
  }
  function syncSelInputs(el) {
    ["x", "y"].forEach(function (k) {
      var inp = $("#es-" + k);
      if (inp && document.activeElement !== inp) inp.value = round1(el[k]);
    });
  }
  function svgPoint(evt) {
    var svg = $("#sheet"), pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }
  function layoutSource() {
    var d = D(), lay = d.layout;
    var rows = lay.elemen.map(function (el) {
      if (!el.kolom) return "    " + JSON.stringify(el);
      var head = Object.assign({}, el);
      delete head.kolom;
      return "    " + JSON.stringify(head).slice(0, -1) + ',\n      "kolom": [\n' +
        el.kolom.map(function (c) { return "        " + JSON.stringify(c); }).join(",\n") + "\n      ] }";
    });
    var extra = Object.keys(lay).filter(function (k) { return k !== "elemen"; })
      .map(function (k) { return "  " + k + ": " + JSON.stringify(lay[k]) + ",\n"; }).join("");
    return "/* Posisi isian desain " + d.nama + ". Dibuat lewat mode \"Atur posisi\" pada " + new Date().toLocaleString("id-ID") + ".\n" +
      "   Satuan milimeter dari pojok kiri-atas A4 (210 x 297); y teks = garis dasar huruf; ukuran huruf dalam pt. */\n\n" +
      "window." + d.varName + " = {\n" + extra + "  elemen: [\n" + rows.join(",\n") + "\n  ]\n};\n";
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (res, rej) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      ta.remove();
      if (ok) res(); else rej(new Error("Salin tidak didukung"));
    });
  }

  /* --------------------------------------------------------------- event */
  function resetForm(next) {
    state = next;
    renderFlights();
    renderPax();
    fillStatic();
    $$("[aria-invalid]").forEach(clearInvalid);
    dirty = false;
    schedule();
  }

  function bindEvents() {
    var form = $("#notaForm");
    function onField(e) {
      var t = e.target;
      if (t.name === "status") {
        state.status = t.value;
        $$("#segStatus label").forEach(function (l) { l.classList.toggle("on", $("input", l).checked); });
        $("#fieldDp").hidden = state.status !== "DP";
        clearInvalid($("#fDp"));
        changed();
        return;
      }
      if (t.hasAttribute("data-bind")) return onBind(t);
      if (t.closest("#listTerbang")) return onFlight(t);
      if (t.closest("#listPax")) return onPax(t);
    }
    form.addEventListener("input", onField);
    form.addEventListener("change", function (e) { if (e.target.tagName === "SELECT" || e.target.type === "radio") onField(e); });
    form.addEventListener("submit", function (e) { e.preventDefault(); });

    $("#listTerbang").addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]");
      if (!b) return;
      var i = Number(b.closest(".item").getAttribute("data-i"));
      if (b.getAttribute("data-act") === "hapus") { state.penerbangan.splice(i, 1); renderFlights(); changed(); }
      if (b.getAttribute("data-act") === "tukar") swapFlight(i);
    });
    $("#listPax").addEventListener("click", function (e) {
      var b = e.target.closest('[data-act="hapus"]');
      if (!b) return;
      state.penumpang.splice(Number(b.closest(".item").getAttribute("data-i")), 1);
      renderPax();
      changed();
    });
    $("#btnTambahTerbang").addEventListener("click", function () { addFlight(false); });
    $("#btnRutePulang").addEventListener("click", function () { addFlight(true); });
    $("#btnTambahPax").addEventListener("click", addPax);
    $("#btnNomorBaru").addEventListener("click", function () { state.nomor = autoNomor(); $("#fNomor").value = state.nomor; changed(); });

    $("#btnContoh").addEventListener("click", function () {
      if (hasData() && !window.confirm("Ganti isian sekarang dengan data contoh?")) return;
      resetForm(sampleState());
      dirty = true;
      toast("Data contoh terisi. Ubah sesuai pesanan sebenarnya sebelum diunduh.");
    });
    $("#btnKosongkan").addEventListener("click", function () {
      if (hasData() && !window.confirm("Kosongkan semua isian nota?")) return;
      resetForm(freshState());
    });

    $("#btnUnduh").addEventListener("click", function () { onDownload(this); });
    $("#btnUnduhSm").addEventListener("click", function () { onDownload(this); });
    $("#btnBagikan").addEventListener("click", function () { onShare(this); });
    $("#btnBagikanSm").addEventListener("click", function () { onShare(this); });

    // pratinjau di layar kecil
    $("#btnPratinjau").addEventListener("click", function () { document.body.classList.add("preview-open"); fitPaper(); });
    $("#btnTutup").addEventListener("click", function () { document.body.classList.remove("preview-open"); });
    $("#zoomIn").addEventListener("click", function () { zoomIdx = Math.min(ZOOMS.length - 1, zoomIdx + 1); fitPaper(); });
    $("#zoomOut").addEventListener("click", function () { zoomIdx = Math.max(0, zoomIdx - 1); fitPaper(); });
    var resizeQueued = false;
    window.addEventListener("resize", function () {
      if (resizeQueued) return;
      resizeQueued = true;
      requestAnimationFrame(function () { resizeQueued = false; fitPaper(); });
    });

    // atur posisi
    $("#btnAtur").addEventListener("click", function () { setEditing(!editing); });
    $("#btnSelesaiAtur").addEventListener("click", function () { setEditing(false); });
    $("#editorList").addEventListener("click", function (e) {
      var li = e.target.closest("li");
      if (li && e.target.tagName === "BUTTON") selectEl(li.getAttribute("data-id"));
    });
    $("#editorList").addEventListener("change", function (e) {
      var li = e.target.closest("li"), el = li && findEl(li.getAttribute("data-id"));
      if (!el) return;
      if (e.target.checked) delete el.sembunyi; else el.sembunyi = true;
      li.classList.toggle("off", !!el.sembunyi);
      schedule();
    });
    $("#editorSel").addEventListener("input", function (e) {
      var k = e.target.getAttribute("data-k"), el = findEl(selId), v = parseFloat(e.target.value);
      if (!k || !el || !isFinite(v)) return;
      el[k] = round1(v);
      schedule();
    });
    var sheet = $("#sheet");
    sheet.addEventListener("pointerdown", function (e) {
      if (!editing) return;
      var box = e.target.closest ? e.target.closest(".ebox") : null;
      if (!box) return;
      var el = findEl(box.getAttribute("data-id"));
      if (!el) return;
      if (selId !== el.id) selectEl(el.id);
      var p = svgPoint(e);
      drag = { id: el.id, sx: p.x, sy: p.y, ox: el.x, oy: el.y, pid: e.pointerId };
      sheet.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    sheet.addEventListener("pointermove", function (e) {
      if (!drag || e.pointerId !== drag.pid) return;
      var p = svgPoint(e), el = findEl(drag.id);
      el.x = round1(drag.ox + p.x - drag.sx);
      el.y = round1(drag.oy + p.y - drag.sy);
      syncSelInputs(el);
      schedule();
    });
    function endDrag(e) { if (drag && e.pointerId === drag.pid) drag = null; }
    sheet.addEventListener("pointerup", endDrag);
    sheet.addEventListener("pointercancel", endDrag);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("preview-open")) { document.body.classList.remove("preview-open"); return; }
      if (!editing || !selId) return;
      var tag = document.activeElement ? document.activeElement.tagName : "";
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      var step = e.shiftKey ? 2 : 0.5, dx = 0, dy = 0;
      if (e.key === "ArrowLeft") dx = -step; else if (e.key === "ArrowRight") dx = step;
      else if (e.key === "ArrowUp") dy = -step; else if (e.key === "ArrowDown") dy = step;
      else return;
      e.preventDefault();
      var el = findEl(selId);
      el.x = round1(el.x + dx); el.y = round1(el.y + dy);
      syncSelInputs(el);
      schedule();
    });
    $("#btnUnduhLayout").addEventListener("click", function () {
      var f = D().fileName;
      saveBlob(new TextEncoder().encode(layoutSource()), f, "text/javascript");
      toast(f + " diunduh. Ganti file " + f + " di repositori dengan file ini.");
    });
    $("#btnSalinLayout").addEventListener("click", function () {
      var f = D().fileName;
      copyText(layoutSource()).then(function () { toast("Kode disalin. Tempel menggantikan seluruh isi " + f + "."); },
        function () { toast("Tidak bisa menyalin otomatis. Pakai tombol Unduh " + f + ".", true); });
    });
    $("#btnResetLayout").addEventListener("click", function () {
      var d = D();
      if (!window.confirm("Kembalikan semua posisi ke isi " + d.fileName + " yang sedang terpasang?")) return;
      d.layout = clone(d.asli);
      selId = null;
      renderEditorList(); renderEditorSel(); schedule();
    });
    $("#fileMaster").addEventListener("change", async function (e) {
      var file = e.target.files && e.target.files[0], d = D();
      e.target.value = "";
      if (!file) return;
      var bytes = new Uint8Array(await file.arrayBuffer()), type = E.sniff(bytes);
      if (type !== "png" && type !== "jpg") { toast("Pilih gambar PNG atau JPG.", true); return; }
      if (d.test) URL.revokeObjectURL(d.test.url);
      var url = URL.createObjectURL(file);
      d.test = { url: url, bytes: bytes };
      setBackground();
      try {
        var s = await imageSize(url);
        if (Math.abs(s.h / s.w - 297 / 210) > 0.03) toast("Ukuran gambar bukan A4 tegak (210 x 297). Hasilnya bisa tampak melar.", true);
        else if (s.w < 1200) toast("Resolusi gambar rendah (" + s.w + " px). Untuk cetak, ekspor minimal 1654 x 2339 px.", true);
      } catch (err) { /* abaikan */ }
    });
    $("#btnMasterAsli").addEventListener("click", function () {
      var d = D();
      if (d.test) URL.revokeObjectURL(d.test.url);
      d.test = null;
      setBackground();
    });

    // pilihan desain & cetak
    $("#desainTabs").addEventListener("click", function (e) {
      var b = e.target.closest("[data-desain]");
      if (b && b.getAttribute("data-desain") !== desainId) setDesain(b.getAttribute("data-desain"));
    });
    $("#btnCetak").addEventListener("click", onPrint);
    $("#btnCetakSm").addEventListener("click", onPrint);
    window.addEventListener("afterprint", afterPrint);

    window.addEventListener("beforeunload", function (e) {
      if (dirty && hasData()) { e.preventDefault(); e.returnValue = ""; }
    });
  }

  /* ---------------------------------------------------------------- mulai */
  function fatal(title, message) { var e = new Error(message); e.title = title; return e; }
  function showFatal(err) {
    console.error(err);
    var boot = $("#boot");
    boot.classList.remove("done");
    boot.innerHTML = '<div class="fatal"><h1>' + esc(err.title || "Aplikasi belum bisa dibuka") + "</h1><p>" + esc(err.message || String(err)) + "</p></div>";
  }

  async function boot() {
    if (!CFG || !E || !PDFLib) {
      throw fatal("File aplikasi tidak lengkap", "Pastikan config.js, layout.js, layout-sederhana.js, assets/engine.js, dan vendor/pdf-lib.min.js ikut terunggah ke repositori.");
    }
    if (location.protocol === "file:") {
      throw fatal("Buka lewat alamat web", "Aplikasi ini perlu dibuka lewat alamat situsnya (misalnya https://" + (CFG.profil.website || "tiket.zasha.online") +
        ") atau server lokal. Membuka index.html langsung dari folder tidak bisa memuat font dan desain master.");
    }
    IDX = E.indexConfig(CFG);
    buildDesigns();
    if (!DLIST.length) throw fatal("Posisi isian tidak ditemukan", "File layout.js belum terunggah atau rusak.");
    // batas baris form = baris tersedikit di antara semua desain
    function tableMax(src, fallback) {
      return DLIST.reduce(function (mx, d) {
        var t = d.layout.elemen.filter(function (e) { return e.tipe === "tabel" && e.sumber === src; })[0];
        return t && t.maksBaris ? Math.min(mx, t.maksBaris) : mx;
      }, fallback);
    }
    MAX_F = Math.max(1, tableMax("penerbangan", CFG.nota.maksPenerbangan || 4));
    MAX_P = Math.max(1, tableMax("penumpang", CFG.nota.maksPenumpang || 8));

    var simpan = "";
    try { simpan = localStorage.getItem(KUNCI_DESAIN) || ""; } catch (e) { /* abaikan */ }
    desainId = DS[simpan] ? simpan : DS[CFG.desainAwal] ? CFG.desainAwal : DLIST[0].id;
    await ensureFonts(D()).catch(function (e) {
      throw fatal("Font tidak bisa dimuat", e.message + ". Periksa folder fonts/ dan pengaturan font di config.js.");
    });
    masterBytes(D()).catch(function () { /* ditampilkan saat unduh */ });

    if (CFG.profil.logo) {
      try {
        var lb = await fetchBytes(CFG.profil.logo), lt = E.sniff(lb);
        if (lt === "png" || lt === "jpg") {
          var url = URL.createObjectURL(new Blob([lb], { type: lt === "png" ? "image/png" : "image/jpeg" }));
          var d = await imageSize(url);
          assets.logo = { bytes: lb, url: url, width: d.w, height: d.h };
        }
      } catch (e) { console.warn("Logo tidak bisa dimuat:", e); }
    }
    if (document.fonts && document.fonts.load) {
      try { await Promise.all([document.fonts.load('400 12px "Poppins Nota"'), document.fonts.load('700 12px "Poppins Nota"')]); } catch (e) { /* lanjut */ }
    }

    $("#brandName").textContent = CFG.profil.nama || "Nota tiket";
    document.title = "Nota Tiket Pesawat" + (CFG.profil.nama ? " – " + CFG.profil.nama : "");
    $("#fMetode").innerHTML = simpleOptions(CFG.metodeBayar);
    buildOptionCache();
    state = freshState();
    renderFlights();
    renderPax();
    fillStatic();
    renderTabs();
    setBackground();
    updateEditorTexts();
    bindEvents();
    var shareOk = canShareFiles();
    $("#btnBagikan").hidden = !shareOk;
    $("#btnBagikanSm").hidden = !shareOk;
    $("#boot").classList.add("done");
    fitPaper();
    render();
  }

  boot().catch(showFatal);
})();
