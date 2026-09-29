<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { User, Area, CheckpointSlot, CheckpointRecord, Finding, SupplyItem, RatingScore } from './types';
import { MASTER_AREAS, INITIAL_SUPPLIES } from './data/checklistMaster';
import {
  getLocalCheckpoints,
  saveLocalCheckpoint,
  getLocalFindings,
  saveLocalFinding,
  getLocalSupplies,
  saveLocalSupplies,
  getLocalGamification,
  saveLocalGamification
} from './services/offlineQueue';
import { playSuccessChime, triggerHaptic } from './services/audioHaptic';

import Navbar from './components/Navbar.vue';
import BottomNav from './components/BottomNav.vue';
import SubstituteModal from './components/SubstituteModal.vue';
import OnboardingTour from './components/OnboardingTour.vue';

import HomeView from './views/HomeView.vue';
import AreaChecklistView from './views/AreaChecklistView.vue';
import CheckpointSubmitView from './views/CheckpointSubmitView.vue';
import FindingsView from './views/FindingsView.vue';
import MyScoreView from './views/MyScoreView.vue';
import SupervisorView from './views/SupervisorView.vue';
import ManagementDashboardView from './views/ManagementDashboardView.vue';
import EmailRecapView from './views/EmailRecapView.vue';
import AdminMasterView from './views/AdminMasterView.vue';

// Active User
const currentUser = ref<User>({
  id: 'usr_hendi',
  name: 'Hendi',
  role: 'officer',
  title: 'Area Care Officer',
  origin_team: 'Facility & Care Team',
  phone: '081234567890',
  pin: '123456'
});

const isSubstitute = ref(false);
const activeTab = ref<string>('today');
const currentSlot = ref<CheckpointSlot>('07.00');

// Master data
const areas = ref<Area[]>(MASTER_AREAS);
const supplies = ref<SupplyItem[]>(INITIAL_SUPPLIES as unknown as SupplyItem[]);
const findings = ref<Finding[]>([]);
const checkpoints = ref<Record<string, CheckpointRecord>>({});
const gamification = ref({
  points: 85,
  streak: 6,
  level: 'Bersih',
  points_history: [] as any[]
});

// Modals and subviews
const inspectingArea = ref<Area | null>(null);
const submittingSlot = ref<CheckpointSlot | null>(null);
const showSubstituteModal = ref(false);
const showTour = ref(false);

// Initialize default checkpoints data if none exists
const initCheckpointRecords = () => {
  const today = '2026-09-29';
  const defaultRecords: Record<string, CheckpointRecord> = {
    '07.00': {
      id: `chk_${today}_0700`,
      slot: '07.00',
      date: today,
      officer_name: currentUser.value.name,
      officer_id: currentUser.value.id,
      is_substitute: isSubstitute.value,
      status: 'Berjalan',
      overall_score: 97,
      area_results: {}
    },
    '10.00': {
      id: `chk_${today}_1000`,
      slot: '10.00',
      date: today,
      officer_name: currentUser.value.name,
      officer_id: currentUser.value.id,
      is_substitute: isSubstitute.value,
      status: 'Belum',
      overall_score: 0,
      area_results: {}
    },
    '13.00': {
      id: `chk_${today}_1300`,
      slot: '13.00',
      date: today,
      officer_name: currentUser.value.name,
      officer_id: currentUser.value.id,
      is_substitute: isSubstitute.value,
      status: 'Belum',
      overall_score: 0,
      area_results: {}
    },
    '15.30': {
      id: `chk_${today}_1530`,
      slot: '15.30',
      date: today,
      officer_name: currentUser.value.name,
      officer_id: currentUser.value.id,
      is_substitute: isSubstitute.value,
      status: 'Belum',
      overall_score: 0,
      area_results: {}
    }
  };

  // Seed sample initial check for 07.00 for demo convenience
  areas.value.forEach(a => {
    defaultRecords['07.00'].area_results[a.id] = {
      scanned_at: '2026-09-29T07:12:00+08:00',
      is_ready: true,
      score: 98,
      ready_photo_url: '/pwa-512x512.png',
      ratings: {},
      item_notes: {},
      item_photos: {}
    };
  });

  checkpoints.value = defaultRecords;
};

