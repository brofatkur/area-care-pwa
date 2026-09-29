<script setup lang="ts">
import { ref } from 'vue';
import { Finding, Area, User } from '../types';
import { playSuccessChime, triggerHaptic } from '../services/audioHaptic';
import CameraModal from '../components/CameraModal.vue';
import {
  AlertCircle,
  Plus,
  Clock,
  CheckCircle2,
  Camera,
  ChevronRight,
  Filter,
  Check,
  X,
  MessageSquare
} from 'lucide-vue-next';

const props = defineProps<{
  findings: Finding[];
  areas: Area[];
  currentUser: User;
}>();

const emit = defineEmits<{
  (e: 'createFinding', finding: Finding): void;
  (e: 'updateFinding', finding: Finding): void;
}>();

const filterStatus = ref<'All' | 'Open' | 'Diteruskan' | 'Selesai'>('All');
const showNewModal = ref(false);

// New finding form state
const selectedAreaId = ref(props.areas[0]?.id || '');
const itemName = ref('');
const description = ref('');
const actionTaken = ref('');
const findingType = ref<'Perbaiki langsung' | 'Teknis-berisiko'>('Perbaiki langsung');
const photoBefore = ref<string | null>(null);
const photoAfter = ref<string | null>(null);

// Camera Modal for finding photos
const showCamera = ref(false);
const cameraTarget = ref<'before' | 'after'>('before');

const filteredFindings = () => {
  if (filterStatus.value === 'All') return props.findings;
  return props.findings.filter(f => f.status === filterStatus.value);
};

const handleCapturePhoto = (data: { dataUrl: string }) => {
  showCamera.value = false;
  if (cameraTarget.value === 'before') {
    photoBefore.value = data.dataUrl;
  } else {
    photoAfter.value = data.dataUrl;
  }
};

const submitNewFinding = () => {
  if (!description.value.trim()) {
    alert('Harap deskripsikan temuan masalah terlebih dahulu.');
    return;
  }

  const selectedArea = props.areas.find(a => a.id === selectedAreaId.value);
  const now = new Date();
  const deadline = new Date(now.getTime() + (findingType.value === 'Teknis-berisiko' ? 48 : 24) * 3600 * 1000);

  const newFinding: Finding = {
    id: `find_${Date.now()}`,
    area_id: selectedAreaId.value,
    area_name: selectedArea ? selectedArea.name : 'Area',
    item_name: itemName.value.trim() || 'Fasilitas Umum',
    description: description.value.trim(),
    action_taken: actionTaken.value.trim(),
    finding_type: findingType.value,
    status: findingType.value === 'Perbaiki langsung' ? 'Selesai' : 'Open',
    pic: findingType.value === 'Teknis-berisiko' ? 'Tim Maintenance / Teknisi' : props.currentUser.name,
    deadline: deadline.toISOString(),
    photo_before: photoBefore.value || undefined,
    photo_after: photoAfter.value || undefined,
    reported_by: props.currentUser.name,
    created_at: now.toISOString(),
    resolved_at: findingType.value === 'Perbaiki langsung' ? now.toISOString() : undefined
  };

  playSuccessChime();
  triggerHaptic('success');
  emit('createFinding', newFinding);

  // Reset form
  description.value = '';
  actionTaken.value = '';
  itemName.value = '';
  photoBefore.value = null;
  photoAfter.value = null;
  showNewModal.value = false;
};

