<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Area } from '../types';
import QRCode from 'qrcode';
import { ArrowLeft, Printer, QrCode, Database, Check, Layers } from 'lucide-vue-next';

const props = defineProps<{
  areas: Area[];
}>();

const emit = defineEmits<{
  (e: 'back'): void;
}>();

const activeTab = ref<'qr' | 'items'>('qr');
const qrDataUrls = ref<Record<string, string>>({});
const selectedArea = ref<Area>(props.areas[0]);

const generateQRCodes = async () => {
  for (const a of props.areas) {
    try {
      const url = await QRCode.toDataURL(a.qr_code, {
        width: 280,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      qrDataUrls.value[a.id] = url;
    } catch (e) {
      console.warn('QR generate error', e);
    }
  }
};

const printQRCodes = () => {
  window.print();
};

onMounted(() => {
  generateQRCodes();
});
</script>

<template>
  <div class="space-y-4 max-w-4xl mx-auto pb-28">
    <!-- Header -->
    <div class="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex items-center justify-between text-slate-900">
      <div class="flex items-center gap-3">
        <button
          @click="emit('back')"
          class="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-300 font-bold active:scale-95 transition"
        >
          <ArrowLeft class="w-4 h-4" /> Kembali
        </button>
        <div>
          <h2 class="text-base font-black text-slate-900">Master Data & Cetak QR Code</h2>
          <p class="text-xs text-slate-500 font-medium">7 Area · 27 Sub-Bagian · 315 Item Checklist</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="printQRCodes"
          class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition active:scale-95"
        >
          <Printer class="w-3.5 h-3.5" />
          <span>Cetak Lembar Stiker QR</span>
        </button>
      </div>
    </div>

    <!-- Tab Selector -->
    <div class="flex gap-2 bg-slate-100 border border-slate-200 p-1.5 rounded-2xl text-xs font-bold">
      <button
        @click="activeTab = 'qr'"
        class="flex-1 py-2 rounded-xl transition flex items-center justify-center gap-2"
        :class="activeTab === 'qr' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'"
      >
        <QrCode class="w-4 h-4" />
        <span>Lembar Stiker QR Fisik (7 Area)</span>
      </button>

      <button
        @click="activeTab = 'items'"
        class="flex-1 py-2 rounded-xl transition flex items-center justify-center gap-2"
        :class="activeTab === 'items' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'"
      >
        <Database class="w-4 h-4" />
        <span>Katalog 315 Item Checklist</span>
      </button>
    </div>

    <!-- TAB 1: PRINTABLE QR STICKERS SHEET -->
    <div v-if="activeTab === 'qr'" class="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl print:p-0 print:border-none print:shadow-none">
      <div class="text-center border-b-2 border-slate-200 pb-4 mb-6">
        <h3 class="text-xl font-black text-slate-900">LEMBAR STIKER QR CODE AREA INSPEKSI</h3>
        <p class="text-xs text-slate-500 mt-1">Cetak & tempel pada pintu / dinding masuk tiap area untuk validasi fisik kehadiran</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="area in areas"
          :key="area.id"
          class="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center flex flex-col items-center justify-between page-break-inside-avoid"
        >
          <div class="w-full text-center pb-2 border-b border-slate-100">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">BOFFICE CARE POINT</span>
            <h4 class="text-base font-extrabold text-slate-900">{{ area.name }}</h4>
          </div>

          <div class="my-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
            <img
              v-if="qrDataUrls[area.id]"
              :src="qrDataUrls[area.id]"
              :alt="area.name"
              class="w-44 h-44 object-contain"
            />
          </div>

          <div class="w-full text-center pt-2 border-t border-slate-100">
            <p class="text-[11px] font-mono font-bold text-emerald-700">{{ area.qr_code }}</p>
            <p class="text-[10px] text-slate-500">Pindai dengan kamera Area Care Officer</p>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: 315 ITEMS MASTER CATALOG -->
    <div v-else class="space-y-4">
      <div class="flex gap-2 overflow-x-auto pb-1 text-xs">
        <button
          v-for="a in areas"
          :key="a.id"
          @click="selectedArea = a"
          class="px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition border"
          :class="selectedArea.id === a.id ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'"
        >
          {{ a.name }} ({{ a.total_items }})
        </button>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 class="text-base font-bold text-white">{{ selectedArea.name }}</h3>
            <p class="text-xs text-slate-400">{{ selectedArea.sections.length }} Sub-Bagian · {{ selectedArea.total_items }} Item</p>
          </div>
          <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
            {{ selectedArea.qr_code }}
          </span>
        </div>

        <div v-for="sec in selectedArea.sections" :key="sec.id" class="space-y-2">
          <h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <span class="w-5 h-5 rounded bg-emerald-500/20 flex items-center justify-center text-[11px]">
              {{ sec.code }}
            </span>
            {{ sec.name }}
          </h4>

          <div class="divide-y divide-slate-800/60 bg-slate-950/70 border border-slate-800 rounded-2xl p-2">
            <div
              v-for="item in sec.items"
              :key="item.id"
              class="py-2 px-2 text-xs flex items-center justify-between gap-3"
            >
              <div class="flex items-center gap-2">
                <span class="font-mono text-[10px] text-slate-500 w-8">{{ item.code }}</span>
                <span class="text-slate-200">{{ item.text }}</span>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <span
                  class="text-[9px] px-1.5 py-0.2 rounded font-mono"
                  :class="item.frequency === 'daily_0700' ? 'bg-amber-900/40 text-amber-300' : 'bg-slate-800 text-slate-400'"
                >
                  {{ item.frequency === 'daily_0700' ? '07.00 saja' : 'Tiap checkpoint' }}
                </span>
                <span
                  v-if="item.is_key_item"
                  class="text-[9px] px-1.5 py-0.2 rounded bg-purple-900/40 text-purple-300 font-bold"
                >
                  KUNCI
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
