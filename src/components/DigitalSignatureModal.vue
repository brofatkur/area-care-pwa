<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { playSuccessChime, triggerHaptic } from '../services/audioHaptic';
import { PenTool, RotateCcw, Check, X } from 'lucide-vue-next';

const props = defineProps<{
  title: string;
  signerName: string;
  roleDescription: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'signed', signatureDataUrl: string): void;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isDrawing = ref(false);
const hasSignature = ref(false);

const initCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * 2;
  canvas.height = rect.height * 2;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#059669'; // Emerald green stroke
  }
};

const getPos = (e: MouseEvent | TouchEvent) => {
  const canvas = canvasRef.value;
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  if ('touches' in e && e.touches.length > 0) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  } else if ('clientX' in e) {
    return {
      x: (e as MouseEvent).clientX - rect.left,
      y: (e as MouseEvent).clientY - rect.top
    };
  }
  return { x: 0, y: 0 };
};

const startDrawing = (e: MouseEvent | TouchEvent) => {
  e.preventDefault();
  isDrawing.value = true;
  hasSignature.value = true;
  const ctx = canvasRef.value?.getContext('2d');
  if (!ctx) return;
  const { x, y } = getPos(e);
  ctx.beginPath();
  ctx.moveTo(x, y);
};

const draw = (e: MouseEvent | TouchEvent) => {
  if (!isDrawing.value) return;
  e.preventDefault();
  const ctx = canvasRef.value?.getContext('2d');
  if (!ctx) return;
  const { x, y } = getPos(e);
  ctx.lineTo(x, y);
  ctx.stroke();
};

const stopDrawing = () => {
  isDrawing.value = false;
};

const clearCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSignature.value = false;
  }
};

const saveSignature = () => {
  if (!canvasRef.value || !hasSignature.value) {
    alert('Silakan bubuhkan tanda tangan atau paraf Anda terlebih dahulu di kotak.');
    return;
  }
  playSuccessChime();
  triggerHaptic('success');
  const dataUrl = canvasRef.value.toDataURL('image/png');
  emit('signed', dataUrl);
};

onMounted(() => {
  setTimeout(initCanvas, 100);
});
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-5 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 text-slate-900">
      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
            <PenTool class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-black text-slate-900 text-base leading-tight">{{ title }}</h3>
            <p class="text-xs text-slate-500 font-medium">{{ signerName }} · {{ roleDescription }}</p>
          </div>
        </div>
        <button
          @click="emit('close')"
          class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <p class="text-xs text-slate-600 mb-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 font-medium leading-relaxed">
        Bubuhkan paraf pada area di bawah menggunakan jari atau stylus. Paraf ini mewakili keabsahan pemeriksaan fisik dan komitmen standar Ready-to-Use.
      </p>

      <!-- Signature Canvas Box -->
      <div class="relative bg-white border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl h-48 w-full overflow-hidden touch-none mb-3 shadow-inner">
        <canvas
          ref="canvasRef"
          @mousedown="startDrawing"
          @mousemove="draw"
          @mouseup="stopDrawing"
          @mouseleave="stopDrawing"
          @touchstart="startDrawing"
          @touchmove="draw"
          @touchend="stopDrawing"
          class="w-full h-full cursor-crosshair"
        ></canvas>

        <div
          v-if="!hasSignature"
          class="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400"
        >
          <PenTool class="w-8 h-8 mb-1.5 opacity-40 text-slate-400" />
          <span class="text-xs font-bold text-slate-500">Tanda tangan / paraf di sini</span>
        </div>

        <div class="absolute bottom-2 right-3 text-[10px] text-slate-400 font-mono font-bold pointer-events-none">
          TIMESTAMP VALIDATED
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex gap-2.5">
        <button
          @click="clearCanvas"
          class="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition border border-slate-300"
        >
          <RotateCcw class="w-4 h-4" /> Bersihkan
        </button>
        <button
          @click="saveSignature"
          class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition"
        >
          <Check class="w-4 h-4" /> Simpan & Paraf
        </button>
      </div>
    </div>
  </div>
</template>
