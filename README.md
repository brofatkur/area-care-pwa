# Area Care Officer PWA (care.boffice.co.id)

Progressive Web Application (PWA) untuk **Area Care Officer** yang menggantikan checklist kertas (5 area fasilitas / 7 area operasional, 27 sub-bagian, 315 item, 4 checkpoint per hari) dengan checklist digital berbukti foto ber-watermark otomatis, validasi scan QR area, pencatatan temuan & SLA 48 jam, gamifikasi, review supervisor, dashboard manajemen 7 panel, serta rekap email harian & bulanan.

---

## 🚀 Fitur Utama

- **PWA Mobile-First**: Dioptimalkan untuk penggunaan satu tangan di HP (tombol besar $\ge 56\text{ px}$, kontras tinggi, navigasi bawah 3 menu).
- **Pengisian Berbasis Pengecualian**: Tombol *"Semua Sesuai (2)"* per sub-bagian memangkas $\pm 90\%$ ketukan. Tombol nilai 3 warna (Bagus, Kurang, Kotor) dan filter frekuensi checkpoint (07.00 full check vs 10.00/13.00/15.30 ringkas).
- **Validasi QR Code**: Area checklist terkunci sampai QR code fisik area tersebut discan.
- **Kamera Bukti Ber-Watermark Otomatis (&le; 300 KB)**: Waktu (WITA), nama area, nama petugas, dan hash validasi langsung di-render ke canvas foto. Kompresi JPEG otomatis $\le 300\text{ KB}$.
- **Gamifikasi**: Poin (+10 on-time, +10 foto lengkap, +5 perbaikan, +20 bonus), streak (🔥), level (*Pemula* s.d. *Master Care*), dan suara/getaran haptic instan.
- **Mode Petugas Pengganti ("Saya Pengganti Hari Ini")**: Pendaftaran mandiri petugas pengganti tanpa jeda tunggu.
- **Tiket Temuan & Tindakan**: Pemisahan perbaikan langsung vs teknis berisiko dengan countdown SLA 48 jam.
- **Log Replenishment**: Status stok persediaan (Kopi, Teh, Gula, Tisu, Sabun, Gelas) auto-generate daftar belanja harian.
- **Portal Supervisor**: Matriks live 7 area $\times$ 4 checkpoint, pengesahan paraf digital, dan simulator *spot-check* selisih $\le 10$ poin.
- **Dashboard Manajemen 7 Panel**:
  1. Ringkasan Kinerja (KPI target $\ge 95\%$)
  2. Status Live Matrix
  3. Tren Kinerja 30 Hari
  4. 10 Kendala Fasilitas Berulang
  5. Papan Follow-up Kanban & SLA
  6. Kinerja Petugas Utama & Pengganti
  7. Daftar Belanja Replenishment
- **Rekap Email Terjadwal**: Generator laporan email HTML, ekspor cetak PDF resmi, dan ekspor data mentah ke CSV/Excel untuk Bagus (Direktur) dan Pasek (Manajer Operasional).
- **Offline First**: Antrian sinkronisasi otomatis menggunakan IndexedDB saat jaringan terputus.

---

## 🛠️ Tech Stack

- **Frontend**: Vue 3 (Composition API), TypeScript, Vite, Tailwind CSS, Lucide Icons
- **PWA & Offline**: Vite Plugin PWA (Workbox), Service Worker, IndexedDB (`idb-keyval`)
- **Backend & DB**: Insforge BaaS (PostgreSQL 15 + S3-compatible Object Storage)
- **Audio & Haptic**: Web Audio API & `navigator.vibrate`
- **QR & Signature**: `qrcode`, HTML5 Canvas Signature Pad

---

## 📦 Menjalankan Proyek

```bash
# Install dependencies
npm install

# Jalankan development server
npm run dev

# Build untuk produksi
npm run build

# Preview build lokal
npm run preview
```

---

Dibuat untuk operasional ASA BOffice & BTS Transit Hub.
