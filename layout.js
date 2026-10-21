/* ==========================================================================
   POSISI ISIAN DI ATAS DESAIN MASTER
   --------------------------------------------------------------------------
   Satuan: milimeter dari pojok KIRI-ATAS kertas A4 (210 x 297 mm).
   y pada teks = garis dasar huruf (baseline). Ukuran huruf dalam pt.
   File ini bisa dibuat ulang otomatis lewat tombol "Atur posisi" di aplikasi
   (lalu "Unduh layout.js") — tidak perlu mengedit angka satu per satu.
   ========================================================================== */

window.NOTA_LAYOUT = {
  elemen: [
    /* ---- Kop ------------------------------------------------------------- */
    { id: "logo", label: "Logo / monogram", tipe: "logo", x: 14, y: 9, w: 17, h: 17, warnaLatar: "#E0A526", warnaHuruf: "#1E3A5F" },
    { id: "profil-nama", label: "Nama usaha", tipe: "teks", isi: "profil.nama", x: 36, y: 15.6, ukuran: 15, tebal: true, warna: "#FFFFFF", lebarMaks: 92 },
    { id: "profil-tagline", label: "Tagline", tipe: "teks", isi: "profil.tagline", x: 36, y: 20.7, ukuran: 7.4, warna: "#A9C7E3", lebarMaks: 92 },
    { id: "profil-alamat", label: "Alamat usaha", tipe: "teks", isi: "profil.alamat", x: 36, y: 25.9, ukuran: 7, warna: "#D6E6F4", lebarMaks: 92 },
    { id: "profil-kontak", label: "Kontak usaha", tipe: "teks", isi: "profil.kontak", x: 36, y: 29.9, ukuran: 7, warna: "#D6E6F4", lebarMaks: 92 },

    /* ---- Pemesan, nomor nota, kode booking ------------------------------- */
    { id: "pemesan-nama", label: "Nama pemesan", tipe: "teks", isi: "pemesan.nama", x: 19, y: 68.2, ukuran: 10.5, tebal: true, warna: "#1E3A5F", lebarMaks: 76 },
    { id: "pemesan-hp", label: "No. HP pemesan", tipe: "teks", isi: "pemesan.hp", x: 19, y: 73.1, ukuran: 7.4, warna: "#36475A", lebarMaks: 76 },
    { id: "pemesan-email", label: "Email pemesan", tipe: "teks", isi: "pemesan.email", x: 19, y: 77.0, ukuran: 7, warna: "#5A6B7E", lebarMaks: 76 },
    { id: "nota-nomor", label: "No. nota", tipe: "teks", isi: "nota.nomor", x: 102, y: 67.4, ukuran: 9, tebal: true, warna: "#1E3A5F", lebarMaks: 45 },
    { id: "nota-tanggal", label: "Tanggal nota", tipe: "teks", isi: "nota.tanggal", x: 102, y: 77.0, ukuran: 9, tebal: true, warna: "#1E3A5F", lebarMaks: 45 },
    { id: "pnr", label: "Kode booking", contoh: "ABC123", tipe: "teks", isi: "pnr", x: 173, y: 71.4, ukuran: 18, tebal: true, warna: "#1E3A5F", rata: "tengah", lebarMaks: 40, spasiHuruf: 0.9 },

    /* ---- Tabel penerbangan (maks. 4 baris) -------------------------------- */
    { id: "tabel-penerbangan", label: "Tabel penerbangan", tipe: "tabel", sumber: "penerbangan",
      x: 14, y: 98, lebar: 182, tinggiBaris: 10.5, maksBaris: 4,
      kolom: [
        { isi: "asal", label: "Asal", contoh: "SUB", dx: 3, dy: 5.7, ukuran: 11, tebal: true, warna: "#1E3A5F", lebarMaks: 10 },
        { tipe: "rute", dx: 13.6, dx2: 24.2, dy: 4.15, warna: "#9EBEDD", warnaIkon: "#1E3A5F" },
        { isi: "tujuan", label: "Tujuan", contoh: "CGK", dx: 26, dy: 5.7, ukuran: 11, tebal: true, warna: "#1E3A5F", lebarMaks: 10 },
        { isi: "kotaAsal", label: "Kota asal", dx: 3, dy: 9.1, ukuran: 6.3, warna: "#5A6B7E", lebarMaks: 22 },
        { isi: "kotaTujuan", label: "Kota tujuan", dx: 26, dy: 9.1, ukuran: 6.3, warna: "#5A6B7E", lebarMaks: 24 },
        { isi: "maskapai", label: "Maskapai", dx: 54, dy: 5.1, ukuran: 8, tebal: true, warna: "#18283B", lebarMaks: 45 },
        { isi: "noPenerbangan", label: "No. penerbangan", dx: 54, dy: 8.9, ukuran: 6.8, warna: "#5A6B7E", lebarMaks: 45 },
        { isi: "tanggal", label: "Tanggal terbang", dx: 102, dy: 5.1, ukuran: 8, tebal: true, warna: "#18283B", lebarMaks: 37 },
        { isi: "jam", label: "Jam", dx: 102, dy: 8.9, ukuran: 6.8, warna: "#5A6B7E", lebarMaks: 37 },
        { isi: "kelas", label: "Kelas", dx: 141, dy: 5.1, ukuran: 7.6, warna: "#18283B", lebarMaks: 24 },
        { isi: "bagasi", label: "Bagasi", dx: 166, dy: 5.1, ukuran: 7.6, warna: "#18283B", lebarMaks: 16 }
      ] },

    /* ---- Tabel penumpang & harga (maks. 8 baris) ------------------------- */
    { id: "tabel-penumpang", label: "Tabel penumpang", tipe: "tabel", sumber: "penumpang",
      x: 14, y: 158, lebar: 182, tinggiBaris: 6.4, maksBaris: 8,
      kolom: [
        { isi: "no", label: "1", dx: 3, dy: 4.3, ukuran: 7.6, warna: "#5A6B7E" },
        { isi: "nama", label: "Nama penumpang", dx: 12, dy: 4.3, ukuran: 8, tebal: true, warna: "#18283B", lebarMaks: 78 },
        { isi: "tipe", label: "Tipe", dx: 92, dy: 4.3, ukuran: 7.6, warna: "#18283B", lebarMaks: 20 },
        { isi: "tiket", label: "No. tiket", dx: 114, dy: 4.3, ukuran: 7.6, warna: "#18283B", lebarMaks: 42 },
        { isi: "harga", label: "Rp 0", dx: 179, dy: 4.3, ukuran: 8, tebal: true, warna: "#18283B", rata: "kanan", lebarMaks: 26 }
      ] },

    /* ---- Ringkasan biaya ------------------------------------------------- */
    { id: "subtotal", label: "Subtotal", tipe: "teks", isi: "ringkasan.subtotal", x: 193, y: 217.6, ukuran: 8, warna: "#18283B", rata: "kanan", lebarMaks: 36 },
    { id: "biaya-layanan", label: "Biaya layanan", tipe: "teks", isi: "ringkasan.biayaLayanan", x: 193, y: 222.8, ukuran: 8, warna: "#18283B", rata: "kanan", lebarMaks: 36 },
    { id: "diskon", label: "Diskon", tipe: "teks", isi: "ringkasan.diskon", x: 193, y: 228.0, ukuran: 8, warna: "#18283B", rata: "kanan", lebarMaks: 36 },
    { id: "total", label: "Total bayar", tipe: "teks", isi: "ringkasan.total", x: 193, y: 239.6, ukuran: 13, tebal: true, warna: "#FFFFFF", rata: "kanan", lebarMaks: 44 },
    { id: "terbilang", label: "Terbilang", tipe: "paragraf", isi: "ringkasan.terbilang", x: 14, y: 222.4, ukuran: 8, warna: "#18283B", lebarMaks: 104, jarakBaris: 3.9, maksBaris: 2 },
    { id: "metode", label: "Metode pembayaran", tipe: "teks", isi: "pembayaran.metode", x: 14, y: 238.4, ukuran: 8, tebal: true, warna: "#18283B", lebarMaks: 48 },
    { id: "status", label: "Status pembayaran", tipe: "teks", isi: "pembayaran.status", warnaDari: "pembayaran.warnaStatus", x: 66, y: 238.4, ukuran: 8, tebal: true, warna: "#18283B", lebarMaks: 52 },
    { id: "keterangan", label: "Keterangan pembayaran", tipe: "teks", isi: "pembayaran.keterangan", x: 14, y: 243.4, ukuran: 6.8, warna: "#5A6B7E", lebarMaks: 104 },

    /* ---- Rekening, syarat, tanda tangan ---------------------------------- */
    { id: "rekening", label: "Rekening pembayaran", tipe: "paragraf", isi: "rekening", x: 14, y: 260.2, ukuran: 7.2, warna: "#18283B", lebarMaks: 52, jarakBaris: 3.55, maksBaris: 7 },
    { id: "syarat", label: "Syarat & ketentuan", tipe: "daftar", isi: "syarat", x: 70, y: 260.2, ukuran: 6.3, warna: "#36475A", lebarMaks: 76, jarakBaris: 3.0, maksBaris: 8, indent: 2.4 },
    { id: "tempat-tanggal", label: "Kota & tanggal", tipe: "teks", isi: "ttd.tempatTanggal", x: 174, y: 255.0, ukuran: 7, warna: "#5A6B7E", rata: "tengah", lebarMaks: 44 },
    { id: "stempel", label: "Stempel status", tipe: "stempel", isi: "pembayaran.kodeStatus", subIsi: "nota.tanggalStempel", x: 174, y: 267.6, sudut: 9, ukuran: 13, spasiHuruf: 0.7, opasitas: 0.86,
      gaya: {
        "LUNAS":       { teks: "LUNAS",       warna: "#1E7B4F" },
        "DP":          { teks: "DP",          warna: "#A86A00" },
        "BELUM LUNAS": { teks: "BELUM LUNAS", warna: "#B3261E" }
      } },
    { id: "ttd-nama", label: "Nama penanda tangan", tipe: "teks", isi: "ttd.nama", x: 174, y: 280.3, ukuran: 8, tebal: true, warna: "#1E3A5F", rata: "tengah", lebarMaks: 40 },
    { id: "ttd-jabatan", label: "Jabatan", tipe: "teks", isi: "ttd.jabatan", x: 174, y: 283.8, ukuran: 6.6, warna: "#5A6B7E", rata: "tengah", lebarMaks: 40 },

    /* ---- Kaki halaman ----------------------------------------------------- */
    { id: "website", label: "Website", tipe: "teks", isi: "profil.website", x: 196, y: 290.6, ukuran: 6.8, tebal: true, warna: "#1E3A5F", rata: "kanan", lebarMaks: 60 }
  ]
};
