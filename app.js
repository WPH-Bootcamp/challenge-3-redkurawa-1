// ============================================
// HABIT TRACKER CLI - CHALLENGE 3
// ============================================
// NAMA: [Isi nama Anda]
// KELAS: [Isi kelas Anda]
// TANGGAL: [Isi tanggal pengerjaan]
// ============================================

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Konstanta
const DATA_FILE = path.join(__dirname, 'habits-data.json');
const REMINDER_INTERVAL = 10_000; // 10 detik (WAJIB: reminder otomatis)
const DAYS_IN_WEEK = 7;

// Readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Util promisify question
function askQuestion(q) {
  return new Promise((resolve) => rl.question(q, (ans) => resolve(ans)));
}

// Util: format tanggal yyyy-mm-dd
function toYMD(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Util: awal minggu (Senin)
function startOfThisWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Minggu, 1 Senin, ... 6 Sabtu
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ============================================
// USER PROFILE OBJECT
// ============================================
const userProfile = {
  name: '',
  joinDate: toYMD(),
  totalHabits: 0,
  completedThisWeek: 0,

  updateStats(habits = []) {
    this.totalHabits = habits.length;
    // hitung selesai minggu ini: habit yang capai target
    const completed = habits.filter((h) => h.isCompletedThisWeek()).length;
    this.completedThisWeek = completed;
    if (!this.joinDate) this.joinDate = toYMD();
  },

  getDaysJoined() {
    const start = new Date(this.joinDate);
    const now = new Date();
    const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  },
};

// ============================================
// HABIT CLASS
// ============================================
class Habit {
  constructor(name, targetFrequency) {
    this.id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.name = name;
    this.targetFrequency = Number(targetFrequency) || 1; // x/minggu
    this.completions = []; // ["yyyy-mm-dd", ...]
    this.createdAt = toYMD();
  }

  markComplete(date = new Date()) {
    const ymd = toYMD(date);
    if (!this.completions.includes(ymd)) {
      this.completions.push(ymd);
    }
  }

  getThisWeekCompletions() {
    const startWeek = startOfThisWeek();
    return this.completions.filter((c) => new Date(c) >= startWeek).length; // Array.filter
  }

  isCompletedThisWeek() {
    return this.getThisWeekCompletions() >= this.targetFrequency;
  }

  getProgressPercentage() {
    const done = this.getThisWeekCompletions();
    const pct = Math.round((done / Math.max(1, this.targetFrequency)) * 100);
    return Math.max(0, Math.min(100, pct));
  }

  getStatus() {
    return this.isCompletedThisWeek() ? 'Selesai' : 'Aktif';
  }
}

// ============================================
// HABIT TRACKER CLASS
// ============================================
class HabitTracker {
  constructor(profile) {
    this.profile = profile;
    this.habits = [];
    this._reminderId = null;
  }

  addHabit(name, frequency) {
    const nm = (name ?? '').trim(); // (1) Nullish coalescing
    if (!nm) {
      console.log('❌ Nama habit tidak boleh kosong.\n');
      return;
    }
    const fq = Number((frequency ?? '1').toString().trim()) || 1; // (2) Nullish coalescing
    this.habits.push(new Habit(nm, fq));
    this.profile.updateStats(this.habits);
    console.log('✅ Habit ditambahkan.\n');
  }

  completeHabit(displayIndex) {
    // input menu 1-based, simpan 0-based
    const idx = Number(displayIndex) - 1;
    const target = this.habits[idx] ?? null; // (3) Nullish coalescing
    if (!target) {
      console.log('❌ Indeks tidak valid.\n');
      return;
    }
    target.markComplete();
    this.profile.updateStats(this.habits);
    console.log(`✅ "${target.name}" ditandai selesai hari ini.\n`);
  }

  deleteHabit(displayIndex) {
    const idx = Number(displayIndex) - 1;
    if (Number.isNaN(idx) || idx < 0 || idx >= this.habits.length) {
      console.log('❌ Indeks tidak valid.\n');
      return;
    }
    const removed = this.habits.splice(idx, 1);
    this.profile.updateStats(this.habits);
    console.log(`🗑️  Habit "${removed[0].name}" dihapus.\n`);
  }

  displayProfile() {
    console.log('==================================================');
    console.log('HABIT TRACKER - PROFIL');
    console.log('==================================================');
    console.log(`Nama               : ${this.profile.name || '-'}`);
    console.log(`Tanggal Bergabung  : ${this.profile.joinDate}`);
    console.log(`Total Habit        : ${this.profile.totalHabits}`);
    console.log(`Selesai Minggu Ini : ${this.profile.completedThisWeek}`);
    console.log(
      `Hari ke-           : ${this.profile.getDaysJoined()} sejak bergabung`
    );
    console.log('==================================================\n');
  }

  _renderHabitLine(h, i) {
    const done = h.getThisWeekCompletions();
    const pct = h.getProgressPercentage();
    const filled = '█'.repeat(Math.round((pct / 100) * 10));
    const empty = '░'.repeat(10 - filled.length);
    console.log(
      `${i + 1}. [${h.getStatus()}] ${h.name}\n   Target: ${
        h.targetFrequency
      }x/minggu\n   ` +
        `Progress: ${done}/${h.targetFrequency} (${pct}%)\n   ` +
        `Progress Bar: ${filled}${empty} ${pct}%\n`
    );
  }

  displayHabits(filter = 'all') {
    const list =
      filter === 'active'
        ? this.habits.filter((h) => !h.isCompletedThisWeek()) // filter
        : filter === 'completed'
        ? this.habits.filter((h) => h.isCompletedThisWeek()) // filter
        : this.habits;

    console.log('==================================================');
    console.log('DAFTAR KEBIASAAN');
    console.log('==================================================');
    if (list.length === 0) {
      console.log('(kosong)\n');
      return;
    }
    list.forEach((h, i) => this._renderHabitLine(h, i)); // forEach
  }

  displayHabitsWithWhile() {
    console.log('=== Demo while loop ===');
    let i = 0;
    if (this.habits.length === 0) {
      console.log('(kosong)\n');
      return;
    }
    while (i < this.habits.length) {
      // while loop
      const h = this.habits[i];
      console.log(
        `${i + 1}. ${h.name} — ${h.getThisWeekCompletions()}/${
          h.targetFrequency
        }`
      );
      i++;
    }
    console.log('');
  }

  displayHabitsWithFor() {
    console.log('=== Demo for loop ===');
    if (this.habits.length === 0) {
      console.log('(kosong)\n');
      return;
    }
    for (let i = 0; i < this.habits.length; i++) {
      // for loop
      const h = this.habits[i];
      console.log(
        `${i + 1}. ${h.name} — ${h.getProgressPercentage()}% (${h.getStatus()})`
      );
    }
    console.log('');
  }

  displayStats() {
    const names = this.habits.map((h) => h.name); // map
    const completed = this.habits.filter((h) => h.isCompletedThisWeek()).length; // filter
    const anyFiveX = this.habits.find((h) => h.targetFrequency >= 5)
      ? 'Ya'
      : 'Tidak'; // find

    console.log('==================================================');
    console.log('STATISTIK');
    console.log('==================================================');
    console.log(`Total Habit        : ${this.habits.length}`);
    console.log(`Selesai Minggu Ini : ${completed}`);
    console.log(`Nama Habit         : ${names.join(', ') || '-'}`);
    console.log(`Ada target ≥ 5x?   : ${anyFiveX}`);
    console.log('==================================================\n');
  }

  // Reminder otomatis (start saat app jalan)
  startReminder() {
    if (this._reminderId) return;
    this._reminderId = setInterval(
      () => this.showReminder(),
      REMINDER_INTERVAL
    );
  }

  showReminder() {
    // pilih satu habit yang belum selesai minggu ini
    const pending = this.habits.filter((h) => !h.isCompletedThisWeek());
    if (pending.length === 0) return;
    // ambil yang paling lama dibuat
    const pick = pending.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    )[0];
    console.log('==================================================');
    console.log(`REMINDER: Jangan lupa "${pick.name}"!`);
    console.log('==================================================');
  }

  stopReminder() {
    if (this._reminderId) {
      clearInterval(this._reminderId);
      this._reminderId = null;
    }
  }

  saveToFile() {
    const payload = {
      profile: this.profile,
      habits: this.habits.map((h) => ({
        id: h.id,
        name: h.name,
        targetFrequency: h.targetFrequency,
        completions: h.completions,
        createdAt: h.createdAt,
      })), // map
    };
    const jsonData = JSON.stringify(payload, null, 2);
    fs.writeFileSync(DATA_FILE, jsonData, 'utf-8');
    console.log(`💾 Data tersimpan ke ${path.basename(DATA_FILE)}\n`);
  }

  loadFromFile() {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify({ profile: this.profile, habits: [] }, null, 2),
        'utf-8'
      );
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (!raw.trim()) return;

    try {
      const parsed = JSON.parse(raw);
      // pakai ?? untuk fallback (4) dan (5)
      const p = parsed.profile ?? {};
      this.profile.name = p.name ?? this.profile.name;
      this.profile.joinDate = p.joinDate ?? this.profile.joinDate;

      const arr = parsed.habits ?? []; // (6) Nullish coalescing
      this.habits = arr.map((h) => {
        const obj = new Habit(h.name ?? 'Untitled', h.targetFrequency ?? 1);
        obj.id = h.id ?? obj.id;
        obj.completions = Array.isArray(h.completions) ? h.completions : [];
        obj.createdAt = h.createdAt ?? toYMD();
        return obj;
      });

      this.profile.updateStats(this.habits);
      console.log('📂 Data dimuat dari file.\n');
    } catch (e) {
      console.log('❌ Gagal memuat data, inisialisasi baru.\n');
      this.habits = [];
      this.profile.updateStats(this.habits);
    }
  }

  clearAllData() {
    this.habits = [];
    this.profile.updateStats(this.habits);
    this.saveToFile();
  }
}

