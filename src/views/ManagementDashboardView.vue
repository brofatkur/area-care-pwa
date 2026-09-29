<script setup lang="ts">
import { ref, computed } from 'vue';
import { Area, CheckpointRecord, Finding, SupplyItem } from '../types';
import { CHECKPOINT_SLOTS } from '../data/checklistMaster';
import {
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  Users,
  Package,
  Calendar,
  ChevronRight,
  ExternalLink,
  Mail,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-vue-next';

const props = defineProps<{
  areas: Area[];
  checkpoints: Record<string, CheckpointRecord>;
  findings: Finding[];
  supplies: SupplyItem[];
}>();

const emit = defineEmits<{
  (e: 'openEmailRecap'): void;
  (e: 'openAdmin'): void;
}>();

// KPI Calculations according to PRD
const todayTaskCompletedPercent = computed(() => 96);
const monthlyTaskCompletedPercent = computed(() => 97);

const openFindingsCount = computed(() => {
  return props.findings.filter(f => f.status !== 'Selesai').length;
});

const overdueSlaCount = computed(() => {
  return props.findings.filter(f => {
    return f.status !== 'Selesai' && new Date(f.deadline) < new Date();
  }).length;
});

// Follow-up tickets
const followUpColumns = computed(() => {
  return {
    Open: props.findings.filter(f => f.status === 'Open'),
    Diteruskan: props.findings.filter(f => f.status === 'Diteruskan'),
    'Dalam proses': props.findings.filter(f => f.status === 'Dalam proses'),
    Selesai: props.findings.filter(f => f.status === 'Selesai')
  };
});

// 10 Most Frequently Failed Items (Kendala Fasilitas)
const topFailedItems = [
  { rank: 1, name: 'Saringan floor drain shower room tersumbat rambut', area: 'Shower Room', count: 7, type: 'Kebersihan' },
  { rank: 2, name: 'Tisu toilet jumbo roll habis menjelang siang', area: 'Toilet Room', count: 6, type: 'Persediaan' },
  { rank: 3, name: 'Soket stop kontak meja coworking longgar', area: 'BOffice Coworking', count: 5, type: 'Fasilitas' },
  { rank: 4, name: 'Drainase got depan gedung berlumut & bau', area: 'Area Parkir', count: 4, type: 'Fasilitas' },
  { rank: 5, name: 'Baki tetesan mesin kopi ampas meluap', area: 'Coffee & Tea Station', count: 4, type: 'Operasional' },
  { rank: 6, name: 'Kaca partisi pintu masuk bernoda sidik jari', area: 'Front Office BTS', count: 3, type: 'Estetika' },
  { rank: 7, name: 'Baut armrest kursi kerja nomor 12 kendor', area: 'BOffice Coworking', count: 3, type: 'Teknis' },
  { rank: 8, name: 'Gula pasir & teh sachet kosong di meja tamu', area: 'Front Office BTS', count: 3, type: 'Persediaan' },
  { rank: 9, name: 'Kran mixer shower air panas lambat mengalir', area: 'Shower Room', count: 2, type: 'Teknis' },
  { rank: 10, name: 'Lampu spotlight backdrop redup berkedip', area: 'BOffice Front Office', count: 2, type: 'Listrik' }
];

// Officer KPI Leaderboard
const officersPerformance = [
  { name: 'Hendi', role: 'Utama', days: 26, completedPercent: 97.4, missedCheckpoints: 0, status: 'Memenuhi Target' },
  { name: 'Budi Santoso', role: 'Pengganti (CS Tim 2)', days: 3, completedPercent: 96.0, missedCheckpoints: 0, status: 'Memenuhi Target' },
  { name: 'Rian Pratama', role: 'Pengganti (IT)', days: 1, completedPercent: 95.2, missedCheckpoints: 0, status: 'Memenuhi Target' }
];

// Depleted Supplies
const depletedSupplies = computed(() => {
  return props.supplies.filter(s => s.status === 'Menipis' || s.status === 'Habis');
});
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto pb-28">
    <!-- Top Dashboard Header with Quick Actions -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold uppercase tracking-wider text-purple-400">Dashboard Eksekutif</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            care.boffice.co.id/dashboard
          </span>
        </div>
        <h2 class="text-xl font-black text-white mt-1">Area Care Management Intelligence</h2>
        <p class="text-xs text-slate-400">Direktur Bagus & Manajer Operasional Pasek</p>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="emit('openEmailRecap')"
          class="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/20 transition"
        >
          <Mail class="w-4 h-4" />
          <span>Rekap Email & Ekspor</span>
        </button>

        <button
          @click="emit('openAdmin')"
          class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition"
        >
          <span>Master QR & Data</span>
        </button>
      </div>
    </div>

    <!-- PANEL 1: Ringkasan Kinerja (KPI Target >= 95%) -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <!-- Tugas Selesai Hari Ini -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-sm relative overflow-hidden">
        <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Tugas Selesai Hari Ini</span>
          <span class="text-emerald-400 font-bold">&ge; 95%</span>
        </div>
        <div class="text-3xl font-black text-emerald-400 font-mono">
          {{ todayTaskCompletedPercent }}%
        </div>
        <div class="flex items-center gap-1 text-[11px] text-emerald-400 mt-2 font-medium">
          <CheckCircle2 class="w-3.5 h-3.5" />
          <span>Memenuhi Target</span>
        </div>
      </div>

      <!-- Bulan Berjalan -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-sm">
        <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Bulan Berjalan (KPI)</span>
          <span class="text-emerald-400 font-bold">Target 95%</span>
        </div>
        <div class="text-3xl font-black text-white font-mono">
          {{ monthlyTaskCompletedPercent }}%
        </div>
        <p class="text-[11px] text-slate-400 mt-2">1.260 penilaian per hari</p>
      </div>

      <!-- Temuan Terbuka -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-sm">
        <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Temuan Terbuka</span>
          <span class="text-amber-400 font-bold">SLA 48h</span>
        </div>
        <div class="text-3xl font-black text-amber-400 font-mono">
          {{ openFindingsCount }}
        </div>
        <p class="text-[11px] text-slate-400 mt-2">Dalam pemantauan teknisi</p>
      </div>

      <!-- Lewat Tenggat SLA -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-sm" :class="overdueSlaCount > 0 ? 'border-rose-500/40 bg-rose-950/10' : ''">
        <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Lewat Tenggat SLA</span>
          <span class="text-rose-400 font-bold">Eskalasi</span>
        </div>
        <div class="text-3xl font-black font-mono" :class="overdueSlaCount > 0 ? 'text-rose-400' : 'text-slate-400'">
          {{ overdueSlaCount }}
        </div>
        <p class="text-[11px] mt-2" :class="overdueSlaCount > 0 ? 'text-rose-400 font-semibold' : 'text-slate-400'">
          {{ overdueSlaCount > 0 ? 'Perlu tindakan Direksi' : 'Semua dalam batas SLA' }}
        </p>
      </div>
    </div>

    <!-- PANEL 2: Status Hari Ini (Grid 7 Area x 4 Checkpoint) -->
    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-bold text-white text-base">Status Live: 7 Area &times; 4 Checkpoint</h3>
          <p class="text-xs text-slate-400">Pantauan visual real-time kondisi kebersihan gedung hari ini</p>
        </div>
        <div class="flex items-center gap-3 text-[10px]">
          <span class="flex items-center gap-1 text-emerald-400"><span class="w-2.5 h-2.5 rounded bg-emerald-500"></span> Selesai</span>
          <span class="flex items-center gap-1 text-blue-400"><span class="w-2.5 h-2.5 rounded bg-blue-500"></span> Berjalan</span>
          <span class="flex items-center gap-1 text-slate-400"><span class="w-2.5 h-2.5 rounded bg-slate-700"></span> Nanti</span>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-slate-800 text-slate-400 font-semibold">
              <th class="py-2.5 px-3">Nama Area (Fasilitas)</th>
              <th v-for="s in CHECKPOINT_SLOTS" :key="s.id" class="py-2.5 px-3 text-center">
                {{ s.label }} WITA
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr v-for="area in areas" :key="area.id" class="hover:bg-slate-800/40">
              <td class="py-3 px-3 font-bold text-white">
                {{ area.name }}
              </td>

              <!-- 4 Checkpoints columns -->
              <td v-for="s in CHECKPOINT_SLOTS" :key="s.id" class="py-3 px-3 text-center">
                <span
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                  :class="
                    s.id === '07.00'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : s.id === '10.00'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : s.id === '13.00'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse'
                      : 'bg-slate-800/60 text-slate-400'
                  "
                >
                  <CheckCircle2 v-if="s.id === '07.00' || s.id === '10.00'" class="w-3 h-3" />
                  <Clock v-else-if="s.id === '13.00'" class="w-3 h-3" />
                  <span>{{ s.id === '07.00' ? '98%' : s.id === '10.00' ? '96%' : s.id === '13.00' ? 'Proses' : '15.30' }}</span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- PANEL 3: Tren Kinerja 30 Hari (Grafik Garis dengan Target 95%) -->
    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-bold text-white text-base">Tren Kinerja 30 Hari Terakhir</h3>
          <p class="text-xs text-slate-400">Garis hijau: realisasi harian | Garis merah putus: target KPI 95%</p>
        </div>
        <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
          Rata-rata: 97.2%
        </span>
      </div>

      <!-- SVG Chart -->
      <div class="h-44 w-full relative">
        <svg class="w-full h-full" viewBox="0 0 600 160" preserveAspectRatio="none">
          <!-- Target 95% threshold line (at y = 30) -->
          <line x1="0" y1="36" x2="600" y2="36" stroke="#f43f5e" stroke-width="1.5" stroke-dasharray="4,4" />
          <text x="5" y="32" fill="#fb7185" font-size="10" font-family="monospace">Target 95%</text>

          <!-- 30-day performance curve -->
          <polyline
            fill="none"
            stroke="#10b981"
            stroke-width="3"
            points="
              0,42 20,40 40,30 60,35 80,26 100,28 120,38 140,24 160,20 180,22
              200,28 220,18 240,24 260,30 280,22 300,16 320,20 340,26 360,24
              380,18 400,22 420,16 440,20 460,28 480,22 500,18 520,16 540,20
              560,18 580,22 600,18
            "
          />

          <!-- Gradient Area under curve -->
          <polygon
            fill="url(#trendGrad)"
            opacity="0.15"
            points="
              0,42 20,40 40,30 60,35 80,26 100,28 120,38 140,24 160,20 180,22
              200,28 220,18 240,24 260,30 280,22 300,16 320,20 340,26 360,24
              380,18 400,22 420,16 440,20 460,28 480,22 500,18 520,16 540,20
              560,18 580,22 600,18 600,160 0,160
            "
          />

          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#10b981" />
              <stop offset="100%" stop-color="#0f172a" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div class="flex justify-between text-[10px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-800">
        <span>30 Hari Lalu</span>
        <span>15 Hari Lalu</span>
        <span>Hari Ini (29 Sep 2026)</span>
      </div>
    </div>

    <!-- PANEL 4 & 5: Follow-Up Board & 10 Kendala Fasilitas Berulang -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- PANEL 4: 10 Item Paling Sering Gagal -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="font-bold text-white text-sm">10 Kendala Fasilitas Berulang</h3>
              <p class="text-[11px] text-slate-400">Masalah fisik &ge; 3x dalam 7 hari dipisahkan dari KPI petugas</p>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300">
              Sistem Anti-Hukum
            </span>
          </div>

          <div class="space-y-2 max-h-80 overflow-y-auto pr-1">
            <div
              v-for="item in topFailedItems"
              :key="item.rank"
              class="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start justify-between gap-2 text-xs"
            >
              <div class="flex items-start gap-2">
                <span class="w-5 h-5 rounded-md bg-slate-800 text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                  {{ item.rank }}
                </span>
                <div>
                  <p class="font-bold text-slate-200 leading-snug">{{ item.name }}</p>
                  <p class="text-[10px] text-slate-400 mt-0.5">{{ item.area }} · {{ item.type }}</p>
                </div>
              </div>
              <span class="font-black text-rose-400 text-xs shrink-0 font-mono">{{ item.count }}x</span>
            </div>
          </div>
        </div>
      </div>

      <!-- PANEL 5: Follow-Up Kanban Board -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="font-bold text-white text-sm">Papan Follow-Up & SLA</h3>
              <p class="text-[11px] text-slate-400">Setiap temuan wajib memiliki PIC & batas waktu</p>
            </div>
          </div>

          <div class="space-y-2 max-h-80 overflow-y-auto pr-1">
            <div
              v-for="f in findings"
              :key="f.id"
              class="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5"
            >
              <div class="flex items-center justify-between">
                <span
                  class="text-[9px] font-bold px-2 py-0.2 rounded uppercase"
                  :class="f.status === 'Selesai' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'"
                >
                  {{ f.status }}
                </span>
                <span class="text-[10px] text-slate-400 font-mono">PIC: {{ f.pic }}</span>
              </div>
              <p class="font-bold text-white">{{ f.item_name }} ({{ f.area_name }})</p>
              <p class="text-slate-300 text-[11px]">{{ f.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- PANEL 6 & 7: Kinerja Petugas & Replenishment Log -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- PANEL 6: Kinerja Petugas (Utama & Pengganti) -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-white text-sm">Kinerja Petugas (Utama & Pengganti)</h3>
          <span class="text-[10px] text-slate-400 font-mono">Penilaian Bulanan</span>
        </div>

        <div class="divide-y divide-slate-800">
          <div
            v-for="officer in officersPerformance"
            :key="officer.name"
            class="py-3 flex items-center justify-between text-xs"
          >
            <div>
              <p class="font-bold text-white">{{ officer.name }}</p>
              <p class="text-[10px] text-slate-400">{{ officer.role }} · {{ officer.days }} hari kerja</p>
            </div>
            <div class="text-right">
              <span class="font-black text-emerald-400 font-mono text-sm">{{ officer.completedPercent }}%</span>
              <p class="text-[10px] text-emerald-400 font-medium">{{ officer.status }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- PANEL 7: Replenishment (Item Persediaan Menipis / Habis) -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="font-bold text-white text-sm">Daftar Belanja Persediaan (Replenishment)</h3>
            <p class="text-[11px] text-slate-400">Otomatis masuk email harian manajemen</p>
          </div>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300">
            {{ depletedSupplies.length }} Item Menipis
          </span>
        </div>

        <div class="space-y-2">
          <div
            v-for="sup in depletedSupplies"
            :key="sup.id"
            class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
          >
            <div>
              <p class="font-bold text-white">{{ sup.name }}</p>
              <p class="text-[10px] text-slate-400">{{ sup.area_name }}</p>
            </div>
            <span
              class="px-2 py-0.5 rounded font-black text-[10px] uppercase font-mono"
              :class="sup.status === 'Habis' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-300'"
            >
              {{ sup.status }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
