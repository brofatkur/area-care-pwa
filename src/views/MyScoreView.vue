<script setup lang="ts">
import { computed } from 'vue';
import { User } from '../types';
import { Award, Flame, TrendingUp, CheckCircle, ShieldAlert, Sparkles, Star, Calendar } from 'lucide-vue-next';

const props = defineProps<{
  currentUser: User;
  gamification: {
    points: number;
    streak: number;
    level: string;
    points_history: Array<{
      id: string;
      points: number;
      reason: string;
      created_at: string;
    }>;
  };
}>();

const levels = ['Pemula', 'Rapi', 'Bersih', 'Juara Area', 'Master Care'];

const currentLevelIndex = computed(() => {
  return levels.indexOf(props.gamification.level) !== -1 ? levels.indexOf(props.gamification.level) : 2;
});

const progressToNextLevel = computed(() => {
  const points = props.gamification.points;
  const currentThreshold = currentLevelIndex.value * 50;
  const nextThreshold = (currentLevelIndex.value + 1) * 50;
  const progress = Math.min(100, Math.round(((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100));
  return Math.max(0, progress);
});
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto pb-24">
    <!-- Header -->
    <div>
      <h2 class="text-lg font-black text-slate-900">Kinerja & Skor Saya</h2>
      <p class="text-xs text-slate-500 font-medium">Poin Diberikan Untuk Pekerjaan Nyata Yang Terbukti</p>
    </div>

    <!-- Main Level & Point Showcase Card -->
    <div class="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 border border-emerald-500/30 rounded-3xl p-5 shadow-lg relative overflow-hidden text-white">
      <div class="flex items-center justify-between mb-4">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Tingkat Kemahiran</span>
          <h3 class="text-2xl font-black text-white flex items-center gap-2 mt-0.5">
            {{ gamification.level }}
            <Star class="w-5 h-5 text-amber-300 fill-amber-300" />
          </h3>
          <p class="text-xs text-emerald-100 font-medium">Petugas: {{ currentUser.name }}</p>
        </div>

        <div class="text-right">
          <div class="text-3xl font-black text-white font-mono">{{ gamification.points }}</div>
          <span class="text-[10px] text-emerald-100 uppercase tracking-wider font-bold">Total Poin</span>
        </div>
      </div>

      <!-- Level Progress Bar -->
      <div class="space-y-1.5">
        <div class="flex justify-between text-[11px] font-bold text-white">
          <span>Progres ke Level Berikutnya</span>
          <span>{{ progressToNextLevel }}%</span>
        </div>
        <div class="h-2.5 w-full bg-black/20 rounded-full overflow-hidden p-0.5 border border-white/20">
          <div
            class="h-full bg-white rounded-full transition-all duration-700 shadow-sm"
            :style="{ width: `${progressToNextLevel}%` }"
          ></div>
        </div>
        <div class="flex justify-between text-[10px] text-emerald-100 font-semibold">
          <span>{{ levels[currentLevelIndex] }}</span>
          <span>{{ levels[Math.min(levels.length - 1, currentLevelIndex + 1)] }}</span>
        </div>
      </div>
    </div>

    <!-- Personal Records & Streak -->
    <div class="grid grid-cols-2 gap-3">
      <!-- Streak -->
      <div class="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm text-slate-800">
        <div class="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-2 shadow-xs">
          <Flame class="w-5 h-5 fill-amber-500" />
        </div>
        <div class="text-2xl font-black text-slate-900 flex items-center gap-1">
          {{ gamification.streak }} Hari
          <span class="text-xs text-amber-500">🔥</span>
        </div>
        <p class="text-xs text-slate-700 font-bold mt-0.5">Streak Konsisten</p>
        <p class="text-[11px] text-slate-500 mt-1 font-medium">Hari berturut-turut &ge; 95% tugas selesai.</p>
      </div>

      <!-- Personal Record -->
      <div class="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm text-slate-800">
        <div class="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-2 shadow-xs">
          <TrendingUp class="w-5 h-5" />
        </div>
        <div class="text-2xl font-black text-slate-900 font-mono">98%</div>
        <p class="text-xs text-slate-700 font-bold mt-0.5">Rekor Pribadi</p>
        <p class="text-[11px] text-slate-500 mt-1 font-medium">Minggu ini 97%, rekor kamu 98%.</p>
      </div>
    </div>

    <!-- Anti-Cheat and Fair Scoring Rules (PRD Principle) -->
    <div class="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 sm:p-5 shadow-xs text-xs text-slate-800 space-y-2">
      <div class="flex items-center gap-2 font-black text-emerald-900">
        <ShieldAlert class="w-4 h-4 text-emerald-700" />
        <span>Prinsip Penilaian Adil & Anti-Curang</span>
      </div>
      <ul class="space-y-1.5 text-[11px] text-slate-700 list-disc list-inside font-medium">
        <li>Tidak ada poin untuk sekadar memberi nilai "Bagus".</li>
        <li>Melaporkan item "Kurang/Kotor" lalu memperbaikinya justru memberi poin (+5).</li>
        <li>Pengisian terburu-buru (< 3 menit untuk seluruh area) tidak mendapat poin.</li>
        <li>Hasil dinilai per petugas sebenarnya (adil bagi petugas pengganti).</li>
      </ul>
    </div>

    <!-- Points Ledger History -->
    <div class="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm text-slate-800">
      <h4 class="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">Riwayat Perolehan Poin</h4>

      <div class="divide-y divide-slate-100">
        <div
          v-for="entry in gamification.points_history"
          :key="entry.id"
          class="py-2.5 flex items-center justify-between text-xs"
        >
          <div>
            <p class="font-bold text-slate-800">{{ entry.reason }}</p>
            <p class="text-[10px] text-slate-500 font-mono mt-0.5">{{ entry.created_at }}</p>
          </div>
          <span class="font-black text-emerald-700 font-mono text-sm">
            +{{ entry.points }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
