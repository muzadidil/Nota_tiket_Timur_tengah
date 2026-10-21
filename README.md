# Nota Tiket Pesawat — tiket.zasha.online

Aplikasi web untuk membuat **nota pembelian tiket pesawat** dalam format **PDF A4**, atau langsung dicetak ke printer.
Data ditempelkan di atas **desain master** (nota kosong), jadi tampilan nota selalu sama dan rapi.
Tanpa database dan tanpa server: semua berjalan di browser, cocok untuk GitHub Pages.

Ada dua pilihan desain di bagian atas form:

- **Berwarna**: kop biru dengan motif awan, untuk dikirim lewat WhatsApp/email.
- **Sederhana**: hitam-putih dengan huruf mesin ketik (Courier), hemat tinta untuk dicetak sendiri di kertas biasa. Blok penerbangan dan baris penumpang yang tidak terpakai otomatis dirapatkan.

## Isi folder

| File / folder | Fungsi |
|---|---|
| `index.html` | Halaman aplikasi |
| `config.js` | **Data master**: kop usaha, rekening, syarat & ketentuan, daftar maskapai, bandara, kelas, bagasi, metode bayar |
| `layout.js` | Posisi isian desain **Berwarna** di atas master (milimeter) |
| `layout-sederhana.js` | Posisi isian, label, dan garis desain **Sederhana** |
| `master/master-nota.pdf` | Desain master nota kosong A4 (dipakai untuk PDF) |
| `master/master-nota.png` | Gambar master untuk pratinjau di layar |
| `assets/` | Tampilan dan logika aplikasi |
| `fonts/` | Font Poppins (lisensi OFL, lihat `fonts/OFL.txt`) |
| `vendor/pdf-lib.min.js` | Pustaka pembuat PDF (lisensi MIT) |
| `CNAME` | Nama domain untuk GitHub Pages: `tiket.zasha.online` |

## Cara pakai

1. Buka **https://tiket.zasha.online**.
2. Isi **Pemesan**, **Penerbangan** (maks. 4 baris), **Penumpang** (maks. 8 orang), dan **Pembayaran**.
   Nomor nota dibuat otomatis (`ALF-TTBBHH-JJMM`) dan bisa diubah.
3. Pilih desain **Berwarna** atau **Sederhana**. Pratinjau di kanan berubah langsung (di HP, tekan **Pratinjau**).
4. Tekan **Unduh PDF**, atau **Cetak** untuk langsung ke printer. Di HP yang mendukung, tombol **Bagikan** bisa langsung mengirim PDF ke WhatsApp.

Saat mencetak, pilih kertas **A4**, margin **Tidak ada/None**, skala **100%**, dan matikan **Header dan footer** bila pilihan itu muncul.

Isian form tidak disimpan di mana pun; menutup atau memuat ulang halaman akan mengosongkan form. Pilihan desain terakhir diingat oleh browser.

## Mengubah data master dan dropdown

Semua ada di `config.js`. Di GitHub: buka file → ikon pensil (**Edit**) → ubah teks di antara tanda kutip → **Commit changes**.
Situs akan diperbarui dalam 1–2 menit (tekan Ctrl+F5 bila masih tampil versi lama).

- **Kop nota**: bagian `profil` (nama usaha, tagline, alamat, telepon, email, website, kota, penanda tangan).
- **Logo**: upload file PNG (latar transparan) ke folder `assets/`, lalu isi `logo: "assets/logo.png"`. Bila kosong, kop memakai monogram huruf depan nama usaha.
- **Rekening** dan **syarat & ketentuan**: bagian `rekening` dan `syarat`.
- **Maskapai / bandara**: tambahkan baris baru dengan format yang sama. Bandara ditulis di nota seperti tiket, `KOTA, NEGARA (NAMA BANDARA), TERMINAL 2`, jadi isi `kota`, `negara` (kode 2 huruf, misalnya SA), dan `nama`. Terminal diisi per penerbangan di form. Di form juga tersedia pilihan **Lainnya (ketik sendiri)**.

## Memakai desain nota sendiri (misalnya dari Canva)

