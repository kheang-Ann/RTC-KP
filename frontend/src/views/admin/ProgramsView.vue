<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { programsService, type Program, type CreateProgramDto } from '@/services/programs'
import { departmentsService, type Department } from '@/services/departments'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const programs = ref<Program[]>([])
const departments = ref<Department[]>([])
const loading = ref(false)
const error = ref('')
const showModal = ref(false)
const editingProgram = ref<Program | null>(null)
const showDeleteConfirm = ref(false)
const deleteTargetId = ref<number | null>(null)

const degreeTypes = ['Bachelor', 'Master', 'PhD'] as const

const form = ref({
  name: '',
  duration: 4,
  degreeType: 'Bachelor' as 'Bachelor' | 'Master' | 'PhD',
  departmentId: undefined as number | undefined,
})

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [programsData, depsData] = await Promise.all([
      programsService.getAll(),
      departmentsService.getAll(),
    ])
    programs.value = programsData
    departments.value = depsData
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingProgram.value = null
  form.value = {
    name: '',
    duration: 4,
    degreeType: 'Bachelor',
    departmentId: departments.value[0]?.id,
  }
  showModal.value = true
}

function openEdit(program: Program) {
  editingProgram.value = program
  form.value = {
    name: program.name,
    duration: program.duration,
    degreeType: program.degreeType,
    departmentId: program.departmentId,
  }
  showModal.value = true
}

async function saveProgram() {
  if (!form.value.departmentId) {
    error.value = 'Please select a department'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const data: CreateProgramDto = {
      name: form.value.name,
      duration: form.value.duration,
      degreeType: form.value.degreeType,
      departmentId: form.value.departmentId,
    }
    if (editingProgram.value) {
      await programsService.update(editingProgram.value.id, data)
    } else {
      await programsService.create(data)
    }
    showModal.value = false
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function deleteProgram(id: number) {
  deleteTargetId.value = id
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (deleteTargetId.value === null) return
  showDeleteConfirm.value = false
  loading.value = true
  try {
    await programsService.delete(deleteTargetId.value)
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
    deleteTargetId.value = null
  }
}

function cancelDelete() {
  showDeleteConfirm.value = false
  deleteTargetId.value = null
}

function getDegreeColor(degreeType: string) {
  switch (degreeType) {
    case 'Bachelor':
      return 'badge-bachelor'
    case 'Master':
      return 'badge-master'
    case 'PhD':
      return 'badge-phd'
    default:
      return ''
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header-row">
      <h1 class="page-title">Programs Management</h1>
      <button class="btn btn-primary" @click="openCreate">+ Add Program</button>
    </div>

    <div v-if="error" class="page-alert page-alert-error">{{ error }}</div>
    <div v-if="loading" class="page-loading">Loading...</div>

    <table class="page-table" v-if="programs.length">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Duration (Years)</th>
          <th>Degree Type</th>
          <th>Department</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="program in programs" :key="program.id">
          <td>{{ program.id }}</td>
          <td>{{ program.name }}</td>
          <td>{{ program.duration }}</td>
          <td>
            <span class="badge" :class="getDegreeColor(program.degreeType)">
              {{ program.degreeType }}
            </span>
          </td>
          <td>{{ program.department?.name || '-' }}</td>
          <td>
            <button class="btn btn-sm btn-secondary" @click="openEdit(program)">Edit</button>
            <button class="btn btn-sm btn-danger" @click="deleteProgram(program.id)">
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="!loading" class="page-empty">No programs found.</div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div v-if="error" class="modal-error">{{ error }}</div>
      <div class="modal">
        <h2>{{ editingProgram ? 'Edit Program' : 'Create Program' }}</h2>
        <form @submit.prevent="saveProgram">
          <div class="form-group">
            <label>Program Name</label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="Computer Science"
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Duration (Years)</label>
              <input
                v-model.number="form.duration"
                type="number"
                min="1"
                max="10"
                required
              />
            </div>
            <div class="form-group">
              <label>Degree Type</label>
              <select v-model="form.degreeType" required>
                <option v-for="type in degreeTypes" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Department</label>
            <select v-model.number="form.departmentId" required>
              <option v-for="dept in departments" :key="dept.id" :value="dept.id">
                {{ dept.name }}
              </option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ editingProgram ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <ConfirmDialog
    :show="showDeleteConfirm"
    title="Delete Program"
    message="Are you sure you want to delete this program? This action cannot be undone."
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
</template>

<style scoped>
/* View-specific styles */
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-bachelor {
  background: #dbeafe;
  color: #1e40af;
}

.badge-master {
  background: #fef3c7;
  color: #92400e;
}

.badge-phd {
  background: #d1fae5;
  color: #065f46;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
  gap: 12px;
}

.modal-error {
  background: #fee2e2;
  color: #dc2626;
  padding: 12px 20px;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
  text-align: center;
  font-weight: 500;
}

.modal {
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  box-sizing: border-box;
}

.modal * {
  box-sizing: border-box;
}

@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
