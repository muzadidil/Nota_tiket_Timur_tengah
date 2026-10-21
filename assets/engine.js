/* ==========================================================================
   Nota Tiket — mesin tata letak, pratinjau SVG, dan pembuat PDF
   Dipakai di browser (window.NotaEngine) dan bisa diuji di Node.js.
   Hanya butuh pdf-lib (diberikan saat memanggil renderPdf).
   ========================================================================== */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.NotaEngine = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var MM_PER_PT = 25.4 / 72;
  var PT_PER_MM = 72 / 25.4;

  /* ------------------------------------------------------------------------
     1. Teks & encoding WinAnsi (huruf Latin, cukup untuk bahasa Indonesia)
     ------------------------------------------------------------------------ */
  var WIN_EXTRA = {
    0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86,
    0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c,
    0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95,
    0x2013: 0x96, 0x2014: 0x97, 0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b,
    0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f
  };
  var WIN_TO_UNI = (function () {
    var a = [], c;
    for (c = 0; c < 256; c++) a[c] = -1;
    for (c = 32; c <= 126; c++) a[c] = c;
    for (c = 160; c <= 255; c++) a[c] = c;
    Object.keys(WIN_EXTRA).forEach(function (k) { a[WIN_EXTRA[k]] = Number(k); });
    return a;
  })();
  // karakter yang tidak ada di WinAnsi diganti padanan terdekat
  var SUBST = {
    0x2192: "-", 0x2190: "-", 0x2194: "-", 0x2010: "-", 0x2011: "-", 0x2012: "-",
    0x2015: "-", 0x2212: "-", 0x2002: " ", 0x2003: " ", 0x2007: " ", 0x2009: " ",
    0x200a: " ", 0x202f: " ", 0x200b: "", 0xfeff: "", 0x2032: "'", 0x2033: '"',
    0x02bc: "'", 0x2027: "-", 0x00b7: "·"
  };

  function winCode(cp) {
    if ((cp >= 32 && cp <= 126) || (cp >= 160 && cp <= 255)) return cp;
    return WIN_EXTRA[cp] != null ? WIN_EXTRA[cp] : -1;
  }

  function clean(s) {
    if (s == null) return "";
    s = String(s);
    if (s.normalize) s = s.normalize("NFC");
    var out = "";
    for (var i = 0; i < s.length; i++) {
      var cp = s.codePointAt(i);
      var ch = String.fromCodePoint(cp);
      if (cp > 0xffff) i++;
      if (cp === 9 || cp === 10 || cp === 13) { out += " "; continue; }
      if (cp < 32 || (cp >= 127 && cp < 160)) continue;
      if (winCode(cp) >= 0) { out += ch; continue; }
      out += SUBST[cp] != null ? SUBST[cp] : "?";
    }
    return out;
  }

  /* ------------------------------------------------------------------------
     2. Font TrueType: baca metrik, ukur teks, sisipkan ke PDF
     ------------------------------------------------------------------------ */
  function NotaFont(bytes) {
    var u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    var tables = {}, n = dv.getUint16(4), i, o;
    for (i = 0; i < n; i++) {
      o = 12 + i * 16;
      var tag = String.fromCharCode(dv.getUint8(o), dv.getUint8(o + 1), dv.getUint8(o + 2), dv.getUint8(o + 3));
      tables[tag] = { offset: dv.getUint32(o + 8), length: dv.getUint32(o + 12) };
    }
    ["head", "hhea", "hmtx", "cmap"].forEach(function (t) {
      if (!tables[t]) throw new Error("Font tidak valid (tabel " + t + " tidak ada)");
    });
    if (!tables.glyf) throw new Error("Gunakan font TrueType (.ttf), bukan OpenType CFF");

    var head = tables.head.offset, hhea = tables.hhea.offset, hmtx = tables.hmtx.offset;
    this.unitsPerEm = dv.getUint16(head + 18);
    this.bbox = [dv.getInt16(head + 36), dv.getInt16(head + 38), dv.getInt16(head + 40), dv.getInt16(head + 42)];
    this.ascender = dv.getInt16(hhea + 4);
    this.descender = dv.getInt16(hhea + 6);
    var numHM = dv.getUint16(hhea + 34);
    this.capHeight = Math.round(this.unitsPerEm * 0.7);
    this.weight = 400;
    if (tables["OS/2"]) {
      var os2 = tables["OS/2"].offset, ver = dv.getUint16(os2);
      this.weight = dv.getUint16(os2 + 4);
      if (ver >= 2 && tables["OS/2"].length >= 90) this.capHeight = dv.getInt16(os2 + 88);
    }
    this.italicAngle = 0;
    this.fixedPitch = false;
    if (tables.post) {
      var p = tables.post.offset;
      this.italicAngle = dv.getInt16(p + 4) + dv.getUint16(p + 6) / 65536;
      this.fixedPitch = dv.getUint32(p + 12) !== 0;
    }

    // cmap: cari subtabel format 4 (BMP) atau 12
    var cmap = tables.cmap.offset, nsub = dv.getUint16(cmap + 2), sub4 = -1, sub12 = -1;
    for (i = 0; i < nsub; i++) {
      var pid = dv.getUint16(cmap + 4 + i * 8), eid = dv.getUint16(cmap + 6 + i * 8);
      var so = cmap + dv.getUint32(cmap + 8 + i * 8), fmt = dv.getUint16(so);
      if (fmt === 4 && (pid === 0 || (pid === 3 && eid === 1)) && sub4 < 0) sub4 = so;
      if (fmt === 12 && (pid === 0 || (pid === 3 && eid === 10)) && sub12 < 0) sub12 = so;
    }
    function glyphFor(cp) {
      var k;
      if (sub4 >= 0 && cp <= 0xffff) {
        var segX2 = dv.getUint16(sub4 + 6), ends = sub4 + 14, starts = ends + segX2 + 2;
        var deltas = starts + segX2, ranges = deltas + segX2;
        for (k = 0; k < segX2 / 2; k++) {
          if (cp > dv.getUint16(ends + 2 * k)) continue;
          var start = dv.getUint16(starts + 2 * k);
          if (cp < start) return 0;
          var delta = dv.getInt16(deltas + 2 * k), ro = dv.getUint16(ranges + 2 * k);
          if (ro === 0) return (cp + delta) & 0xffff;
          var g = dv.getUint16(ranges + 2 * k + ro + 2 * (cp - start));
          return g === 0 ? 0 : (g + delta) & 0xffff;
        }
      }
      if (sub12 >= 0) {
        var groups = dv.getUint32(sub12 + 12);
        for (k = 0; k < groups; k++) {
          var go = sub12 + 16 + k * 12, sc = dv.getUint32(go), ec = dv.getUint32(go + 4);
          if (cp >= sc && cp <= ec) return dv.getUint32(go + 8) + (cp - sc);
        }
      }
      return 0;
    }
    function advance(gid) { return dv.getUint16(hmtx + 4 * Math.min(gid, numHM - 1)); }

    // lebar tiap kode WinAnsi dalam satuan 1/1000 em
    var scale = 1000 / this.unitsPerEm;
    this.widths = [];
    for (var code = 0; code < 256; code++) {
      var uni = WIN_TO_UNI[code];
      var gid = uni >= 0 ? glyphFor(uni) : 0;
      this.widths[code] = uni >= 0 ? Math.round(advance(gid) * scale) : 0;
    }
    this.psName = readPsName(dv, tables.name) || "NotaFont";
    this.bytes = u8;
  }

  function readPsName(dv, t) {
    if (!t) return "";
    var base = t.offset, count = dv.getUint16(base + 2), strOff = base + dv.getUint16(base + 4);
    var mac = "";
    for (var i = 0; i < count; i++) {
      var r = base + 6 + i * 12;
      var pid = dv.getUint16(r), nid = dv.getUint16(r + 6), len = dv.getUint16(r + 8), off = dv.getUint16(r + 10);
      if (nid !== 6) continue;
      var s = "", j;
      if (pid === 3 || pid === 0) {
        for (j = 0; j < len; j += 2) s += String.fromCharCode(dv.getUint16(strOff + off + j));
        return s.replace(/[^\x21-\x7e]/g, "").replace(/[\[\](){}<>\/%#]/g, "");
      }
      for (j = 0; j < len; j++) s += String.fromCharCode(dv.getUint8(strOff + off + j));
      mac = s.replace(/[^\x21-\x7e]/g, "");
    }
    return mac;
  }

  NotaFont.prototype.codes = function (text) {
    var t = clean(text), out = [];
    for (var i = 0; i < t.length; i++) {
      var cp = t.codePointAt(i);
      if (cp > 0xffff) i++;
      var c = winCode(cp);
      out.push(c < 0 ? 63 : c);
    }
    return out;
  };
  /** lebar teks dalam point */
  NotaFont.prototype.widthOf = function (text, sizePt) {
    var c = this.codes(text), w = 0;
    for (var i = 0; i < c.length; i++) w += this.widths[c[i]];
    return (w * sizePt) / 1000;
  };
  NotaFont.prototype.encodeHex = function (text) {
    return this.codes(text).map(function (c) { return (c < 16 ? "0" : "") + c.toString(16).toUpperCase(); }).join("");
  };

  /**
   * Font standar PDF (Courier / Courier-Bold): sudah ada di semua pembaca PDF,
   * tidak perlu file font, dan setiap huruf selebar 600/1000 em (huruf mesin ketik).
   */
  var STD_METRICS = { "Courier": [629, -157, 562], "Courier-Bold": [629, -157, 562] };
  function StandardFont(name) {
    var mt = STD_METRICS[name];
    if (!mt) throw new Error("Font standar tidak dikenal: " + name);
    this.standard = name;
    this.psName = name;
    this.unitsPerEm = 1000;
    this.ascender = mt[0];
    this.descender = mt[1];
    this.capHeight = mt[2];
    this.widths = [];
    for (var c = 0; c < 256; c++) this.widths[c] = WIN_TO_UNI[c] >= 0 ? 600 : 0;
  }
  StandardFont.prototype.codes = NotaFont.prototype.codes;
  StandardFont.prototype.widthOf = NotaFont.prototype.widthOf;

  /** Sisipkan NotaFont ke dokumen pdf-lib sebagai font TrueType WinAnsi. */
  function embedFont(doc, L, font) {
    var emb = L.StandardFontEmbedder.for(L.StandardFonts.Helvetica);
    var upm = font.unitsPerEm, s = 1000 / upm;
    emb.fontName = font.psName;
    emb.encodeText = function (text) { return L.PDFHexString.of(font.encodeHex(text)); };
    emb.widthOfTextAtSize = function (text, size) { return font.widthOf(text, size); };
    emb.heightOfFontAtSize = function (size, opt) {
      var h = font.ascender - font.descender;
      if (opt && opt.descender === false) h += font.descender;
      return (h / upm) * size;
    };
    emb.sizeOfFontAtHeight = function (height) { return (height * upm) / (font.ascender - font.descender); };
    emb.embedIntoContext = function (context, ref) {
      var fileRef = context.register(context.flateStream(font.bytes, { Length1: font.bytes.length }));
      var flags = 32 | (font.fixedPitch ? 1 : 0) | (font.italicAngle ? 64 : 0);
      var descRef = context.register(context.obj({
        Type: "FontDescriptor",
        FontName: font.psName,
        Flags: flags,
        FontBBox: font.bbox.map(function (v) { return Math.round(v * s); }),
        ItalicAngle: font.italicAngle,
        Ascent: Math.round(font.ascender * s),
        Descent: Math.round(font.descender * s),
        CapHeight: Math.round(font.capHeight * s),
        StemV: font.weight >= 600 ? 140 : 80,
        FontFile2: fileRef
      }));
      var dict = context.obj({
        Type: "Font",
        Subtype: "TrueType",
        BaseFont: font.psName,
        FirstChar: 32,
        LastChar: 255,
        Widths: font.widths.slice(32, 256),
        FontDescriptor: descRef,
        Encoding: "WinAnsiEncoding"
      });
      if (ref) { context.assign(ref, dict); return ref; }
      return context.register(dict);
    };
    var pdfFont = L.PDFFont.of(doc.context.nextRef(), doc, emb);
    doc.fonts.push(pdfFont);
    return pdfFont;
  }

  /** alat ukur teks dalam milimeter */
  function makeMeasure(fonts) {
    function f(bold) { return bold ? fonts.bold : fonts.regular; }
    return {
      width: function (text, sizePt, bold) { return f(bold).widthOf(text, sizePt) * MM_PER_PT; },
      capHeight: function (sizePt, bold) { var x = f(bold); return (x.capHeight / x.unitsPerEm) * sizePt * MM_PER_PT; },
      ascent: function (sizePt, bold) { var x = f(bold); return (x.ascender / x.unitsPerEm) * sizePt * MM_PER_PT; },
      charWidths: function (text, sizePt, bold) {
        var x = f(bold);
        return x.codes(text).map(function (c) { return (x.widths[c] * sizePt) / 1000 * MM_PER_PT; });
      }
    };
  }

  /* ------------------------------------------------------------------------
     3. Format angka, tanggal, terbilang
     ------------------------------------------------------------------------ */
  var BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  var BULAN3 = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  var HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  var HARI3 = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  function angka(n) {
    n = Math.round(Math.abs(Number(n) || 0));
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  function rupiah(n) {
    n = Math.round(Number(n) || 0);
    return (n < 0 ? "- " : "") + "Rp " + angka(n);
  }
  function parseTanggal(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  }
  function tanggalPanjang(iso) {
    var d = parseTanggal(iso);
    return d ? d.getDate() + " " + BULAN[d.getMonth()] + " " + d.getFullYear() : "";
  }
  function tanggalJadwal(iso) {
    var d = parseTanggal(iso);
    return d ? HARI3[d.getDay()] + ", " + d.getDate() + " " + BULAN3[d.getMonth()] + " " + d.getFullYear() : "";
  }
  function tanggalStempel(iso) {
    var d = parseTanggal(iso);
    return d ? (d.getDate() + " " + BULAN3[d.getMonth()] + " " + d.getFullYear()).toUpperCase() : "";
  }
  function dua(n) { return (n < 10 ? "0" : "") + n; }
  /** "04 Nov 2026" */
  function tanggalSingkat(iso) {
    var d = parseTanggal(iso);
    return d ? dua(d.getDate()) + " " + BULAN3[d.getMonth()] + " " + d.getFullYear() : "";
  }
  /** "Rab 04 Nov 2026" */
  function hariTanggalSingkat(iso) {
    var d = parseTanggal(iso);
    return d ? HARI3[d.getDay()] + " " + tanggalSingkat(iso) : "";
  }
  function geserTanggal(iso, n) {
    var d = parseTanggal(iso);
    if (!d) return "";
    d.setDate(d.getDate() + n);
    return d.getFullYear() + "-" + dua(d.getMonth() + 1) + "-" + dua(d.getDate());
  }

  var SATUAN = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  function terbilang(n) {
    n = Math.floor(Math.abs(Number(n) || 0));
    if (n < 12) return SATUAN[n];
    if (n < 20) return terbilang(n - 10) + " belas";
    if (n < 100) return terbilang(Math.floor(n / 10)) + " puluh" + (n % 10 ? " " + terbilang(n % 10) : "");
    if (n < 200) return "seratus" + (n - 100 ? " " + terbilang(n - 100) : "");
    if (n < 1000) return terbilang(Math.floor(n / 100)) + " ratus" + (n % 100 ? " " + terbilang(n % 100) : "");
    if (n < 2000) return "seribu" + (n - 1000 ? " " + terbilang(n - 1000) : "");
    if (n < 1e6) return terbilang(Math.floor(n / 1000)) + " ribu" + (n % 1000 ? " " + terbilang(n % 1000) : "");
    if (n < 1e9) return terbilang(Math.floor(n / 1e6)) + " juta" + (n % 1e6 ? " " + terbilang(n % 1e6) : "");
    if (n < 1e12) return terbilang(Math.floor(n / 1e9)) + " miliar" + (n % 1e9 ? " " + terbilang(n % 1e9) : "");
    return terbilang(Math.floor(n / 1e12)) + " triliun" + (n % 1e12 ? " " + terbilang(n % 1e12) : "");
  }
  function terbilangRupiah(n) {
    n = Math.floor(Math.abs(Number(n) || 0));
    var t = n === 0 ? "nol" : terbilang(n);
    return t.charAt(0).toUpperCase() + t.slice(1) + " rupiah";
  }

  /* ---- Format Khusus E-Ticket / Itinerary Maskapai ---- */
  var BULAN_EN = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  var HARI_EN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  function tanggalEn(iso) {
    var d = parseTanggal(iso);
    return d ? dua(d.getDate()) + " " + BULAN_EN[d.getMonth()] + " " + d.getFullYear() : "";
  }
  function hariTanggalEn(iso) {
    var d = parseTanggal(iso);
    return d ? HARI_EN[d.getDay()] + " " + tanggalEn(iso) : "";
  }
  function tanggalBulanEn(iso) {
    var d = parseTanggal(iso);
    return d ? dua(d.getDate()) + " " + BULAN_EN[d.getMonth()] : "";
  }

  var SAPAAN_AIRLINE = {
    "Tn.": "MR", "Ny.": "MRS", "Nn.": "MS", "An.": "MSTR", "Bayi": "INF",
    "Mr": "MR", "Mr.": "MR", "Mrs": "MRS", "Mrs.": "MRS", "Ms": "MS", "Ms.": "MS",
    "Miss": "MISS", "Mstr": "MSTR", "Inf": "INF"
  };

  function formatNamaTiket(nama, sapaan) {
    var n = str(nama).toUpperCase().replace(/[^A-Z0-9\/\. ]/g, " ").replace(/\s+/g, " ").trim();
    if (!n) return "";
    var title = SAPAAN_AIRLINE[sapaan] || "";
    var hasTitle = /\b(MR|MRS|MS|MISS|MSTR|INF)\b$/i.test(n);
    if (hasTitle) title = "";

    // Sudah dalam format SURNAME/GIVEN: pakai langsung
    if (n.indexOf("/") >= 0) {
      return (n + (title ? " " + title : "")).trim();
    }
    var parts = n.split(" ").filter(Boolean);
    if (parts.length === 1) {
      return parts[0] + "/" + parts[0] + (title ? " " + title : "");
    }
    // Kata terakhir = surname (standar tiket maskapai)
    // Contoh: "Budi Santoso" → SANTOSO/BUDI MR
    //         "Rokayah Bt Rohman" → ROHMAN/ROKAYAH BT MRS
    var surname = parts[parts.length - 1];
    var given = parts.slice(0, -1).join(" ");
    return surname + "/" + given + (title ? " " + title : "");
  }

  var TIKET_PREFIX = {
    "MH": "232", "QR": "157", "SV": "065", "GA": "126", "JT": "990",
    "ID": "938", "QG": "888", "QZ": "084", "AK": "807", "D7": "843",
    "SQ": "618", "TR": "668", "BI": "672", "EK": "176", "EY": "607",
    "FZ": "141", "WY": "910", "GF": "072", "KU": "229", "RJ": "078",
    "MS": "077", "TK": "235", "XY": "593", "F3": "610"
  };

  var TZ_AIRPORT = {
    "SUB": 7, "CGK": 7, "KJT": 7, "SOC": 7, "YIA": 7, "SRG": 7, "KNO": 7,
    "BTJ": 7, "PDG": 7, "PKU": 7, "BTH": 7, "PLM": 7,
    "DPS": 8, "LOP": 8, "UPG": 8, "BPN": 8, "BDJ": 8, "MDC": 8,
    "KUL": 8, "PEN": 8, "SIN": 8, "BWN": 8,
    "CAN": 8, "SZX": 8, "XMN": 8, "HAK": 8, "PVG": 8, "PKX": 8, "PEK": 8, "MNL": 8,
    "JED": 3, "MED": 3, "RUH": 3, "DMM": 3, "TIF": 3, "HAS": 3, "AHB": 3,
    "TUU": 3, "ELQ": 3, "YNB": 3, "GIZ": 3, "ULH": 3, "DOH": 3, "KWI": 3,
    "BAH": 3, "AMM": 3, "CAI": 3, "IST": 3, "ADD": 3,
    "DXB": 4, "AUH": 4, "SHJ": 4, "MCT": 4,
    "BOM": 5.5, "DEL": 5.5, "CMB": 5.5
  };
  var TZ_COUNTRY = { "ID": 7, "MY": 8, "SG": 8, "BN": 8, "CN": 8, "SA": 3, "QA": 3, "AE": 4, "OM": 4, "KW": 3, "EG": 3, "TR": 3 };

  function hitungDurasi(jb, jt, dari, ke, lewatHari) {
    jb = str(jb); jt = str(jt);
    if (!jb || !jt) return "02:00";
    var b = jb.split(":").map(Number);
    var t = jt.split(":").map(Number);
    if (isNaN(b[0]) || isNaN(b[1]) || isNaN(t[0]) || isNaN(t[1])) return "02:00";
    var tzD = TZ_AIRPORT[dari.kode] != null ? TZ_AIRPORT[dari.kode] : (TZ_COUNTRY[dari.negara] != null ? TZ_COUNTRY[dari.negara] : 7);
    var tzK = TZ_AIRPORT[ke.kode] != null ? TZ_AIRPORT[ke.kode] : (TZ_COUNTRY[ke.negara] != null ? TZ_COUNTRY[ke.negara] : tzD);

    var mB = (b[0] * 60 + b[1]) - Math.round(tzD * 60);
    var mT = (t[0] * 60 + t[1]) - Math.round(tzK * 60);
    var diff = mT - mB;
    if (diff <= 30 || lewatHari) diff += 24 * 60;
    while (diff > 24 * 60) diff -= 24 * 60;
    var jam = Math.floor(diff / 60);
    var mnt = diff % 60;
    return (jam < 10 ? "0" : "") + jam + ":" + (mnt < 10 ? "0" : "") + mnt;
  }

  function autoEquipment(mKode, dari, ke) {
    mKode = str(mKode).toUpperCase();
    if (mKode === "MH") {
      return (ke.kode === "JED" || dari.kode === "JED" || ke.kode === "MED" || dari.kode === "MED" || dari.kode === "DOH" || ke.kode === "DOH") ? "AIRBUS A330-300" : "BOEING 737 MAX 8";
    }
    if (mKode === "QR") return "AIRBUS A330-300";
    if (mKode === "SV") return "BOEING 777-300ER";
    if (mKode === "EK") return "BOEING 777-300ER";
    if (mKode === "EY") return "BOEING 787-9";
    if (mKode === "GA") return (ke.kode === "JED" || dari.kode === "JED") ? "BOEING 777-300ER" : "AIRBUS A330-300";
    if (mKode === "JT") return "AIRBUS A330-900NEO";
    if (mKode === "ID" || mKode === "OD") return "BOEING 737-800";
    if (mKode === "QG" || mKode === "QZ" || mKode === "AK") return "AIRBUS A320";
    if (mKode === "SQ") return "BOEING 787-10";
    if (mKode === "TR") return "BOEING 787-8";
    if (mKode === "XY") return "AIRBUS A320NEO";
    return "BOEING 737-800";
  }

  function formatKelasTiket(kelas) {
    var k = str(kelas).toUpperCase();
    if (k.indexOf("BISNIS") >= 0 || k.indexOf("BUSINESS") >= 0) return "BUSINESS (C)";
    if (k.indexOf("FIRST") >= 0) return "FIRST (F)";
    if (k.indexOf("PREMIUM") >= 0) return "PREMIUM ECONOMY (W)";
    return "ECONOMY (O)";
  }

  /* ------------------------------------------------------------------------
     4. Data form -> data nota (view model)
     ------------------------------------------------------------------------ */
  var LAIN = "__lain";
  var WARNA_STATUS = { "LUNAS": "#1E7B4F", "DP": "#A86A00", "BELUM LUNAS": "#B3261E" };
  var LABEL_STATUS = { "LUNAS": "LUNAS", "DP": "DP (uang muka)", "BELUM LUNAS": "BELUM LUNAS" };

  function indexConfig(cfg) {
    var idx = { maskapai: {}, bandara: {} };
    (cfg.maskapai || []).forEach(function (g) { (g.daftar || []).forEach(function (m) { idx.maskapai[m.kode] = m; }); });
    (cfg.bandara || []).forEach(function (g) { (g.daftar || []).forEach(function (b) { idx.bandara[b.kode] = b; }); });
    return idx;
  }

  function str(v) { return v == null ? "" : String(v).trim(); }
  function num(v) { var n = Number(v); return isFinite(n) ? Math.max(0, Math.round(n)) : 0; }

  /** "2", "T2", "Terminal 2" -> "2" */
  function terminal(t) { return str(t).replace(/^(terminal|term\.?|t)\s*/i, ""); }
  function labelTerminal(t) { return /^\d+[a-z]?$/i.test(t) ? "T" + t.toUpperCase() : t; }

  /** "15:50 (T2) – 19:30 (T1)" untuk desain berwarna */
  function jamTerbang(b, t, tb, tt) {
    b = str(b); t = str(t);
    var B = b + (b && tb ? " (" + labelTerminal(tb) + ")" : ""), T = t + (t && tt ? " (" + labelTerminal(tt) + ")" : "");
    if (b && t) return B + " – " + T + (t < b ? " (+1)" : "");
    if (b) return "Berangkat " + B;
    return t ? "Tiba " + T : "";
  }

  /** "Surabaya, ID (Juanda), Terminal 2" — gaya penulisan tiket */
  function bandaraLengkap(b, t) {
    var s = b.kota || b.kode || "";
    if (!s) return "";
    if (b.negara) s += ", " + b.negara;
    if (b.nama) s += " (" + b.nama + ")";
    if (t) s += ", Terminal " + t;
    return s;
  }

  /** "04 Nov" */
  function tanggalBulan(iso) {
    var d = parseTanggal(iso);
    return d ? dua(d.getDate()) + " " + BULAN3[d.getMonth()] : "";
  }

  function flightFilled(f) {
    return !!(str(f.maskapai) || str(f.dari) || str(f.ke) || str(f.tanggal) || str(f.nomor));
  }
  function paxFilled(p) { return !!(str(p.nama) || num(p.harga)); }

  function hitung(state) {
    var subtotal = (state.penumpang || []).filter(paxFilled).reduce(function (a, p) { return a + num(p.harga); }, 0);
    var biaya = num(state.biayaLayanan), diskon = num(state.diskon);
    var total = Math.max(0, subtotal + biaya - diskon);
    var dp = state.status === "DP" ? Math.min(num(state.dp), total) : 0;
    return { subtotal: subtotal, biaya: biaya, diskon: diskon, total: total, dp: dp, sisa: total - dp };
  }

  function buildViewModel(state, cfg, idx) {
    idx = idx || indexConfig(cfg);
    var p = cfg.profil || {};
    var h = hitung(state);

    function bandara(kode, lain) {
      if (kode === LAIN) return { kode: str(lain.kode).toUpperCase(), kota: str(lain.kota), negara: str(lain.negara).toUpperCase(), nama: str(lain.nama) };
      var b = idx.bandara[kode];
      return b ? { kode: b.kode, kota: b.kota || "", negara: b.negara || "", nama: b.nama || "" } : { kode: str(kode).toUpperCase(), kota: "", negara: "", nama: "" };
    }

    var pnrCode = str(state.pnr).toUpperCase() || "PENDING";

    var penerbangan = (state.penerbangan || []).filter(flightFilled).map(function (f, i) {
      var dari = bandara(f.dari, { kode: f.dariKode, kota: f.dariKota, negara: f.dariNegara, nama: f.dariBandara });
      var ke = bandara(f.ke, { kode: f.keKode, kota: f.keKota, negara: f.keNegara, nama: f.keBandara });
      var m = f.maskapai === LAIN ? { nama: str(f.maskapaiLain) } : idx.maskapai[f.maskapai] || { nama: "" };
      var maskapaiKode = (f.maskapai === LAIN ? "" : f.maskapai) || (m.kode || "");
      if (!maskapaiKode && str(f.nomor)) {
        var matchK = str(f.nomor).match(/^([A-Za-z0-9]{2})/);
        if (matchK) maskapaiKode = matchK[1].toUpperCase();
      }
      var jb = str(f.berangkat), jt = str(f.tiba), lewatHari = !!(jb && jt && jt < jb);
      var tD = terminal(f.terminalDari), tK = terminal(f.terminalKe);
      var tglB = tanggalBulan(f.tanggal);
      var tglT = f.tanggal ? tanggalBulan(lewatHari ? geserTanggal(f.tanggal, 1) : f.tanggal) : "";
      var tglBEn = tanggalBulanEn(f.tanggal);
      var tglTEn = f.tanggal ? tanggalBulanEn(lewatHari ? geserTanggal(f.tanggal, 1) : f.tanggal) : "";

      var durasiStr = hitungDurasi(jb, jt, dari, ke, lewatHari);
      var nonStopRute = (dari.kota && ke.kota) ? (dari.kota + " TO " + ke.kota).toUpperCase() : "";
      var aircraftOwner = (m.nama ? m.nama + (maskapaiKode ? ", " + maskapaiKode : "") : "").toUpperCase();
      var equipment = str(f.pesawat) || autoEquipment(maskapaiKode, dari, ke);

      return {
        asal: dari.kode, tujuan: ke.kode, kotaAsal: dari.kota, kotaTujuan: ke.kota,
        maskapai: m.nama, maskapaiKode: maskapaiKode, noPenerbangan: str(f.nomor).toUpperCase(),
        tanggal: tanggalJadwal(f.tanggal), jam: jamTerbang(jb, jt, tD, tK),
        kelas: str(f.kelas), bagasi: str(f.bagasi),
        // untuk desain sederhana (gaya penulisan tiket)
        no: String(i + 1),
        judul: [str(f.nomor).toUpperCase(), m.nama].filter(Boolean).join(" - "),
        hariTanggal: hariTanggalSingkat(f.tanggal),
        asalLengkap: bandaraLengkap(dari, tD), tujuanLengkap: bandaraLengkap(ke, tK),
        waktuBerangkat: [tglB, jb].filter(Boolean).join("  "),
        waktuTiba: jt ? [tglT, jt].filter(Boolean).join("  ") : "",
        // gaya tiket maskapai (GDS / Amadeus style)
        hariTanggalEn: hariTanggalEn(f.tanggal),
        waktuBerangkatEn: [tglBEn, jb].filter(Boolean).join("  "),
        waktuTibaEn: jt ? [tglTEn, jt].filter(Boolean).join("  ") : "",
        flightBookingRef: (maskapaiKode || "MH") + "/" + pnrCode,
        reservationConfirmed: "RESERVATION CONFIRMED, " + formatKelasTiket(f.kelas),
        durationLabel: "DURATION: " + durasiStr,
        meal: "MEAL",
        nonStopRute: nonStopRute,
        aircraftOwner: aircraftOwner,
        equipment: equipment.toUpperCase()
      };
    });

    var penumpang = (state.penumpang || []).filter(paxFilled).map(function (x, i) {
      var sapaan = str(x.sapaan);
      var namaTiket = formatNamaTiket(x.nama, sapaan);
      return {
        no: String(i + 1),
        nama: (sapaan ? sapaan + " " : "") + str(x.nama),
        namaTiket: namaTiket,
        tipe: str(x.tipe), tiket: str(x.tiket), harga: rupiah(num(x.harga)), hargaAngka: angka(num(x.harga))
      };
    });

    var firstF = penerbangan[0];
    var mainAirline = str(state.maskapaiAtas) || (firstF && firstF.maskapai) || "MALAYSIA AIRLINES";
    var originCity = (firstF && firstF.kotaAsal) || str(p.kota) || "SURABAYA";
    var officeCity = str(state.kantorAtas) || (originCity.toUpperCase() + " RES N TKTG");
    var dateEn = tanggalEn(state.tanggal);
    var paxTopList = penumpang.map(function (px) { return px.namaTiket; }).filter(Boolean);
    if (!paxTopList.length && state.pemesan && state.pemesan.nama) {
      var defSapaan = (state.penumpang && state.penumpang[0] && state.penumpang[0].sapaan) || "";
      paxTopList = [formatNamaTiket(state.pemesan.nama, defSapaan)];
    }
    if (!paxTopList.length) paxTopList = ["MANIN/ROKAYAH BT ROHMAN MRS"];

    var mainKode = (firstF && firstF.maskapaiKode) || "MH";
    var tktPrefix = TIKET_PREFIX[mainKode] || "232";
    var tiketList = penumpang.map(function (px) {
      var raw = str(px.tiket).replace(/[^0-9]/g, "");
      var tStr = "";
      if (raw.length >= 10) {
        if (raw.startsWith(tktPrefix)) tStr = tktPrefix + " " + raw.slice(tktPrefix.length);
        else tStr = tktPrefix + " " + raw;
      } else if (raw) {
        tStr = tktPrefix + " " + raw;
      } else {
        tStr = tktPrefix + " 5899282788";
      }
      return {
        tiketLengkap: "TICKET: " + mainKode + "/ETKT " + tStr + " FOR " + px.namaTiket
      };
    });
    if (!tiketList.length) {
      tiketList = [{
        tiketLengkap: "TICKET: " + mainKode + "/ETKT " + tktPrefix + " 5899282788 FOR " + paxTopList[0]
      }];
    }

    var kodeStatus = str(state.status);
    var ket = [];
    if (kodeStatus === "DP" && h.dp) ket.push("Dibayar " + rupiah(h.dp) + "   |   Sisa " + rupiah(h.sisa));
    if (str(state.catatan)) ket.push("Catatan: " + str(state.catatan));

    var rekening = [];
    (cfg.rekening || []).forEach(function (r, i) {
      rekening.push({ teks: str(r.bank) + "  " + str(r.nomor), tebal: true, spasiAtas: i ? 1.4 : 0 });
      if (str(r.atasNama)) rekening.push({ teks: "a.n. " + str(r.atasNama), warna: "#5A6B7E" });
    });

    var kontak = [p.telepon ? "Telp/WA " + p.telepon : "", str(p.email)].filter(Boolean).join("   |   ");
    var rekeningBaris = (cfg.rekening || []).map(function (r) {
      return [str(r.bank), str(r.nomor)].filter(Boolean).join(" ") + (str(r.atasNama) ? " a.n. " + str(r.atasNama) : "");
    });
    var penandatangan = str(p.penandatangan);
    var hpPemesan = str(state.pemesan && state.pemesan.hp);

    return {
      profil: { nama: str(p.nama), tagline: str(p.tagline), alamat: str(p.alamat), kontak: kontak, website: str(p.website) },
      nota: {
        nomor: str(state.nomor), tanggal: tanggalPanjang(state.tanggal),
        tanggalStempel: tanggalStempel(state.tanggal), tanggalSingkat: tanggalSingkat(state.tanggal)
      },
      pemesan: {
        nama: str(state.pemesan && state.pemesan.nama),
        hp: hpPemesan ? "Telp/WA " + hpPemesan : "",
        telepon: hpPemesan,
        email: str(state.pemesan && state.pemesan.email)
      },
      pnr: str(state.pnr).toUpperCase(),
      penerbangan: penerbangan,
      penumpang: penumpang,
      ringkasan: {
        subtotal: rupiah(h.subtotal),
        biayaLayanan: rupiah(h.biaya),
        diskon: h.diskon ? "- " + rupiah(h.diskon) : rupiah(0),
        total: rupiah(h.total),
        terbilang: terbilangRupiah(h.total),
        subtotalAngka: angka(h.subtotal),
        biayaAngka: angka(h.biaya),
        diskonAngka: h.diskon ? "-" + angka(h.diskon) : "0",
        totalAngka: angka(h.total)
      },
      pembayaran: {
        metode: str(state.metode),
        status: LABEL_STATUS[kodeStatus] || kodeStatus,
        kodeStatus: kodeStatus,
        warnaStatus: WARNA_STATUS[kodeStatus] || "#18283B",
        keterangan: ket.join("   |   ")
      },
      rekening: rekening,
      rekeningBaris: rekeningBaris,
      syarat: (cfg.syarat || []).map(str).filter(Boolean),
      ttd: {
        tempatTanggal: (str(p.kota) ? str(p.kota) + ", " : "") + tanggalPanjang(state.tanggal),
        nama: penandatangan,
        namaKurung: penandatangan ? "( " + penandatangan + " )" : "(" + new Array(27).join(".") + ")",
        jabatan: str(p.jabatan)
      },
      headerTiket: {
        mainAirline: mainAirline.toUpperCase(),
        officeCity: officeCity,
        dateEn: dateEn,
        penumpangTop: paxTopList
      },
      tiketList: tiketList,
      angka: h
    };
  }

  /* ------------------------------------------------------------------------
     5. Tata letak -> daftar operasi gambar (dipakai SVG & PDF)
     ------------------------------------------------------------------------ */
  // pesawat sederhana menghadap kanan, kotak 24 x 24
  var PLANE = "M22.6 12C22.6 11.2 21.8 10.9 20.6 10.9L15.2 10.9L9.6 3.4L7.4 3.4L10.4 10.9L5.4 10.9L3.4 7.6L1.9 7.6L2.9 11.3L1.4 12L2.9 12.7L1.9 16.4L3.4 16.4L5.4 13.1L10.4 13.1L7.4 20.6L9.6 20.6L15.2 13.1L20.6 13.1C21.8 13.1 22.6 12.8 22.6 12Z";

  function get(obj, path) {
    if (!path) return undefined;
    return String(path).split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  function alignX(x, w, rata) {
    if (rata === "kanan" || rata === "right") return x - w;
    if (rata === "tengah" || rata === "center") return x - w / 2;
    return x;
  }
  function spaced(m, text, size, bold, ls) {
    return m.width(text, size, bold) + (ls || 0) * Math.max(0, clean(text).length - 1);
  }
  function fit(raw, el, m, opt) {
    var text = clean(raw), size = el.ukuran || 8, ls = el.spasiHuruf || 0, bold = !!el.tebal;
    // hurufTetap (mis. desain mesin ketik): teks kepanjangan dipotong, ukuran huruf tidak diperkecil
    var min = el.ukuranMin || (opt && opt.hurufTetap ? size : Math.max(4.5, size * 0.75));
    if (el.lebarMaks) {
      while (spaced(m, text, size, bold, ls) > el.lebarMaks && size > min) size = Math.max(min, size - 0.25);
      if (spaced(m, text, size, bold, ls) > el.lebarMaks) {
        var t = text;
        while (t.length > 1 && spaced(m, t + "…", size, bold, ls) > el.lebarMaks) t = t.slice(0, -1);
        text = t.replace(/\s+$/, "") + "…";
      }
    }
    return { text: text, size: size, width: spaced(m, text, size, bold, ls) };
  }
  function textOp(m, x, y, size, text, bold, color, ls, opacity) {
    var op = { t: "text", x: x, y: y, s: size, text: text, bold: !!bold, color: color || "#000000", opacity: opacity == null ? 1 : opacity };
    if (ls) {
      op.ls = ls;
      var cw = m.charWidths(text, size, bold), xs = [], cx = x;
      for (var i = 0; i < cw.length; i++) { xs.push(cx); cx += cw[i] + ls; }
      op.xs = xs;
    }
    return op;
  }
  function wrap(text, size, bold, maxW, m) {
    var words = clean(text).split(/\s+/).filter(Boolean), lines = [], cur = "";
    words.forEach(function (w) {
      var test = cur ? cur + " " + w : w;
      if (!cur || m.width(test, size, bold) <= maxW) cur = test;
      else { lines.push(cur); cur = w; }
    });
    if (cur) lines.push(cur);
    return lines;
  }
  function ellipsizeLine(text, size, bold, maxW, m) {
    var t = text + "…";
    while (t.length > 1 && m.width(t, size, bold) > maxW) t = t.slice(0, -2).replace(/\s+$/, "") + "…";
    return t;
  }
  function textValue(v) { return v == null ? "" : String(v).trim(); }
  function initials(nama) {
    var words = clean(nama).replace(/[^A-Za-z0-9À-ÿ ]/g, " ").split(/\s+/).filter(Boolean);
    return words.slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join("");
  }

  var RENDER = {
    teks: function (el, vm, m, opt) {
      var raw = el.teks != null ? String(el.teks) : textValue(get(vm, el.isi)), ph = false;
      if (!raw && opt.editor) { raw = el.contoh || el.label || el.isi; ph = true; }
      if (el.kapital) raw = raw.toUpperCase();
      var size = el.ukuran || 8;
      var asc = m.ascent(size, !!el.tebal);
      var bw = el.lebarMaks || (raw ? spaced(m, clean(raw), size, !!el.tebal, el.spasiHuruf) : 20);
      var box = { x: alignX(el.x, bw, el.rata), y: el.y - asc, w: bw, h: asc + size * MM_PER_PT * 0.3 };
      if (!raw) return { box: box };
      var f = fit(raw, el, m, opt);
      var color = el.warnaDari ? get(vm, el.warnaDari) || el.warna : el.warna;
      return {
        ops: [textOp(m, alignX(el.x, f.width, el.rata), el.y, f.size, f.text, el.tebal, color, el.spasiHuruf, ph ? 0.4 : el.opasitas)],
        box: box
      };
    },

    paragraf: function (el, vm, m, opt) {
      var val = get(vm, el.isi), ph = false;
      var items = Array.isArray(val) ? val.map(function (v) { return typeof v === "string" ? { teks: v } : v; }) : textValue(val) ? [{ teks: textValue(val) }] : [];
      items = items.filter(function (it) { return textValue(it.teks); });
      if (!items.length && opt.editor) { items = [{ teks: el.label }]; ph = true; }
      if (el.kapital) items = items.map(function (it) { return Object.assign({}, it, { teks: String(it.teks).toUpperCase() }); });
      var size = el.ukuran || 7, lh = el.jarakBaris || size * MM_PER_PT * 1.4, maxW = el.lebarMaks || 100, maxL = el.maksBaris || 99;
      var lines = [], y = el.y;
      items.forEach(function (it) {
        if (lines.length && it.spasiAtas) y += it.spasiAtas;
        var bold = it.tebal != null ? !!it.tebal : !!el.tebal;
        wrap(it.teks, size, bold, maxW, m).forEach(function (ln) {
          lines.push({ text: ln, bold: bold, color: it.warna || el.warna, y: y });
          y += lh;
        });
      });
      if (lines.length > maxL) {
        lines = lines.slice(0, maxL);
        var last = lines[maxL - 1];
        last.text = ellipsizeLine(last.text, size, last.bold, maxW, m);
      }
      var asc = m.ascent(size, false);
      return {
        ops: lines.map(function (l) { return textOp(m, el.x, l.y, size, l.text, l.bold, l.color, 0, ph ? 0.4 : 1); }),
        box: { x: el.x, y: el.y - asc, w: maxW, h: (maxL - 1) * lh + asc + size * MM_PER_PT * 0.3 }
      };
    },

    daftar: function (el, vm, m, opt) {
      var items = (get(vm, el.isi) || []).map(textValue).filter(Boolean), ph = false;
      if (!items.length && opt.editor) { items = [el.label]; ph = true; }
      if (el.kapital) items = items.map(function (s) { return s.toUpperCase(); });
      var size = el.ukuran || 6.5, lh = el.jarakBaris || size * MM_PER_PT * 1.4, maxW = el.lebarMaks || 80;
      var maxL = el.maksBaris || 99, ind = el.indent == null ? 2.4 : el.indent, bullet = el.butir || "•";
      var all = [];
      items.forEach(function (it) {
        wrap(it, size, false, maxW - ind, m).forEach(function (ln, i) { all.push({ text: ln, first: i === 0 }); });
      });
      if (all.length > maxL) {
        all = all.slice(0, maxL);
        all[maxL - 1].text = ellipsizeLine(all[maxL - 1].text, size, false, maxW - ind, m);
      }
      var out = [], op = ph ? 0.4 : 1;
      all.forEach(function (l, i) {
        var y = el.y + i * lh;
        if (l.first) out.push(textOp(m, el.x, y, size, bullet, false, el.warna, 0, op));
        out.push(textOp(m, el.x + ind, y, size, l.text, false, el.warna, 0, op));
      });
      var asc = m.ascent(size, false);
      return { ops: out, box: { x: el.x, y: el.y - asc, w: maxW, h: (maxL - 1) * lh + asc + size * MM_PER_PT * 0.3 } };
    },

    tabel: function (el, vm, m, opt) {
      var rows = get(vm, el.sumber) || [], ph = false;
      if (!rows.length && opt.editor) {
        var r = {};
        (el.kolom || []).forEach(function (c) { if (c.isi) r[c.isi] = c.contoh || c.label || c.isi; });
        rows = [r]; ph = true;
      }
      var ops = [], maxR = el.maksBaris || rows.length;
      rows.slice(0, maxR).forEach(function (row, i) {
        var ry = el.y + i * el.tinggiBaris;
        (el.kolom || []).forEach(function (col) {
          if (col.jika && !textValue(row[col.jika]) && !ph) return;
          if (col.tipe === "rute") {
            if (row.asal && row.tujuan) ops.push.apply(ops, routeOps(el.x + col.dx, el.x + col.dx2, ry + col.dy, col, ph ? 0.4 : 1));
            return;
          }
          if (col.tipe === "garis") { ops.push(garisOp(m, el.x + col.dx, ry + col.dy, col, ph ? 0.4 : 1)); return; }
          var v = col.teks != null ? String(col.teks) : textValue(row[col.isi]);
          if (!v) return;
          if (col.kapital) v = v.toUpperCase();
          var f = fit(v, col, m, opt);
          ops.push(textOp(m, alignX(el.x + col.dx, f.width, col.rata), ry + col.dy, f.size, f.text, col.tebal, col.warna, col.spasiHuruf, ph ? 0.4 : 1));
        });
      });
      return { ops: ops, box: { x: el.x, y: el.y, w: el.lebar || 180, h: el.tinggiBaris * maxR } };
    },

    /** garis dari huruf berulang ("-", "- ", "="), khas nota ketikan */
    garis: function (el, vm, m) {
      var size = el.ukuran || 9, asc = m.ascent(size, false);
      return { ops: [garisOp(m, el.x, el.y, el, el.opasitas)], box: { x: el.x, y: el.y - asc, w: el.lebar || 100, h: asc + size * MM_PER_PT * 0.3 } };
    },

    logo: function (el, vm, m, opt) {
      var box = { x: el.x, y: el.y, w: el.w, h: el.h };
      var img = opt.images && opt.images.logo;
      if (img) return { ops: [{ t: "image", key: "logo", x: el.x, y: el.y, w: el.w, h: el.h, iw: img.width, ih: img.height }], box: box };
      var ini = initials(get(vm, "profil.nama") || "");
      if (!ini) return { box: box };
      var r = Math.min(el.w, el.h) / 2, cx = el.x + el.w / 2, cy = el.y + el.h / 2;
      var sizePt = r * (ini.length > 1 ? 0.92 : 1.12) * PT_PER_MM;
      var w = m.width(ini, sizePt, true), cap = m.capHeight(sizePt, true);
      return {
        ops: [
          { t: "circle", cx: cx, cy: cy, r: r, fill: el.warnaLatar || "#E0A526" },
          textOp(m, cx - w / 2, cy + cap / 2, sizePt, ini, true, el.warnaHuruf || "#1E3A5F", 0, 1)
        ],
        box: box
      };
    },

    stempel: function (el, vm, m, opt) {
      var gaya = el.gaya || {}, kode = textValue(get(vm, el.isi)), g = gaya[kode], ph = false;
      if (!g && opt.editor) { g = gaya[Object.keys(gaya)[0]]; ph = true; }
      var size = el.ukuran || 13, ls = el.spasiHuruf == null ? 0.6 : el.spasiHuruf;
      if (!g) return { box: { x: el.x - 18, y: el.y - 5.5, w: 36, h: 11 } };
      var txt = clean(g.teks), sub = textValue(get(vm, el.subIsi)), subSize = el.ukuranSub || 5.4;
      var w1 = spaced(m, txt, size, true, ls), w2 = sub ? spaced(m, sub, subSize, true, 0.3) : 0;
      var bw = Math.max(w1, w2) + 6.8, bh = sub ? 10.8 : 8.6, bx = el.x - bw / 2, by = el.y - bh / 2;
      var cap = m.capHeight(size, true);
      var base1 = sub ? by + 2.3 + cap : el.y + cap / 2;
      var color = g.warna || "#1E7B4F";
      var kids = [
        { t: "rect", x: bx, y: by, w: bw, h: bh, r: 1.6, stroke: color, sw: 0.55 },
        { t: "rect", x: bx + 0.95, y: by + 0.95, w: bw - 1.9, h: bh - 1.9, r: 1.0, stroke: color, sw: 0.22 },
        textOp(m, el.x - w1 / 2, base1, size, txt, true, color, ls, 1)
      ];
      if (sub) kids.push(textOp(m, el.x - w2 / 2, by + bh - 2.15, subSize, sub, true, color, 0.3, 1));
      return {
        ops: [{ t: "group", cx: el.x, cy: el.y, angle: el.sudut || 0, opacity: (el.opasitas || 0.86) * (ph ? 0.45 : 1), children: kids }],
        box: { x: bx, y: by, w: bw, h: bh }
      };
    }
  };

  function garisOp(m, x, y, spec, opacity) {
    var size = spec.ukuran || 9, pola = spec.pola || "-", w1 = m.width(pola, size, false) || 1;
    var n = Math.max(1, Math.floor((spec.lebar || 100) / w1 + 1e-6));
    var text = new Array(n + 1).join(pola).replace(/\s+$/, "");
    return textOp(m, x, y, size, text, !!spec.tebal, spec.warna || "#000000", 0, opacity == null ? 1 : opacity);
  }

  function routeOps(x1, x2, y, col, opacity) {
    var mid = (x1 + x2) / 2, gap = 2.15, ic = 3.3, c = col.warna || "#9EBEDD";
    return [
      { t: "circle", cx: x1, cy: y, r: 0.42, fill: c, opacity: opacity },
      { t: "line", x1: x1, y1: y, x2: mid - gap, y2: y, w: 0.3, color: c, opacity: opacity },
      { t: "line", x1: mid + gap, y1: y, x2: x2, y2: y, w: 0.3, color: c, opacity: opacity },
      { t: "circle", cx: x2, cy: y, r: 0.42, fill: c, opacity: opacity },
      { t: "path", d: PLANE, x: mid - ic / 2, y: y - ic / 2, scale: ic / 24, color: col.warnaIkon || "#1E3A5F", opacity: opacity }
    ];
  }

  function computeOps(vm, layout, m, opt) {
    opt = Object.assign({}, opt || {}, layout && layout.hurufTetap ? { hurufTetap: true } : {});
    var ops = [], boxes = [];
    var elems = (layout && layout.elemen) || [];

    // Tabel "susut": baris yang tidak terpakai dirapatkan, isian di bawahnya ikut naik.
    var susut = elems.filter(function (e) { return e.tipe === "tabel" && e.susut && !e.sembunyi; }).map(function (t) {
      var n = (get(vm, t.sumber) || []).length;
      if (!n && opt.editor) n = 1;
      var max = t.maksBaris || n;
      return { id: t.id, bawah: t.y + t.tinggiBaris * max, celah: Math.max(0, max - Math.min(n, max)) * t.tinggiBaris };
    });
    function geser(el) {
      var s = 0;
      susut.forEach(function (c) { if (c.id !== el.id && el.y >= c.bawah - 0.05) s += c.celah; });
      return s;
    }

    elems.forEach(function (el) {
      var fn = RENDER[el.tipe];
      if (!fn) return;
      var dy = geser(el), e = dy ? Object.assign({}, el, { y: el.y - dy }) : el;
      var syaratGagal = !!(el.jika && !textValue(get(vm, el.jika)));
      var res = el.sembunyi || (syaratGagal && !opt.editor) ? { box: null } : fn(e, vm, m, opt) || {};
      (res.ops || []).forEach(function (o) {
        o.id = el.id;
        if (syaratGagal) o.opacity = (o.opacity == null ? 1 : o.opacity) * 0.4;
        ops.push(o);
      });
      if (opt.editor) {
        var b = res.box || (fn(e, vm, m, { editor: true, images: opt.images }) || {}).box;
        if (b) boxes.push({ id: el.id, label: el.label || el.id, x: b.x, y: b.y, w: b.w, h: b.h, hidden: !!el.sembunyi });
      }
    });
    return { ops: ops, boxes: boxes };
  }

  /* ------------------------------------------------------------------------
     6. Render: SVG (pratinjau) dan PDF (unduhan)
     ------------------------------------------------------------------------ */
  function f3(v) { return String(Math.round(v * 1000) / 1000); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  function renderSvg(ops, opt) {
    opt = opt || {};
    function one(op, inh) {
      var o = (op.opacity == null ? 1 : op.opacity) * inh, op_ = o < 1 ? ' opacity="' + f3(o) + '"' : "";
      var id = op.id ? ' data-el="' + esc(op.id) + '"' : "";
      switch (op.t) {
        case "text":
          var xs = op.xs ? op.xs.map(f3).join(" ") : f3(op.x);
          return '<text x="' + xs + '" y="' + f3(op.y) + '" font-size="' + f3(op.s * MM_PER_PT) + '" font-weight="' + (op.bold ? 700 : 400) +
            '" fill="' + op.color + '"' + op_ + id + ">" + esc(clean(op.text)) + "</text>";
        case "line":
          return '<line x1="' + f3(op.x1) + '" y1="' + f3(op.y1) + '" x2="' + f3(op.x2) + '" y2="' + f3(op.y2) + '" stroke="' + op.color +
            '" stroke-width="' + f3(op.w) + '" stroke-linecap="round"' + op_ + id + "/>";
        case "circle":
          return '<circle cx="' + f3(op.cx) + '" cy="' + f3(op.cy) + '" r="' + f3(op.r) + '" fill="' + (op.fill || "none") + '"' +
            (op.stroke ? ' stroke="' + op.stroke + '" stroke-width="' + f3(op.sw || 0.3) + '"' : "") + op_ + id + "/>";
        case "rect":
          return '<rect x="' + f3(op.x) + '" y="' + f3(op.y) + '" width="' + f3(op.w) + '" height="' + f3(op.h) + '" rx="' + f3(op.r || 0) +
            '" fill="' + (op.fill || "none") + '"' + (op.stroke ? ' stroke="' + op.stroke + '" stroke-width="' + f3(op.sw || 0.3) + '"' : "") + op_ + id + "/>";
        case "path":
          return '<path d="' + op.d + '" transform="translate(' + f3(op.x) + " " + f3(op.y) + ") scale(" + f3(op.scale) + ')" fill="' + op.color + '"' + op_ + id + "/>";
        case "image":
          var src = opt.images && opt.images[op.key] && opt.images[op.key].url;
          return src ? '<image href="' + esc(src) + '" x="' + f3(op.x) + '" y="' + f3(op.y) + '" width="' + f3(op.w) + '" height="' + f3(op.h) +
            '" preserveAspectRatio="xMidYMid meet"' + id + "/>" : "";
        case "group":
          return '<g transform="rotate(' + f3(-op.angle) + " " + f3(op.cx) + " " + f3(op.cy) + ')"' + id + ">" +
            op.children.map(function (c) { return one(c, o); }).join("") + "</g>";
      }
      return "";
    }
    return ops.map(function (op) { return one(op, 1); }).join("");
  }

  function hexRgb(L, hex) {
    var h = String(hex || "#000000").replace("#", "");
    if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
    var n = parseInt(h, 16);
    return L.rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
  }
  function rrPath(w, h, r) {
    r = Math.max(0, Math.min(r || 0, w / 2, h / 2));
    if (!r) return "M0 0H" + w + "V" + h + "H0Z";
    var k = 0.5523 * r;
    return "M" + r + " 0H" + (w - r) + "C" + (w - r + k) + " 0 " + w + " " + (r - k) + " " + w + " " + r +
      "V" + (h - r) + "C" + w + " " + (h - r + k) + " " + (w - r + k) + " " + h + " " + (w - r) + " " + h +
      "H" + r + "C" + (r - k) + " " + h + " 0 " + (h - r + k) + " 0 " + (h - r) +
      "V" + r + "C0 " + (r - k) + " " + (r - k) + " 0 " + r + " 0Z";
  }
  function sniff(bytes) {
    var b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "pdf";
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
    if (b[0] === 0xff && b[1] === 0xd8) return "jpg";
    return "";
  }

  /**
   * ctx = { PDFLib, master: {bytes}, pageMm: [210, 297], fonts: {regular, bold} (NotaFont),
   *         images: { logo: {bytes} }, meta: {title, author, subject, creator} }
   */
  async function renderPdf(ops, ctx) {
    var L = ctx.PDFLib, doc = await L.PDFDocument.create(), page, box;
    var pageMm = ctx.pageMm || [210, 297];
    var type = ctx.master && ctx.master.bytes ? sniff(ctx.master.bytes) : "kosong";
    if (type === "kosong") {
      // tanpa desain master: halaman putih polos
      page = doc.addPage([pageMm[0] * PT_PER_MM, pageMm[1] * PT_PER_MM]);
      box = { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() };
    } else if (type === "pdf") {
      var src = await L.PDFDocument.load(ctx.master.bytes, { ignoreEncryption: true });
      var copied = await doc.copyPages(src, [0]);
      page = doc.addPage(copied[0]);
      box = page.getCropBox ? page.getCropBox() : page.getMediaBox();
    } else if (type === "png" || type === "jpg") {
      page = doc.addPage([pageMm[0] * PT_PER_MM, pageMm[1] * PT_PER_MM]);
      var bg = type === "png" ? await doc.embedPng(ctx.master.bytes) : await doc.embedJpg(ctx.master.bytes);
      page.drawImage(bg, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
      box = { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() };
    } else {
      throw new Error("File master harus PDF, PNG, atau JPG");
    }
    var sx = box.width / pageMm[0], sy = box.height / pageMm[1];
    function X(v) { return box.x + v * sx; }
    function Y(v) { return box.y + box.height - v * sy; }

    function pdfFont(f) { return f.standard ? doc.embedStandardFont(f.standard) : embedFont(doc, L, f); }
    var fonts = { regular: pdfFont(ctx.fonts.regular), bold: pdfFont(ctx.fonts.bold) };
    var logo = null;
    if (ctx.images && ctx.images.logo && ctx.images.logo.bytes) {
      var lt = sniff(ctx.images.logo.bytes);
      if (lt === "png") logo = await doc.embedPng(ctx.images.logo.bytes);
      else if (lt === "jpg") logo = await doc.embedJpg(ctx.images.logo.bytes);
    }

    function draw(op, inh) {
      var o = (op.opacity == null ? 1 : op.opacity) * inh;
      switch (op.t) {
        case "text":
          var txt = clean(op.text);
          if (!txt) return;
          if (op.ls) page.pushOperators(L.setCharacterSpacing(op.ls * sx));
          page.drawText(txt, { x: X(op.x), y: Y(op.y), size: op.s * (sx / PT_PER_MM), font: op.bold ? fonts.bold : fonts.regular, color: hexRgb(L, op.color), opacity: o });
          if (op.ls) page.pushOperators(L.setCharacterSpacing(0));
          return;
        case "line":
          page.drawLine({ start: { x: X(op.x1), y: Y(op.y1) }, end: { x: X(op.x2), y: Y(op.y2) }, thickness: op.w * sx, color: hexRgb(L, op.color), opacity: o, lineCap: L.LineCapStyle.Round });
          return;
        case "circle":
          page.drawCircle({
            x: X(op.cx), y: Y(op.cy), size: op.r * sx,
            color: op.fill ? hexRgb(L, op.fill) : undefined, opacity: o,
            borderColor: op.stroke ? hexRgb(L, op.stroke) : undefined, borderWidth: op.stroke ? (op.sw || 0.3) * sx : 0, borderOpacity: o
          });
          return;
        case "rect":
          page.drawSvgPath(rrPath(op.w * sx, op.h * sy, (op.r || 0) * sx), {
            x: X(op.x), y: Y(op.y),
            color: op.fill ? hexRgb(L, op.fill) : undefined, opacity: o,
            borderColor: op.stroke ? hexRgb(L, op.stroke) : undefined, borderWidth: op.stroke ? (op.sw || 0.3) * sx : 0, borderOpacity: o
          });
          return;
        case "path":
          page.drawSvgPath(op.d, { x: X(op.x), y: Y(op.y), scale: op.scale * sx, color: hexRgb(L, op.color), opacity: o });
          return;
        case "image":
          if (!logo) return;
          var s = Math.min(op.w / logo.width, op.h / logo.height), dw = logo.width * s, dh = logo.height * s;
          var dx = op.x + (op.w - dw) / 2, dy = op.y + (op.h - dh) / 2;
          page.drawImage(logo, { x: X(dx), y: Y(dy + dh), width: dw * sx, height: dh * sy, opacity: o });
          return;
        case "group":
          page.pushOperators(L.pushGraphicsState(), L.translate(X(op.cx), Y(op.cy)), L.rotateDegrees(op.angle || 0), L.translate(-X(op.cx), -Y(op.cy)));
          op.children.forEach(function (c) { draw(c, o); });
          page.pushOperators(L.popGraphicsState());
          return;
      }
    }
    ops.forEach(function (op) { draw(op, 1); });

    var meta = ctx.meta || {};
    if (meta.title) doc.setTitle(meta.title);
    if (meta.author) doc.setAuthor(meta.author);
    if (meta.subject) doc.setSubject(meta.subject);
    doc.setCreator(meta.creator || "Nota Tiket");
    doc.setProducer("Nota Tiket");
    doc.setCreationDate(new Date());
    doc.setModificationDate(new Date());
    return doc.save();
  }

  return {
    MM_PER_PT: MM_PER_PT, PT_PER_MM: PT_PER_MM, LAIN: LAIN,
    clean: clean, NotaFont: NotaFont, StandardFont: StandardFont, makeMeasure: makeMeasure, embedFont: embedFont,
    angka: angka, rupiah: rupiah, terbilang: terbilang, terbilangRupiah: terbilangRupiah,
    tanggalPanjang: tanggalPanjang, tanggalJadwal: tanggalJadwal,
    indexConfig: indexConfig, hitung: hitung, buildViewModel: buildViewModel,
    computeOps: computeOps, renderSvg: renderSvg, renderPdf: renderPdf, sniff: sniff
  };
});
