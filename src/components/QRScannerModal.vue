<script setup lang="ts">
import { ref } from 'vue';
import { playSuccessChime, triggerHaptic, playWarningSound } from '../services/audioHaptic';
import { Area } from '../types';
import { QrCode, X, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-vue-next';

const props = defineProps<{
  targetArea: Area | null;
  allAreas: Area[];
  isSupervisor: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'scanned', areaId: string, manualReason?: string): void;
}>();

const showManualUnlock = ref(false);
const supervisorReason = ref('');
const manualError = ref('');

const handleSimulatedScan = (area: Area) => {
  if (props.targetArea && props.targetArea.id !== area.id) {
    playWarningSound();
    triggerHaptic('warning');
    alert(`QR Code salah! Ini adalah QR "${area.name}", sedangkan Anda sedang membuka "${props.targetArea.name}".`);
    return;
  }
  playSuccessChime();
  triggerHaptic('success');
  emit('scanned', area.id);
};

const submitManualUnlock = () => {
  if (!supervisorReason.value.trim()) {
    manualError.value = 'Wajib mengisi alasan pembukaan manual (mis. Stiker QR rusak/sedang dibersihkan)';
    return;
  }
  playSuccessChime();
  triggerHaptic('success');
  emit('scanned', props.targetArea ? props.targetArea.id : props.allAreas[0].id, supervisorReason.value.trim());
};
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black/90 flex flex-col justify-between backdrop-blur-md p-4">
    <!-- Header -->
    <div class="flex items-center justify-between text-white">
      <div>
        <h3 class="font-bold text-base flex items-center gap-2">
          <QrCode class="w-5 h-5 text-emerald-400" />
          Pindai QR Code Area
        </h3>
        <p class="text-xs text-slate-300">
          Arahkan kamera ke stiker QR di
          <span class="text-emerald-400 font-bold">{{ targetArea ? targetArea.name : 'Area Terpilih' }}</span>
        </p>
      </div>
      <button
        @click="emit('close')"
        class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white"
      >
        <X class="w-6 h-6" />
      </button>
    </div>

    <!-- Center Viewfinder -->
    <div class="my-auto flex flex-col items-center">
      <div class="relative w-64 h-64 border-2 border-emerald-500 rounded-3xl p-3 flex flex-col items-center justify-center overflow-hidden bg-slate-900/60 shadow-2xl">
        <!-- Laser scanner animation line -->
        <div class="absolute inset-x-4 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399] animate-bounce"></div>

        <QrCode class="w-32 h-32 text-emerald-400/40" />
        <span class="text-xs font-semibold text-emerald-300 mt-3 text-center">
          Posisikan stiker QR di dalam kotak
        </span>
      </div>

      <!-- Quick 1-tap simulator selector -->
      <div class="w-full max-w-sm mt-6 bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Sparkles class="w-3.5 h-3.5 text-amber-400" />
            Simulasi Tap QR Langsung:
          </span>
          <span class="text-[10px] text-slate-400">Pengujian Cepat</span>
        </div>

        <div class="grid grid-cols-2 gap-1.5">
          <button
            v-for="a in allAreas"
            :key="a.id"
            @click="handleSimulatedScan(a)"
            class="text-left px-2.5 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between border"
            :class="targetArea && targetArea.id === a.id ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow' : 'bg-slate-900/70 border-slate-700/60 text-slate-300 hover:bg-slate-700'"
          >
            <span class="truncate">{{ a.name }}</span>
            <span class="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0 ml-1">QR</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Fallback Manual Unlock (Supervisor) -->
    <div class="text-center pt-2">
      <div v-if="!showManualUnlock">
        <button
          @click="showManualUnlock = true"
          class="text-xs text-slate-400 hover:text-slate-200 underline font-medium"
        >
          Kendala Scan QR? Buka Checklist Manual (Supervisor)
        </button>
      </div>

      <div v-else class="bg-slate-900 border border-slate-700 rounded-2xl p-4 max-w-sm mx-auto text-left">
        <div class="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-2">
          <ShieldCheck class="w-4 h-4" />
          <span>Pembukaan Manual Oleh Supervisor</span>
        </div>
        <p class="text-[11px] text-slate-300 mb-2">
          Sesuai aturan F-03 PRD, pembukaan tanpa scan fisik akan dicatat di log audit.
        </p>
        <input
          v-model="supervisorReason"
          type="text"
          placeholder="Alasan pembukaan (mis. QR rusak / lensa HP kotor)"
          class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 mb-2"
        />
        <p v-if="manualError" class="text-[11px] text-rose-400 mb-2">{{ manualError }}</p>
        <div class="flex gap-2">
          <button
            @click="showManualUnlock = false"
            class="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
          >
            Batal
          </button>
          <button
            @click="submitManualUnlock"
            class="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
          >
            Buka Manual
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
