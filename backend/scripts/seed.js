/**
 * DeciSmart - Data Seeder Script
 * Membuat data dummy realistis untuk simulasi/demo
 * 
 * Jalankan: node scripts/seed.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../config/supabase');

// ─────────────────────────────────────────────
// DATA DUMMY
// ─────────────────────────────────────────────

const USERS = [
  { full_name: 'Admin DeciSmart', email: 'admin@decismart.com', password: 'Admin123!', role: 'admin' },
  { full_name: 'Budi Santoso',    email: 'budi@example.com',    password: 'User123!',  role: 'user'  },
  { full_name: 'Sari Dewi',       email: 'sari@example.com',    password: 'User123!',  role: 'user'  },
  { full_name: 'Ahmad Fauzi',     email: 'ahmad@example.com',   password: 'User123!',  role: 'user'  },
];

// Skenario keputusan: [ title, description, alternatives, criteria, scores[alt][cri] ]
// Semua skor dalam skala 1-10 (sesuai batas kolom DB DECIMAL(10,4))
const DECISION_SCENARIOS = [
  {
    title: 'Pilih Laptop untuk Kuliah',
    description: 'Saya mahasiswa teknik informatika yang membutuhkan laptop untuk coding, desain grafis, dan tugas kuliah dengan anggaran terbatas.',
    alternatives: ['ASUS VivoBook 15', 'Lenovo IdeaPad 3', 'HP Laptop 14s', 'Acer Aspire 5'],
    criteria: [
      { name: 'Harga (Rp juta)',  weight: 40, type: 'cost'    },
      { name: 'RAM (GB)',         weight: 30, type: 'benefit' },
      { name: 'Baterai (jam)',    weight: 15, type: 'benefit' },
      { name: 'Garansi (tahun)', weight: 15, type: 'benefit' },
    ],
    // Skala 1-10: harga 8.5 juta → 8.5, RAM 8GB → 8, baterai 6 jam → 6, garansi 2 thn → 2
    scores: [
      [8.5, 8, 6, 2],
      [7.2, 10, 8, 1],
      [9.0, 10, 9, 1],
      [6.8, 8, 7, 1],
    ],
  },
  {
    title: 'Memilih Platform E-Commerce untuk Jualan Online',
    description: 'UMKM saya ingin mulai berjualan online. Perlu memilih platform yang tepat berdasarkan biaya, kemudahan penggunaan, dan jangkauan pembeli.',
    alternatives: ['Shopee', 'Tokopedia', 'Lazada', 'TikTok Shop'],
    criteria: [
      { name: 'Biaya Komisi (%)',  weight: 35, type: 'cost'    },
      { name: 'Kemudahan Pakai',  weight: 30, type: 'benefit' },
      { name: 'Jumlah Pengguna',  weight: 25, type: 'benefit' },
      { name: 'Fitur Promosi',    weight: 10, type: 'benefit' },
    ],
    // Komisi dalam %, lainnya skala 1-10
    scores: [
      [2.5, 9, 10, 9],
      [2.0, 8, 9,  8],
      [3.0, 7, 7,  7],
      [1.5, 8, 8,  9],
    ],
  },
  {
    title: 'Evaluasi Kandidat Karyawan Baru Divisi IT',
    description: 'Perusahaan kami membuka posisi Software Developer. Terdapat 3 kandidat yang harus dievaluasi berdasarkan kompetensi teknis dan soft skill.',
    alternatives: ['Kandidat A - Rina', 'Kandidat B - Doni', 'Kandidat C - Maya'],
    criteria: [
      { name: 'Kemampuan Teknis',  weight: 40, type: 'benefit' },
      { name: 'Pengalaman Kerja',  weight: 25, type: 'benefit' },
      { name: 'Komunikasi',        weight: 20, type: 'benefit' },
      { name: 'Gaji (juta/bln)',   weight: 15, type: 'cost'    },
    ],
    // Gaji dalam juta: 8 juta → 8, 10 juta → 10, 7.5 juta → 7.5
    scores: [
      [9, 7, 8, 8.0],
      [7, 9, 7, 10.0],
      [8, 6, 9, 7.5],
    ],
  },
];

// ─────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────
function log(msg) { console.log(`  ✓ ${msg}`); }
function warn(msg) { console.warn(`  ⚠ ${msg}`); }

async function clearTable(table) {
  const { error } = await supabaseAdmin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) warn(`Gagal hapus ${table}: ${error.message}`);
}

// ─────────────────────────────────────────────
// SEED FUNCTIONS
// ─────────────────────────────────────────────
async function seedUsers() {
  console.log('\n📦 Membuat users...');
  const inserted = [];
  for (const u of USERS) {
    // Cek sudah ada?
    const { data: existing } = await supabaseAdmin.from('users').select('id, email, role').eq('email', u.email).single();
    if (existing) {
      warn(`User ${u.email} sudah ada, dilewati.`);
      inserted.push(existing);
      continue;
    }
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(u.password, salt);
    const { data, error } = await supabaseAdmin.from('users').insert({
      email: u.email, full_name: u.full_name, password_hash, role: u.role, is_active: true, preferences: {},
    }).select('id, email, role').single();
    if (error) throw new Error(`Gagal buat user ${u.email}: ${error.message}`);
    log(`${u.role.toUpperCase()} - ${u.full_name} (${u.email}) | password: ${u.password}`);
    inserted.push(data);
  }
  return inserted;
}

async function seedDecisions(users) {
  console.log('\n📦 Membuat keputusan + analisis...');
  // Ambil hanya user biasa (bukan admin)
  const regularUsers = users.filter(u => u.role === 'user');

  for (let i = 0; i < DECISION_SCENARIOS.length; i++) {
    const sc = DECISION_SCENARIOS[i];
    // Distribusikan skenario ke user secara round-robin
    const owner = regularUsers[i % regularUsers.length];

    // 1. Buat Decision
    const { data: dec, error: decErr } = await supabaseAdmin.from('decisions').insert({
      user_id: owner.id, title: sc.title, description: sc.description, status: 'draft',
    }).select('id').single();
    if (decErr) throw new Error(`Decision error: ${decErr.message}`);

    // 2. Buat Alternatives
    const altIds = [];
    for (let ai = 0; ai < sc.alternatives.length; ai++) {
      const { data: alt, error: altErr } = await supabaseAdmin.from('alternatives').insert({
        decision_id: dec.id, name: sc.alternatives[ai], order_index: ai,
      }).select('id').single();
      if (altErr) throw new Error(`Alternative error: ${altErr.message}`);
      altIds.push(alt.id);
    }

    // 3. Buat Criteria (sudah dalam %, total = 100)
    const criIds = [];
    for (let ci = 0; ci < sc.criteria.length; ci++) {
      const c = sc.criteria[ci];
      const { data: cri, error: criErr } = await supabaseAdmin.from('criteria').insert({
        decision_id: dec.id, name: c.name, weight: c.weight, type: c.type, order_index: ci,
      }).select('id').single();
      if (criErr) throw new Error(`Criteria error: ${criErr.message}`);
      criIds.push(cri.id);
    }

    // 4. Buat Scores matrix
    const scoreRows = [];
    for (let ai = 0; ai < altIds.length; ai++) {
      for (let ci = 0; ci < criIds.length; ci++) {
        scoreRows.push({
          alternative_id: altIds[ai],
          criteria_id: criIds[ci],
          raw_value: sc.scores[ai][ci],
          source: 'manual',
        });
      }
    }
    const { error: scoreErr } = await supabaseAdmin.from('scores').insert(scoreRows);
    if (scoreErr) throw new Error(`Scores error: ${scoreErr.message}`);

    // 5. Hitung SAW secara manual untuk menyimpan rekomendasi
    const sawResult = computeSAW(sc.alternatives, sc.criteria, sc.scores);
    const rankedAlts = sawResult.map((r, idx) => ({
      rank: idx + 1,
      alternative_id: altIds[sawResult.map(x => x.name).indexOf(r.name)],
      alternative_name: r.name,
      final_score: r.score,
    })).sort((a, b) => a.rank - b.rank);

    const aiReasoning = generateFakeReasoning(sc.title, rankedAlts[0].alternative_name, sc.criteria);

    // 6. Simpan Recommendation
    const { error: recErr } = await supabaseAdmin.from('recommendations').insert({
      decision_id: dec.id,
      ranked_alternatives: rankedAlts,
      mcdm_scores: { method: 'SAW', scores: sawResult },
      ai_reasoning: aiReasoning,
      processing_time_ms: Math.floor(Math.random() * 2000) + 800,
    });
    if (recErr) throw new Error(`Recommendation error: ${recErr.message}`);

    // 7. Update decision status menjadi completed
    await supabaseAdmin.from('decisions').update({ status: 'completed' }).eq('id', dec.id);

    // 8. Log history
    await supabaseAdmin.from('decision_history').insert({
      decision_id: dec.id, user_id: owner.id, action_type: 'analyzed',
      metadata: { method: 'SAW' },
    });

    log(`"${sc.title}" → Rekomendasi: ${rankedAlts[0].alternative_name} (user: ${owner.email})`);
  }
}

// ─────────────────────────────────────────────
// SAW CALCULATOR (inline, tanpa dependency)
// ─────────────────────────────────────────────
function computeSAW(altNames, criteria, scoreMatrix) {
  const results = altNames.map((name, ai) => {
    let total = 0;
    criteria.forEach((cri, ci) => {
      const colValues = scoreMatrix.map(row => row[ci]);
      const max = Math.max(...colValues);
      const min = Math.min(...colValues);
      const raw = scoreMatrix[ai][ci];
      const normalized = cri.type === 'cost'
        ? (max > 0 ? min / raw : 0)
        : (max > 0 ? raw / max : 0);
      total += normalized * (cri.weight / 100);
    });
    return { name, score: parseFloat(total.toFixed(4)) };
  });
  return results.sort((a, b) => b.score - a.score);
}

// ─────────────────────────────────────────────
// AI REASONING GENERATOR (template)
// ─────────────────────────────────────────────
function generateFakeReasoning(title, winner, criteria) {
  const topCriteria = [...criteria].sort((a, b) => b.weight - a.weight).slice(0, 2).map(c => c.name).join(' dan ');
  return `Berdasarkan analisis menggunakan metode SAW (Simple Additive Weighting) untuk keputusan "${title}", **${winner}** terpilih sebagai rekomendasi terbaik dengan skor tertinggi setelah normalisasi bobot kriteria.\n\nAlasan utama: ${winner} menunjukkan performa terbaik pada kriteria dengan bobot terbesar yaitu **${topCriteria}**. Metode SAW mengevaluasi setiap alternatif secara proporsional terhadap bobotnya, sehingga alternatif yang unggul di kriteria berbobot tinggi mendapatkan keuntungan lebih besar dalam perhitungan akhir.\n\nSaran: Pertimbangkan kembali bobot kriteria jika ada faktor subjektif lain yang belum masuk dalam analisis ini, seperti preferensi pribadi, ketersediaan produk, atau faktor risiko jangka panjang.`;
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function main() {
  console.log('🌱 DeciSmart Data Seeder');
  console.log('═══════════════════════════════════════');

  try {
    const users = await seedUsers();
    await seedDecisions(users);

    console.log('\n═══════════════════════════════════════');
    console.log('✅ Seeding selesai!\n');
    console.log('📋 AKUN DEMO:');
    console.log('  Admin   → admin@decismart.com  / Admin123!');
    console.log('  User 1  → budi@example.com     / User123!');
    console.log('  User 2  → sari@example.com     / User123!');
    console.log('  User 3  → ahmad@example.com    / User123!');
    console.log('\n📊 DATA YANG DIBUAT:');
    console.log(`  - ${USERS.length} users`);
    console.log(`  - ${DECISION_SCENARIOS.length} keputusan lengkap (dengan alternatif, kriteria, skor, dan analisis SAW)`);
    console.log('═══════════════════════════════════════\n');
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

main();
