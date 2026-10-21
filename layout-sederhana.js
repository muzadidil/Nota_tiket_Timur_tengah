/* ==========================================================================
   POSISI ISIAN — DESAIN SEDERHANA (hitam-putih, huruf mesin ketik Courier)
   --------------------------------------------------------------------------
   Desain ini tanpa gambar master: semua teks, termasuk label dan garis,
   ada di file ini. Satuan milimeter dari pojok kiri-atas A4; y = garis dasar
   huruf; ukuran huruf dalam pt. Satu huruf Courier 9 pt = 1,905 mm.
   Tabel bertanda susut:true merapat bila barisnya tidak terpakai, dan semua
   isian di bawahnya ikut naik.
   Bisa diatur ulang lewat tombol "Atur posisi" lalu "Unduh layout-sederhana.js".
   ========================================================================== */

window.NOTA_LAYOUT_SEDERHANA = {
  hurufTetap: true,
  elemen: [
    /* ---- Kop usaha (kiri) & keterangan nota (kanan) ----------------------- */
    { id: "s-nama", label: "Nama usaha", tipe: "teks", isi: "profil.nama", x: 14, y: 18, ukuran: 11, tebal: true, kapital: true, warna: "#000000", lebarMaks: 92 },
    { id: "s-tagline", label: "Tagline", tipe: "teks", isi: "profil.tagline", x: 14, y: 22.2, ukuran: 8.5, kapital: true, warna: "#000000", lebarMaks: 92 },
    { id: "s-alamat", label: "Alamat usaha", tipe: "teks", isi: "profil.alamat", x: 14, y: 26.2, ukuran: 8.5, kapital: true, warna: "#000000", lebarMaks: 92 },
    { id: "s-kontak", label: "Kontak usaha", tipe: "teks", isi: "profil.kontak", x: 14, y: 30.2, ukuran: 8.5, kapital: true, warna: "#000000", lebarMaks: 92 },
    { id: "s-judul", label: "Judul nota", tipe: "teks", teks: "NOTA PEMBELIAN TIKET PESAWAT", x: 109.25, y: 18, ukuran: 9.5, tebal: true, warna: "#000000" },
    { id: "s-lbl-nomor", label: "Label no. nota", tipe: "teks", teks: "NO. NOTA     :", x: 109.25, y: 22.2, ukuran: 9, warna: "#000000" },
    { id: "s-nomor", label: "No. nota", tipe: "teks", isi: "nota.nomor", x: 137.83, y: 22.2, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 58 },
    { id: "s-lbl-tanggal", label: "Label tanggal", tipe: "teks", teks: "TANGGAL      :", x: 109.25, y: 26.2, ukuran: 9, warna: "#000000" },
    { id: "s-tanggal", label: "Tanggal nota", tipe: "teks", isi: "nota.tanggalSingkat", x: 137.83, y: 26.2, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 58 },
    { id: "s-lbl-pnr", label: "Label kode booking", tipe: "teks", teks: "KODE BOOKING :", x: 109.25, y: 30.2, ukuran: 9, warna: "#000000" },
    { id: "s-pnr", label: "Kode booking", contoh: "ABC123", tipe: "teks", isi: "pnr", x: 137.83, y: 30.2, ukuran: 9, tebal: true, kapital: true, warna: "#000000", lebarMaks: 58 },
    { id: "s-garis-kop", label: "Garis bawah kop", tipe: "garis", pola: "=", x: 14, y: 34.5, lebar: 182, ukuran: 9, warna: "#000000" },

    /* ---- Pemesan ----------------------------------------------------------- */
    { id: "s-lbl-pemesan", label: "Label pemesan", tipe: "teks", teks: "PEMESAN :", x: 14, y: 40, ukuran: 9, warna: "#000000" },
    { id: "s-pemesan", label: "Nama pemesan", tipe: "teks", isi: "pemesan.nama", x: 33.05, y: 40, ukuran: 9, tebal: true, kapital: true, warna: "#000000", lebarMaks: 100 },
    { id: "s-lbl-hp", label: "Label telepon", tipe: "teks", teks: "TELP/WA :", jika: "pemesan.telepon", x: 14, y: 44, ukuran: 9, warna: "#000000" },
    { id: "s-hp", label: "Telepon pemesan", tipe: "teks", isi: "pemesan.telepon", x: 33.05, y: 44, ukuran: 9, warna: "#000000", lebarMaks: 100 },
    { id: "s-lbl-email", label: "Label email", tipe: "teks", teks: "EMAIL   :", jika: "pemesan.email", x: 14, y: 48, ukuran: 9, warna: "#000000" },
    { id: "s-email", label: "Email pemesan", tipe: "teks", isi: "pemesan.email", x: 33.05, y: 48, ukuran: 9, warna: "#000000", lebarMaks: 100 },

    /* ---- Penerbangan (satu blok per penerbangan, maks. 4) ------------------ */
    /* Baris blok: judul | BERANGKAT : KOTA, NEGARA (BANDARA), TERMINAL | TIBA | KELAS & BAGASI */
    { id: "s-lbl-terbang", label: "Judul penerbangan", tipe: "teks", teks: "PENERBANGAN", x: 14, y: 54.5, ukuran: 9, tebal: true, warna: "#000000" },
    { id: "s-garis-terbang", label: "Garis penerbangan", tipe: "garis", pola: "-", x: 14, y: 58.5, lebar: 182, ukuran: 9, warna: "#000000" },
    { id: "s-tabel-terbang", label: "Blok penerbangan", tipe: "tabel", sumber: "penerbangan", susut: true,
      x: 14, y: 58.5, lebar: 182, tinggiBaris: 20.5, maksBaris: 4,
      kolom: [
        { isi: "no", label: "1", dx: 0, dy: 4.5, ukuran: 9, tebal: true, warna: "#000000" },
        { isi: "judul", label: "No. penerbangan & maskapai", contoh: "MH 872 - MALAYSIA AIRLINES", dx: 5.72, dy: 4.5, ukuran: 9, tebal: true, kapital: true, warna: "#000000", lebarMaks: 140 },
        { isi: "hariTanggal", label: "Hari & tanggal", contoh: "RAB 04 NOV 2026", dx: 182, dy: 4.5, ukuran: 9, tebal: true, kapital: true, rata: "kanan", warna: "#000000", lebarMaks: 50 },
        { teks: "BERANGKAT :", dx: 5.72, dy: 8.4, ukuran: 9, warna: "#000000" },
        { isi: "asalLengkap", label: "Bandara asal", contoh: "SURABAYA, ID (JUANDA), TERMINAL 2", dx: 28.58, dy: 8.4, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 124 },
        { isi: "waktuBerangkat", label: "Waktu berangkat", contoh: "04 NOV  15:50", dx: 182, dy: 8.4, ukuran: 9, kapital: true, rata: "kanan", warna: "#000000", lebarMaks: 30 },
        { teks: "TIBA      :", dx: 5.72, dy: 12.3, ukuran: 9, warna: "#000000" },
        { isi: "tujuanLengkap", label: "Bandara tujuan", contoh: "KUALA LUMPUR, MY (KUALA LUMPUR INTL), TERMINAL 1", dx: 28.58, dy: 12.3, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 124 },
        { isi: "waktuTiba", label: "Waktu tiba", contoh: "04 NOV  19:30", dx: 182, dy: 12.3, ukuran: 9, kapital: true, rata: "kanan", warna: "#000000", lebarMaks: 30 },
        { teks: "KELAS     :", jika: "kelas", dx: 5.72, dy: 16.2, ukuran: 9, warna: "#000000" },
        { isi: "kelas", label: "Kelas", dx: 28.58, dy: 16.2, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 45 },
        { teks: "BAGASI :", jika: "bagasi", dx: 76.2, dy: 16.2, ukuran: 9, warna: "#000000" },
        { isi: "bagasi", label: "Bagasi", dx: 93.35, dy: 16.2, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 50 },
        { tipe: "garis", pola: "- ", dx: 0, dy: 19.8, lebar: 182, ukuran: 9, warna: "#000000" }
      ] },

    /* ---- Penumpang & harga (maks. 8) --------------------------------------- */
    { id: "s-lbl-pax", label: "Judul penumpang", tipe: "teks", teks: "PENUMPANG & HARGA", x: 14, y: 146.5, ukuran: 9, tebal: true, warna: "#000000" },
    { id: "s-garis-pax1", label: "Garis atas penumpang", tipe: "garis", pola: "-", x: 14, y: 150.5, lebar: 182, ukuran: 9, warna: "#000000" },
    { id: "s-h-no", label: "Kepala kolom no", tipe: "teks", teks: "NO", x: 14, y: 154.5, ukuran: 9, warna: "#000000" },
    { id: "s-h-nama", label: "Kepala kolom nama", tipe: "teks", teks: "NAMA PENUMPANG", x: 21.62, y: 154.5, ukuran: 9, warna: "#000000" },
    { id: "s-h-tipe", label: "Kepala kolom tipe", tipe: "teks", teks: "TIPE", x: 90.2, y: 154.5, ukuran: 9, warna: "#000000" },
    { id: "s-h-tiket", label: "Kepala kolom no. tiket", tipe: "teks", teks: "NO. TIKET", x: 109.25, y: 154.5, ukuran: 9, warna: "#000000" },
    { id: "s-h-harga", label: "Kepala kolom harga", tipe: "teks", teks: "HARGA (RP)", x: 196, y: 154.5, ukuran: 9, rata: "kanan", warna: "#000000" },
    { id: "s-garis-pax2", label: "Garis kepala kolom", tipe: "garis", pola: "-", x: 14, y: 158.5, lebar: 182, ukuran: 9, warna: "#000000" },
    { id: "s-tabel-pax", label: "Baris penumpang", tipe: "tabel", sumber: "penumpang", susut: true,
      x: 14, y: 158.5, lebar: 182, tinggiBaris: 4, maksBaris: 8,
      kolom: [
        { isi: "no", label: "1", dx: 0, dy: 4, ukuran: 9, warna: "#000000" },
        { isi: "nama", label: "Nama penumpang", dx: 7.62, dy: 4, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 66.7 },
        { isi: "tipe", label: "Tipe", dx: 76.2, dy: 4, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 17.1 },
        { isi: "tiket", label: "No. tiket", dx: 95.25, dy: 4, ukuran: 9, warna: "#000000", lebarMaks: 40 },
        { isi: "hargaAngka", label: "0", dx: 182, dy: 4, ukuran: 9, rata: "kanan", warna: "#000000", lebarMaks: 30 }
      ] },
    { id: "s-garis-pax3", label: "Garis bawah penumpang", tipe: "garis", pola: "-", x: 14, y: 194.5, lebar: 182, ukuran: 9, warna: "#000000" },

    /* ---- Pembayaran (kiri) & total (kanan) --------------------------------- */
    { id: "s-lbl-metode", label: "Label metode", tipe: "teks", teks: "PEMBAYARAN :", x: 14, y: 199, ukuran: 9, warna: "#000000" },
    { id: "s-metode", label: "Metode pembayaran", tipe: "teks", isi: "pembayaran.metode", x: 38.77, y: 199, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 76 },
    { id: "s-lbl-status", label: "Label status", tipe: "teks", teks: "STATUS     :", x: 14, y: 203, ukuran: 9, warna: "#000000" },
    { id: "s-status", label: "Status pembayaran", tipe: "teks", isi: "pembayaran.status", x: 38.77, y: 203, ukuran: 9, tebal: true, kapital: true, warna: "#000000", lebarMaks: 76 },
    { id: "s-keterangan", label: "Keterangan pembayaran", tipe: "paragraf", isi: "pembayaran.keterangan", x: 14, y: 207, ukuran: 8, kapital: true, warna: "#000000", lebarMaks: 100, jarakBaris: 3.6, maksBaris: 2 },
    { id: "s-lbl-subtotal", label: "Label subtotal", tipe: "teks", teks: "SUBTOTAL TIKET", x: 118.78, y: 199, ukuran: 9, warna: "#000000" },
    { id: "s-subtotal", label: "Subtotal", tipe: "teks", isi: "ringkasan.subtotalAngka", x: 196, y: 199, ukuran: 9, rata: "kanan", warna: "#000000", lebarMaks: 40 },
    { id: "s-lbl-biaya", label: "Label biaya layanan", tipe: "teks", teks: "BIAYA LAYANAN", x: 118.78, y: 203, ukuran: 9, warna: "#000000" },
    { id: "s-biaya", label: "Biaya layanan", tipe: "teks", isi: "ringkasan.biayaAngka", x: 196, y: 203, ukuran: 9, rata: "kanan", warna: "#000000", lebarMaks: 40 },
    { id: "s-lbl-diskon", label: "Label diskon", tipe: "teks", teks: "DISKON", x: 118.78, y: 207, ukuran: 9, warna: "#000000" },
    { id: "s-diskon", label: "Diskon", tipe: "teks", isi: "ringkasan.diskonAngka", x: 196, y: 207, ukuran: 9, rata: "kanan", warna: "#000000", lebarMaks: 40 },
    { id: "s-garis-total", label: "Garis total", tipe: "garis", pola: "-", x: 118.78, y: 211, lebar: 77.22, ukuran: 9, warna: "#000000" },
    { id: "s-lbl-total", label: "Label total", tipe: "teks", teks: "TOTAL BAYAR (RP)", x: 118.78, y: 215.5, ukuran: 9, tebal: true, warna: "#000000" },
    { id: "s-total", label: "Total bayar", tipe: "teks", isi: "ringkasan.totalAngka", x: 196, y: 215.5, ukuran: 10, tebal: true, rata: "kanan", warna: "#000000", lebarMaks: 40 },
    { id: "s-lbl-terbilang", label: "Label terbilang", tipe: "teks", teks: "TERBILANG :", x: 14, y: 221.5, ukuran: 9, warna: "#000000" },
    { id: "s-terbilang", label: "Terbilang", tipe: "paragraf", isi: "ringkasan.terbilang", x: 36.86, y: 221.5, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 159, jarakBaris: 4, maksBaris: 2 },
    { id: "s-garis-bawah", label: "Garis bawah", tipe: "garis", pola: "=", x: 14, y: 230.5, lebar: 182, ukuran: 9, warna: "#000000" },

    /* ---- Rekening, tanda tangan, syarat ------------------------------------ */
    { id: "s-lbl-rekening", label: "Label rekening", tipe: "teks", teks: "PEMBAYARAN KE :", x: 14, y: 236.5, ukuran: 9, tebal: true, warna: "#000000" },
    { id: "s-rekening", label: "Rekening pembayaran", tipe: "paragraf", isi: "rekeningBaris", x: 14, y: 240.5, ukuran: 8.5, kapital: true, warna: "#000000", lebarMaks: 115, jarakBaris: 4, maksBaris: 4 },
    { id: "s-tempat", label: "Kota & tanggal", tipe: "teks", isi: "ttd.tempatTanggal", x: 135.92, y: 236.5, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 60 },
    { id: "s-hormat", label: "Hormat kami", tipe: "teks", teks: "HORMAT KAMI,", x: 135.92, y: 240.5, ukuran: 9, warna: "#000000" },
    { id: "s-ttd-nama", label: "Nama penanda tangan", tipe: "teks", isi: "ttd.namaKurung", x: 135.92, y: 254.5, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 60 },
    { id: "s-ttd-jabatan", label: "Jabatan", tipe: "teks", isi: "ttd.jabatan", x: 135.92, y: 258.5, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 60 },
    { id: "s-lbl-syarat", label: "Label syarat", tipe: "teks", teks: "SYARAT & KETENTUAN :", x: 14, y: 265, ukuran: 8, tebal: true, warna: "#000000" },
    { id: "s-syarat", label: "Syarat & ketentuan", tipe: "daftar", isi: "syarat", x: 14, y: 269, ukuran: 7.5, kapital: true, warna: "#000000", lebarMaks: 182, jarakBaris: 3.4, maksBaris: 6, butir: "-", indent: 3.2 }
  ]
};
