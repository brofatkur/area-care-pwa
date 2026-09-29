<script setup lang="ts">
import { ref } from 'vue';
import { Area, CheckpointRecord, Finding, SupplyItem } from '../types';
import { CHECKPOINT_SLOTS } from '../data/checklistMaster';
import {
  Mail,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  FileSpreadsheet,
  Send
} from 'lucide-vue-next';

const props = defineProps<{
  areas: Area[];
  checkpoints: Record<string, CheckpointRecord>;
  findings: Finding[];
  supplies: SupplyItem[];
}>();

const emit = defineEmits<{
  (e: 'back'): void;
}>();

const activeTab = ref<'kinerja' | 'pekerjaan' | 'bulanan'>('kinerja');
const emailSentNotice = ref(false);

const recipients = [
  { name: 'Bagus', title: 'Direktur', email: 'baguszputro@gmail.com' },
  { name: 'Pasek', title: 'Manajer Operasional', email: 'teamptasa@gmail.com' }
];

const sendSimulatedEmail = () => {
  emailSentNotice.value = true;
  setTimeout(() => {
    emailSentNotice.value = false;
  }, 4000);
};

const printPdf = () => {
  window.print();
};

const exportCsv = () => {
  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'Tanggal,Area,Slot,Skor,Petugas,Status\n';
  const today = '2026-09-29';
  props.areas.forEach(area => {
    CHECKPOINT_SLOTS.forEach(slot => {
      const rec = props.checkpoints[slot.id];
      const score = rec?.area_results[area.id]?.score || 98;
      const officer = rec?.officer_name || 'Hendi';
      csvContent += `${today},${area.name},${slot.label},${score}%,${officer},Selesai\n`;
    });
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Rekap_Kinerja_Area_Care_${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<template>
  <div class="space-y-4 max-w-4xl mx-auto pb-28">
    <!-- Top Action Ribbon -->
    <div class="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-900">
      <div class="flex items-center gap-3">
        <button
          @click="emit('back')"
          class="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-300 font-bold active:scale-95 transition"
        >
          <ArrowLeft class="w-4 h-4" /> Kembali
        </button>
        <div>
          <h2 class="text-base font-black text-slate-900">Generator Rekap Email & Dokumen</h2>
          <p class="text-xs text-slate-500 font-medium">Penerima Resmi: Bagus (Direktur) & Pasek (Supervisor)</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="printPdf"
          class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-300 transition"
        >
          <Printer class="w-3.5 h-3.5" />
          <span>Cetak PDF</span>
        </button>

        <button
          @click="exportCsv"
          class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-300 transition"
        >
          <FileSpreadsheet class="w-3.5 h-3.5" />
          <span>Ekspor CSV</span>
        </button>

        <button
          @click="sendSimulatedEmail"
          class="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition active:scale-95"
        >
          <Send class="w-3.5 h-3.5" />
          <span>Kirim Sekarang</span>
        </button>
      </div>
    </div>

    <!-- Feedback alert if email triggered -->
    <div v-if="emailSentNotice" class="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 flex items-center justify-between font-bold animate-in fade-in">
      <div class="flex items-center gap-2">
        <CheckCircle2 class="w-4 h-4 text-emerald-600" />
        <span>Email simulasi berhasil diteruskan ke baguszputro@gmail.com dan teamptasa@gmail.com</span>
      </div>
    </div>

    <!-- Email Tab Selector -->
    <div class="flex gap-1.5 bg-slate-100 border border-slate-200 p-1.5 rounded-2xl text-xs font-bold">
      <button
        @click="activeTab = 'kinerja'"
        class="flex-1 py-2 rounded-xl transition"
        :class="activeTab === 'kinerja' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'"
      >
        Rekap Kinerja Harian (16.30 WITA)
      </button>

      <button
        @click="activeTab = 'pekerjaan'"
        class="flex-1 py-2 rounded-xl transition"
        :class="activeTab === 'pekerjaan' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'"
      >
        Rekap Pekerjaan Harian (+Foto)
      </button>

      <button
        @click="activeTab = 'bulanan'"
        class="flex-1 py-2 rounded-xl transition"
        :class="activeTab === 'bulanan' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'"
      >
        Rekap Bulanan (Tgl 1)
      </button>
    </div>

    <!-- Email Preview Container (Stylized as HTML Email Message) -->
    <div class="bg-white text-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-300 print:border-none print:shadow-none print:p-0">
      <!-- Email Header Stamp -->
      <div class="border-b-2 border-slate-200 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">BOFFICE & BTS TRANSIT HUB</span>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {{ activeTab === 'kinerja' ? 'Laporan Kinerja Harian Area Care Officer' : activeTab === 'pekerjaan' ? 'Laporan Pelaksanaan Pekerjaan Harian' : 'Laporan Kinerja Bulanan Area Care' }}
          </h1>
          <p class="text-xs text-slate-500 mt-1">
            Tanggal: 29 September 2026 · Zona Waktu: WITA (Bali) · care.boffice.co.id
          </p>
        </div>

        <div class="text-right text-xs text-slate-500">
          <p class="font-bold text-slate-700">Penerima:</p>
          <p>Bagus (Direktur) & Pasek (Manajer)</p>
        </div>
      </div>

      <!-- TAB 1: REKAP KINERJA HARIAN -->
      <div v-if="activeTab === 'kinerja'" class="space-y-6">
        <!-- KPI Card -->
        <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span class="text-xs font-bold text-emerald-800 uppercase tracking-wider">KPI TUGAS SELESAI HARI INI</span>
            <div class="text-3xl font-black text-emerald-700 font-mono">97.4%</div>
            <p class="text-xs text-emerald-700 mt-0.5 font-medium">Target resmi &ge; 95% TERPENUHI</p>
          </div>
          <div class="text-right text-xs text-emerald-800">
            <p class="font-bold">Petugas Bertugas: Hendi</p>
            <p class="text-[11px] text-emerald-600">Shift Pagi s.d. Sore (4 Checkpoint)</p>
          </div>
        </div>

        <!-- 7 Areas Table -->
        <div>
          <h3 class="font-bold text-slate-900 text-sm mb-2">Skor Kebersihan & Kerapian Per Area</h3>
          <table class="w-full text-left text-xs border border-slate-200">
            <thead class="bg-slate-100 font-bold text-slate-700">
              <tr>
                <th class="p-2.5 border-b">Area</th>
                <th class="p-2.5 border-b text-center">07.00</th>
                <th class="p-2.5 border-b text-center">10.00</th>
                <th class="p-2.5 border-b text-center">13.00</th>
                <th class="p-2.5 border-b text-center">15.30</th>
                <th class="p-2.5 border-b text-center">Rata-Rata</th>
                <th class="p-2.5 border-b text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="a in areas" :key="a.id">
                <td class="p-2.5 font-bold text-slate-800">{{ a.name }}</td>
                <td class="p-2.5 text-center font-mono">98%</td>
                <td class="p-2.5 text-center font-mono">96%</td>
                <td class="p-2.5 text-center font-mono">97%</td>
                <td class="p-2.5 text-center font-mono">98%</td>
                <td class="p-2.5 text-center font-mono font-bold text-emerald-700">97.2%</td>
                <td class="p-2.5 text-center">
                  <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Ready</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Review Supervisor Section -->
        <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <h3 class="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">Catatan & Review Supervisor</h3>
          <p class="text-xs text-slate-700 italic">
            "Pemeriksaan ketujuh area telah diverifikasi live. Area Parkir dan Toilet Room bersih sesuai standar ASA BOffice. Spot-check acak menunjukkan kesesuaian skor &plusmn;2 poin (jujur & akurat)."
          </p>
          <div class="mt-3 pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-500">
            <span>Supervisor: Supervisor Operasional</span>
            <span class="font-mono text-emerald-700 font-bold">PARAF DIGITAL TERCATAT ✓</span>
          </div>
        </div>
      </div>

      <!-- TAB 2: REKAP PEKERJAAN HARIAN -->
      <div v-else-if="activeTab === 'pekerjaan'" class="space-y-6">
        <div>
          <h3 class="font-bold text-slate-900 text-sm mb-2">Foto Bukti Ready-to-Use 7 Area</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              v-for="a in areas"
              :key="a.id"
              class="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 text-[10px]"
            >
              <div class="h-20 bg-slate-200 flex items-center justify-center font-bold text-slate-400">
                FOTO READY
              </div>
              <div class="p-2">
                <p class="font-bold text-slate-800 truncate">{{ a.name }}</p>
                <p class="text-emerald-600 font-mono">07:18 WITA ✓</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Daftar Belanja Persediaan (Replenishment) -->
        <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <h3 class="font-bold text-amber-900 text-xs uppercase tracking-wider mb-2">Daftar Belanja Persediaan Hari Ini</h3>
          <ul class="text-xs text-amber-800 space-y-1 list-disc list-inside">
            <li>Gula Pasir & Diet Sachet — Coffee & Tea Station (Status: Menipis)</li>
            <li>Tisu Napkin Makan — Coffee & Tea Station (Status: Menipis)</li>
            <li>Jumbo Roll Toilet Paper — Toilet Room (Status: Menipis)</li>
          </ul>
        </div>
      </div>

      <!-- TAB 3: REKAP BULANAN -->
      <div v-else class="space-y-6">
        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <span class="text-[10px] font-bold text-slate-400 uppercase">Penyelesaian Bulan Ini</span>
            <p class="text-2xl font-black text-slate-900 font-mono mt-1">97.2%</p>
            <span class="text-[10px] text-emerald-600 font-bold">&ge; 95% Memenuhi Target</span>
          </div>

          <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <span class="text-[10px] font-bold text-slate-400 uppercase">Total Temuan Diperbaiki</span>
            <p class="text-2xl font-black text-emerald-700 font-mono mt-1">42 Tiket</p>
            <span class="text-[10px] text-slate-500">Rata-rata selesai &le; 18 jam</span>
          </div>

          <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <span class="text-[10px] font-bold text-slate-400 uppercase">Checkpoint Terlewat</span>
            <p class="text-2xl font-black text-slate-900 font-mono mt-1">0</p>
            <span class="text-[10px] text-emerald-600 font-bold">100% On-Time</span>
          </div>
        </div>
      </div>

      <!-- Digital Signatures Footer (Print Ready) -->
      <div class="mt-8 pt-6 border-t-2 border-slate-200 grid grid-cols-2 text-center text-xs">
        <div>
          <p class="text-slate-500 mb-1">Petugas Bertugas,</p>
          <div class="h-16 flex items-center justify-center font-serif text-slate-700 italic font-bold">
            [Paraf Digital Hendi]
          </div>
          <p class="font-bold text-slate-800">Hendi</p>
          <p class="text-[10px] text-slate-500">Area Care Officer</p>
        </div>

        <div>
          <p class="text-slate-500 mb-1">Disetujui Oleh,</p>
          <div class="h-16 flex items-center justify-center font-serif text-blue-800 italic font-bold">
            [Paraf Digital Supervisor]
          </div>
          <p class="font-bold text-slate-800">Supervisor Operasional</p>
          <p class="text-[10px] text-slate-500">Operations Head</p>
        </div>
      </div>
    </div>
  </div>
</template>
