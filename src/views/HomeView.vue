<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { User, Area, CheckpointSlot, CheckpointRecord, ShiftAttendance, ShiftStatus } from '../types';
import { CHECKPOINT_SLOTS } from '../data/checklistMaster';
import { playTapSound, playSuccessChime, triggerHaptic } from '../services/audioHaptic';
import { getLocalAttendance, saveLocalAttendance } from '../services/offlineQueue';
import confetti from 'canvas-confetti';
import {
  Clock,
  Flame,
  Award,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  UserPlus,
  Play,
  Check,
  Coffee,
  LogOut,
  LogIn,
  Timer,
  Pause,
  RotateCcw,
  Sparkles,
  ClipboardList
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

// Attendance & Work Timer State
const attendance = ref<ShiftAttendance>({
  date: '2026-09-29',
  status: 'working',
  check_in_time: '06:55 WITA',
  started_timestamp: Date.now() - 3600 * 1000 * 2.5, // 2.5 hours ago default so user sees timer immediately
  total_break_seconds: 0
});

const nowTimestamp = ref(Date.now());
let timerInterval: any = null;

onMounted(async () => {
  const saved = await getLocalAttendance();
  if (saved) {
    attendance.value = saved;
  }
  timerInterval = setInterval(() => {
    nowTimestamp.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

// Format timer into HH:MM:SS
const formattedWorkTimer = computed(() => {
  if (attendance.value.status === 'not_started' || !attendance.value.started_timestamp) {
    return '00:00:00';
  }

  let totalElapsed = 0;
  if (attendance.value.status === 'working') {
    totalElapsed = Math.floor((nowTimestamp.value - attendance.value.started_timestamp) / 1000) - (attendance.value.total_break_seconds || 0);
  } else if (attendance.value.status === 'on_break') {
    const breakDuration = attendance.value.break_start_timestamp ? Math.floor((nowTimestamp.value - attendance.value.break_start_timestamp) / 1000) : 0;
    totalElapsed = Math.floor((nowTimestamp.value - attendance.value.started_timestamp) / 1000) - ((attendance.value.total_break_seconds || 0) + breakDuration);
  } else if (attendance.value.status === 'completed') {
    totalElapsed = Math.floor(((attendance.value as any).completed_timestamp || nowTimestamp.value) - attendance.value.started_timestamp) / 1000 - (attendance.value.total_break_seconds || 0);
  }

  const safeSec = Math.max(0, totalElapsed);
  const hrs = Math.floor(safeSec / 3600).toString().padStart(2, '0');
  const mins = Math.floor((safeSec % 3600) / 60).toString().padStart(2, '0');
  const secs = Math.floor(safeSec % 60).toString().padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
});

// Break timer if currently on break
const formattedBreakTimer = computed(() => {
  if (attendance.value.status !== 'on_break' || !attendance.value.break_start_timestamp) {
    return '00:00';
  }
  const diff = Math.max(0, Math.floor((nowTimestamp.value - attendance.value.break_start_timestamp) / 1000));
  const mins = Math.floor(diff / 60).toString().padStart(2, '0');
  const secs = Math.floor(diff % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
});

// Attendance Actions
const doCheckIn = async () => {
  playSuccessChime();
  triggerHaptic('success');
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA';
  attendance.value.status = 'working';
  attendance.value.check_in_time = timeStr;
  attendance.value.started_timestamp = Date.now();
  attendance.value.total_break_seconds = 0;
  await saveLocalAttendance(attendance.value);
};

const doStartBreak = async () => {
  playTapSound();
  triggerHaptic('medium');
  attendance.value.status = 'on_break';
  attendance.value.break_start_timestamp = Date.now();
  await saveLocalAttendance(attendance.value);
};

const doEndBreak = async () => {
  playSuccessChime();
  triggerHaptic('success');
  if (attendance.value.break_start_timestamp) {
    const elapsed = Math.floor((Date.now() - attendance.value.break_start_timestamp) / 1000);
    attendance.value.total_break_seconds += elapsed;
  }
  attendance.value.status = 'working';
  attendance.value.break_start_timestamp = undefined;
  await saveLocalAttendance(attendance.value);
};

const doCheckOut = async () => {
  if (!confirm('Apakah Anda yakin ingin menyelesaikan shift dan melakukan check-out pulang?')) {
    return;
  }
  playSuccessChime();
  triggerHaptic('success');
  try {
    confetti({ particleCount: 70, spread: 60 });
  } catch (e) {}

  const now = new Date();
  attendance.value.status = 'completed';
  attendance.value.check_out_time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA';
  (attendance.value as any).completed_timestamp = Date.now();
  await saveLocalAttendance(attendance.value);
};

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
    // Open the first unfinished area directly (no QR scan needed!)
    const firstUnfinished = props.areas.find(a => !activeSlotRecord.value?.area_results[a.id]?.ready_photo_url) || props.areas[0];
    emit('openArea', firstUnfinished);
  }
};
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto">
    <!-- 1. ABSENSI MASUK, TIMER KERJA, ISTIRAHAT & CHECKOUT CARD -->
    <div class="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
      <!-- Top Status Row -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <div
            class="w-3 h-3 rounded-full"
            :class="
              attendance.status === 'working'
                ? 'bg-emerald-500 animate-pulse'
                : attendance.status === 'on_break'
                ? 'bg-amber-500 animate-pulse'
                : attendance.status === 'completed'
                ? 'bg-blue-600'
                : 'bg-slate-400'
            "
          ></div>
          <span
            class="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md"
            :class="
              attendance.status === 'working'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : attendance.status === 'on_break'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : attendance.status === 'completed'
                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                : 'bg-slate-100 text-slate-700'
            "
          >
            {{
              attendance.status === 'working'
                ? 'Sedang Bertugas'
                : attendance.status === 'on_break'
                ? 'Sedang Istirahat'
                : attendance.status === 'completed'
                ? 'Shift Selesai (Check-Out)'
                : 'Belum Check-In Masuk'
            }}
          </span>
        </div>

        <span class="text-[11px] text-slate-500 font-semibold">
          Shift 07.00 - 16.00 WITA
        </span>
      </div>

      <!-- Center: Live Work Timer & Check-In Detail -->
      <div class="flex items-center justify-between my-2 py-3 border-y border-slate-100">
        <div>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {{ attendance.status === 'on_break' ? 'Durasi Istirahat' : 'Durasi Jam Kerja Aktif' }}
          </span>
          <div
            class="text-3xl sm:text-4xl font-black font-mono tracking-tight"
            :class="attendance.status === 'on_break' ? 'text-amber-600' : 'text-emerald-600'"
          >
            {{ attendance.status === 'on_break' ? formattedBreakTimer : formattedWorkTimer }}
          </div>
          <p class="text-[11px] text-slate-500 mt-0.5 font-medium">
            Masuk: <span class="text-slate-800 font-bold">{{ attendance.check_in_time || '-' }}</span>
            <span v-if="attendance.check_out_time"> · Pulang: <span class="text-slate-800 font-bold">{{ attendance.check_out_time }}</span></span>
          </p>
        </div>

        <div class="text-right">
          <div
            class="w-13 h-13 rounded-2xl flex items-center justify-center border shadow-xs"
            :class="attendance.status === 'on_break' ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'"
          >
            <Coffee v-if="attendance.status === 'on_break'" class="w-6 h-6" />
            <Timer v-else class="w-6 h-6" />
          </div>
        </div>
      </div>

      <!-- Action Buttons for Shift Attendance -->
      <div class="mt-3">
        <!-- If Not Started: Button Check-in Masuk -->
        <button
          v-if="attendance.status === 'not_started'"
          @click="doCheckIn"
          class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 transition"
        >
          <LogIn class="w-5 h-5" />
          <span>CHECK-IN ABSEN MASUK KERJA</span>
        </button>

        <!-- If Working: Buttons Istirahat & Check-out -->
        <div v-else-if="attendance.status === 'working'" class="grid grid-cols-2 gap-2">
          <button
            @click="doStartBreak"
            class="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
          >
            <Coffee class="w-4 h-4 text-amber-700" />
            <span>Mulai Istirahat</span>
          </button>

          <button
            @click="doCheckOut"
            class="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
          >
            <LogOut class="w-4 h-4" />
            <span>Check-Out Pulang</span>
          </button>
        </div>

        <!-- If On Break: Button Selesai Istirahat -->
        <div v-else-if="attendance.status === 'on_break'" class="flex gap-2">
          <button
            @click="doEndBreak"
            class="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/25 active:scale-95 transition"
          >
            <Play class="w-4 h-4 fill-white" />
            <span>Selesai Istirahat & Lanjut Kerja</span>
          </button>
        </div>

        <!-- If Completed: Finished note -->
        <div v-else class="text-center py-1">
          <span class="text-xs text-blue-700 font-bold">✓ Shift hari ini telah diselesaikan. Terima kasih atas dedikasi Anda!</span>
        </div>
      </div>
    </div>

    <!-- Gamification Ribbon -->
    <div class="bg-white border border-slate-200 rounded-3xl p-3.5 flex items-center justify-between shadow-sm">
      <!-- Streak -->
      <div class="flex items-center gap-2.5">
        <div class="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
          <Flame class="w-5 h-5 fill-amber-500" />
        </div>
        <div>
          <div class="flex items-center gap-1">
            <span class="text-xs font-black text-slate-900">{{ gamification.streak }} Hari</span>
            <span class="text-amber-500 text-xs">🔥</span>
          </div>
          <p class="text-[10px] text-slate-500 font-medium">Streak &ge; 95%</p>
        </div>
      </div>

      <!-- Level & Points -->
      <div class="text-right">
        <div class="flex items-center justify-end gap-1.5">
          <span class="text-xs font-black text-emerald-700">{{ gamification.points }} PTS</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black border border-emerald-200">
            Level {{ gamification.level }}
          </span>
        </div>
        <p class="text-[10px] text-slate-500 font-medium mt-0.5">Petugas: <span class="text-slate-800 font-bold">{{ currentUser.name }}</span></p>
      </div>
    </div>

    <!-- Substitute Officer Alert Bar if in relief mode -->
    <div
      v-if="isSubstitute"
      class="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between text-xs text-amber-900 shadow-xs"
    >
      <div class="flex items-center gap-2">
        <ShieldCheck class="w-4 h-4 text-amber-600 shrink-0" />
        <span class="font-bold">Mode Petugas Pengganti Aktif</span>
      </div>
      <span class="text-[10px] text-amber-800 font-bold">KPI Dinilai Khusus Hari Ini</span>
    </div>

    <!-- "Saya Pengganti Hari Ini" Button -->
    <div v-else class="text-center">
      <button
        @click="emit('openSubstituteModal')"
        class="text-xs text-slate-500 hover:text-amber-700 transition flex items-center justify-center gap-1.5 mx-auto py-0.5 font-bold"
      >
        <UserPlus class="w-3.5 h-3.5 text-slate-400" />
        <span>Saya pengganti hari ini (Bukan {{ currentUser.name }})?</span>
      </button>
    </div>

    <!-- GIANT Primary Action Button: Direct Checklist Execution (NO QR) -->
    <div class="relative group">
      <button
        @click="onPrimaryAction"
        class="w-full h-20 rounded-3xl text-white font-black text-lg sm:text-xl flex items-center justify-between px-6 shadow-xl transition-all duration-300 active:scale-[0.98] border border-white/20"
        :class="
          isReadyToSubmit
            ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 shadow-emerald-600/30 hover:shadow-emerald-600/40'
            : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 shadow-blue-600/30 hover:shadow-blue-600/40'
        "
      >
        <div class="text-left">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold tracking-wider uppercase text-blue-100">
              {{ isReadyToSubmit ? 'SEMUA AREA SELESAI' : 'CHECKLIST BERJALAN' }}
            </span>
            <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
          </div>
          <div class="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
            {{ isReadyToSubmit ? 'SUBMIT & PARAF DIGITAL' : `LANGSUNG ISI ${currentSlot}` }}
          </div>
        </div>

        <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner shrink-0">
          <Check v-if="isReadyToSubmit" class="w-6 h-6 stroke-[3]" />
          <Play v-else class="w-6 h-6 fill-white ml-0.5" />
        </div>
      </button>
    </div>

    <!-- Circular Progress KPI Card (Target >= 95%) -->
    <div class="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">KPI Kinerja Hari Ini</span>
          <h3 class="text-base font-black text-slate-900 mt-0.5">Penyelesaian Checkpoint</h3>
          <p class="text-xs text-slate-600 mt-1 font-medium">
            Target resmi: <span class="text-emerald-700 font-bold">&ge; 95%</span>
          </p>
        </div>

        <!-- SVG Circular Ring -->
        <div class="relative w-18 h-18 shrink-0 flex items-center justify-center">
          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              class="text-slate-100"
              stroke-width="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              class="text-emerald-500 transition-all duration-700 ease-out"
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
            <span class="text-sm font-black text-slate-900 leading-none">{{ dailyKpi }}%</span>
            <span class="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Selesai</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 4 Checkpoint Slots of Today (07.00, 10.00, 13.00, 15.30) -->
    <div>
      <div class="flex items-center justify-between mb-2 px-1">
        <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider">4 Jadwal Checkpoint</h4>
        <span class="text-[11px] text-slate-500 font-medium">Shift 07.00 - 16.00</span>
      </div>

      <div class="grid grid-cols-2 gap-2.5">
        <div
          v-for="slot in CHECKPOINT_SLOTS"
          :key="slot.id"
          @click="emit('startCheckpoint', slot.id as CheckpointSlot)"
          class="p-3.5 rounded-2xl border transition cursor-pointer relative overflow-hidden shadow-xs"
          :class="
            slot.id === currentSlot
              ? 'bg-blue-50/80 border-2 border-blue-600 shadow-md'
              : checkpoints[slot.id]?.status === 'Selesai'
              ? 'bg-white border-slate-200 hover:border-slate-300'
              : 'bg-white/80 border-slate-200/90 hover:bg-slate-50'
          "
        >
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-black" :class="slot.id === currentSlot ? 'text-blue-900' : 'text-slate-900'">{{ slot.label }}</span>
            <span
              class="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase"
              :class="
                checkpoints[slot.id]?.status === 'Selesai'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : slot.id === currentSlot
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600'
              "
            >
              {{ checkpoints[slot.id]?.status || (slot.id === currentSlot ? 'Sekarang' : 'Belum') }}
            </span>
          </div>

          <p class="text-[11px] font-semibold truncate" :class="slot.id === currentSlot ? 'text-blue-800' : 'text-slate-700'">{{ slot.name }}</p>
          <div class="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500">
            <span>{{ slot.isFullCheck ? '315 Item (Lengkap)' : 'Item Rutin' }}</span>
            <span v-if="checkpoints[slot.id]?.overall_score" class="font-black text-emerald-700">
              {{ checkpoints[slot.id]?.overall_score }}%
            </span>
            <span v-else class="text-slate-400">Belum diisi</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 7 Areas List: Direct Checklist Entry (No QR Code Needed) -->
    <div class="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <div>
          <h4 class="text-xs font-black text-slate-900 uppercase tracking-wider">7 Area Checkpoint {{ currentSlot }}</h4>
          <p class="text-[11px] text-slate-500 font-medium">Langsung ketuk area untuk mengisi checklist</p>
        </div>
        <span class="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
          {{ Object.values(activeSlotRecord?.area_results || {}).filter(a => a.ready_photo_url).length }} / {{ areas.length }} Selesai
        </span>
      </div>

      <div class="space-y-2">
        <div
          v-for="area in areas"
          :key="area.id"
          @click="emit('openArea', area)"
          class="p-3.5 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md border border-slate-200/90 flex items-center justify-between gap-3 cursor-pointer transition active:scale-[0.99]"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
              :class="
                activeSlotRecord?.area_results[area.id]?.ready_photo_url
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700 shadow-xs'
                  : 'bg-white border-slate-300 text-slate-500'
              "
            >
              <CheckCircle2 v-if="activeSlotRecord?.area_results[area.id]?.ready_photo_url" class="w-5 h-5 text-emerald-700" />
              <ClipboardList v-else class="w-5 h-5 text-slate-600" />
            </div>

            <div>
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-xs text-slate-900">{{ area.name }}</span>
                <span
                  v-if="activeSlotRecord?.area_results[area.id]?.is_ready === false"
                  class="text-[9px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 font-black"
                >
                  TIDAK SIAP
                </span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5 font-medium">
                {{ area.sections.length }} sub-bagian ·
                <span :class="activeSlotRecord?.area_results[area.id]?.ready_photo_url ? 'text-emerald-700 font-bold' : 'text-slate-500'">
                  {{ activeSlotRecord?.area_results[area.id]?.ready_photo_url ? 'Selesai Terverifikasi ✓' : 'Siap dikerjakan' }}
                </span>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span
              v-if="activeSlotRecord?.area_results[area.id]?.score"
              class="text-xs font-black text-emerald-700"
            >
              {{ activeSlotRecord?.area_results[area.id]?.score }}%
            </span>
            <ChevronRight class="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
