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
      <h2 class="text-lg font-black text-white">Kinerja & Skor Saya</h2>
      <p class="text-xs text-slate-400">Poin Diberikan Untuk Pekerjaan Nyata Yang Terbukti</p>
    </div>

    <!-- Main Level & Point Showcase Card -->
    <div class="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
      <div class="flex items-center justify-between mb-4">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Tingkat Kemahiran</span>
          <h3 class="text-2xl font-black text-white flex items-center gap-2 mt-0.5">
            {{ gamification.level }}
            <Star class="w-5 h-5 text-amber-400 fill-amber-400" />
          </h3>
          <p class="text-xs text-slate-300">Petugas: {{ currentUser.name }}</p>
        </div>

        <div class="text-right">
          <div class="text-3xl font-black text-emerald-400 font-mono">{{ gamification.points }}</div>
          <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Poin</span>
        </div>
      </div>

      <!-- Level Progress Bar -->
      <div class="space-y-1.5">
        <div class="flex justify-between text-[11px] font-semibold text-slate-300">
          <span>Progres ke Level Berikutnya</span>
          <span>{{ progressToNextLevel }}%</span>
        </div>
        <div class="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
          <div
            class="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-700"
            :style="{ width: `${progressToNextLevel}%` }"
          ></div>
        </div>
        <div class="flex justify-between text-[9px] text-slate-400 font-medium">
          <span>{{ levels[currentLevelIndex] }}</span>
          <span>{{ levels[Math.min(levels.length - 1, currentLevelIndex + 1)] }}</span>
        </div>
      </div>
    </div>

    <!-- Personal Records & Streak -->
    <div class="grid grid-cols-2 gap-3">
      <!-- Streak -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-sm">
        <div class="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
          <Flame class="w-5 h-5 fill-amber-500/20" />
        </div>
        <div class="text-2xl font-black text-white flex items-center gap-1">
          {{ gamification.streak }} Hari
          <span class="text-xs text-amber-400">🔥</span>
        </div>
        <p class="text-xs text-slate-300 font-medium mt-0.5">Streak Konsisten</p>
        <p class="text-[10px] text-slate-400 mt-1">Hari berturut-turut &ge; 95% tugas selesai.</p>
      </div>

      <!-- Personal Record -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-sm">
        <div class="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
          <TrendingUp class="w-5 h-5" />
        </div>
        <div class="text-2xl font-black text-white font-mono">98%</div>
        <p class="text-xs text-slate-300 font-medium mt-0.5">Rekor Pribadi</p>
        <p class="text-[10px] text-slate-400 mt-1">Minggu ini 97%, rekor kamu 98%.</p>
      </div>
    </div>

    <!-- Anti-Cheat and Fair Scoring Rules (PRD Principle) -->
    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-sm text-xs text-slate-300 space-y-2">
      <div class="flex items-center gap-2 font-bold text-emerald-400">
        <ShieldAlert class="w-4 h-4" />
        <span>Prinsip Penilaian Adil & Anti-Curang</span>
      </div>
      <ul class="space-y-1.5 text-[11px] text-slate-300 list-disc list-inside">
        <li>Tidak ada poin untuk sekadar memberi nilai "Bagus".</li>
        <li>Melaporkan item "Kurang/Kotor" lalu memperbaikinya justru memberi poin (+5).</li>
        <li>Pengisian terburu-buru (< 3 menit untuk seluruh area) tidak mendapat poin.</li>
        <li>Hasil dinilai per petugas sebenarnya (adil bagi petugas pengganti).</li>
      </ul>
    </div>

    <!-- Points Ledger History -->
    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-sm">
      <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-3">Riwayat Perolehan Poin</h4>

      <div class="divide-y divide-slate-800">
        <div
          v-for="entry in gamification.points_history"
          :key="entry.id"
          class="py-2.5 flex items-center justify-between text-xs"
        >
          <div>
            <p class="font-medium text-slate-200">{{ entry.reason }}</p>
            <p class="text-[10px] text-slate-400 font-mono mt-0.5">{{ entry.created_at }}</p>
          </div>
          <span class="font-black text-emerald-400 font-mono text-sm">
            +{{ entry.points }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
