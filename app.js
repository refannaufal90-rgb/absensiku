/**
 * HadirKu - Absensi Mudah, Kerja Lebih Bermakna
 * Full Implementation with PDF Official Report, Confirmation Modal, 7-Hour Target & Custom Splash
 */

(() => {
  'use strict';

  // --- Constants & Storage Keys ---
  const THEME_KEY = 'hadirku_theme';
  const CFG_URL_KEY = 'absensiku_supabase_url';
  const CFG_KEY_KEY = 'absensiku_supabase_key';
  const PDF_INFO_KEY = 'hadirku_pdf_officials';
  const CIRCLE_CIRCUMFERENCE = 314.159; // 2 * PI * 50
  const TARGET_WORK_MINUTES = 420; // 7 jam kerja: 07.30 - 14.30 WITA

  // --- State ---
  let supabase = null;
  let currentUser = null;
  let records = [];       // Attendance records from Supabase
  let allTasks = [];      // Tasks from Supabase
  let timerInterval = null;
  let activeTab = 'home';
  let taskFilter = 'all';
  let currentHistoryPeriod = new Date(); // for history month view

  // --- DOM Elements ---
  const splashScreen = document.getElementById('splashScreen');
  const authSection = document.getElementById('authSection');
  const appSection = document.getElementById('appSection');
  const bottomNav = document.getElementById('bottomNav');

  // Auth Elements
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const authForm = document.getElementById('authForm');
  const authEmail = document.getElementById('authEmail');
  const authPassword = document.getElementById('authPassword');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const authSubmitText = document.getElementById('authSubmitText');
  const openConfigBtnAuth = document.getElementById('openConfigBtnAuth');
  let isRegisterMode = false;

  // Header Elements (Home)
  const userAvatarContainer = document.getElementById('userAvatarContainer');
  const greetingNameDisplay = document.getElementById('greetingNameDisplay');
  const notificationBtn = document.getElementById('notificationBtn');

  // Today Circular Ring & Status Card
  const todayFullDateText = document.getElementById('todayFullDateText');
  const todayStatusBadge = document.getElementById('todayStatusBadge');
  const circularProgressArc = document.getElementById('circularProgressArc');
  const circularWorkedTime = document.getElementById('circularWorkedTime');
  const todayCheckInText = document.getElementById('todayCheckInText');
  const todayCheckOutText = document.getElementById('todayCheckOutText');
  const subPunchInText = document.getElementById('subPunchInText');
  const subTotalHoursText = document.getElementById('subTotalHoursText');

  // Floating Center FAB
  const centerFabAbsenBtn = document.getElementById('centerFabAbsenBtn');

  // Weekly Calendar
  const weekRangeLabel = document.getElementById('weekRangeLabel');
  const weeklyCalendarGrid = document.getElementById('weeklyCalendarGrid');

  // Home Task Preview
  const homeTaskProgressCount = document.getElementById('homeTaskProgressCount');
  const homeTaskProgressBar = document.getElementById('homeTaskProgressBar');
  const homeTaskListPreview = document.getElementById('homeTaskListPreview');
  const homeViewAllTasksLink = document.getElementById('homeViewAllTasksLink');

  // Home Monthly Summary
  const homeMonthLabel = document.getElementById('homeMonthLabel');
  const summaryHadirCount = document.getElementById('summaryHadirCount');
  const summaryTerlambatCount = document.getElementById('summaryTerlambatCount');
  const summaryIzinCount = document.getElementById('summaryIzinCount');
  const summaryTotalHoursCount = document.getElementById('summaryTotalHoursCount');

  // Timeline Aktivitas Hari Ini
  const timelineDotMasuk = document.getElementById('timelineDotMasuk');
  const timelineTimeMasuk = document.getElementById('timelineTimeMasuk');
  const timelineDotPulang = document.getElementById('timelineDotPulang');
  const timelineTimePulang = document.getElementById('timelineTimePulang');

  // Tab Contents
  const tabContentHome = document.getElementById('tabContentHome');
  const tabContentHistory = document.getElementById('tabContentHistory');
  const tabContentTasks = document.getElementById('tabContentTasks');
  const tabContentProfile = document.getElementById('tabContentProfile');

  // Tasks Tab Elements
  const tasksSubtitleProgress = document.getElementById('tasksSubtitleProgress');
  const tasksPercentBadge = document.getElementById('tasksPercentBadge');
  const tasksProgressBar = document.getElementById('tasksProgressBar');
  const fullTaskListContainer = document.getElementById('fullTaskListContainer');
  const emptyTasksFullState = document.getElementById('emptyTasksFullState');
  const openAddTaskModalBtn = document.getElementById('openAddTaskModalBtn');

  // History Tab Elements
  const prevMonthBtn = document.getElementById('prevMonthBtn');
  const nextMonthBtn = document.getElementById('nextMonthBtn');
  const currentPeriodLabel = document.getElementById('currentPeriodLabel');
  const histHadirCount = document.getElementById('histHadirCount');
  const histTerlambatCount = document.getElementById('histTerlambatCount');
  const histIzinCount = document.getElementById('histIzinCount');
  const histAlpaCount = document.getElementById('histAlpaCount');
  const historyListContainer = document.getElementById('historyListContainer');
  const emptyHistoryState = document.getElementById('emptyHistoryState');
  const exportCsvBtn = document.getElementById('exportCsvBtn');

  // Profile Tab Elements
  const profileAvatarInitial = document.getElementById('profileAvatarInitial');
  const profileNameDisplay = document.getElementById('profileNameDisplay');
  const profileEmailDisplay = document.getElementById('profileEmailDisplay');
  const openConfigBtnProfile = document.getElementById('openConfigBtnProfile');
  const themeToggleBtnProfile = document.getElementById('themeToggleBtnProfile');
  const profileThemeIcon = document.getElementById('profileThemeIcon');
  const profileThemeText = document.getElementById('profileThemeText');
  const logoutBtnProfile = document.getElementById('logoutBtnProfile');

  // Confirm Pulang Modal
  const confirmPulangModal = document.getElementById('confirmPulangModal');
  const confirmPulangCurrentTime = document.getElementById('confirmPulangCurrentTime');
  const cancelConfirmPulangBtn = document.getElementById('cancelConfirmPulangBtn');
  const proceedConfirmPulangBtn = document.getElementById('proceedConfirmPulangBtn');

  // Absen Success Modal
  const absenSuccessModal = document.getElementById('absenSuccessModal');
  const modalSuccessBadge = document.getElementById('modalSuccessBadge');
  const modalSuccessTitle = document.getElementById('modalSuccessTitle');
  const modalSuccessTime = document.getElementById('modalSuccessTime');
  const modalSuccessDate = document.getElementById('modalSuccessDate');
  const modalSuccessSubtitle = document.getElementById('modalSuccessSubtitle');
  const closeSuccessModalBtn = document.getElementById('closeSuccessModalBtn');

  // Export PDF Modal & Form Elements
  const openExportPdfModalBtn = document.getElementById('openExportPdfModalBtn');
  const exportPdfModal = document.getElementById('exportPdfModal');
  const exportPdfForm = document.getElementById('exportPdfForm');
  const closeExportPdfModalBtn = document.getElementById('closeExportPdfModalBtn');
  const cancelExportPdfBtn = document.getElementById('cancelExportPdfBtn');
  const pdfNamaPegawai = document.getElementById('pdfNamaPegawai');
  const pdfNipPegawai = document.getElementById('pdfNipPegawai');
  const pdfJabatanPegawai = document.getElementById('pdfJabatanPegawai');
  const pdfNamaAtasan = document.getElementById('pdfNamaAtasan');
  const pdfNipAtasan = document.getElementById('pdfNipAtasan');
  const pdfJabatanAtasan = document.getElementById('pdfJabatanAtasan');
  const pdfKotaTtd = document.getElementById('pdfKotaTtd');
  const pdfPeriodeDisplay = document.getElementById('pdfPeriodeDisplay');

  // Printable Report Elements
  const printableReportContainer = document.getElementById('printableReportContainer');
  const printReportPeriodeTitle = document.getElementById('printReportPeriodeTitle');
  const printNamaPegawai = document.getElementById('printNamaPegawai');
  const printNipPegawai = document.getElementById('printNipPegawai');
  const printJabatanPegawai = document.getElementById('printJabatanPegawai');
  const printTotalHariHadir = document.getElementById('printTotalHariHadir');
  const printTotalJamKerja = document.getElementById('printTotalJamKerja');
  const printAttendanceTableBody = document.getElementById('printAttendanceTableBody');
  const printJabatanAtasan = document.getElementById('printJabatanAtasan');
  const printNamaAtasan = document.getElementById('printNamaAtasan');
  const printNipAtasan = document.getElementById('printNipAtasan');
  const printKotaTanggalCetak = document.getElementById('printKotaTanggalCetak');
  const printNamaPegawaiBawah = document.getElementById('printNamaPegawaiBawah');
  const printNipPegawaiBawah = document.getElementById('printNipPegawaiBawah');

  // Calendar Detail Modal
  const calendarDetailModal = document.getElementById('calendarDetailModal');
  const calDetailDateTitle = document.getElementById('calDetailDateTitle');
  const calDetailBody = document.getElementById('calDetailBody');
  const closeCalDetailModalBtn = document.getElementById('closeCalDetailModalBtn');

  // Add Task Modal
  const addTaskModal = document.getElementById('addTaskModal');
  const addTaskModalForm = document.getElementById('addTaskModalForm');
  const modalTaskTitle = document.getElementById('modalTaskTitle');
  const modalTaskDesc = document.getElementById('modalTaskDesc');
  const modalTaskDueDate = document.getElementById('modalTaskDueDate');
  const modalTaskPriority = document.getElementById('modalTaskPriority');
  const closeAddTaskModalBtn = document.getElementById('closeAddTaskModalBtn');
  const cancelAddTaskModalBtn = document.getElementById('cancelAddTaskModalBtn');

  // Config Modal
  const configModal = document.getElementById('configModal');
  const configForm = document.getElementById('configForm');
  const cfgSupabaseUrl = document.getElementById('cfgSupabaseUrl');
  const cfgSupabaseKey = document.getElementById('cfgSupabaseKey');
  const closeConfigModalBtn = document.getElementById('closeConfigModalBtn');
  const cancelConfigModalBtn = document.getElementById('cancelConfigModalBtn');

  // Toast Container
  const toastContainer = document.getElementById('toastContainer');

  // --- Utility Helpers ---
  const padZero = (n) => String(n).padStart(2, '0');

  const getTodayDateString = () => {
    const now = new Date();
    return `${now.getFullYear()}-${padZero(now.getMonth() + 1)}-${padZero(now.getDate())}`;
  };

  const getFormattedCurrentTime = () => {
    const now = new Date();
    return `${padZero(now.getHours())}:${padZero(now.getMinutes())}:${padZero(now.getSeconds())}`;
  };

  const formatTimeAmPm = (timeStr) => {
    if (!timeStr) return '--:--';
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${padZero(h)}:${m} ${ampm}`;
  };

  const formatDisplayDateLong = (dateObj) => {
    return dateObj.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDisplayDateShort = (dateStr) => {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return null;
    const [startH, startM, startS = 0] = startTime.split(':').map(Number);
    const [endH, endM, endS = 0] = endTime.split(':').map(Number);

    const startTotalSec = startH * 3600 + startM * 60 + startS;
    const endTotalSec = endH * 3600 + endM * 60 + endS;

    let diffSec = endTotalSec - startTotalSec;
    if (diffSec < 0) diffSec = 0;

    const hours = Math.floor(diffSec / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;

    return {
      totalMinutes: Math.floor(diffSec / 60),
      hours,
      minutes,
      seconds,
      formattedText: `${padZero(hours)}:${padZero(minutes)}`
    };
  };

  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  };

  // --- Toast Notification ---
  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `toast-enter flex items-center gap-2.5 p-3.5 rounded-2xl border shadow-xl text-xs text-white pointer-events-auto transition ${
      type === 'success'
        ? 'bg-[#142D4E] border-[#16A34A] text-white'
        : type === 'error'
        ? 'bg-[#142D4E] border-[#DC2626] text-white'
        : 'bg-[#142D4E] border-[#168C85] text-white'
    }`;

    const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info';
    toast.innerHTML = `
      <i data-lucide="${iconName}" class="w-4 h-4 text-[#14BBA6] flex-shrink-0"></i>
      <span class="flex-1 font-semibold leading-relaxed">${message}</span>
    `;

    toastContainer.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.classList.remove('toast-enter');
      toast.classList.add('toast-leave');
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  };

  // --- Supabase Credentials & Client Init ---
  const getSupabaseCredentials = () => {
    const storedUrl = localStorage.getItem(CFG_URL_KEY);
    const storedKey = localStorage.getItem(CFG_KEY_KEY);

    const configUrl = (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) ? window.SUPABASE_CONFIG.url.trim() : '';
    const configKey = (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.anonKey) ? window.SUPABASE_CONFIG.anonKey.trim() : '';

    return {
      url: storedUrl || configUrl,
      key: storedKey || configKey
    };
  };

  const initSupabaseClient = () => {
    const { url, key } = getSupabaseCredentials();

    if (!url || !key) {
      supabase = null;
      return false;
    }

    try {
      supabase = window.supabase.createClient(url, key);
      return true;
    } catch (err) {
      console.error('Error init Supabase:', err);
      return false;
    }
  };

  // --- Auth View & Navigation Management ---
  const showAuthView = () => {
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
    bottomNav.classList.add('hidden');
  };

  const showAppView = () => {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    bottomNav.classList.remove('hidden');

    if (currentUser) {
      const email = currentUser.email || '';
      const name = email.split('@')[0];
      const displayName = name.charAt(0).toUpperCase() + name.slice(1);
      const initial = displayName.charAt(0);

      greetingNameDisplay.textContent = `Good Morning, ${displayName}!`;
      userAvatarContainer.textContent = initial;
      profileAvatarInitial.textContent = initial;
      profileNameDisplay.textContent = displayName;
      profileEmailDisplay.textContent = email;

      // Pre-fill user name into PDF modal if empty
      if (!pdfNamaPegawai.value) {
        pdfNamaPegawai.value = displayName;
      }
    }
  };

  // Auth Tabs (Login vs Register)
  tabLoginBtn.addEventListener('click', () => {
    isRegisterMode = false;
    tabLoginBtn.className = 'flex-1 py-2.5 rounded-lg bg-white text-[#142D4E] shadow-sm font-bold transition';
    tabRegisterBtn.className = 'flex-1 py-2.5 rounded-lg text-[#64748B] hover:text-[#142D4E] transition';
    authSubmitText.textContent = 'Masuk';
  });

  tabRegisterBtn.addEventListener('click', () => {
    isRegisterMode = true;
    tabRegisterBtn.className = 'flex-1 py-2.5 rounded-lg bg-white text-[#142D4E] shadow-sm font-bold transition';
    tabLoginBtn.className = 'flex-1 py-2.5 rounded-lg text-[#64748B] hover:text-[#142D4E] transition';
    authSubmitText.textContent = 'Daftar Akun Baru';
  });

  togglePasswordBtn.addEventListener('click', () => {
    const isPassword = authPassword.type === 'password';
    authPassword.type = isPassword ? 'text' : 'password';
    togglePasswordBtn.innerHTML = isPassword
      ? '<i data-lucide="eye-off" class="w-4 h-4"></i>'
      : '<i data-lucide="eye" class="w-4 h-4"></i>';
    if (window.lucide) window.lucide.createIcons();
  });

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!supabase) {
      showToast('Harap hubungkan project Supabase melalui tombol Database di atas!', 'error');
      openConfigModal();
      return;
    }

    const email = authEmail.value.trim();
    const password = authPassword.value;

    authSubmitBtn.disabled = true;
    authSubmitText.textContent = isRegisterMode ? 'Mendaftarkan...' : 'Memverifikasi...';

    try {
      if (isRegisterMode) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.session) {
          currentUser = data.user;
          showToast('Pendaftaran akun berhasil!', 'success');
          await loadAllDataFromCloud();
        } else {
          showToast('Pendaftaran berhasil! Silakan langsung login dengan akun Anda.', 'success');
          tabLoginBtn.click();
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        currentUser = data.user;
        showToast('Berhasil masuk! Memuat data...', 'success');
        await loadAllDataFromCloud();
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Gagal autentikasi!', 'error');
    } finally {
      authSubmitBtn.disabled = false;
      authSubmitText.textContent = isRegisterMode ? 'Daftar Akun Baru' : 'Masuk';
    }
  });

  // Logout
  const handleLogout = async () => {
    if (!confirm('Apakah Anda yakin ingin keluar dari akun HadirKu?')) return;
    if (supabase) await supabase.auth.signOut();

    currentUser = null;
    records = [];
    allTasks = [];
    showAuthView();
    showToast('Berhasil keluar dari akun.', 'info');
  };

  logoutBtnProfile.addEventListener('click', handleLogout);

  // --- 4 Tab Bottom Navigation Switching ---
  const switchTab = (tabName) => {
    activeTab = tabName;

    document.querySelectorAll('.bottom-nav-item').forEach((item) => {
      if (item.dataset.tab === tabName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    tabContentHome.classList.add('hidden');
    tabContentHistory.classList.add('hidden');
    tabContentTasks.classList.add('hidden');
    tabContentProfile.classList.add('hidden');

    if (tabName === 'home') tabContentHome.classList.remove('hidden');
    if (tabName === 'history') tabContentHistory.classList.remove('hidden');
    if (tabName === 'tasks') tabContentTasks.classList.remove('hidden');
    if (tabName === 'profile') tabContentProfile.classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.lucide) window.lucide.createIcons();
  };

  bottomNav.addEventListener('click', (e) => {
    const item = e.target.closest('.bottom-nav-item');
    if (!item) return;
    switchTab(item.dataset.tab);
  });

  homeViewAllTasksLink.addEventListener('click', () => {
    switchTab('tasks');
  });

  // --- Data Loading from Supabase Cloud ---
  const loadAllDataFromCloud = async () => {
    if (!supabase || !currentUser) return;

    showAppView();

    try {
      const { data: attData, error: attErr } = await supabase
        .from('attendance')
        .select('*')
        .order('date', { ascending: false });

      if (attErr) throw attErr;
      records = attData || [];

      const { data: taskData, error: taskErr } = await supabase
        .from('daily_tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (taskErr) throw taskErr;
      allTasks = taskData || [];

      renderAll();
    } catch (err) {
      console.error('Error load cloud data:', err);
      showToast('Gagal memuat data cloud: ' + err.message, 'error');
    }
  };

  const getTodayRecord = () => {
    const todayStr = getTodayDateString();
    return records.find((r) => r.date === todayStr);
  };

  // --- 02. TODAY'S STATUS & CIRCULAR PROGRESS RING (Target 7 Jam: 07.30 - 14.30 WITA) ---
  const updateCircularTimerAndState = () => {
    const today = getTodayRecord();
    todayFullDateText.textContent = formatDisplayDateLong(new Date());

    if (!today || !today.clock_in) {
      // 1. Belum Absen
      todayStatusBadge.textContent = 'Belum Absen';
      todayStatusBadge.className = 'text-xs px-3 py-1 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200';
      todayCheckInText.textContent = '--:--';
      todayCheckOutText.textContent = '--:--';
      subPunchInText.textContent = '--:--';
      subTotalHoursText.textContent = '00:00';
      circularWorkedTime.textContent = '00:00';

      // Ring empty
      circularProgressArc.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE;

      // Timeline
      timelineTimeMasuk.textContent = '--:--';
      timelineDotMasuk.className = 'timeline-dot -left-6 absolute top-1 bg-slate-300';
      timelineTimePulang.textContent = '--:--';
      timelineDotPulang.className = 'timeline-dot -left-6 absolute top-1 bg-slate-300';

    } else if (today.clock_in && !today.clock_out) {
      // 2. Sedang Bekerja (Live Timer berjalan terhadap target 7 jam)
      todayStatusBadge.textContent = 'Sedang Bekerja';
      todayStatusBadge.className = 'text-xs px-3 py-1 rounded-full font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200';
      
      const checkInAmPm = formatTimeAmPm(today.clock_in);
      todayCheckInText.textContent = checkInAmPm;
      todayCheckOutText.textContent = '--:--';
      subPunchInText.textContent = checkInAmPm;

      // Timeline
      timelineTimeMasuk.textContent = checkInAmPm;
      timelineDotMasuk.className = 'timeline-dot -left-6 absolute top-1 bg-[#16A34A] border-white shadow-[0_0_8px_rgba(22,163,74,0.5)]';
      timelineTimePulang.textContent = '--:--';
      timelineDotPulang.className = 'timeline-dot -left-6 absolute top-1 bg-slate-300';

      // Hitung live durasi kerja
      const dur = calculateDuration(today.clock_in, getFormattedCurrentTime());
      if (dur) {
        circularWorkedTime.textContent = dur.formattedText;
        subTotalHoursText.textContent = dur.formattedText;

        // Target: 7 jam (420 menit)
        const percent = Math.min(100, (dur.totalMinutes / TARGET_WORK_MINUTES) * 100);
        const offset = CIRCLE_CIRCUMFERENCE - (percent / 100) * CIRCLE_CIRCUMFERENCE;
        circularProgressArc.style.strokeDashoffset = offset;
      }

    } else if (today.clock_in && today.clock_out) {
      // 3. Selesai Bekerja
      todayStatusBadge.textContent = 'Selesai';
      todayStatusBadge.className = 'text-xs px-3 py-1 rounded-full font-bold bg-slate-100 text-[#142D4E] border border-slate-200';

      const checkInAmPm = formatTimeAmPm(today.clock_in);
      const checkOutAmPm = formatTimeAmPm(today.clock_out);

      todayCheckInText.textContent = checkInAmPm;
      todayCheckOutText.textContent = checkOutAmPm;
      subPunchInText.textContent = checkInAmPm;

      // Timeline
      timelineTimeMasuk.textContent = checkInAmPm;
      timelineDotMasuk.className = 'timeline-dot -left-6 absolute top-1 bg-[#16A34A]';
      timelineTimePulang.textContent = checkOutAmPm;
      timelineDotPulang.className = 'timeline-dot -left-6 absolute top-1 bg-[#142D4E]';

      const dur = calculateDuration(today.clock_in, today.clock_out);
      if (dur) {
        circularWorkedTime.textContent = dur.formattedText;
        subTotalHoursText.textContent = dur.formattedText;

        const percent = Math.min(100, (dur.totalMinutes / TARGET_WORK_MINUTES) * 100);
        const offset = CIRCLE_CIRCUMFERENCE - (percent / 100) * CIRCLE_CIRCUMFERENCE;
        circularProgressArc.style.strokeDashoffset = offset;
      }
    }
  };

  // --- 04. KALENDER MINGGUAN (Senin s/d Minggu) ---
  const renderWeeklyCalendar = () => {
    weeklyCalendarGrid.innerHTML = '';
    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMonday = (currentDay + 6) % 7;

    const mondayDate = new Date(now);
    mondayDate.setDate(now.getDate() - distanceToMonday);

    const sundayDate = new Date(mondayDate);
    sundayDate.setDate(mondayDate.getDate() + 6);

    weekRangeLabel.textContent = `${mondayDate.getDate()} - ${sundayDate.getDate()} ${now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;

    const dayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const todayStr = getTodayDateString();

    for (let i = 0; i < 7; i++) {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + i);

      const dStr = `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
      const isToday = dStr === todayStr;

      const record = records.find((r) => r.date === dStr);
      const isHadir = record && record.clock_in;

      const item = document.createElement('div');
      item.className = `cal-day-item flex flex-col items-center py-2 px-1 cursor-pointer ${
        isToday ? 'today' : ''
      }`;
      item.dataset.date = dStr;

      item.innerHTML = `
        <span class="text-[10px] font-semibold text-[#64748B] block">${dayLabels[i]}</span>
        <span class="text-xs font-extrabold my-1 block ${isToday ? 'text-[#168C85]' : 'text-[#172B4D]'}">${d.getDate()}</span>
        <div class="w-1.5 h-1.5 rounded-full ${
          isHadir ? 'bg-[#16A34A]' : isToday ? 'bg-[#14BBA6]' : 'bg-transparent'
        }"></div>
      `;

      weeklyCalendarGrid.appendChild(item);
    }
  };

  // Click on Calendar Day -> Shows Detail Modal
  weeklyCalendarGrid.addEventListener('click', (e) => {
    const item = e.target.closest('.cal-day-item');
    if (!item) return;

    const dateStr = item.dataset.date;
    const record = records.find((r) => r.date === dateStr);

    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    calDetailDateTitle.textContent = formatDisplayDateLong(dateObj);

    if (record && record.clock_in) {
      const dur = record.clock_out ? calculateDuration(record.clock_in, record.clock_out) : null;
      calDetailBody.innerHTML = `
        <div class="p-3 rounded-xl bg-slate-50 space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="text-[#64748B]">Status:</span>
            <span class="font-bold text-[#16A34A]">${record.status || 'Hadir'}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[#64748B]">Jam Masuk:</span>
            <span class="font-bold font-mono">${formatTimeAmPm(record.clock_in)}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[#64748B]">Jam Pulang:</span>
            <span class="font-bold font-mono">${record.clock_out ? formatTimeAmPm(record.clock_out) : 'Belum absen pulang'}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[#64748B]">Total Durasi:</span>
            <span class="font-bold text-[#168C85]">${dur ? dur.formattedText + ' jam' : '-'}</span>
          </div>
        </div>
      `;
    } else {
      calDetailBody.innerHTML = `
        <div class="p-3 rounded-xl bg-slate-50 text-center text-[#64748B] text-xs">
          Belum ada catatan absensi untuk tanggal ini.
        </div>
      `;
    }

    calendarDetailModal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  });

  closeCalDetailModalBtn.addEventListener('click', () => {
    calendarDetailModal.classList.add('hidden');
  });

  calendarDetailModal.addEventListener('click', (e) => {
    if (e.target === calendarDetailModal) calendarDetailModal.classList.add('hidden');
  });

  // --- 05. TARGET TASK LOGIC ---
  const getTodayTasks = () => {
    const todayStr = getTodayDateString();
    return allTasks.filter((t) => t.date === todayStr);
  };

  const renderTaskProgressAndHomePreview = () => {
    const todayTasks = getTodayTasks();
    const totalCount = todayTasks.length;
    const completedCount = todayTasks.filter((t) => t.completed).length;
    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Home Card Progress
    homeTaskProgressCount.textContent = `${completedCount} dari ${totalCount} tugas selesai`;
    homeTaskProgressBar.style.width = `${percent}%`;

    // Tasks Tab Header Progress
    tasksSubtitleProgress.textContent = `${completedCount} dari ${totalCount} tugas selesai`;
    tasksPercentBadge.textContent = `${percent}%`;
    tasksProgressBar.style.width = `${percent}%`;

    // Render Home 3 Tasks Preview
    homeTaskListPreview.innerHTML = '';
    if (todayTasks.length === 0) {
      homeTaskListPreview.innerHTML = `
        <div class="text-center py-3 text-xs text-[#64748B]">
          Belum ada target tugas hari ini.
        </div>
      `;
    } else {
      const sorted = [...todayTasks].sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
      const previewSlice = sorted.slice(0, 3);

      previewSlice.forEach((task) => {
        const item = document.createElement('div');
        item.className = `task-item flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 ${
          task.completed ? 'completed' : ''
        }`;

        item.innerHTML = `
          <label class="flex items-center gap-3 cursor-pointer flex-1 min-w-0 pr-2">
            <input 
              type="checkbox" 
              class="quick-task-cb w-4 h-4 rounded text-[#168C85] focus:ring-0 cursor-pointer"
              data-id="${task.id}"
              ${task.completed ? 'checked' : ''}
            />
            <span class="task-title text-xs font-semibold text-[#172B4D] truncate select-none">
              ${escapeHtml(task.title)}
            </span>
          </label>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-md ${
            task.priority === 'Tinggi' ? 'badge-priority-tinggi' : task.priority === 'Rendah' ? 'badge-priority-rendah' : 'badge-priority-sedang'
          }">
            ${task.priority || 'Sedang'}
          </span>
        `;
        homeTaskListPreview.appendChild(item);
      });
    }

    renderFullTaskList();
  };

  const renderFullTaskList = () => {
    fullTaskListContainer.innerHTML = '';
    const todayTasks = getTodayTasks();

    let filtered = todayTasks;
    if (taskFilter === 'completed') filtered = todayTasks.filter((t) => t.completed);
    if (taskFilter === 'uncompleted') filtered = todayTasks.filter((t) => !t.completed);

    if (filtered.length === 0) {
      emptyTasksFullState.classList.remove('hidden');
      return;
    }

    emptyTasksFullState.classList.add('hidden');

    filtered.forEach((task) => {
      const card = document.createElement('div');
      card.className = `task-item hadirku-card p-3.5 flex items-start justify-between gap-3 ${
        task.completed ? 'completed' : ''
      }`;

      card.innerHTML = `
        <div class="flex items-start gap-3 flex-1 min-w-0">
          <input 
            type="checkbox" 
            class="full-task-cb mt-1 w-4 h-4 rounded text-[#168C85] focus:ring-0 cursor-pointer"
            data-id="${task.id}"
            ${task.completed ? 'checked' : ''}
          />
          <div class="space-y-1 overflow-hidden">
            <h4 class="task-title text-xs font-bold text-[#142D4E] truncate select-none">
              ${escapeHtml(task.title)}
            </h4>
            ${
              task.description
                ? `<p class="text-[11px] text-[#64748B] line-clamp-2">${escapeHtml(task.description)}</p>`
                : ''
            }
            <div class="flex items-center gap-2 pt-0.5">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-md ${
                task.priority === 'Tinggi' ? 'badge-priority-tinggi' : task.priority === 'Rendah' ? 'badge-priority-rendah' : 'badge-priority-sedang'
              }">
                ${task.priority || 'Sedang'}
              </span>
              ${
                task.due_date
                  ? `<span class="text-[10px] text-[#64748B] flex items-center gap-1 font-medium">
                      <i data-lucide="calendar" class="w-3 h-3"></i>
                      ${formatDisplayDateShort(task.due_date)}
                    </span>`
                  : ''
              }
            </div>
          </div>
        </div>

        <button type="button" class="delete-task-btn p-1.5 rounded-lg text-slate-400 hover:text-[#DC4545] hover:bg-rose-50 transition" data-id="${task.id}" title="Hapus Tugas">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      `;

      fullTaskListContainer.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  };

  // Task Filter Tabs in Tugas Screen
  document.querySelectorAll('.task-filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      taskFilter = btn.dataset.filter;
      document.querySelectorAll('.task-filter-btn').forEach((b) => {
        b.className = 'task-filter-btn px-3.5 py-1.5 rounded-xl bg-white text-[#64748B] border border-[#E2E8F0] hover:text-[#142D4E] transition';
      });
      btn.className = 'task-filter-btn px-3.5 py-1.5 rounded-xl bg-[#142D4E] text-white shadow-sm transition font-bold';
      renderFullTaskList();
    });
  });

  const handleTaskToggle = async (taskId, isChecked) => {
    if (!currentUser) return;
    try {
      await supabase
        .from('daily_tasks')
        .update({ completed: isChecked })
        .eq('id', taskId);

      const target = allTasks.find((t) => t.id === taskId);
      if (target) target.completed = isChecked;

      renderTaskProgressAndHomePreview();
      if (isChecked) showToast('Tugas selesai dicentang!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal update tugas di cloud', 'error');
    }
  };

  homeTaskListPreview.addEventListener('change', (e) => {
    const cb = e.target.closest('.quick-task-cb');
    if (cb) handleTaskToggle(cb.dataset.id, cb.checked);
  });

  fullTaskListContainer.addEventListener('change', (e) => {
    const cb = e.target.closest('.full-task-cb');
    if (cb) handleTaskToggle(cb.dataset.id, cb.checked);
  });

  fullTaskListContainer.addEventListener('click', async (e) => {
    const delBtn = e.target.closest('.delete-task-btn');
    if (delBtn && currentUser) {
      const taskId = delBtn.dataset.id;
      try {
        await supabase.from('daily_tasks').delete().eq('id', taskId);
        allTasks = allTasks.filter((t) => t.id !== taskId);
        renderTaskProgressAndHomePreview();
        showToast('Tugas telah dihapus.', 'info');
      } catch (err) {
        showToast('Gagal menghapus tugas dari cloud', 'error');
      }
    }
  });

  // Add Task Modal Handlers
  openAddTaskModalBtn.addEventListener('click', () => {
    modalTaskTitle.value = '';
    modalTaskDesc.value = '';
    modalTaskDueDate.value = getTodayDateString();
    modalTaskPriority.value = 'Sedang';
    addTaskModal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  });

  const closeAddTaskModal = () => {
    addTaskModal.classList.add('hidden');
    addTaskModalForm.reset();
  };

  closeAddTaskModalBtn.addEventListener('click', closeAddTaskModal);
  cancelAddTaskModalBtn.addEventListener('click', closeAddTaskModal);
  addTaskModal.addEventListener('click', (e) => {
    if (e.target === addTaskModal) closeAddTaskModal();
  });

  addTaskModalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const title = modalTaskTitle.value.trim();
    if (!title) return;

    const desc = modalTaskDesc.value.trim();
    const dueDate = modalTaskDueDate.value || null;
    const priority = modalTaskPriority.value || 'Sedang';
    const todayStr = getTodayDateString();

    try {
      const { data, error } = await supabase
        .from('daily_tasks')
        .insert({
          user_id: currentUser.id,
          date: todayStr,
          title: title,
          description: desc,
          due_date: dueDate,
          priority: priority,
          completed: false
        })
        .select()
        .single();

      if (error) throw error;

      allTasks.push(data);
      closeAddTaskModal();
      renderTaskProgressAndHomePreview();
      showToast('Tugas berhasil disimpan!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan tugas ke cloud: ' + err.message, 'error');
    }
  });

  // --- 06. RINGKASAN KEHADIRAN BULANAN (Dihitung Nyata dari Data) ---
  const renderMonthlyCalculations = () => {
    const year = currentHistoryPeriod.getFullYear();
    const month = currentHistoryPeriod.getMonth();
    const monthPrefix = `${year}-${padZero(month + 1)}`;

    homeMonthLabel.textContent = currentHistoryPeriod.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    currentPeriodLabel.textContent = homeMonthLabel.textContent;
    pdfPeriodeDisplay.value = homeMonthLabel.textContent;

    const monthRecords = records.filter((r) => r.date.startsWith(monthPrefix));

    let hadir = 0;
    let terlambat = 0;
    let izin = 0;
    let alpa = 0;
    let totalMinutesWorked = 0;

    monthRecords.forEach((r) => {
      if (r.status === 'Hadir' || r.status === 'Hadir (WFO)' || r.status === 'WFH') {
        hadir++;
      } else if (r.status === 'Izin' || r.status === 'Cuti' || r.status === 'Sakit') {
        izin++;
      } else if (r.status === 'Terlambat') {
        terlambat++;
      } else if (r.status === 'Alpa') {
        alpa++;
      }

      if (r.duration_minutes) {
        totalMinutesWorked += r.duration_minutes;
      } else if (r.clock_in && r.clock_out) {
        const d = calculateDuration(r.clock_in, r.clock_out);
        if (d) totalMinutesWorked += d.totalMinutes;
      }
    });

    const totH = Math.floor(totalMinutesWorked / 60);
    const totM = totalMinutesWorked % 60;
    const totalHoursStr = `${padZero(totH)}:${padZero(totM)}`;

    // Update Home Summary
    summaryHadirCount.textContent = hadir;
    summaryTerlambatCount.textContent = terlambat;
    summaryIzinCount.textContent = izin;
    summaryTotalHoursCount.textContent = totalHoursStr;

    // Update History Badges
    histHadirCount.textContent = hadir;
    histTerlambatCount.textContent = terlambat;
    histIzinCount.textContent = izin;
    histAlpaCount.textContent = alpa;

    renderHistoryList(monthRecords);
  };

  const renderHistoryList = (monthRecords) => {
    historyListContainer.innerHTML = '';

    if (monthRecords.length === 0) {
      emptyHistoryState.classList.remove('hidden');
      return;
    }

    emptyHistoryState.classList.add('hidden');

    monthRecords.forEach((r) => {
      const card = document.createElement('div');
      card.className = 'hadirku-card p-4 space-y-2';

      let durText = '-';
      if (r.clock_in && r.clock_out) {
        const d = calculateDuration(r.clock_in, r.clock_out);
        durText = d ? `${d.hours}j ${d.minutes}m` : '-';
      }

      card.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-[#142D4E]">${formatDisplayDateShort(r.date)}</span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#16A34A] border border-emerald-200">
            ${r.status || 'Hadir'}
          </span>
        </div>
        <div class="grid grid-cols-3 gap-2 text-xs pt-1">
          <div class="p-2 rounded-xl bg-slate-50">
            <span class="text-[10px] text-[#64748B] block">Masuk</span>
            <span class="font-bold text-[#142D4E] font-mono">${formatTimeAmPm(r.clock_in)}</span>
          </div>
          <div class="p-2 rounded-xl bg-slate-50">
            <span class="text-[10px] text-[#64748B] block">Pulang</span>
            <span class="font-bold text-[#142D4E] font-mono">${r.clock_out ? formatTimeAmPm(r.clock_out) : '-'}</span>
          </div>
          <div class="p-2 rounded-xl bg-slate-50">
            <span class="text-[10px] text-[#64748B] block">Durasi</span>
            <span class="font-bold text-[#168C85]">${durText}</span>
          </div>
        </div>
      `;

      historyListContainer.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  };

  prevMonthBtn.addEventListener('click', () => {
    currentHistoryPeriod.setMonth(currentHistoryPeriod.getMonth() - 1);
    renderMonthlyCalculations();
  });

  nextMonthBtn.addEventListener('click', () => {
    currentHistoryPeriod.setMonth(currentHistoryPeriod.getMonth() + 1);
    renderMonthlyCalculations();
  });

  // Export CSV
  exportCsvBtn.addEventListener('click', () => {
    if (records.length === 0) {
      showToast('Belum ada data untuk diekspor!', 'warning');
      return;
    }

    const headers = ['Tanggal', 'Status', 'Jam Masuk', 'Jam Pulang', 'Durasi (Menit)', 'Catatan'];
    const rows = records.map((r) => [
      r.date,
      r.status,
      r.clock_in || '-',
      r.clock_out || '-',
      r.duration_minutes || 0,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HadirKu_Riwayat_${getTodayDateString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('File CSV berhasil diunduh!', 'success');
  });

  // --- 03. ABSEN MASUK & PULANG (TERPUSAT DI TOMBOL FINGERPRINT) ---
  const triggerAbsenMasuk = async () => {
    if (!currentUser) return;
    const todayStr = getTodayDateString();
    let today = getTodayRecord();

    if (today && today.clock_in) {
      showToast('Anda sudah melakukan Absen Masuk hari ini!', 'warning');
      return;
    }

    const currentTime = getFormattedCurrentTime();

    try {
      const payload = {
        user_id: currentUser.id,
        date: todayStr,
        status: 'Hadir',
        clock_in: currentTime,
        clock_out: null,
        duration_minutes: 0,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('attendance')
        .upsert(payload, { onConflict: 'user_id,date' })
        .select()
        .single();

      if (error) throw error;

      if (!today) {
        records.unshift(data);
      } else {
        Object.assign(today, data);
      }

      showAbsenSuccessModal('masuk', formatTimeAmPm(currentTime));
    } catch (err) {
      console.error(err);
      showToast('Gagal Absen Masuk: ' + err.message, 'error');
    }
  };

  const triggerAbsenPulang = async () => {
    if (!currentUser) return;
    const today = getTodayRecord();

    if (!today || !today.clock_in) {
      showToast('Anda belum melakukan Absen Masuk!', 'warning');
      return;
    }

    if (today.clock_out) {
      showToast('Anda sudah melakukan Absen Pulang hari ini!', 'warning');
      return;
    }

    const currentTime = getFormattedCurrentTime();
    const dur = calculateDuration(today.clock_in, currentTime);
    const durationMinutes = dur ? dur.totalMinutes : 0;

    try {
      const payload = {
        user_id: currentUser.id,
        date: today.date,
        status: 'Hadir',
        clock_in: today.clock_in,
        clock_out: currentTime,
        duration_minutes: durationMinutes,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('attendance')
        .upsert(payload, { onConflict: 'user_id,date' })
        .select()
        .single();

      if (error) throw error;

      Object.assign(today, data);
      confirmPulangModal.classList.add('hidden');
      showAbsenSuccessModal('pulang', formatTimeAmPm(currentTime));
    } catch (err) {
      console.error(err);
      showToast('Gagal Absen Pulang: ' + err.message, 'error');
    }
  };

  // TOMBOL FLOATING FINGERPRINT ACTION
  centerFabAbsenBtn.addEventListener('click', () => {
    const today = getTodayRecord();

    if (!today || !today.clock_in) {
      // Belum absen masuk -> Langsung Absen Masuk
      triggerAbsenMasuk();
    } else if (today.clock_in && !today.clock_out) {
      // Sedang bekerja -> Tampilkan POP-UP KONFIRMASI ABSEN PULANG
      confirmPulangCurrentTime.textContent = `${formatTimeAmPm(getFormattedCurrentTime())} WITA`;
      confirmPulangModal.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    } else {
      showToast('Absensi hari ini sudah selesai tercatat!', 'info');
      switchTab('home');
    }
  });

  cancelConfirmPulangBtn.addEventListener('click', () => {
    confirmPulangModal.classList.add('hidden');
  });

  proceedConfirmPulangBtn.addEventListener('click', () => {
    triggerAbsenPulang();
  });

  confirmPulangModal.addEventListener('click', (e) => {
    if (e.target === confirmPulangModal) confirmPulangModal.classList.add('hidden');
  });

  // Absen Success Modal
  const showAbsenSuccessModal = (type, timeDisplay) => {
    const isMasuk = type === 'masuk';
    modalSuccessTitle.textContent = isMasuk ? 'Absen Masuk Berhasil!' : 'Absen Pulang Berhasil!';
    modalSuccessTime.textContent = timeDisplay;
    modalSuccessDate.textContent = formatDisplayDateLong(new Date());

    if (isMasuk) {
      modalSuccessBadge.className = 'w-20 h-20 mx-auto rounded-full bg-[#16A34A] text-white flex items-center justify-center shadow-xl shadow-[#16A34A]/30';
      modalSuccessSubtitle.textContent = 'Semangat bekerja! Jangan lupa absen pulang sesuai jam kerja ya!';
    } else {
      modalSuccessBadge.className = 'w-20 h-20 mx-auto rounded-full bg-[#142D4E] text-white flex items-center justify-center shadow-xl shadow-[#142D4E]/30';
      modalSuccessSubtitle.textContent = 'Terima kasih! Hari ini sudah selesai. Sampai jumpa besok!';
    }

    absenSuccessModal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  };

  closeSuccessModalBtn.addEventListener('click', () => {
    absenSuccessModal.classList.add('hidden');
    renderAll();
  });

  // --- EXPORT PDF RESMI (LAPORAN KE ATASAN) ---
  const loadSavedPdfOfficials = () => {
    try {
      const saved = localStorage.getItem(PDF_INFO_KEY);
      if (saved) {
        const info = JSON.parse(saved);
        if (info.namaPegawai) pdfNamaPegawai.value = info.namaPegawai;
        if (info.nipPegawai) pdfNipPegawai.value = info.nipPegawai;
        if (info.jabatanPegawai) pdfJabatanPegawai.value = info.jabatanPegawai;
        if (info.namaAtasan) pdfNamaAtasan.value = info.namaAtasan;
        if (info.nipAtasan) pdfNipAtasan.value = info.nipAtasan;
        if (info.jabatanAtasan) pdfJabatanAtasan.value = info.jabatanAtasan;
        if (info.kota) pdfKotaTtd.value = info.kota;
      }
    } catch (e) {
      console.error(e);
    }
  };

  openExportPdfModalBtn.addEventListener('click', () => {
    loadSavedPdfOfficials();
    pdfPeriodeDisplay.value = currentPeriodLabel.textContent;
    exportPdfModal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  });

  const closeExportPdfModal = () => {
    exportPdfModal.classList.add('hidden');
  };

  closeExportPdfModalBtn.addEventListener('click', closeExportPdfModal);
  cancelExportPdfBtn.addEventListener('click', closeExportPdfModal);
  exportPdfModal.addEventListener('click', (e) => {
    if (e.target === exportPdfModal) closeExportPdfModal();
  });

  exportPdfForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // 1. Simpan info ke LocalStorage
    const pdfInfo = {
      namaPegawai: pdfNamaPegawai.value.trim(),
      nipPegawai: pdfNipPegawai.value.trim(),
      jabatanPegawai: pdfJabatanPegawai.value.trim() || 'Staf',
      namaAtasan: pdfNamaAtasan.value.trim(),
      nipAtasan: pdfNipAtasan.value.trim(),
      jabatanAtasan: pdfJabatanAtasan.value.trim() || 'Atasan Langsung',
      kota: pdfKotaTtd.value.trim() || 'Banjarmasin'
    };
    localStorage.setItem(PDF_INFO_KEY, JSON.stringify(pdfInfo));

    // 2. Siapkan data periode aktif
    const year = currentHistoryPeriod.getFullYear();
    const month = currentHistoryPeriod.getMonth();
    const monthPrefix = `${year}-${padZero(month + 1)}`;
    const monthRecords = records.filter((r) => r.date.startsWith(monthPrefix));

    if (monthRecords.length === 0) {
      showToast('Tidak ada data absensi untuk dicetak pada periode ini!', 'warning');
      return;
    }

    // Sort ascending per tanggal untuk laporan resmi
    const sortedRecords = [...monthRecords].sort((a, b) => (a.date > b.date ? 1 : -1));

    // 3. Masukkan data ke template laporan cetak
    printReportPeriodeTitle.textContent = `PERIODE: ${currentPeriodLabel.textContent.toUpperCase()}`;
    printNamaPegawai.textContent = pdfInfo.namaPegawai;
    printNipPegawai.textContent = pdfInfo.nipPegawai || '-';
    printJabatanPegawai.textContent = pdfInfo.jabatanPegawai;

    printNamaPegawaiBawah.textContent = pdfInfo.namaPegawai;
    printNipPegawaiBawah.textContent = pdfInfo.nipPegawai ? `NIP. ${pdfInfo.nipPegawai}` : '-';

    printNamaAtasan.textContent = pdfInfo.namaAtasan;
    printNipAtasan.textContent = pdfInfo.nipAtasan ? `NIP. ${pdfInfo.nipAtasan}` : '-';
    printJabatanAtasan.textContent = pdfInfo.jabatanAtasan;

    const todayDate = new Date();
    printKotaTanggalCetak.textContent = `${pdfInfo.kota}, ${formatDisplayDateLong(todayDate)}`;

    // Hitung total
    let totalHariHadir = 0;
    let totalMinutes = 0;
    printAttendanceTableBody.innerHTML = '';

    sortedRecords.forEach((r, idx) => {
      if (r.clock_in) totalHariHadir++;
      let durText = '-';
      if (r.duration_minutes) {
        totalMinutes += r.duration_minutes;
        const h = Math.floor(r.duration_minutes / 60);
        const m = r.duration_minutes % 60;
        durText = `${padZero(h)}:${padZero(m)}`;
      } else if (r.clock_in && r.clock_out) {
        const d = calculateDuration(r.clock_in, r.clock_out);
        if (d) {
          totalMinutes += d.totalMinutes;
          durText = d.formattedText;
        }
      }

      const [y, m, d] = r.date.split('-').map(Number);
      const dayDate = new Date(y, m - 1, d);
      const dayName = dayDate.toLocaleDateString('id-ID', { weekday: 'long' });

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align: center;">${idx + 1}</td>
        <td style="text-align: center;">${r.date}</td>
        <td>${dayName}</td>
        <td style="text-align: center;">${r.clock_in ? formatTimeAmPm(r.clock_in) : '-'}</td>
        <td style="text-align: center;">${r.clock_out ? formatTimeAmPm(r.clock_out) : '-'}</td>
        <td style="text-align: center;">${durText}</td>
        <td style="text-align: center; font-weight: bold;">${r.status || 'Hadir'}</td>
        <td>${escapeHtml(r.notes || '-')}</td>
      `;
      printAttendanceTableBody.appendChild(tr);
    });

    const totH = Math.floor(totalMinutes / 60);
    const totM = totalMinutes % 60;
    printTotalHariHadir.textContent = `${totalHariHadir} Hari`;
    printTotalJamKerja.textContent = `${padZero(totH)}:${padZero(totM)} Jam`;

    closeExportPdfModal();
    showToast('Sedang memproses file PDF...', 'info');

    // 4. Unduh PDF via html2pdf
    if (window.html2pdf) {
      const element = document.getElementById('printableReportContainer');
      element.parentElement.classList.remove('hidden');

      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Laporan_Absensi_${pdfInfo.namaPegawai.replace(/\s+/g, '_')}_${currentPeriodLabel.textContent.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      window.html2pdf().set(opt).from(element).save().then(() => {
        element.parentElement.classList.add('hidden');
        showToast('Laporan PDF resmi berhasil diunduh!', 'success');
      }).catch((err) => {
        element.parentElement.classList.add('hidden');
        console.error(err);
        showToast('Gagal membuat PDF: ' + err.message, 'error');
      });
    } else {
      // Fallback ke window.print jika cdn tidak aktif
      window.print();
    }
  });

  // --- Theme Toggle ---
  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      profileThemeIcon.setAttribute('data-lucide', 'sun');
      profileThemeText.textContent = 'Mode Gelap (Dark)';
    } else {
      document.documentElement.classList.remove('dark');
      profileThemeIcon.setAttribute('data-lucide', 'moon');
      profileThemeText.textContent = 'Mode Terang (Light)';
    }
    localStorage.setItem(THEME_KEY, theme);
    if (window.lucide) window.lucide.createIcons();
  };

  themeToggleBtnProfile.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(isDark ? 'light' : 'dark');
  });

  // --- Supabase Config Modal ---
  const openConfigModal = () => {
    const creds = getSupabaseCredentials();
    cfgSupabaseUrl.value = creds.url;
    cfgSupabaseKey.value = creds.key;
    configModal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  };

  const closeConfigModal = () => {
    configModal.classList.add('hidden');
  };

  openConfigBtnAuth.addEventListener('click', openConfigModal);
  openConfigBtnProfile.addEventListener('click', openConfigModal);
  closeConfigModalBtn.addEventListener('click', closeConfigModal);
  cancelConfigModalBtn.addEventListener('click', closeConfigModal);
  configModal.addEventListener('click', (e) => {
    if (e.target === configModal) closeConfigModal();
  });

  configForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = cfgSupabaseUrl.value.trim();
    const key = cfgSupabaseKey.value.trim();

    localStorage.setItem(CFG_URL_KEY, url);
    localStorage.setItem(CFG_KEY_KEY, key);

    closeConfigModal();

    if (initSupabaseClient()) {
      showToast('Koneksi Supabase tersimpan!', 'success');
      checkInitialAuth();
    }
  });

  // --- Master Render Function ---
  const renderAll = () => {
    updateCircularTimerAndState();
    renderWeeklyCalendar();
    renderTaskProgressAndHomePreview();
    renderMonthlyCalculations();
  };

  // --- Initial Auth Check ---
  const checkInitialAuth = async () => {
    if (!supabase) {
      showAuthView();
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        currentUser = session.user;
        await loadAllDataFromCloud();
      } else {
        showAuthView();
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session && session.user) {
          currentUser = session.user;
          await loadAllDataFromCloud();
        } else {
          currentUser = null;
          showAuthView();
        }
      });
    } catch (err) {
      console.error('Auth error:', err);
      showAuthView();
    }
  };

  // --- Application Initialization ---
  const init = () => {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    applyTheme(savedTheme);

    // Live clock & circular progress updates
    setInterval(() => {
      updateCircularTimerAndState();
    }, 1000);

    initSupabaseClient();

    // Fade out splash screen after 1.5s
    setTimeout(() => {
      splashScreen.classList.add('opacity-0', 'pointer-events-none');
      setTimeout(() => splashScreen.remove(), 500);
      checkInitialAuth();
    }, 1500);

    if (window.lucide) window.lucide.createIcons();
  };

  init();
})();
