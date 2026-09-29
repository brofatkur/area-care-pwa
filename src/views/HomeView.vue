<script setup lang="ts">
import { ref, computed } from 'vue';
import { User, Area, CheckpointSlot, CheckpointRecord } from '../types';
import { CHECKPOINT_SLOTS } from '../data/checklistMaster';
import { playTapSound, triggerHaptic } from '../services/audioHaptic';
import {
  Clock,
  QrCode,
  Flame,
  Award,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  UserPlus,
  Play,
  Camera,
  Check
} from 'lucide-vue-next';

const props = defineProps<{
  currentUser: User;
  isSubstitute: boolean;
  areas: Area[];
  currentSlot: CheckpointSlot;
  checkpoints: Record<string, CheckpointRecord>;
  gamification: {
    points: number;
    streak: number;
    level: string;
  };
}>();

const emit = defineEmits<{
  (e: 'startCheckpoint', slot: CheckpointSlot): void;
  (e: 'openArea', area: Area): void;
  (e: 'openSubmit', slot: CheckpointSlot): void;
  (e: 'openSubstituteModal'): void;
}>();

// Slot times in WITA
const activeSlotRecord = computed(() => {
  return props.checkpoints[props.currentSlot] || null;
});

// Calculate daily KPI % tugas selesai (item dinilai lengkap / item dijadwalkan * 100%)
const dailyKpi = computed(() => {
  let completedAreas = 0;
  let totalAreas = props.areas.length;
  if (!activeSlotRecord.value) return 0;

  Object.values(activeSlotRecord.value.area_results).forEach(ar => {
    if (ar.ready_photo_url && Object.keys(ar.ratings).length > 0) {
      completedAreas++;
    }
  });

  return Math.round((completedAreas / totalAreas) * 100);
});

// Check if all 7 areas are ready for submission
const isReadyToSubmit = computed(() => {
  if (!activeSlotRecord.value) return false;
  const results = activeSlotRecord.value.area_results;
  return props.areas.every(a => results[a.id]?.ready_photo_url);
});