const markResolved = (f: Finding) => {
  const updated: Finding = {
    ...f,
    status: 'Selesai',
    resolved_at: new Date().toISOString()
  };
  playSuccessChime();
  triggerHaptic('success');
  emit('updateFinding', updated);
};
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto pb-24">
    <!-- Header with Action -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-black text-slate-900">Temuan & Tiket Fasilitas</h2>
        <p class="text-xs text-slate-500 font-medium">Pencatatan Masalah & SLA 48 Jam</p>
      </div>

      <button
        @click="showNewModal = true"
        class="h-10 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition"
      >
        <Plus class="w-4 h-4" />
        <span>Catat Temuan</span>
      </button>
    </div>

    <!-- Filter chips -->
    <div class="flex gap-1.5 overflow-x-auto pb-1 text-xs">
      <button
        v-for="st in (['All', 'Open', 'Diteruskan', 'Selesai'] as const)"
        :key="st"
        @click="filterStatus = st"
        class="px-3 py-1.5 rounded-xl font-bold transition border"
        :class="filterStatus === st ? 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'"
      >
        {{ st }}
      </button>
    </div>

    <!-- Findings List -->
    <div class="space-y-3">
      <div
        v-for="finding in filteredFindings()"
        :key="finding.id"
        class="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden text-slate-800"
      >
        <!-- Top Status Row -->
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span
              class="text-[9px] font-black px-2 py-0.5 rounded-md uppercase"
              :class="
                finding.status === 'Selesai'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : finding.status === 'Diteruskan'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              "
            >
              {{ finding.status }}
            </span>
            <span class="text-[10px] font-bold text-slate-500 font-mono">{{ finding.area_name }}</span>
          </div>

          <span
            class="text-[9px] px-2 py-0.5 rounded font-bold"
            :class="finding.finding_type === 'Teknis-berisiko' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-slate-100 text-slate-600 border border-slate-200'"
          >
            {{ finding.finding_type }}
          </span>
        </div>

        <h4 class="font-black text-sm text-slate-900 leading-snug mb-1">{{ finding.item_name }}</h4>
        <p class="text-xs text-slate-600 leading-relaxed mb-2.5 font-medium">{{ finding.description }}</p>

        <!-- Action / Resolution note -->
        <div v-if="finding.action_taken" class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 mb-2.5 font-medium">
          <span class="font-bold text-emerald-700">Tindakan: </span>
          <span>{{ finding.action_taken }}</span>
        </div>

        <!-- Before / After Photos if any -->
        <div v-if="finding.photo_before || finding.photo_after" class="grid grid-cols-2 gap-2 mb-3">
          <div v-if="finding.photo_before" class="relative rounded-xl overflow-hidden border border-slate-200">
            <img :src="finding.photo_before" alt="Sebelum" class="w-full h-24 object-cover" />
            <span class="absolute bottom-1 left-1.5 px-1.5 py-0.2 rounded bg-black/70 text-[9px] font-mono font-bold text-rose-300">
              SEBELUM
            </span>
          </div>
          <div v-if="finding.photo_after" class="relative rounded-xl overflow-hidden border border-slate-200">
            <img :src="finding.photo_after" alt="Sesudah" class="w-full h-24 object-cover" />
            <span class="absolute bottom-1 left-1.5 px-1.5 py-0.2 rounded bg-black/70 text-[9px] font-mono font-bold text-emerald-300">
              SESUDAH
            </span>
          </div>
        </div>

        <!-- Footer details & Resolve Button -->
        <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div class="flex items-center gap-1.5 font-medium">
            <Clock class="w-3.5 h-3.5 text-slate-400" />
            <span>PIC: <strong class="text-slate-700">{{ finding.pic }}</strong></span>
          </div>

          <button
            v-if="finding.status !== 'Selesai'"
            @click="markResolved(finding)"
            class="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-[10px] flex items-center gap-1 transition shadow-xs"
          >
            <Check class="w-3 h-3 text-emerald-700" />
            <span>Tandai Selesai</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Form Catat Temuan Baru -->
    <div v-if="showNewModal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto text-slate-900">
        <!-- Header -->
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="font-black text-slate-900 text-base">Catat Temuan Masalah</h3>
            <p class="text-xs text-slate-500 font-medium">Otomatis Terjadwal Tiket SLA</p>
          </div>
          <button
            @click="showNewModal = false"
            class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Lokasi Area *</label>
            <select
              v-model="selectedAreaId"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
            >
              <option v-for="a in areas" :key="a.id" :value="a.id">{{ a.name }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Item / Fasilitas Yang Bermasalah *</label>
            <input
              v-model="itemName"
              type="text"
              placeholder="mis. Kran wastafel bocor, lampu mati, AC kurang dingin"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Deskripsi Kondisi *</label>
            <textarea
              v-model="description"
              rows="2"
              placeholder="Jelaskan kondisi detail temuan..."
              class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white"
            ></textarea>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Jenis Temuan</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="findingType = 'Perbaiki langsung'"
                class="py-2.5 px-3 rounded-xl border text-xs font-bold transition"
                :class="findingType === 'Perbaiki langsung' ? 'bg-emerald-100 border-emerald-400 text-emerald-900 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600'"
              >
                ✓ Perbaiki Langsung
              </button>
              <button
                type="button"
                @click="findingType = 'Teknis-berisiko'"
                class="py-2.5 px-3 rounded-xl border text-xs font-bold transition"
                :class="findingType === 'Teknis-berisiko' ? 'bg-purple-100 border-purple-400 text-purple-900 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600'"
              >
                ⚠️ Teknis / Berisiko (SLA 48h)
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Tindakan Yang Telah / Akan Dilakukan</label>
            <input
              v-model="actionTaken"
              type="text"
              placeholder="mis. Langsung dipel / Diteruskan ke teknisi AC"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white"
            />
          </div>

          <!-- Photo upload buttons -->
          <div class="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              @click="cameraTarget = 'before'; showCamera = true"
              class="py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition"
              :class="photoBefore ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'"
            >
              <Camera class="w-3.5 h-3.5" />
              <span>{{ photoBefore ? '✓ Foto Sebelum' : '+ Foto Sebelum' }}</span>
            </button>

            <button
              type="button"
              @click="cameraTarget = 'after'; showCamera = true"
              class="py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition"
              :class="photoAfter ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'"
            >
              <Camera class="w-3.5 h-3.5" />
              <span>{{ photoAfter ? '✓ Foto Sesudah' : '+ Foto Sesudah' }}</span>
            </button>
          </div>
        </div>

        <div class="flex gap-2 mt-4 pt-3 border-t border-slate-100">
          <button
            @click="showNewModal = false"
            class="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
          >
            Batal
          </button>
          <button
            @click="submitNewFinding"
            class="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
          >
            <Check class="w-4 h-4" /> Simpan Temuan
          </button>
        </div>
      </div>
    </div>

    <!-- Camera Modal -->
    <CameraModal
      v-if="showCamera"
      :title="cameraTarget === 'before' ? 'Foto Kondisi Sebelum' : 'Foto Kondisi Sesudah'"
      subtitle="Bukti Temuan Fisik"
      :area-name="areas.find(a => a.id === selectedAreaId)?.name || 'Area'"
      :officer-name="currentUser.name"
      slot-name="Temuan"
      @close="showCamera = false"
      @captured="handleCapturePhoto"
    />
  </div>
</template>
