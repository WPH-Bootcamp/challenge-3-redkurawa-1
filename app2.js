// ============================================
// HABIT TRACKER CLI - CHALLENGE 3
// ============================================
// NAMA: adi wph-32
// KELAS: batch rep
// TANGGAL: 2025 11 04
// ============================================

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'habits-data.json');
const REMINDER_INTERVAL = 10000;
const DAYS_IN_WEEK = 7;

function checkFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
    console.log('buat file habits-data.json');
  } else {
    console.log('file sudah ada');
  }
}
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const actions = {
  1: showProfile,
  2: showAllHabits,
  // 3: showActiveHabits,
  // 4: showCompletedHabits,
  // 5: addNewHabit,
  // 6: markHabitDone,
  // 7: deleteHabit,
  // 8: showStats,
  // 9: demoLoop,
};

function holdAction() {
  rl.question('Tekan Enter untuk kembali ke menu...', () => main());
}

function showProfile() {
  console.log('📄 Ini profileku');
  holdAction();
}

function showAllHabits() {
  console.log('ini showAllHabits');
  holdAction();
}
function displayMenu() {
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

function handleMenu(pilihan) {
  const action = actions[pilihan];

  if (action) {
    console.log(action);
    action();
  } else if (pilihan === '0') {
    console.log('👋 Keluar dari Habit Tracker. Sampai jumpa!');
    rl.close();
  } else {
    console.log('⚠️ Pilihan tidak valid. Silakan coba lagi.');
    rl.question('Tekan Enter untuk kembali ke menu...', () => main());
  }
}

function main() {
  checkFile();
  displayMenu();
  rl.question('Masukkan pilihan Anda: ', handleMenu);
}

main();