const onPrimaryAction = () => {
  playTapSound();
  triggerHaptic('medium');
  if (isReadyToSubmit.value) {
    emit('openSubmit', props.currentSlot);
  } else {
    // Open the first unfinished area
    const firstUnfinished = props.areas.find(a => !activeSlotRecord.value?.area_results[a.id]?.ready_photo_url) || props.areas[0];
    emit('openArea', firstUnfinished);
  }
};
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto">
    <!-- Top Gamification Ribbon -->
    <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-3.5 flex items-center justify-between shadow-lg">
      <!-- Streak -->
      <div class="flex items-center gap-2">
        <div class="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Flame class="w-5 h-5 fill-amber-500/20" />
        </div>
        <div>
          <div class="flex items-center gap-1">
            <span class="text-sm font-extrabold text-white">{{ gamification.streak }} Hari</span>
            <span class="text-amber-400 text-xs">🔥</span>
          </div>
          <p class="text-[10px] text-slate-400">Streak &ge; 95%</p>
        </div>
      </div>

      <!-- Level & Points -->
      <div class="text-right">
        <div class="flex items-center justify-end gap-1.5">
          <span class="text-xs font-black text-emerald-400">{{ gamification.points }} PTS</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30">
            Level {{ gamification.level }}
          </span>
        </div>
        <p class="text-[10px] text-slate-400 mt-0.5">Petugas: <span class="text-slate-200 font-medium">{{ currentUser.name }}</span></p>
      </div>
    </div>

    <!-- Substitute Officer Alert Bar if in relief mode -->
    <div
      v-if="isSubstitute"
      class="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center justify-between text-xs text-amber-200"
    >
      <div class="flex items-center gap-2">
        <ShieldCheck class="w-4 h-4 text-amber-400 shrink-0" />
        <span>Mode Petugas Pengganti Aktif</span>
      </div>
      <span class="text-[10px] text-amber-300 font-mono">KPI Dinilai Khusus Hari Ini</span>
    </div>

    <!-- "Saya Pengganti Hari Ini" Button (PRD requirement F-01) -->
    <div v-else class="text-center">
      <button
        @click="emit('openSubstituteModal')"
        class="text-xs text-slate-400 hover:text-amber-300 transition flex items-center justify-center gap-1.5 mx-auto py-1 font-medium"
      >
        <UserPlus class="w-3.5 h-3.5" />
        <span>Saya pengganti hari ini (Bukan {{ currentUser.name }})?</span>
      </button>
    </div>

    <!-- GIANT Primary Action Button (PRD Principle 1: Satu aksi utama per layar, tombol >= 56px) -->
    <div class="relative group">
      <button
        @click="onPrimaryAction"
        class="w-full h-20 rounded-3xl text-white font-black text-lg sm:text-xl flex items-center justify-between px-6 shadow-2xl transition-all duration-300 active:scale-[0.98] border border-white/10"
        :class="
          isReadyToSubmit
            ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 shadow-emerald-500/30 hover:shadow-emerald-500/40'
            : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 shadow-teal-500/25 hover:shadow-teal-500/35'
        "
      >
        <div class="text-left">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold tracking-wider uppercase text-emerald-100/90">
              {{ isReadyToSubmit ? 'SEMUA AREA SELESAI' : 'CHECKPOINT BERJALAN' }}
            </span>
            <span class="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
          </div>
          <div class="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
            {{ isReadyToSubmit ? 'SUBMIT & PARAF DIGITAL' : `MULAI ${currentSlot}` }}
          </div>
        </div>

        <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner shrink-0">
          <Check v-if="isReadyToSubmit" class="w-6 h-6 stroke-[3]" />
          <Play v-else class="w-6 h-6 fill-white ml-0.5" />
        </div>
      </button>
    </div>

    <!-- Circular Progress KPI Card (Target >= 95%) -->
    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
      <div class="flex items-center justify-between">
        <div>
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">KPI Kinerja Hari Ini</span>
          <h3 class="text-lg font-bold text-white mt-0.5">Penyelesaian Checkpoint</h3>
          <p class="text-xs text-slate-300 mt-1">
            Target resmi manajemen: <span class="text-emerald-400 font-bold">&ge; 95%</span>
          </p>
        </div>

        <!-- SVG Circular Ring -->
        <div class="relative w-20 h-20 shrink-0 flex items-center justify-center">
          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              class="text-slate-800"
              stroke-width="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              class="text-emerald-400 transition-all duration-700 ease-out"
              stroke-dasharray="100, 100"
              :stroke-dashoffset="100 - dailyKpi"
              stroke-width="3.5"
              stroke-linecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-sm font-black text-white leading-none">{{ dailyKpi }}%</span>
            <span class="text-[8px] font-semibold text-slate-400 uppercase mt-0.5">Selesai</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 4 Checkpoint Slots of Today (07.00, 10.00, 13.00, 15.30) -->
    <div>
      <div class="flex items-center justify-between mb-2 px-1">
        <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider">4 Checkpoint Harian</h4>
        <span class="text-[11px] text-slate-400">Shift 07.00 - 16.00 WITA</span>
      </div>

      <div class="grid grid-cols-2 gap-2.5">
        <div
          v-for="slot in CHECKPOINT_SLOTS"
          :key="slot.id"
          @click="emit('startCheckpoint', slot.id as CheckpointSlot)"
          class="p-3.5 rounded-2xl border transition cursor-pointer relative overflow-hidden"
          :class="
            slot.id === currentSlot
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-md'
              : checkpoints[slot.id]?.status === 'Selesai'
              ? 'bg-slate-900 border-slate-800'
              : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800'
          "
        >
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-black text-white">{{ slot.label }}</span>
            <span
              class="text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase"
              :class="
                checkpoints[slot.id]?.status === 'Selesai'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : slot.id === currentSlot
                  ? 'bg-teal-500/20 text-teal-300 animate-pulse'
                  : 'bg-slate-800 text-slate-400'
              "
            >
              {{ checkpoints[slot.id]?.status || (slot.id === currentSlot ? 'Sekarang' : 'Belum') }}
            </span>
          </div>

          <p class="text-[11px] text-slate-300 font-medium truncate">{{ slot.name }}</p>
          <div class="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400">
            <span>{{ slot.isFullCheck ? '315 Item (Full)' : 'Item Rutin' }}</span>
            <span v-if="checkpoints[slot.id]?.overall_score" class="font-bold text-emerald-400">
              {{ checkpoints[slot.id]?.overall_score }}%
            </span>
            <span v-else class="text-slate-500">Belum diisi</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Area List for Current Checkpoint Slot (Scan QR to unlock) -->
    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-lg">
      <div class="flex items-center justify-between mb-3">
        <div>
          <h4 class="text-xs font-bold text-white uppercase tracking-wider">7 Area Checkpoint {{ currentSlot }}</h4>
          <p class="text-[11px] text-slate-400">Scan QR fisik untuk membuka form area</p>
        </div>
        <span class="text-xs font-extrabold text-emerald-400">
          {{ Object.values(activeSlotRecord?.area_results || {}).filter(a => a.ready_photo_url).length }} / {{ areas.length }}
        </span>
      </div>

      <div class="space-y-2">
        <div
          v-for="area in areas"
          :key="area.id"
          @click="emit('openArea', area)"
          class="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80 flex items-center justify-between gap-3 cursor-pointer transition active:scale-[0.99]"
        >
          <div class="flex items-center gap-2.5">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
              :class="
                activeSlotRecord?.area_results[area.id]?.ready_photo_url
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              "
            >
              <CheckCircle2 v-if="activeSlotRecord?.area_results[area.id]?.ready_photo_url" class="w-5 h-5 text-emerald-400" />
              <QrCode v-else class="w-5 h-5 text-slate-400" />
            </div>

            <div>
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-xs text-white">{{ area.name }}</span>
                <span
                  v-if="activeSlotRecord?.area_results[area.id]?.is_ready === false"
                  class="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 font-extrabold"
                >
                  TIDAK SIAP
                </span>
              </div>
              <p class="text-[10px] text-slate-400 mt-0.5">
                {{ area.sections.length }} sub-bagian ·
                {{ activeSlotRecord?.area_results[area.id]?.ready_photo_url ? 'Foto Ready ✓' : 'Perlu Scan QR' }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span
              v-if="activeSlotRecord?.area_results[area.id]?.score"
              class="text-xs font-black text-emerald-400"
            >
              {{ activeSlotRecord?.area_results[area.id]?.score }}%
            </span>
            <ChevronRight class="w-4 h-4 text-slate-500" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
