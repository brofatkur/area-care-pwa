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
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-slate-900">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-black uppercase tracking-wider text-purple-700">Dashboard Eksekutif</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            care.boffice.co.id/dashboard
          </span>
        </div>
        <h2 class="text-xl font-black text-slate-900 mt-1">Area Care Management Intelligence</h2>
        <p class="text-xs text-slate-500 font-medium">Direktur Bagus & Manajer Operasional Pasek</p>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="emit('openEmailRecap')"
          class="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition active:scale-95"
        >
          <Mail class="w-4 h-4" />
          <span>Rekap Email & Ekspor</span>
        </button>

        <button
          @click="emit('openAdmin')"
          class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 border border-slate-300 transition active:scale-95"
        >
          <span>Master QR & Data</span>
        </button>
      </div>
    </div>

    <!-- PANEL 1: Ringkasan Kinerja (KPI Target >= 95%) -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <!-- Tugas Selesai Hari Ini -->
      <div class="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm relative overflow-hidden">
        <div class="flex items-center justify-between text-xs text-slate-500 mb-1 font-bold">
          <span>Tugas Selesai Hari Ini</span>
          <span class="text-emerald-700">&ge; 95%</span>
        </div>
        <div class="text-3xl font-black text-emerald-700 font-mono">
          {{ todayTaskCompletedPercent }}%
        </div>
        <div class="flex items-center gap-1 text-[11px] text-emerald-700 mt-2 font-bold">
          <CheckCircle2 class="w-3.5 h-3.5" />
          <span>Memenuhi Target</span>
        </div>
      </div>

      <!-- Bulan Berjalan -->
      <div class="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
        <div class="flex items-center justify-between text-xs text-slate-500 mb-1 font-bold">
          <span>Bulan Berjalan (KPI)</span>
          <span class="text-emerald-700">Target 95%</span>
        </div>
        <div class="text-3xl font-black text-slate-900 font-mono">
          {{ monthlyTaskCompletedPercent }}%
        </div>
        <p class="text-[11px] text-slate-500 mt-2 font-medium">1.260 penilaian per hari</p>
      </div>

      <!-- Temuan Terbuka -->
      <div class="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
        <div class="flex items-center justify-between text-xs text-slate-500 mb-1 font-bold">
          <span>Temuan Terbuka</span>
          <span class="text-amber-700">SLA 48h</span>
        </div>
        <div class="text-3xl font-black text-amber-700 font-mono">
          {{ openFindingsCount }}
        </div>
        <p class="text-[11px] text-slate-500 mt-2 font-medium">Dalam pemantauan teknisi</p>
      </div>

      <!-- Lewat Tenggat SLA -->
      <div class="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm" :class="overdueSlaCount > 0 ? 'border-rose-400 bg-rose-50/50' : ''">
        <div class="flex items-center justify-between text-xs text-slate-500 mb-1 font-bold">
          <span>Lewat Tenggat SLA</span>
          <span class="text-rose-700">Eskalasi</span>
        </div>
        <div class="text-3xl font-black font-mono" :class="overdueSlaCount > 0 ? 'text-rose-700' : 'text-slate-400'">
          {{ overdueSlaCount }}
        </div>
        <p class="text-[11px] mt-2 font-medium" :class="overdueSlaCount > 0 ? 'text-rose-700 font-bold' : 'text-slate-500'">
          {{ overdueSlaCount > 0 ? 'Perlu tindakan Direksi' : 'Semua dalam batas SLA' }}
        </p>
      </div>
    </div>

    <!-- PANEL 2: Status Hari Ini (Grid 7 Area x 4 Checkpoint) -->
    <div class="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-black text-slate-900 text-base">Status Live: 7 Area &times; 4 Checkpoint</h3>
          <p class="text-xs text-slate-500 font-medium">Pantauan visual real-time kondisi kebersihan gedung hari ini</p>
        </div>
        <div class="flex items-center gap-3 text-[10px] font-bold">
          <span class="flex items-center gap-1 text-emerald-700"><span class="w-2.5 h-2.5 rounded bg-emerald-500"></span> Selesai</span>
          <span class="flex items-center gap-1 text-blue-700"><span class="w-2.5 h-2.5 rounded bg-blue-500"></span> Berjalan</span>
          <span class="flex items-center gap-1 text-slate-500"><span class="w-2.5 h-2.5 rounded bg-slate-300"></span> Nanti</span>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold">
              <th class="py-2.5 px-3">Nama Area (Fasilitas)</th>
              <th v-for="s in CHECKPOINT_SLOTS" :key="s.id" class="py-2.5 px-3 text-center">
                {{ s.label }} WITA
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="area in areas" :key="area.id" class="hover:bg-slate-50/80 transition">
              <td class="py-3 px-3 font-bold text-slate-900">
                {{ area.name }}
              </td>

              <!-- 4 Checkpoints columns -->
              <td v-for="s in CHECKPOINT_SLOTS" :key="s.id" class="py-3 px-3 text-center">
                <span
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                  :class="
                    s.id === '07.00'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : s.id === '10.00'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : s.id === '13.00'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200 animate-pulse'
                      : 'bg-slate-100 text-slate-500'
                  "
                >
                  <CheckCircle2 v-if="s.id === '07.00' || s.id === '10.00'" class="w-3 h-3 text-emerald-600" />
                  <Clock v-else-if="s.id === '13.00'" class="w-3 h-3 text-blue-600" />
                  <span>{{ s.id === '07.00' ? '98%' : s.id === '10.00' ? '96%' : s.id === '13.00' ? 'Proses' : '15.30' }}</span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- PANEL 3: Tren Kinerja 30 Hari (Grafik Garis dengan Target 95%) -->
    <div class="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-black text-slate-900 text-base">Tren Kinerja 30 Hari Terakhir</h3>
          <p class="text-xs text-slate-500 font-medium">Garis hijau: realisasi harian | Garis merah putus: target KPI 95%</p>
        </div>
        <span class="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
          Rata-rata: 97.2%
        </span>
      </div>

      <!-- SVG Chart -->
      <div class="h-44 w-full relative bg-slate-50 rounded-2xl p-2 border border-slate-100">
        <svg class="w-full h-full" viewBox="0 0 600 160" preserveAspectRatio="none">
          <!-- Target 95% threshold line (at y = 36) -->
          <line x1="0" y1="36" x2="600" y2="36" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4,4" />
          <text x="5" y="30" fill="#dc2626" font-size="10" font-family="monospace" font-weight="bold">Target 95%</text>

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
            opacity="0.2"
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
              <stop offset="100%" stop-color="#ffffff" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div class="flex justify-between text-[10px] text-slate-500 font-mono font-medium mt-2 pt-2 border-t border-slate-100">
        <span>30 Hari Lalu</span>
        <span>15 Hari Lalu</span>
        <span>Hari Ini (29 Sep 2026)</span>
      </div>
    </div>

    <!-- PANEL 4 & 5: Follow-Up Board & 10 Kendala Fasilitas Berulang -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- PANEL 4: 10 Item Paling Sering Gagal -->
      <div class="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="font-black text-slate-900 text-sm">10 Kendala Fasilitas Berulang</h3>
              <p class="text-[11px] text-slate-500 font-medium">Masalah fisik &ge; 3x dalam 7 hari dipisahkan dari KPI petugas</p>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
              Sistem Anti-Hukum
            </span>
          </div>

          <div class="space-y-2 max-h-80 overflow-y-auto pr-1">
            <div
              v-for="item in topFailedItems"
              :key="item.rank"
              class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-2 text-xs"
            >
              <div class="flex items-start gap-2">
                <span class="w-5 h-5 rounded-md bg-slate-200 text-slate-700 font-black text-[10px] flex items-center justify-center shrink-0">
                  {{ item.rank }}
                </span>
                <div>
                  <p class="font-bold text-slate-900 leading-snug">{{ item.name }}</p>
                  <p class="text-[10px] text-slate-500 mt-0.5">{{ item.area }} · {{ item.type }}</p>
                </div>
              </div>
              <span class="font-black text-rose-600 text-xs shrink-0 font-mono">{{ item.count }}x</span>
            </div>
          </div>
        </div>
      </div>

      <!-- PANEL 5: Follow-Up Kanban Board -->
      <div class="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="font-black text-slate-900 text-sm">Papan Follow-Up & SLA</h3>
              <p class="text-[11px] text-slate-500 font-medium">Setiap temuan wajib memiliki PIC & batas waktu</p>
            </div>
          </div>

          <div class="space-y-2 max-h-80 overflow-y-auto pr-1">
            <div
              v-for="f in findings"
              :key="f.id"
              class="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
            >
              <div class="flex items-center justify-between">
                <span
                  class="text-[9px] font-black px-2 py-0.5 rounded uppercase"
                  :class="f.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'"
                >
                  {{ f.status }}
                </span>
                <span class="text-[10px] text-slate-500 font-mono font-medium">PIC: {{ f.pic }}</span>
              </div>
              <p class="font-bold text-slate-900">{{ f.item_name }} ({{ f.area_name }})</p>
              <p class="text-slate-600 text-[11px]">{{ f.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- PANEL 6 & 7: Kinerja Petugas & Replenishment Log -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- PANEL 6: Kinerja Petugas (Utama & Pengganti) -->
      <div class="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-black text-slate-900 text-sm">Kinerja Petugas (Utama & Pengganti)</h3>
          <span class="text-[10px] text-slate-500 font-mono font-bold">Penilaian Bulanan</span>
        </div>

        <div class="divide-y divide-slate-100">
          <div
            v-for="officer in officersPerformance"
            :key="officer.name"
            class="py-3 flex items-center justify-between text-xs"
          >
            <div>
              <p class="font-bold text-slate-900">{{ officer.name }}</p>
              <p class="text-[10px] text-slate-500 font-medium">{{ officer.role }} · {{ officer.days }} hari kerja</p>
            </div>
            <div class="text-right">
              <span class="font-black text-emerald-700 font-mono text-sm">{{ officer.completedPercent }}%</span>
              <p class="text-[10px] text-emerald-700 font-bold">{{ officer.status }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- PANEL 7: Replenishment (Item Persediaan Menipis / Habis) -->
      <div class="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="font-black text-slate-900 text-sm">Daftar Belanja Persediaan (Replenishment)</h3>
            <p class="text-[11px] text-slate-500 font-medium">Otomatis masuk email harian manajemen</p>
          </div>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
            {{ depletedSupplies.length }} Item Menipis
          </span>
        </div>

        <div class="space-y-2">
          <div
            v-for="sup in depletedSupplies"
            :key="sup.id"
            class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
          >
            <div>
              <p class="font-bold text-slate-900">{{ sup.name }}</p>
              <p class="text-[10px] text-slate-500 font-medium">{{ sup.area_name }}</p>
            </div>
            <span
              class="px-2 py-0.5 rounded font-black text-[10px] uppercase font-mono"
              :class="sup.status === 'Habis' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'"
            >
              {{ sup.status }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