onMounted(async () => {
  // Load IndexedDB state
  const localCheckpoints = await getLocalCheckpoints();
  if (Object.keys(localCheckpoints).length > 0) {
    checkpoints.value = localCheckpoints;
  } else {
    initCheckpointRecords();
  }

  const localFindings = await getLocalFindings();
  if (localFindings.length > 0) {
    findings.value = localFindings;
  } else {
    findings.value = [
      {
        id: 'find_1',
        area_id: 'area_toilet',
        area_name: 'Toilet Room',
        item_name: 'Jet spray bidet toilet wanita',
        description: 'Karet seal jet spray getas dan menetes air perlahan',
        action_taken: 'Diteruskan ke tim teknisi plumbing untuk ganti seal',
        finding_type: 'Teknis-berisiko',
        status: 'Diteruskan',
        pic: 'Tim Maintenance',
        deadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        reported_by: 'Hendi',
        created_at: new Date().toISOString()
      },
      {
        id: 'find_2',
        area_id: 'area_coworking',
        area_name: 'BOffice Coworking',
        item_name: 'Soket colokan meja No. 4',
        description: 'Stop kontak longgar saat dicolok charger laptop',
        action_taken: 'Sudah dimatikan jalurnya dan dipasang tanda perbaikan',
        finding_type: 'Teknis-berisiko',
        status: 'Open',
        pic: 'Teknisi Listrik',
        deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        reported_by: 'Hendi',
        created_at: new Date().toISOString()
      }
    ];
  }

  const localSupplies = await getLocalSupplies();
  if (localSupplies.length > 0) {
    supplies.value = localSupplies;
  }

  const localGamification = await getLocalGamification();
  if (localGamification) {
    gamification.value = localGamification;
  }
});

// Handlers
const onSwitchUser = (user: User, isSub?: boolean) => {
  currentUser.value = user;
  isSubstitute.value = !!isSub;
  if (user.role === 'management') {
    activeTab.value = 'dashboard';
  } else if (user.role === 'supervisor') {
    activeTab.value = 'supervisor';
  } else {
    activeTab.value = 'today';
  }
};

const handleStartCheckpoint = (slot: CheckpointSlot) => {
  currentSlot.value = slot;
  if (!checkpoints.value[slot]) {
    checkpoints.value[slot] = {
      id: `chk_2026-09-29_${slot.replace('.', '')}`,
      slot,
      date: '2026-09-29',
      officer_name: currentUser.value.name,
      officer_id: currentUser.value.id,
      is_substitute: isSubstitute.value,
      status: 'Berjalan',
      overall_score: 0,
      area_results: {}
    };
  }
  activeTab.value = 'today';
};

const handleOpenArea = (area: Area) => {
  if (!checkpoints.value[currentSlot.value]) {
    handleStartCheckpoint(currentSlot.value);
  }
  const record = checkpoints.value[currentSlot.value];
  if (!record.area_results[area.id]) {
    record.area_results[area.id] = {
      scanned_at: new Date().toISOString(),
      is_ready: true,
      score: 100,
      ratings: {},
      item_notes: {},
      item_photos: {}
    };
  }
  inspectingArea.value = area;
};