// ============================================
// CLI MENU
// ============================================
function displayMenu() {
  console.log('Menu Utama');
  console.log('==================================================');
  console.log('HABIT TRACKER - MAIN MENU');
  console.log('==================================================');
  console.log('1. Lihat Profil');
  console.log('2. Lihat Semua Kebiasaan');
  console.log('3. Lihat Kebiasaan Aktif');
  console.log('4. Lihat Kebiasaan Selesai');
  console.log('5. Tambah Kebiasaan Baru');
  console.log('6. Tandai Kebiasaan Selesai');
  console.log('7. Hapus Kebiasaan');
  console.log('8. Lihat Statistik');
  console.log('9. Demo Loop (while/for)');
  console.log('0. Keluar');
  console.log('==================================================');
}

async function handleMenu(tracker) {
  let running = true;
  while (running) {
    displayMenu();
    const choice = (await askQuestion('Pilih menu: ')).trim();
    console.log('');

    switch (choice) {
      case '1':
        tracker.displayProfile();
        break;
      case '2':
        tracker.displayHabits('all');
        break;
      case '3':
        tracker.displayHabits('active');
        break;
      case '4':
        tracker.displayHabits('completed');
        break;
      case '5': {
        const name = await askQuestion('Nama habit: ');
        const freq = await askQuestion('Target per minggu (angka): ');
        tracker.addHabit(name, freq);
        tracker.saveToFile();
        break;
      }
      case '6': {
        if (tracker.habits.length === 0) {
          console.log('Belum ada habit.\n');
          break;
        }
        tracker.displayHabits('all');
        const idx = await askQuestion(
          'Masukkan nomor habit yang selesai hari ini: '
        );
        tracker.completeHabit(idx);
        tracker.saveToFile();
        break;
      }
      case '7': {
        if (tracker.habits.length === 0) {
          console.log('Belum ada habit.\n');
          break;
        }
        tracker.displayHabits('all');
        const idx = await askQuestion(
          'Masukkan nomor habit yang akan dihapus: '
        );
        tracker.deleteHabit(idx);
        tracker.saveToFile();
        break;
      }
      case '8':
        tracker.displayStats();
        break;
      case '9':
        tracker.displayHabitsWithWhile();
        tracker.displayHabitsWithFor();
        break;
      case '0':
        running = false;
        break;
      default:
        console.log('Menu tidak dikenal.\n');
    }
  }
}

// ============================================
// MAIN
// ============================================
async function main() {
  console.log('==================================================');
  console.log('HABIT TRACKER CLI - CHALLENGE 3');
  console.log('==================================================\n');

  const tracker = new HabitTracker(userProfile);

  // Pastikan file ada & muat
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ profile: tracker.profile, habits: [] }, null, 2),
      'utf-8'
    );
  }
  tracker.loadFromFile();

  // Isi nama sekali jika kosong
  if (!tracker.profile.name) {
    const name = await askQuestion('Masukkan nama Anda: ');
    tracker.profile.name = (name ?? 'Anonim').trim() || 'Anonim';
    tracker.profile.joinDate = tracker.profile.joinDate || toYMD();
    tracker.profile.updateStats(tracker.habits);
    tracker.saveToFile();
  }

  // Reminder otomatis setiap 10 detik
  tracker.startReminder();

  await handleMenu(tracker);

  tracker.stopReminder();
  rl.close();
  console.log('👋 Sampai jumpa!');
}

main().catch((err) => {
  console.error('Terjadi kesalahan:', err);
  try {
    rl.close();
  } catch {}
});
