<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { programsService, type Program, type CreateProgramDto } from '@/services/programs'
import { departmentsService, type Department } from '@/services/departments'

const programs = ref<Program[]>([])
const departments = ref<Department[]>([])
const loading = ref(false)
const error = ref('')
const showModal = ref(false)
const editingProgram = ref<Program | null>(null)

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

async function deleteProgram(id: number) {
  if (!confirm('Are you sure you want to delete this program?')) return
  loading.value = true
  try {
    await programsService.delete(id)
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
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
  <div class="container">
    <div class="header">
      <h1>Programs Management</h1>
      <button class="btn btn-primary" @click="openCreate">+ Add Program</button>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="loading" class="loading">Loading...</div>

    <table class="table" v-if="programs.length">
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
            <button class="btn btn-sm" @click="openEdit(program)">Edit</button>
            <button class="btn btn-sm btn-danger" @click="deleteProgram(program.id)">
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="!loading" class="empty">No programs found.</div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
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
            <button type="button" class="btn" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ editingProgram ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table th,
.table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
  color: #374151;
}

.table th {
  background: #f5f5f5;
  font-weight: 600;
}

.table tr:hover {
  background: #fafafa;
}

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

.btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  background: white;
}

.btn-primary {
  background: var(--color-purple);
  color: white;
  border-color: var(--color-purple);
}

.btn-danger {
  background: var(--color-light-red);
  color: white;
  border-color: var(--color-light-red);
}

.btn-sm {
  padding: 4px 8px;
  margin-right: 4px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
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

.alert-error {
  padding: 12px;
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 4px;
  margin-bottom: 16px;
}

.loading,
.empty {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
  background: white;
  border-radius: 8px;
}
</style>