1. Buat desain ukuran **A4 tegak (210 × 297 mm)**. Sisakan area kosong untuk data (nama pemesan, tabel penerbangan, tabel penumpang, total, dan seterusnya).
2. Ekspor dua file:
   - **PDF Standar** (tanpa tanda potong dan *bleed*) → untuk hasil PDF yang tajam.
   - **PNG** → untuk pratinjau di layar.
3. Upload keduanya ke folder `master/`, lalu di `config.js` bagian `desain`, ubah `master` pada desain **berwarna**:
   ```js
   master: { file: "master/desain-saya.pdf", preview: "master/desain-saya.png" },
   ```
   (Boleh juga hanya PNG: `file: "master/desain-saya.png"` tanpa `preview`.)
4. Di aplikasi, pilih desainnya, lalu tekan **Atur posisi** (di laptop) dan geser kotak-kotak isian agar pas dengan desain Anda.
   Isian yang sudah ada di desain (misalnya kop atau rekening) bisa disembunyikan lewat centang di daftar isian.
   Sebelum upload, desain PNG bisa dicoba dulu lewat **Coba desain master sendiri**.
5. Tekan **Unduh layout.js** (atau **Unduh layout-sederhana.js** untuk desain Sederhana), lalu upload file itu ke GitHub menggantikan file yang lama.

Desain **Sederhana** tidak memakai gambar master: semua label dan garisnya ada di `layout-sederhana.js`, dan hurufnya memakai Courier bawaan setiap pembaca PDF (tanpa file font).

## Pasang di GitHub Pages

1. Buat repositori baru di GitHub (misalnya `nota-tiket`), jenis **Public**.
2. **Add file → Upload files**, seret **seluruh isi** folder ini (termasuk folder `assets`, `fonts`, `master`, dan `vendor`), lalu **Commit changes**.
3. Buka **Settings → Pages**. Di *Build and deployment*, pilih **Deploy from a branch**, branch **main**, folder **/ (root)**, lalu **Save**.
4. Di kolom **Custom domain**, isi `tiket.zasha.online` → **Save**. Lakukan langkah ini **sebelum** mengatur DNS di Hostinger, sesuai saran GitHub untuk mencegah subdomain diambil alih pihak lain.

## Hubungkan subdomain di Hostinger

1. Masuk **hPanel → Domain → zasha.online → DNS / Nameserver** (DNS Zone Editor).
2. Tambah record baru:

   | Type | Name | Target (Diarahkan ke) | TTL |
   |---|---|---|---|
   | CNAME | `tiket` | `NAMA-AKUN-GITHUB.github.io` | default (14400) |

   Ganti `NAMA-AKUN-GITHUB` dengan nama akun GitHub Anda. Jangan tambahkan nama repositori.
   Bila sudah ada record lain bernama `tiket` (misalnya A record dari menu Subdomain hosting), hapus dulu.
3. Tunggu propagasi DNS (bisa sampai 24 jam, biasanya lebih cepat).
4. Kembali ke **Settings → Pages** di GitHub, tunggu centang hijau pada pemeriksaan DNS, lalu aktifkan **Enforce HTTPS** (bisa butuh waktu hingga 24 jam sampai pilihan ini tersedia).
5. Disarankan: verifikasi domain `zasha.online` di **Settings akun GitHub → Pages → Add a domain** (menambahkan satu TXT record di Hostinger).

## Mencoba di komputer sendiri

Membuka `index.html` langsung dari folder tidak akan berjalan (browser memblokir pemuatan font dan master).
Jalankan server lokal di folder ini, misalnya:

```
python -m http.server 8000
```

lalu buka `http://localhost:8000`. Bisa juga memakai ekstensi *Live Server* di VS Code.

## Catatan

- Situs GitHub Pages bersifat publik: siapa pun yang mengetahui alamatnya bisa membuka aplikasi ini. Halaman sudah diberi tanda agar tidak diindeks mesin pencari, tetapi jangan sebarkan alamatnya ke luar tim.
- Alamat, telepon, dan rekening di `config.js` masih contoh. Ganti dengan data usaha yang sebenarnya sebelum dipakai.
- Teks pada nota memakai huruf Latin (bahasa Indonesia aman). Karakter di luar itu, misalnya aksara non-Latin, akan diganti tanda tanya.
