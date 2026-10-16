# 📅 AbsensiKu - Absensi & Daily Tasks Cloud (PWA)

Aplikasi pencatat absensi dan daily task pribadi modern dengan antarmuka **Mobile-First**, sistem **Login/Autentikasi**, dan **Database Cloud (Supabase PostgreSQL)** sehingga data Anda tersinkronisasi otomatis di HP dan Laptop.

---

## ✨ Fitur Utama

1. 🔐 **Sistem Autentikasi (Login & Register)**:
   - Masuk (Login) dan Daftar (Register) akun menggunakan Email & Password.
   - Sesi login aman dengan token autentikasi.
   - Tombol Keluar (Logout) yang praktis.

2. ☁️ **Database Cloud Terpusat (Supabase PostgreSQL)**:
   - Data absensi dan daily tasks tersimpan di cloud database.
   - Akses dari HP saat di luar atau dari Laptop di rumah, data **otomatis sama dan tersinkronisasi**.
   - Keamanan Row Level Security (RLS) &mdash; data Anda hanya bisa diakses oleh akun Anda sendiri.

3. ⏱️ **Jam Real-time & Timer Durasi Kerja Otomatis**:
   - Stopwatch/timer kerja berjalan otomatis setelah klik **Absen Masuk**.
   - Perhitungan durasi kerja harian otomatis saat klik **Absen Pulang**.

4. ✅ **Daily Task Planner (To-Do List Harian)**:
   - Catat target pekerjaan apa saja yang ingin diselesaikan hari ini.
   - Checklist dengan animasi coret dan persentase progress bar dinamis (*contoh: 2/3 Selesai (67%)*).
   - Task tersimpan per tanggal dan dapat dilihat kembali di riwayat.

5. 🏢 **Status Kehadiran Lengkap**:
   - Hadir (WFO), WFH, Izin, Cuti, dan Sakit.

6. 📱 **Mobile-First & PWA**:
   - Tampilan responsif nyaman untuk layar smartphone.
   - Bisa di-install ke Layar Utama (Home Screen) Android dan iOS.

7. 📊 **Rekap Bulanan & Export CSV**:
   - Total hari kerja, total jam kerja, dan rata-rata jam/hari.
   - Unduh laporan riwayat absensi dalam format file Excel (.csv).

---

## 🛠️ Langkah Menghubungkan ke Supabase (Gratis & Cepat)

Hanya butuh 2-3 menit untuk menyiapkan database cloud gratis Anda:

### 1. Buat Akun & Project di Supabase
1. Buka [supabase.com](https://supabase.com) dan klik **"Start your project"** (Bisa login dengan akun GitHub).
2. Klik **"New project"**:
   - Name: `absensiku` (atau nama lain bebas)
   - Database Password: Buat password yang kuat
   - Region: Pilih yang terdekat (misal: *Singapore*)
   - Klik **"Create new project"**.

### 2. Buat Tabel Database (Salin dari `schema.sql`)
1. Di dashboard project Supabase Anda, buka menu **SQL Editor** (ikon terminal/SQL di bilah kiri).
2. Klik **"New query"**.
3. Buka file [**`schema.sql`**](file:///d:/AI%20Project/schema.sql) di folder proyek ini, salin seluruh isinya, dan tempelkan (paste) ke SQL Editor Supabase.
4. Klik tombol hijau **"Run"**. Selesai! Tabel `attendance` dan `daily_tasks` sudah terbuat dengan keamanan penuh.

### 3. Masukkan Project URL & Anon Key ke Aplikasi
1. Di Supabase, buka menu **Project Settings** (ikon gerigi) ➔ pilih **API**.
2. Salin:
   - **Project URL**
   - **Project API Keys** (pilih yang labelnya **`anon` / `public`**)
3. Buka aplikasi **AbsensiKu**, klik ikon **Database** di kanan atas (atau edit file [**`config.js`**](file:///d:/AI%20Project/config.js)), lalu tempelkan URL dan Anon Key tersebut.
4. Klik **Simpan & Hubungkan**.

Sekarang Anda sudah bisa mendaftar akun dan menikmati sinkronisasi cloud di semua perangkat!

---

## 🚀 Cara Menjalankan Aplikasi

- **Di Laptop**: Cukup *double-click* file [**`Buka-AbsensiKu.bat`**](file:///d:/AI%20Project/Buka-AbsensiKu.bat) atau buka [**`index.html`**](file:///d:/AI%20Project/index.html) di browser.
- **Deploy ke Vercel / GitHub Pages**: Unggah seluruh berkas di folder ini ke GitHub, lalu deploy ke Vercel untuk mendapatkan link online publik gratis!
