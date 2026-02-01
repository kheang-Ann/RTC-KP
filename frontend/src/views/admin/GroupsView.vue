<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { groupsService, type Group, type CreateGroupDto, type AvailableStudent } from '@/services/groups'
import { programsService, type Program } from '@/services/programs'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const groups = ref<Group[]>([])
const programs = ref<Program[]>([])
const loading = ref(false)
const error = ref('')
const modalError = ref('')
const showModal = ref(false)
const editingGroup = ref<Group | null>(null)
const showDeleteConfirm = ref(false)
const deleteTargetId = ref<number | null>(null)

// Student management
const showStudentModal = ref(false)
const studentModalError = ref('')
const selectedGroup = ref<Group | null>(null)
const studentsInGroup = ref<AvailableStudent[]>([])
const availableStudents = ref<AvailableStudent[]>([])
const selectedStudentIds = ref<number[]>([])

// Filters
const filterProgramId = ref<number | null>(null)
const filterYear = ref<number | null>(null)

const form = ref<CreateGroupDto>({
  name: '',
  programId: 0,
  academicYear: 1,
  maxCapacity: 50,
})

// Computed: available years based on selected program
const availableYears = computed(() => {
  const program = programs.value.find((p) => p.id === form.value.programId)
  if (!program) return []
  return Array.from({ length: program.duration }, (_, i) => i + 1)
})

// Computed: filtered groups
const filteredGroups = computed(() => {
  let result = groups.value
  if (filterProgramId.value) {
    result = result.filter((g) => g.programId === filterProgramId.value)
  }
  if (filterYear.value) {
    result = result.filter((g) => g.academicYear === filterYear.value)
  }
  return result
})

// Computed: max years for filter based on all programs
const maxProgramDuration = computed(() => {
  return Math.max(...programs.value.map((p) => p.duration), 4)
})

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [groupsData, programsData] = await Promise.all([
      groupsService.getAll(),
      programsService.getAll(),
    ])
    groups.value = groupsData
    programs.value = programsData
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingGroup.value = null
  modalError.value = ''
  form.value = { name: '', programId: 0, academicYear: 1, maxCapacity: 50 }
  showModal.value = true
}

function openEdit(group: Group) {
  editingGroup.value = group
  modalError.value = ''
  form.value = {
    name: group.name,
    programId: group.programId,
    academicYear: group.academicYear,
    maxCapacity: group.maxCapacity,
  }
  showModal.value = true
}