const onSaveArea = async (data: {
  areaId: string;
  ratings: Record<string, RatingScore>;
  itemNotes: Record<string, string>;
  itemPhotos: Record<string, { before?: string; after?: string }>;
  readyPhotoUrl?: string;
  score: number;
  isReady: boolean;
}) => {
  const record = checkpoints.value[currentSlot.value];
  if (record) {
    record.area_results[data.areaId] = {
      scanned_at: record.area_results[data.areaId]?.scanned_at || new Date().toISOString(),
      is_ready: data.isReady,
      score: data.score,
      ready_photo_url: data.readyPhotoUrl,
      ratings: data.ratings,
      item_notes: data.itemNotes,
      item_photos: data.itemPhotos
    };

    // Calculate interim overall score
    const scores = Object.values(record.area_results).map(r => r.score);
    if (scores.length > 0) {
      record.overall_score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    await saveLocalCheckpoint(record);
  }

  inspectingArea.value = null;
};

const onOpenSubmit = (slot: CheckpointSlot) => {
  submittingSlot.value = slot;
};

const onCheckpointSubmitted = async (data: { score: number; signatureUrl: string; pointsEarned: number }) => {
  const slot = submittingSlot.value || currentSlot.value;
  const record = checkpoints.value[slot];
  if (record) {
    record.status = 'Selesai';
    record.completed_at = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA';
    record.overall_score = data.score;
    record.signature_url = data.signatureUrl;
    await saveLocalCheckpoint(record);
  }

  // Update gamification points and streak
  gamification.value.points += data.pointsEarned;
  gamification.value.streak += 1;
  gamification.value.points_history.unshift({
    id: `pt_${Date.now()}`,
    points: data.pointsEarned,
    reason: `Checkpoint ${slot} disubmit & paraf digital`,
    created_at: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  });
  await saveLocalGamification(gamification.value);

  submittingSlot.value = null;
  activeTab.value = 'today';
};

const handleRegisterSubstitute = (data: { name: string; phone: string; originTeam: string; reason: string }) => {
  currentUser.value = {
    id: `usr_sub_${Date.now()}`,
    name: data.name,
    role: 'officer',
    title: 'Petugas Pengganti',
    origin_team: data.originTeam,
    phone: data.phone,
    pin: '123456'
  };
  isSubstitute.value = true;
  showSubstituteModal.value = false;
  playSuccessChime();
  triggerHaptic('success');
  alert(`Selamat bertugas, ${data.name}! Notifikasi telah diteruskan ke Supervisor Operasional.`);
};

const handleCreateFinding = async (f: Finding) => {
  findings.value.unshift(f);
  await saveLocalFinding(f);
};

const handleUpdateFinding = async (f: Finding) => {
  const idx = findings.value.findIndex(item => item.id === f.id);
  if (idx !== -1) {
    findings.value[idx] = f;
    await saveLocalFinding(f);
  }
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
    <!-- Main Navbar -->
    <Navbar
      :current-user="currentUser"
      :is-substitute="isSubstitute"
      @switch-user="onSwitchUser"
      @open-tour="showTour = true"
    />

    <!-- Main Content Container -->
    <main class="flex-1 p-4 pb-28 max-w-4xl w-full mx-auto">
      <!-- SUBVIEW 1: Area Checklist Modal/Page -->
      <AreaChecklistView
        v-if="inspectingArea"
        :area="inspectingArea"
        :slot="currentSlot"
        :officer-name="currentUser.name"
        :user-role="currentUser.role"
        :is-full-check="currentSlot === '07.00'"
        :initial-ratings="checkpoints[currentSlot]?.area_results[inspectingArea.id]?.ratings || {}"
        :initial-notes="checkpoints[currentSlot]?.area_results[inspectingArea.id]?.item_notes || {}"
        :initial-photos="checkpoints[currentSlot]?.area_results[inspectingArea.id]?.item_photos || {}"
        :initial-ready-photo="checkpoints[currentSlot]?.area_results[inspectingArea.id]?.ready_photo_url"
        @back="inspectingArea = null"
        @save-area="onSaveArea"
      />

      <!-- SUBVIEW 2: Checkpoint Submit Page -->
      <CheckpointSubmitView
        v-else-if="submittingSlot && checkpoints[submittingSlot]"
        :slot="submittingSlot"
        :areas="areas"
        :officer="currentUser"
        :record="checkpoints[submittingSlot]"
        @back="submittingSlot = null"
        @submitted="onCheckpointSubmitted"
      />

      <!-- TAB 1: Hari Ini -->
      <HomeView
        v-else-if="activeTab === 'today'"
        :current-user="currentUser"
        :is-substitute="isSubstitute"
        :areas="areas"
        :current-slot="currentSlot"
        :checkpoints="checkpoints"
        :gamification="gamification"
        @start-checkpoint="handleStartCheckpoint"
        @open-area="handleOpenArea"
        @open-submit="onOpenSubmit"
        @open-substitute-modal="showSubstituteModal = true"
      />

      <!-- TAB 2: Temuan -->
      <FindingsView
        v-else-if="activeTab === 'findings'"
        :findings="findings"
        :areas="areas"
        :current-user="currentUser"
        @create-finding="handleCreateFinding"
        @update-finding="handleUpdateFinding"
      />

      <!-- TAB 3: Skor Saya -->
      <MyScoreView
        v-else-if="activeTab === 'score'"
        :current-user="currentUser"
        :gamification="gamification"
      />

      <!-- TAB 4: Supervisor Live Review -->
      <SupervisorView
        v-else-if="activeTab === 'supervisor'"
        :areas="areas"
        :checkpoints="checkpoints"
        :supervisor="currentUser"
        @review-saved="() => {}"
      />

      <!-- TAB 5: Management Dashboard -->
      <ManagementDashboardView
        v-else-if="activeTab === 'dashboard'"
        :areas="areas"
        :checkpoints="checkpoints"
        :findings="findings"
        :supplies="supplies"
        @open-email-recap="activeTab = 'email_recap'"
        @open-admin="activeTab = 'admin'"
      />

      <!-- SUBVIEW: Email Recap Viewer -->
      <EmailRecapView
        v-else-if="activeTab === 'email_recap'"
        :areas="areas"
        :checkpoints="checkpoints"
        :findings="findings"
        :supplies="supplies"
        @back="activeTab = 'dashboard'"
      />

      <!-- SUBVIEW: Admin Master Data & Printable QR -->
      <AdminMasterView
        v-else-if="activeTab === 'admin'"
        :areas="areas"
        @back="activeTab = 'dashboard'"
      />
    </main>

    <!-- Bottom Navigation Bar (Hidden when inspecting area or submitting) -->
    <BottomNav
      v-if="!inspectingArea && !submittingSlot"
      :active-tab="activeTab"
      :role="currentUser.role"
      :open-findings-count="findings.filter(f => f.status !== 'Selesai').length"
      @change-tab="(tab) => activeTab = tab"
    />

    <!-- Substitute Officer Modal -->
    <SubstituteModal
      v-if="showSubstituteModal"
      @close="showSubstituteModal = false"
      @register-substitute="handleRegisterSubstitute"
    />

    <!-- Onboarding Guide Tour -->
    <OnboardingTour
      v-if="showTour"
      @close="showTour = false"
    />
  </div>
</template>
