/* ==========================================================================
   KONFIGURASI NOTA TIKET PESAWAT
   --------------------------------------------------------------------------
   Semua data master ada di file ini (tanpa database).
   Ubah teks di antara tanda kutip, simpan, lalu upload ulang ke GitHub.
   Posisi isian di atas desain master ada di file layout.js.
   ========================================================================== */

window.NOTA_CONFIG = {

  /* ---- Identitas usaha (tampil di kop nota) ------------------------------ */
  profil: {
    nama: "ALFARISY",
    tagline: "Tiket pesawat domestik & internasional",
    alamat: "Jl. Alamat Usaha No. 00, Kota",
    telepon: "0812-0000-0000",          // tampil sebagai "Telp/WA ..."
    email: "",                          // kosongkan bila tidak dipakai
    website: "tiket.zasha.online",
    logo: "",                           // contoh: "assets/logo.png" (PNG/JPG). Kosong = monogram otomatis
    kota: "",                           // untuk baris tanda tangan, contoh: "Jakarta"
    penandatangan: "",                  // nama di bawah tanda tangan (boleh kosong untuk ditulis tangan)
    jabatan: "Admin Reservasi"
  },

  /* ---- Pengaturan nota --------------------------------------------------- */
  nota: {
    prefix: "ALF",                      // nomor otomatis: ALF-YYMMDD-JJMM
    maksPenerbangan: 4,                 // sesuai jumlah baris di desain master
    maksPenumpang: 8,
    namaFile: "Nota Tiket"              // awal nama file PDF yang diunduh
  },

  /* ---- Rekening pembayaran (tampil di bagian "Pembayaran ke") ------------ */
  rekening: [
    { bank: "BCA",     nomor: "000-000-0000",      atasNama: "Nama Pemilik Rekening" },
    { bank: "Mandiri", nomor: "000-00-0000000-0",  atasNama: "Nama Pemilik Rekening" }
  ],

  /* ---- Syarat & ketentuan ------------------------------------------------ */
  syarat: [
    "Harga sudah termasuk pajak bandara dan biaya yang ditetapkan maskapai.",
    "Perubahan jadwal, nama, atau pembatalan mengikuti aturan maskapai dan dapat dikenai biaya.",
    "Pastikan nama penumpang sama dengan KTP/paspor.",
    "Disarankan tiba di bandara 2 jam sebelum keberangkatan domestik dan 3 jam untuk internasional.",
    "Simpan nota ini sebagai bukti transaksi."
  ],

  /* ---- Dropdown: maskapai ------------------------------------------------ */
  /* Rute: Indonesia - transit (Malaysia, Singapura, Brunei, China, dll.)      */
  /*       - Timur Tengah. kode = kode IATA, mengisi awal nomor penerbangan.   */
  maskapai: [
    { grup: "Indonesia", daftar: [
      { kode: "GA", nama: "Garuda Indonesia" },
      { kode: "JT", nama: "Lion Air" },
      { kode: "ID", nama: "Batik Air" },
      { kode: "QG", nama: "Citilink" },
      { kode: "QZ", nama: "Indonesia AirAsia" }
    ]},
    { grup: "Malaysia, Singapura, Brunei", daftar: [
      { kode: "MH", nama: "Malaysia Airlines" },
      { kode: "OD", nama: "Batik Air Malaysia" },
      { kode: "AK", nama: "AirAsia" },
      { kode: "D7", nama: "AirAsia X" },
      { kode: "SQ", nama: "Singapore Airlines" },
      { kode: "TR", nama: "Scoot" },
      { kode: "BI", nama: "Royal Brunei Airlines" }
    ]},
    { grup: "China", daftar: [
      { kode: "CZ", nama: "China Southern Airlines" },
      { kode: "MU", nama: "China Eastern Airlines" },
      { kode: "CA", nama: "Air China" },
      { kode: "HU", nama: "Hainan Airlines" },
      { kode: "MF", nama: "Xiamen Airlines" }
    ]},
    { grup: "Timur Tengah", daftar: [
      { kode: "SV", nama: "Saudia" },
      { kode: "XY", nama: "flynas" },
      { kode: "F3", nama: "flyadeal" },
      { kode: "QR", nama: "Qatar Airways" },
      { kode: "EK", nama: "Emirates" },
      { kode: "EY", nama: "Etihad Airways" },
      { kode: "FZ", nama: "flydubai" },
      { kode: "WY", nama: "Oman Air" },
      { kode: "GF", nama: "Gulf Air" },
      { kode: "KU", nama: "Kuwait Airways" },
      { kode: "RJ", nama: "Royal Jordanian" },
      { kode: "MS", nama: "EgyptAir" },
      { kode: "TK", nama: "Turkish Airlines" }
    ]},
    { grup: "Transit lainnya", daftar: [
      { kode: "PR", nama: "Philippine Airlines" },
      { kode: "UL", nama: "SriLankan Airlines" },
      { kode: "6E", nama: "IndiGo" },
      { kode: "ET", nama: "Ethiopian Airlines" }
    ]}
  ],

  /* ---- Dropdown: bandara ------------------------------------------------- */
  /* Ditulis di nota seperti tiket: KOTA, NEGARA (NAMA BANDARA), TERMINAL X    */
  /* negara = kode negara 2 huruf (ID, MY, SG, BN, CN, SA, QA, AE, ...)        */
  bandara: [
    { grup: "Indonesia", daftar: [
      { kode: "SUB", kota: "Surabaya",           negara: "ID", nama: "Juanda" },
      { kode: "CGK", kota: "Jakarta",            negara: "ID", nama: "Soekarno-Hatta Intl" },
      { kode: "KJT", kota: "Majalengka",         negara: "ID", nama: "Kertajati Intl" },
      { kode: "SOC", kota: "Solo",               negara: "ID", nama: "Adi Soemarmo Intl" },
      { kode: "YIA", kota: "Yogyakarta",         negara: "ID", nama: "Yogyakarta Intl" },
      { kode: "SRG", kota: "Semarang",           negara: "ID", nama: "Ahmad Yani Intl" },
      { kode: "DPS", kota: "Denpasar Bali",      negara: "ID", nama: "Ngurah Rai Intl" },
      { kode: "LOP", kota: "Lombok",             negara: "ID", nama: "Lombok Intl" },
      { kode: "UPG", kota: "Makassar",           negara: "ID", nama: "Sultan Hasanuddin Intl" },
      { kode: "BPN", kota: "Balikpapan",         negara: "ID", nama: "Sepinggan Intl" },
      { kode: "BDJ", kota: "Banjarmasin",        negara: "ID", nama: "Syamsudin Noor Intl" },
      { kode: "KNO", kota: "Medan",              negara: "ID", nama: "Kualanamu Intl" },
      { kode: "BTJ", kota: "Banda Aceh",         negara: "ID", nama: "Sultan Iskandar Muda Intl" },
      { kode: "PDG", kota: "Padang",             negara: "ID", nama: "Minangkabau Intl" },
      { kode: "PKU", kota: "Pekanbaru",          negara: "ID", nama: "Sultan Syarif Kasim II Intl" },
      { kode: "BTH", kota: "Batam",              negara: "ID", nama: "Hang Nadim Intl" },
      { kode: "PLM", kota: "Palembang",          negara: "ID", nama: "Sultan Mahmud Badaruddin II Intl" },
      { kode: "MDC", kota: "Manado",             negara: "ID", nama: "Sam Ratulangi Intl" }
    ]},
    { grup: "Transit: Malaysia, Singapura, Brunei", daftar: [
      { kode: "KUL", kota: "Kuala Lumpur",       negara: "MY", nama: "Kuala Lumpur Intl" },
      { kode: "PEN", kota: "Penang",             negara: "MY", nama: "Penang Intl" },
      { kode: "SIN", kota: "Singapore",          negara: "SG", nama: "Changi" },
      { kode: "BWN", kota: "Bandar Seri Begawan", negara: "BN", nama: "Brunei Intl" }
    ]},
    { grup: "Transit: China", daftar: [
      { kode: "CAN", kota: "Guangzhou",          negara: "CN", nama: "Baiyun Intl" },
      { kode: "SZX", kota: "Shenzhen",           negara: "CN", nama: "Bao'an Intl" },
      { kode: "XMN", kota: "Xiamen",             negara: "CN", nama: "Gaoqi Intl" },
      { kode: "HAK", kota: "Haikou",             negara: "CN", nama: "Meilan Intl" },
      { kode: "PVG", kota: "Shanghai",           negara: "CN", nama: "Pudong Intl" },
      { kode: "PKX", kota: "Beijing",            negara: "CN", nama: "Daxing Intl" },
      { kode: "PEK", kota: "Beijing",            negara: "CN", nama: "Capital Intl" }
    ]},
    { grup: "Transit lainnya", daftar: [
      { kode: "MNL", kota: "Manila",             negara: "PH", nama: "Ninoy Aquino Intl" },
      { kode: "CMB", kota: "Colombo",            negara: "LK", nama: "Bandaranaike Intl" },
      { kode: "BOM", kota: "Mumbai",             negara: "IN", nama: "Chhatrapati Shivaji Maharaj Intl" },
      { kode: "DEL", kota: "Delhi",              negara: "IN", nama: "Indira Gandhi Intl" },
      { kode: "ADD", kota: "Addis Ababa",        negara: "ET", nama: "Bole Intl" }
    ]},
    { grup: "Arab Saudi", daftar: [
      { kode: "JED", kota: "Jeddah",             negara: "SA", nama: "King Abdulaziz Intl" },
      { kode: "MED", kota: "Madinah",            negara: "SA", nama: "Prince Mohammad Bin Abdulaziz Intl" },
      { kode: "RUH", kota: "Riyadh",             negara: "SA", nama: "King Khalid Intl" },
      { kode: "DMM", kota: "Dammam",             negara: "SA", nama: "King Fahd Intl" },
      { kode: "TIF", kota: "Taif",               negara: "SA", nama: "Taif Intl" },
      { kode: "HAS", kota: "Hail",               negara: "SA", nama: "Hail International" },
      { kode: "AHB", kota: "Abha",               negara: "SA", nama: "Abha Intl" },
      { kode: "TUU", kota: "Tabuk",              negara: "SA", nama: "Prince Sultan Bin Abdulaziz" },
      { kode: "ELQ", kota: "Gassim",             negara: "SA", nama: "Prince Naif Bin Abdulaziz Intl" },
      { kode: "YNB", kota: "Yanbu",              negara: "SA", nama: "Prince Abdul Mohsin Bin Abdulaziz" },
      { kode: "GIZ", kota: "Jazan",              negara: "SA", nama: "King Abdullah Bin Abdulaziz" },
      { kode: "ULH", kota: "AlUla",              negara: "SA", nama: "AlUla Intl" }
    ]},
    { grup: "Teluk & Timur Tengah lainnya", daftar: [
      { kode: "DOH", kota: "Doha",               negara: "QA", nama: "Hamad International" },
      { kode: "DXB", kota: "Dubai",              negara: "AE", nama: "Dubai Intl" },
      { kode: "AUH", kota: "Abu Dhabi",          negara: "AE", nama: "Zayed Intl" },
      { kode: "SHJ", kota: "Sharjah",            negara: "AE", nama: "Sharjah Intl" },
      { kode: "MCT", kota: "Muscat",             negara: "OM", nama: "Muscat Intl" },
      { kode: "KWI", kota: "Kuwait",             negara: "KW", nama: "Kuwait Intl" },
      { kode: "BAH", kota: "Bahrain",            negara: "BH", nama: "Bahrain Intl" },
      { kode: "AMM", kota: "Amman",              negara: "JO", nama: "Queen Alia Intl" },
      { kode: "CAI", kota: "Cairo",              negara: "EG", nama: "Cairo Intl" },
      { kode: "IST", kota: "Istanbul",           negara: "TR", nama: "Istanbul Airport" }
    ]}
  ],

  /* ---- Dropdown lainnya -------------------------------------------------- */
  kelas: ["Ekonomi", "Premium Ekonomi", "Bisnis", "First"],
  bagasi: ["Tanpa bagasi", "Kabin 7 kg", "15 kg", "20 kg", "25 kg", "30 kg", "35 kg", "40 kg", "2 x 23 kg"],
  sapaan: ["Tn.", "Ny.", "Nn.", "An.", "Bayi"],
  tipePenumpang: ["Dewasa", "Anak", "Bayi"],
  metodeBayar: ["Transfer Bank", "Tunai", "QRIS", "Kartu Debit", "Kartu Kredit", "Dompet Digital"],
  statusBayar: ["LUNAS", "DP", "BELUM LUNAS"],

  /* ---- Pilihan desain nota ------------------------------------------------ */
  /* Setiap desain punya master (gambar nota kosong), font, dan file posisi.    */
  /* master.file   : PDF atau PNG/JPG ukuran A4; null = kertas putih polos      */
  /* master.preview: gambar PNG/JPG untuk pratinjau di layar (wajib bila PDF)   */
  /* font          : file .ttf, atau standar: "Courier" (huruf mesin ketik)     */
  kertasMm: [210, 297],
  desainAwal: "berwarna",
  desain: [
    {
      id: "berwarna",
      nama: "Berwarna",
      keterangan: "Untuk PDF dan WhatsApp",
      master: { file: "master/master-nota.pdf", preview: "master/master-nota.png" },
      font: { regular: "fonts/Poppins-Regular.ttf", bold: "fonts/Poppins-Bold.ttf" },
      layout: "NOTA_LAYOUT",
      fileLayout: "layout.js"
    },
    {
      id: "sederhana",
      nama: "E-Ticket",
      keterangan: "Format tiket maskapai, tanpa kop",
      master: null,
      font: { standar: "Courier", standarTebal: "Courier-Bold" },
      layout: "NOTA_LAYOUT_SEDERHANA",
      fileLayout: "layout-sederhana.js"
    }
  ]
};