async function saveGroup() {
  loading.value = true
  modalError.value = ''
  try {
    if (editingGroup.value) {
      await groupsService.update(editingGroup.value.id, form.value)
    } else {
      await groupsService.create(form.value)
    }
    showModal.value = false
    await loadData()
  } catch (e) {
    modalError.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function deleteGroup(id: number) {
  deleteTargetId.value = id
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (deleteTargetId.value === null) return
  showDeleteConfirm.value = false
  loading.value = true
  try {
    await groupsService.delete(deleteTargetId.value)
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

// Student management functions
async function openStudentModal(group: Group) {
  selectedGroup.value = group
  selectedStudentIds.value = []
  studentModalError.value = ''
  loading.value = true
  try {
    const [students, available] = await Promise.all([
      groupsService.getStudentsInGroup(group.id),
      groupsService.getAvailableStudents(group.programId, group.academicYear),
    ])
    studentsInGroup.value = students
    availableStudents.value = available
    showStudentModal.value = true
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function addStudents() {
  if (!selectedGroup.value || selectedStudentIds.value.length === 0) return
  loading.value = true
  studentModalError.value = ''
  try {
    await groupsService.addStudentsToGroup(selectedGroup.value.id, selectedStudentIds.value)
    // Refresh student lists
    const [students, available] = await Promise.all([
      groupsService.getStudentsInGroup(selectedGroup.value.id),
      groupsService.getAvailableStudents(selectedGroup.value.programId, selectedGroup.value.academicYear),
    ])
    studentsInGroup.value = students
    availableStudents.value = available
    selectedStudentIds.value = []
    await loadData() // Refresh main list to update student count
  } catch (e) {
    studentModalError.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function removeStudent(studentId: number) {
  if (!selectedGroup.value) return
  loading.value = true
  studentModalError.value = ''
  try {
    await groupsService.removeStudentFromGroup(selectedGroup.value.id, studentId)
    // Refresh student lists
    const [students, available] = await Promise.all([
      groupsService.getStudentsInGroup(selectedGroup.value.id),
      groupsService.getAvailableStudents(selectedGroup.value.programId, selectedGroup.value.academicYear),
    ])
    studentsInGroup.value = students
    availableStudents.value = available
    await loadData()
  } catch (e) {
    studentModalError.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

// Reset academic year when program changes
watch(() => form.value.programId, () => {
  form.value.academicYear = 1
})
</script>

<template>
  <div class="page-container">
    <div class="page-header-row">
      <h1 class="page-title">Groups Management</h1>
      <button class="btn btn-primary" @click="openCreate">+ Add Group</button>
    </div>

    <!-- Filters -->
    <div class="page-filters">
      <div class="filter-group">
        <label>Program:</label>
        <select v-model="filterProgramId">
          <option :value="null">All Programs</option>
          <option v-for="program in programs" :key="program.id" :value="program.id">
            {{ program.name }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Year:</label>
        <select v-model="filterYear">
          <option :value="null">All Years</option>
          <option v-for="year in maxProgramDuration" :key="year" :value="year">
            Year {{ year }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="error" class="page-alert page-alert-error">{{ error }}</div>
    <div v-if="loading" class="page-loading">Loading...</div>

    <table class="page-table" v-if="filteredGroups.length">
      <thead>
        <tr>
          <th>Group Name</th>
          <th>Program</th>
          <th>Year</th>
          <th>Students</th>
          <th>Capacity</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="group in filteredGroups" :key="group.id">
          <td>{{ group.name }}</td>
          <td>{{ group.program?.name || '-' }}</td>
          <td>Year {{ group.academicYear }}</td>
          <td>{{ group.students?.length || 0 }}</td>
          <td>{{ group.maxCapacity }}</td>
          <td>
            <button class="btn btn-sm" @click="openStudentModal(group)">Students</button>
            <button class="btn btn-sm btn-secondary" @click="openEdit(group)">Edit</button>
            <button class="btn btn-sm btn-danger" @click="deleteGroup(group.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="!loading" class="page-empty">No groups found. Create your first group!</div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h2>{{ editingGroup ? 'Edit Group' : 'Create Group' }}</h2>
        <div v-if="modalError" class="page-alert page-alert-error">{{ modalError }}</div>
        <form @submit.prevent="saveGroup">
          <div class="form-group">
            <label>Program</label>
            <select v-model.number="form.programId" required>
              <option :value="0" disabled>Select program</option>
              <option v-for="program in programs" :key="program.id" :value="program.id">
                {{ program.name }} ({{ program.duration }} years)
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Academic Year</label>
            <select v-model.number="form.academicYear" required :disabled="!form.programId">
              <option v-for="year in availableYears" :key="year" :value="year">
                Year {{ year }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Group Name</label>
            <input v-model="form.name" type="text" required placeholder="e.g., Group A, Section 1" />
          </div>
          <div class="form-group">
            <label>Max Capacity</label>
            <input v-model.number="form.maxCapacity" type="number" min="1" max="500" required />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ editingGroup ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Student Management Modal -->
    <div v-if="showStudentModal" class="modal-overlay" @click.self="showStudentModal = false">
      <div class="modal modal-large">
        <h2>Manage Students - {{ selectedGroup?.name }}</h2>
        <p class="group-info">
          {{ selectedGroup?.program?.name }} - Year {{ selectedGroup?.academicYear }}
        </p>
        <div v-if="studentModalError" class="page-alert page-alert-error">{{ studentModalError }}</div>

        <div class="student-sections">
          <!-- Current students -->
          <div class="student-section">
            <h3>Current Students ({{ studentsInGroup.length }}/{{ selectedGroup?.maxCapacity }})</h3>
            <div class="student-list" v-if="studentsInGroup.length">
              <div v-for="student in studentsInGroup" :key="student.id" class="student-item">
                <span>{{ student.nameLatin || student.nameKhmer }}</span>
                <button class="btn btn-sm btn-danger" @click="removeStudent(student.id)">
                  Remove
                </button>
              </div>
            </div>
            <div v-else class="empty-small">No students in this group</div>
          </div>

          <!-- Available students -->
          <div class="student-section">
            <h3>Available Students</h3>
            <div class="student-list" v-if="availableStudents.length">
              <div v-for="student in availableStudents" :key="student.id" class="student-item">
                <label>
                  <input
                    type="checkbox"
                    :value="student.id"
                    v-model="selectedStudentIds"
                  />
                  {{ student.nameLatin || student.nameKhmer }}
                </label>
              </div>
            </div>
            <div v-else class="empty-small">No available students for this program/year</div>
            <button
              v-if="availableStudents.length && selectedStudentIds.length"
              class="btn btn-primary"
              @click="addStudents"
              :disabled="loading"
            >
              Add Selected ({{ selectedStudentIds.length }})
            </button>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showStudentModal = false">Close</button>
        </div>
      </div>
    </div>
  </div>

  <ConfirmDialog
    :show="showDeleteConfirm"
    title="Delete Group"
    message="Are you sure you want to delete this group? Students will be removed from the group but not deleted."
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
</template>

<style scoped>
/* Filter group styles */
.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
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
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
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

.modal-large {
  max-width: 800px;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
}

/* Student sections */
@media (max-width: 768px) {
  .student-sections {
    grid-template-columns: 1fr;
  }
}

.group-info {
  color: #666;
  margin-bottom: 16px;
}

.student-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.student-section h3 {
  margin-bottom: 12px;
  font-size: 14px;
  color: #333;
}

.student-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 8px;
}

.student-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.student-item:last-child {
  border-bottom: none;
}

.student-item label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.empty-small {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

/* Form styles */
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
</style>
