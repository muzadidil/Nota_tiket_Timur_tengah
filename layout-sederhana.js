/* ==========================================================================
   POSISI ISIAN — DESAIN BIASA (Format E-Ticket / Itinerary Maskapai)
   --------------------------------------------------------------------------
   Format tiket maskapai resmi (GDS / Amadeus style) tanpa kop usaha:
   - Kertas: A4 (210 x 297 mm), gaya huruf mesin ketik monospaced (Courier).
   - Penamaan penumpang format standar tiket: SURNAME/GIVEN TITLE.
   - Blok penerbangan otomatis merapat (susut) bila rute kurang dari 4.
   ========================================================================== */

window.NOTA_LAYOUT_SEDERHANA = {
  hurufTetap: true,
  elemen: [
    /* ---- Header: Maskapai & Kantor (kiri) | Booking Ref, Tanggal, Penumpang (kanan) ---- */
    { id: "s-airline", label: "Maskapai utama", tipe: "teks", isi: "headerTiket.mainAirline", x: 24, y: 25, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 75 },
    { id: "s-office", label: "Kantor reservasi", tipe: "teks", isi: "headerTiket.officeCity", x: 24, y: 29.2, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 75 },

    { id: "s-pnr-lbl", label: "Label booking ref", tipe: "teks", teks: "BOOKING REF:", x: 107.82, y: 25, ukuran: 9, warna: "#000000" },
    { id: "s-pnr-val", label: "Kode booking", tipe: "teks", isi: "pnr", x: 132.58, y: 25, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 40 },

    { id: "s-date-lbl", label: "Label tanggal", tipe: "teks", teks: "DATE:       ", x: 107.82, y: 29.2, ukuran: 9, warna: "#000000" },
    { id: "s-date-val", label: "Tanggal tiket", tipe: "teks", isi: "headerTiket.dateEn", x: 132.58, y: 29.2, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 40 },

    { id: "s-pax-top", label: "Nama penumpang atas", tipe: "paragraf", isi: "headerTiket.penumpangTop", x: 132.58, y: 33.4, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 65, jarakBaris: 4.2, maksBaris: 4 },

    /* ---- Blok Penerbangan (Maks. 4, dengan susut dinamis) ----------------- */
    { id: "s-tabel-terbang", label: "Blok penerbangan", tipe: "tabel", sumber: "penerbangan", susut: true,
      x: 24, y: 47, lebar: 146.685, tinggiBaris: 46.5, maksBaris: 4,
      kolom: [
        /* Baris 1: FLIGHT   MH 872 - MALAYSIA AIRLINES             SUN 18 OCT 2026 */
        { teks: "FLIGHT", dx: 0, dy: 3.5, ukuran: 9, warna: "#000000" },
        { isi: "judul", dx: 24.765, dy: 3.5, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 85 },
        { isi: "hariTanggalEn", dx: 146.685, dy: 3.5, ukuran: 9, kapital: true, rata: "kanan", warna: "#000000", lebarMaks: 40 },

        /* Baris 2: Garis solid --------------------------------------------- */
        { tipe: "garis", pola: "-", dx: 0, dy: 7.3, lebar: 146.685, ukuran: 9, warna: "#000000" },

        /* Baris 3: DEPARTURE: SURABAYA, ID (JUANDA), TERMINAL 2    18 OCT  15:50 */
        { teks: "DEPARTURE:", dx: 0, dy: 11.1, ukuran: 9, warna: "#000000" },
        { isi: "asalLengkap", dx: 24.765, dy: 11.1, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 90 },
        { isi: "waktuBerangkatEn", dx: 146.685, dy: 11.1, ukuran: 9, kapital: true, rata: "kanan", warna: "#000000", lebarMaks: 32 },

        /* Baris 4: ARRIVAL:   KUALA LUMPUR, MY (KUALA LUMPUR INTL) 18 OCT  19:30 */
        { teks: "ARRIVAL:", dx: 0, dy: 14.9, ukuran: 9, warna: "#000000" },
        { isi: "tujuanLengkap", dx: 24.765, dy: 14.9, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 90 },
        { isi: "waktuTibaEn", dx: 146.685, dy: 14.9, ukuran: 9, kapital: true, rata: "kanan", warna: "#000000", lebarMaks: 32 },

        /* Baris 5: FLIGHT BOOKING REF: MH/FD7B5U */
        { teks: "FLIGHT BOOKING REF:", dx: 24.765, dy: 18.7, ukuran: 9, warna: "#000000" },
        { isi: "flightBookingRef", dx: 62.865, dy: 18.7, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 45 },

        /* Baris 6: RESERVATION CONFIRMED, ECONOMY (O)           DURATION: 02:40 */
        { isi: "reservationConfirmed", dx: 24.765, dy: 22.5, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 85 },
        { isi: "durationLabel", dx: 146.685, dy: 22.5, ukuran: 9, kapital: true, rata: "kanan", warna: "#000000", lebarMaks: 35 },

        /* Baris 7: Garis putus-putus - - - - - - - - - - - - - - - - - - - - */
        { tipe: "garis", pola: "- ", dx: 0, dy: 26.3, lebar: 146.685, ukuran: 9, warna: "#000000" },

        /* Baris 8: MEAL:                                        MEAL */
        { teks: "MEAL:", dx: 24.765, dy: 30.1, ukuran: 9, warna: "#000000" },
        { isi: "meal", dx: 83.82, dy: 30.1, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 45 },

        /* Baris 9: NON STOP   SURABAYA TO KUALA LUMPUR */
        { teks: "NON STOP", dx: 0, dy: 33.9, ukuran: 9, warna: "#000000" },
        { isi: "nonStopRute", dx: 24.765, dy: 33.9, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 90 },

        /* Baris 10: AIRCRAFT OWNER:                             MALAYSIA AIRLINES, MH */
        { teks: "AIRCRAFT OWNER:", dx: 24.765, dy: 37.7, ukuran: 9, warna: "#000000" },
        { isi: "aircraftOwner", dx: 83.82, dy: 37.7, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 60 },

        /* Baris 11: EQUIPMENT:                                  BOEING 737 MAX 8 */
        { teks: "EQUIPMENT:", dx: 24.765, dy: 41.5, ukuran: 9, warna: "#000000" },
        { isi: "equipment", dx: 83.82, dy: 41.5, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 60 }
      ]
    },

    /* ---- Section Tiket di Bawah (Otomatis naik bila baris penerbangan susut) ---- */
    { id: "s-lbl-tiket", label: "Judul tiket", tipe: "teks", teks: "FLIGHT TICKET(S)", x: 24, y: 238, ukuran: 9, tebal: true, warna: "#000000" },
    { id: "s-garis-tiket", label: "Garis tiket", tipe: "garis", pola: "-", x: 24, y: 241.8, lebar: 146.685, ukuran: 9, warna: "#000000" },
    { id: "s-tabel-tiket", label: "Daftar no tiket", tipe: "tabel", sumber: "tiketList", susut: true,
      x: 24, y: 241.8, lebar: 146.685, tinggiBaris: 4.2, maksBaris: 8,
      kolom: [
        { isi: "tiketLengkap", label: "Baris tiket", dx: 0, dy: 4.0, ukuran: 9, kapital: true, warna: "#000000", lebarMaks: 146.685 }
      ]
    }
  ]
};
