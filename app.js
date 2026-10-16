/**
 * AbsensiKu - Aplikasi Pencatat Kehadiran & Daily Tasks Pribadi
 * Pure JavaScript with LocalStorage & PWA Support
 */

(() => {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEY = 'absensiku_records_v2';
  const THEME_KEY = 'absensiku_theme';

  // --- State ---
  let records = [];
  let selectedStatus = 'Hadir (WFO)';
  let timerInterval = null;
  let deferredPrompt = null;

  // --- DOM Elements ---
  const liveClockEl = document.getElementById('liveClock');
  const fullDateDisplayEl = document.getElementById('fullDateDisplay');
  const greetingTextEl = document.getElementById('greetingText');
  const headerDateTextEl = document.getElementById('headerDateText');
  const todayStatusPillEl = document.getElementById('todayStatusPill');

  const todayClockInTextEl = document.getElementById('todayClockInText');
  const todayClockOutTextEl = document.getElementById('todayClockOutText');
  const workingTimerContainerEl = document.getElementById('workingTimerContainer');
  const activeDurationTimerEl = document.getElementById('activeDurationTimer');

  const statusButtonGroup = document.getElementById('statusButtonGroup');
  const workingActionButtons = document.getElementById('workingActionButtons');
  const clockInBtn = document.getElementById('clockInBtn');
  const clockOutBtn = document.getElementById('clockOutBtn');
  const leaveActionButton = document.getElementById('leaveActionButton');
  const logLeaveBtn = document.getElementById('logLeaveBtn');
  const logLeaveBtnText = document.getElementById('logLeaveBtnText');
  const todayCompletedActions = document.getElementById('todayCompletedActions');
  const editTodayEntryBtn = document.getElementById('editTodayEntryBtn');
  const quickManualBtn = document.getElementById('quickManualBtn');
  const todayNotesInput = document.getElementById('todayNotesInput');

  // Task Elements
  const addTaskForm = document.getElementById('addTaskForm');
  const newTaskInput = document.getElementById('newTaskInput');
  const taskListContainer = document.getElementById('taskListContainer');
  const emptyTaskState = document.getElementById('emptyTaskState');
  const taskProgressBadge = document.getElementById('taskProgressBadge');
  const taskProgressBar = document.getElementById('taskProgressBar');

  // Stats Elements
  const statTotalDaysEl = document.getElementById('statTotalDays');
  const statTotalHoursEl = document.getElementById('statTotalHours');
  const statAvgHoursEl = document.getElementById('statAvgHours');
  const statLeaveDaysEl = document.getElementById('statLeaveDays');

  // History List
  const historyListContainer = document.getElementById('historyListContainer');
  const emptyHistoryState = document.getElementById('emptyHistoryState');
  const exportCsvBtn = document.getElementById('exportCsvBtn');

  // Modal Elements
  const entryModal = document.getElementById('entryModal');
  const modalTitle = document.getElementById('modalTitle');
  const entryForm = document.getElementById('entryForm');
  const formEntryId = document.getElementById('formEntryId');
  const formDate = document.getElementById('formDate');
  const formStatus = document.getElementById('formStatus');
  const formClockIn = document.getElementById('formClockIn');
  const formClockOut = document.getElementById('formClockOut');
  const formTimesRow = document.getElementById('formTimesRow');
  const formNotes = document.getElementById('formNotes');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');

  // Theme & Backup
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const installPwaBtn = document.getElementById('installPwaBtn');
  const backupDataBtn = document.getElementById('backupDataBtn');
  const restoreDataInput = document.getElementById('restoreDataInput');
  const toastContainer = document.getElementById('toastContainer');

  // --- Utility Helpers ---
  const padZero = (num) => String(num).padStart(2, '0');

  const getTodayDateString = () => {
    const now = new Date();
    return `${now.getFullYear()}-${padZero(now.getMonth() + 1)}-${padZero(now.getDate())}`;
  };

  const getFormattedCurrentTime = () => {
    const now = new Date();
    return `${padZero(now.getHours())}:${padZero(now.getMinutes())}:${padZero(now.getSeconds())}`;
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
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
      totalSeconds: diffSec,
      totalMinutes: Math.floor(diffSec / 60),
      hours,
      minutes,
      seconds,
      formattedText: `${hours}j ${minutes}m`
    };
  };

  // --- LocalStorage Operations ---
  const loadRecords = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      records = data ? JSON.parse(data) : [];
      // Ensure tasks array exists on every record
      records.forEach((r) => {
        if (!Array.isArray(r.tasks)) r.tasks = [];
      });
      records.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
    } catch (e) {
      console.error('Gagal membaca data dari LocalStorage:', e);
      records = [];
    }
  };

  const saveRecords = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Gagal menyimpan data ke LocalStorage:', e);
      showToast('Gagal menyimpan data ke browser!', 'error');
    }
  };

  const getTodayRecord = () => {
    const todayStr = getTodayDateString();
    return records.find((r) => r.date === todayStr);
  };

  const getOrCreateTodayRecord = () => {
    let today = getTodayRecord();
    if (!today) {
      today = {
        id: `rec_${Date.now()}`,
        date: getTodayDateString(),
        status: selectedStatus,
        clockIn: null,
        clockOut: null,
        durationMinutes: 0,
        notes: '',
        tasks: [],
        createdAt: new Date().toISOString()
      };
      records.unshift(today);
      saveRecords();
    }
    return today;
  };

  // --- Toast Notification ---
  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `toast-enter flex items-center gap-2.5 p-3 rounded-2xl border shadow-2xl text-xs text-white pointer-events-auto transition ${
      type === 'success'
        ? 'bg-emerald-950/95 border-emerald-600/80 text-emerald-100'
        : type === 'error'
        ? 'bg-rose-950/95 border-rose-600/80 text-rose-100'
        : type === 'warning'
        ? 'bg-amber-950/95 border-amber-600/80 text-amber-100'
        : 'bg-slate-800/95 border-slate-600 text-slate-100'
    }`;

    const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info';
    toast.innerHTML = `
      <i data-lucide="${iconName}" class="w-4 h-4 flex-shrink-0"></i>
      <span class="flex-1 font-medium leading-relaxed">${message}</span>
    `;

    toastContainer.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.classList.remove('toast-enter');
      toast.classList.add('toast-leave');
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  };

  // --- Realtime Clock & Greeting ---
  const updateClockAndGreeting = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    liveClockEl.textContent = `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;

    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('id-ID', dateOptions);
    fullDateDisplayEl.textContent = dateStr;
    headerDateTextEl.textContent = dateStr;

    let greeting = 'Selamat Datang';
    let greetingIcon = 'sparkles';
    if (hours >= 4 && hours < 11) {
      greeting = 'Selamat Pagi ☀️';
      greetingIcon = 'sun';
    } else if (hours >= 11 && hours < 15) {
      greeting = 'Selamat Siang 🌤️';
      greetingIcon = 'sun-medium';
    } else if (hours >= 15 && hours < 18) {
      greeting = 'Selamat Sore 🌇';
      greetingIcon = 'sunset';
    } else {
      greeting = 'Selamat Malam 🌙';
      greetingIcon = 'moon';
    }

    greetingTextEl.innerHTML = `
      <i data-lucide="${greetingIcon}" class="w-3.5 h-3.5"></i>
      <span>${greeting}</span>
    `;
    if (window.lucide) window.lucide.createIcons();
  };

  // --- Live Timer ---
  const updateActiveDurationTimer = (clockInTime) => {
    const now = new Date();
    const [inH, inM, inS = 0] = clockInTime.split(':').map(Number);
    const inDate = new Date();
    inDate.setHours(inH, inM, inS, 0);

    let diffSec = Math.floor((now.getTime() - inDate.getTime()) / 1000);
    if (diffSec < 0) diffSec = 0;

    const h = Math.floor(diffSec / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    const s = diffSec % 60;

    activeDurationTimerEl.textContent = `${padZero(h)}j ${padZero(m)}m ${padZero(s)}d`;
  };

  // --- UI Update: Today Attendance ---
  const renderTodayStatus = () => {
    const today = getTodayRecord();

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    if (!today || (!today.clockIn && !['Izin', 'Cuti', 'Sakit'].includes(today.status))) {
      todayStatusPillEl.textContent = 'Belum Absen';
      todayStatusPillEl.className = 'text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-800 text-slate-300 border border-slate-700';
      todayClockInTextEl.textContent = '--:--';
      todayClockOutTextEl.textContent = '--:--';
      workingTimerContainerEl.classList.add('hidden');
      todayCompletedActions.classList.add('hidden');

      clockInBtn.disabled = false;
      clockOutBtn.disabled = true;
      clockInBtn.classList.remove('opacity-50', 'cursor-not-allowed');

      updateStatusSelectionUI();
      renderTasks();
      return;
    }

    if (today.notes && !todayNotesInput.value) {
      todayNotesInput.value = today.notes;
    }

    const isLeave = ['Izin', 'Cuti', 'Sakit'].includes(today.status);
    if (isLeave) {
      todayStatusPillEl.textContent = today.status;
      todayStatusPillEl.className = 'text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40';

      todayClockInTextEl.textContent = 'Izin/Libur';
      todayClockOutTextEl.textContent = 'Izin/Libur';
      workingTimerContainerEl.classList.add('hidden');

      workingActionButtons.classList.add('hidden');
      leaveActionButton.classList.add('hidden');
      todayCompletedActions.classList.remove('hidden');
      renderTasks();
      return;
    }

    if (today.clockIn && !today.clockOut) {
      // Sedang Bekerja
      todayStatusPillEl.textContent = `Bekerja (${today.status})`;
      todayStatusPillEl.className = 'text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';

      todayClockInTextEl.textContent = today.clockIn;
      todayClockOutTextEl.textContent = '--:--';

      workingTimerContainerEl.classList.remove('hidden');
      todayCompletedActions.classList.add('hidden');
      workingActionButtons.classList.remove('hidden');
      leaveActionButton.classList.add('hidden');

      clockInBtn.disabled = true;
      clockInBtn.classList.add('opacity-50', 'cursor-not-allowed');
      clockOutBtn.disabled = false;
      clockOutBtn.classList.remove('opacity-40', 'bg-slate-800', 'cursor-not-allowed');

      updateActiveDurationTimer(today.clockIn);
      timerInterval = setInterval(() => {
        updateActiveDurationTimer(today.clockIn);
      }, 1000);
    } else if (today.clockIn && today.clockOut) {
      // Selesai Bekerja
      todayStatusPillEl.textContent = 'Sudah Pulang';
      todayStatusPillEl.className = 'text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40';

      todayClockInTextEl.textContent = today.clockIn;
      todayClockOutTextEl.textContent = today.clockOut;

      const dur = calculateDuration(today.clockIn, today.clockOut);
      workingTimerContainerEl.classList.remove('hidden');
      document.querySelector('#workingTimerContainer span.text-[11px]').textContent = 'Durasi Kerja';
      activeDurationTimerEl.textContent = dur ? `${dur.hours}j ${dur.minutes}m` : '-';

      clockInBtn.disabled = true;
      clockOutBtn.disabled = true;
      workingActionButtons.classList.remove('hidden');
      leaveActionButton.classList.add('hidden');
      todayCompletedActions.classList.remove('hidden');
    }

    renderTasks();
    if (window.lucide) window.lucide.createIcons();
  };

  const updateStatusSelectionUI = () => {
    const isLeave = ['Izin', 'Cuti', 'Sakit'].includes(selectedStatus);
    const today = getTodayRecord();

    if (today && (today.clockOut || ['Izin', 'Cuti', 'Sakit'].includes(today.status))) {
      workingActionButtons.classList.add('hidden');
      leaveActionButton.classList.add('hidden');
      todayCompletedActions.classList.remove('hidden');
      return;
    }

    if (isLeave) {
      workingActionButtons.classList.add('hidden');
      leaveActionButton.classList.remove('hidden');
      logLeaveBtnText.textContent = `Catat ${selectedStatus} Hari Ini`;
    } else {
      workingActionButtons.classList.remove('hidden');
      leaveActionButton.classList.add('hidden');
    }
  };

  statusButtonGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.status-btn');
    if (!btn) return;

    statusButtonGroup.querySelectorAll('.status-btn').forEach((b) => b.classList.remove('active-status'));
    btn.classList.add('active-status');
    selectedStatus = btn.dataset.status;

    updateStatusSelectionUI();
  });

  // --- Clock In & Clock Out Actions ---
  clockInBtn.addEventListener('click', () => {
    let today = getOrCreateTodayRecord();

    if (today.clockIn) {
      showToast('Anda sudah melakukan Absen Masuk hari ini!', 'warning');
      return;
    }

    const currentTime = getFormattedCurrentTime();
    today.status = selectedStatus;
    today.clockIn = currentTime;
    today.updatedAt = new Date().toISOString();

    saveRecords();
    renderAll();
    showToast(`Absen Masuk berhasil dicatat pukul ${currentTime}! Selamat beraktivitas!`, 'success');
  });

  clockOutBtn.addEventListener('click', () => {
    const today = getTodayRecord();
    if (!today || !today.clockIn) {
      showToast('Anda belum melakukan Absen Masuk!', 'warning');
      return;
    }

    if (today.clockOut) {
      showToast('Anda sudah melakukan Absen Pulang hari ini!', 'warning');
      return;
    }

    const currentTime = getFormattedCurrentTime();
    today.clockOut = currentTime;

    const dur = calculateDuration(today.clockIn, currentTime);
    today.durationMinutes = dur ? dur.totalMinutes : 0;
    today.updatedAt = new Date().toISOString();

    saveRecords();
    renderAll();
    showToast(
      `Absen Pulang berhasil dicatat pukul ${currentTime}! Durasi: ${dur ? dur.formattedText : '0 menit'}`,
      'success'
    );
  });

  logLeaveBtn.addEventListener('click', () => {
    let today = getOrCreateTodayRecord();

    if (today.clockIn && !confirm(`Hari ini sudah absen masuk. Ubah status hari ini menjadi ${selectedStatus}?`)) {
      return;
    }

    today.status = selectedStatus;
    today.clockIn = null;
    today.clockOut = null;
    today.durationMinutes = 0;
    today.updatedAt = new Date().toISOString();

    saveRecords();
    renderAll();
    showToast(`Status ${selectedStatus} berhasil dicatat untuk hari ini!`, 'success');
  });

  todayNotesInput.addEventListener('change', () => {
    const today = getOrCreateTodayRecord();
    today.notes = todayNotesInput.value.trim();
    saveRecords();
  });

  // --- DAILY TASK PLANNER (Opsi A) ---
  const renderTasks = () => {
    const today = getTodayRecord();
    const tasks = today && Array.isArray(today.tasks) ? today.tasks : [];

    taskListContainer.innerHTML = '';

    if (tasks.length === 0) {
      emptyTaskState.classList.remove('hidden');
      taskProgressBadge.textContent = '0/0 Selesai';
      taskProgressBar.style.width = '0%';
      return;
    }

    emptyTaskState.classList.add('hidden');

    const completedCount = tasks.filter((t) => t.completed).length;
    const totalCount = tasks.length;
    const percent = Math.round((completedCount / totalCount) * 100);

    taskProgressBadge.textContent = `${completedCount}/${totalCount} Selesai (${percent}%)`;
    taskProgressBar.style.width = `${percent}%`;

    tasks.forEach((task) => {
      const taskDiv = document.createElement('div');
      taskDiv.className = `task-item flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 ${
        task.completed ? 'completed-task' : ''
      }`;

      taskDiv.innerHTML = `
        <label class="flex items-center gap-3 cursor-pointer flex-1 min-w-0 pr-2">
          <input 
            type="checkbox" 
            class="toggle-task-cb w-4 h-4 rounded-lg bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            data-id="${task.id}"
            ${task.completed ? 'checked' : ''}
          />
          <span class="task-title text-xs sm:text-sm text-slate-200 select-none truncate font-medium">
            ${escapeHtml(task.title)}
          </span>
        </label>
        <button 
          type="button" 
          class="delete-task-btn p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 transition"
          data-id="${task.id}"
          title="Hapus task"
        >
          <i data-lucide="trash" class="w-3.5 h-3.5"></i>
        </button>
      `;

      taskListContainer.appendChild(taskDiv);
    });

    if (window.lucide) window.lucide.createIcons();
  };

  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  addTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = newTaskInput.value.trim();
    if (!title) return;

    const today = getOrCreateTodayRecord();
    if (!Array.isArray(today.tasks)) today.tasks = [];

    today.tasks.push({
      id: `task_${Date.now()}`,
      title: title,
      completed: false
    });

    saveRecords();
    newTaskInput.value = '';
    renderTasks();
    showToast('Task berhasil ditambahkan!', 'success');
  });

  taskListContainer.addEventListener('click', (e) => {
    const cb = e.target.closest('.toggle-task-cb');
    if (cb) {
      const taskId = cb.dataset.id;
      const today = getTodayRecord();
      if (!today || !today.tasks) return;

      const target = today.tasks.find((t) => t.id === taskId);
      if (target) {
        target.completed = cb.checked;
        saveRecords();
        renderTasks();
        if (target.completed) {
          showToast('Keren! Task selesai dicentang.', 'success');
        }
      }
      return;
    }

    const delBtn = e.target.closest('.delete-task-btn');
    if (delBtn) {
      const taskId = delBtn.dataset.id;
      const today = getTodayRecord();
      if (!today || !today.tasks) return;

      today.tasks = today.tasks.filter((t) => t.id !== taskId);
      saveRecords();
      renderTasks();
      showToast('Task telah dihapus.', 'info');
    }
  });

  // --- Statistics ---
  const renderStatistics = () => {
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${padZero(now.getMonth() + 1)}`;
    const currentMonthRecords = records.filter((r) => r.date.startsWith(currentYearMonth));

    let workDaysCount = 0;
    let totalMinutes = 0;
    let leaveDaysCount = 0;

    currentMonthRecords.forEach((r) => {
      if (['Hadir (WFO)', 'WFH'].includes(r.status) && r.clockIn) {
        workDaysCount++;
        if (r.durationMinutes) {
          totalMinutes += r.durationMinutes;
        } else if (r.clockIn && r.clockOut) {
          const d = calculateDuration(r.clockIn, r.clockOut);
          if (d) totalMinutes += d.totalMinutes;
        }
      } else if (['Izin', 'Cuti', 'Sakit'].includes(r.status)) {
        leaveDaysCount++;
      }
    });

    const totalHoursFloat = (totalMinutes / 60).toFixed(1);
    const avgHoursFloat = workDaysCount > 0 ? (totalMinutes / 60 / workDaysCount).toFixed(1) : '0.0';

    statTotalDaysEl.textContent = `${workDaysCount} Hari`;
    statTotalHoursEl.textContent = `${totalHoursFloat} Jam`;
    statAvgHoursEl.textContent = `${avgHoursFloat} Jam`;
    statLeaveDaysEl.textContent = `${leaveDaysCount} Hari`;
  };

  // --- History List (Mobile Friendly Cards) ---
  const renderHistoryList = () => {
    historyListContainer.innerHTML = '';

    if (records.length === 0) {
      emptyHistoryState.classList.remove('hidden');
      return;
    }

    emptyHistoryState.classList.add('hidden');

    records.forEach((r) => {
      const card = document.createElement('div');
      card.className = 'p-4 hover:bg-slate-900/50 transition flex flex-col gap-2.5';

      let durationText = '-';
      if (r.clockIn && r.clockOut) {
        const d = calculateDuration(r.clockIn, r.clockOut);
        durationText = d ? `${d.hours}j ${d.minutes}m` : '-';
      } else if (r.clockIn && !r.clockOut && r.date === getTodayDateString()) {
        durationText = '<span class="text-emerald-400 font-medium">Berjalan</span>';
      }

      // Tasks summary
      const taskCount = Array.isArray(r.tasks) ? r.tasks.length : 0;
      const completedTaskCount = Array.isArray(r.tasks) ? r.tasks.filter((t) => t.completed).length : 0;

      card.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-bold text-xs sm:text-sm text-slate-100">${formatShortDate(r.date)}</span>
            ${getStatusBadgeHtml(r.status)}
          </div>
          <div class="flex items-center gap-1">
            <button type="button" class="edit-hist-btn p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition" data-id="${r.id}" title="Edit Data">
              <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
            </button>
            <button type="button" class="delete-hist-btn p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition" data-id="${r.id}" title="Hapus Data">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/80">
          <div>
            <span class="text-[10px] text-slate-500 block">Masuk</span>
            <span class="font-mono text-slate-300 font-semibold">${r.clockIn || '-'}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-500 block">Pulang</span>
            <span class="font-mono text-slate-300 font-semibold">${r.clockOut || '-'}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-500 block">Durasi</span>
            <span class="text-indigo-400 font-semibold">${durationText}</span>
          </div>
        </div>

        ${
          taskCount > 0
            ? `<div class="text-[11px] text-slate-400 flex items-center gap-1.5">
                <i data-lucide="check-square" class="w-3 h-3 text-indigo-400"></i>
                <span>Task: <strong>${completedTaskCount}/${taskCount}</strong> selesai</span>
              </div>`
            : ''
        }

        ${
          r.notes
            ? `<div class="text-[11px] text-slate-400 italic bg-slate-800/40 px-2.5 py-1 rounded-xl">
                "${escapeHtml(r.notes)}"
              </div>`
            : ''
        }
      `;

      historyListContainer.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  };

  const getStatusBadgeHtml = (status) => {
    switch (status) {
      case 'Hadir (WFO)':
        return `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">WFO</span>`;
      case 'WFH':
        return `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">WFH</span>`;
      case 'Izin':
        return `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">Izin</span>`;
      case 'Cuti':
        return `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-500/20 text-violet-400 border border-violet-500/30">Cuti</span>`;
      case 'Sakit':
        return `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">Sakit</span>`;
      default:
        return `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-400">${status}</span>`;
    }
  };

  // History List Actions (Edit / Delete)
  historyListContainer.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-hist-btn');
    if (editBtn) {
      openEditModal(editBtn.dataset.id);
      return;
    }

    const deleteBtn = e.target.closest('.delete-hist-btn');
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      const targetRecord = records.find((r) => r.id === id);
      if (targetRecord && confirm(`Hapus absensi tanggal ${targetRecord.date}?`)) {
        records = records.filter((r) => r.id !== id);
        saveRecords();
        renderAll();
        showToast('Data absensi berhasil dihapus.', 'info');
      }
    }
  });

  // --- Modal Operations ---
  const openModal = (title = 'Tambah Data Absensi') => {
    modalTitle.innerHTML = `<i data-lucide="edit-3" class="w-4 h-4 text-indigo-400"></i> ${title}`;
    entryModal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  };

  const closeModal = () => {
    entryModal.classList.add('hidden');
    entryForm.reset();
    formEntryId.value = '';
  };

  closeModalBtn.addEventListener('click', closeModal);
  cancelModalBtn.addEventListener('click', closeModal);
  entryModal.addEventListener('click', (e) => {
    if (e.target === entryModal) closeModal();
  });

  const openEditModal = (id) => {
    const rec = records.find((r) => r.id === id);
    if (!rec) return;

    formEntryId.value = rec.id;
    formDate.value = rec.date;
    formStatus.value = rec.status;
    formClockIn.value = rec.clockIn || '';
    formClockOut.value = rec.clockOut || '';
    formNotes.value = rec.notes || '';

    handleModalStatusTimesVisibility();
    openModal('Edit Data Absensi');
  };

  const handleModalStatusTimesVisibility = () => {
    const isLeave = ['Izin', 'Cuti', 'Sakit'].includes(formStatus.value);
    if (isLeave) {
      formTimesRow.classList.add('hidden');
    } else {
      formTimesRow.classList.remove('hidden');
    }
  };

  formStatus.addEventListener('change', handleModalStatusTimesVisibility);

  quickManualBtn.addEventListener('click', () => {
    formEntryId.value = '';
    formDate.value = getTodayDateString();
    formStatus.value = 'Hadir (WFO)';
    formClockIn.value = '08:00';
    formClockOut.value = '17:00';
    formNotes.value = '';
    handleModalStatusTimesVisibility();
    openModal('Input Absensi Manual');
  });

  editTodayEntryBtn.addEventListener('click', () => {
    const today = getTodayRecord();
    if (today) openEditModal(today.id);
  });

  entryForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = formEntryId.value;
    const date = formDate.value;
    const status = formStatus.value;
    const isLeave = ['Izin', 'Cuti', 'Sakit'].includes(status);
    const clockIn = isLeave ? null : formClockIn.value || null;
    const clockOut = isLeave ? null : formClockOut.value || null;
    const notes = formNotes.value.trim();

    let durationMinutes = 0;
    if (clockIn && clockOut) {
      const d = calculateDuration(clockIn, clockOut);
      durationMinutes = d ? d.totalMinutes : 0;
    }

    if (id) {
      const existing = records.find((r) => r.id === id);
      if (existing) {
        existing.date = date;
        existing.status = status;
        existing.clockIn = clockIn;
        existing.clockOut = clockOut;
        existing.durationMinutes = durationMinutes;
        existing.notes = notes;
        existing.updatedAt = new Date().toISOString();
      }
    } else {
      const existingDate = records.find((r) => r.date === date);
      if (existingDate) {
        if (!confirm(`Catatan untuk tanggal ${date} sudah ada. Ingin memperbaruinya?`)) return;
        existingDate.status = status;
        existingDate.clockIn = clockIn;
        existingDate.clockOut = clockOut;
        existingDate.durationMinutes = durationMinutes;
        existingDate.notes = notes;
        existingDate.updatedAt = new Date().toISOString();
      } else {
        records.push({
          id: `rec_${Date.now()}`,
          date,
          status,
          clockIn,
          clockOut,
          durationMinutes,
          notes,
          tasks: [],
          createdAt: new Date().toISOString()
        });
      }
    }

    records.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
    saveRecords();
    closeModal();
    renderAll();
    showToast('Data absensi tersimpan!', 'success');
  });

  // --- Export CSV ---
  exportCsvBtn.addEventListener('click', () => {
    if (records.length === 0) {
      showToast('Belum ada data untuk di-export!', 'warning');
      return;
    }

    const headers = ['Tanggal', 'Status', 'Jam Masuk', 'Jam Pulang', 'Durasi (Menit)', 'Task Selesai', 'Total Task', 'Catatan'];
    const rows = records.map((r) => {
      const taskCount = Array.isArray(r.tasks) ? r.tasks.length : 0;
      const completedCount = Array.isArray(r.tasks) ? r.tasks.filter((t) => t.completed).length : 0;
      return [
        r.date,
        r.status,
        r.clockIn || '-',
        r.clockOut || '-',
        r.durationMinutes || 0,
        completedCount,
        taskCount,
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AbsensiKu_Export_${getTodayDateString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('File CSV berhasil diunduh!', 'success');
  });

  // --- Backup & Restore ---
  backupDataBtn.addEventListener('click', () => {
    if (records.length === 0) {
      showToast('Belum ada data untuk di-backup!', 'warning');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `AbsensiKu_Backup_${getTodayDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Backup JSON berhasil di-download!', 'success');
  });

  restoreDataInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          if (confirm(`Impor ${imported.length} data absensi?`)) {
            const existingMap = new Map(records.map((r) => [r.date, r]));
            imported.forEach((item) => {
              if (item.date) existingMap.set(item.date, item);
            });
            records = Array.from(existingMap.values());
            records.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
            saveRecords();
            renderAll();
            showToast('Data absensi berhasil dipulihkan!', 'success');
          }
        }
      } catch (err) {
        showToast('Format JSON tidak valid!', 'error');
      }
    };
    reader.readAsText(file);
    restoreDataInput.value = '';
  });

  // --- Theme Toggle ---
  const applyTheme = (theme) => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      themeIcon.setAttribute('data-lucide', 'moon');
    } else {
      document.documentElement.classList.add('dark');
      themeIcon.setAttribute('data-lucide', 'sun');
    }
    localStorage.setItem(THEME_KEY, theme);
    if (window.lucide) window.lucide.createIcons();
  };

  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(isDark ? 'light' : 'dark');
  });

  // --- PWA Installation ---
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installPwaBtn.classList.remove('hidden');
    installPwaBtn.classList.add('flex');
  });

  installPwaBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast('Aplikasi berhasil dipasang!', 'success');
    }
    deferredPrompt = null;
    installPwaBtn.classList.add('hidden');
    installPwaBtn.classList.remove('flex');
  });

  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((err) => console.log('SW error:', err));
    });
  }

  // --- Render All ---
  const renderAll = () => {
    renderTodayStatus();
    renderStatistics();
    renderHistoryList();
  };

  // --- Initialization ---
  const init = () => {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    applyTheme(savedTheme);

    loadRecords();
    updateClockAndGreeting();
    setInterval(updateClockAndGreeting, 1000);

    renderAll();
    if (window.lucide) window.lucide.createIcons();
  };

  init();
})();
