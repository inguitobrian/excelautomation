<script setup>
import { ref, onMounted, computed } from 'vue'
import Swal from 'sweetalert2'
import AppLayout from '@/components/layout/AppLayout.vue'

const selectedSheet = ref('')
const sheetOptions = ref([])

const tableData = ref([])
const loading = ref(true)
const isUpdating = ref(false)
const searchQuery = ref('')
const selectedFilter = ref('All')

function formatCell(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value)
    if (!isNaN(date)) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  }

  if (typeof value === 'number') {
    return value.toLocaleString()
  }

  return value
}

// Computed property for filtered data
const filteredData = computed(() => {
  let filtered = tableData.value

  // Filter by search query
  if (searchQuery.value) {
    filtered = filtered.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchQuery.value.toLowerCase()),
      ),
    )
  }

  // Filter by remarks status
  if (selectedFilter.value !== 'All') {
    filtered = filtered.filter((row) => row['Remarks'] === selectedFilter.value)
  }

  return filtered
})

const remarkOptions = ['Pending', 'On-going', 'Delivered']
const filterOptions = ['All', ...remarkOptions]

const fetchSheetData = async () => {
  if (!selectedSheet.value) return

  loading.value = true
  try {
    const response = await fetch(
      `https://script.google.com/macros/s/AKfycbywwa6AOFAIZYUg9GYHl-YDwcQIhf-GHC5xF-7wqcX7cPVEkx-JwnYvfSAmI4Pyn_Uy/exec?sheetName=${selectedSheet.value}`,
    )

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

    const data = await response.json()
    tableData.value = data.rows || []
  } catch (err) {
    console.error('Fetch error:', err)
    Swal.fire('Error', 'Failed to load sheet data. Please try again.', 'error')
  } finally {
    loading.value = false
  }
}

const fetchSheetNames = async () => {
  try {
    const res = await fetch(
      'https://script.google.com/macros/s/AKfycbywwa6AOFAIZYUg9GYHl-YDwcQIhf-GHC5xF-7wqcX7cPVEkx-JwnYvfSAmI4Pyn_Uy/exec',
    )
    const data = await res.json()
    sheetOptions.value = (data.sheets || []).filter((name) => name !== 'OverallTransaction')

    // Auto-select the first one
    if (sheetOptions.value.length) {
      selectedSheet.value = sheetOptions.value[0]
      await fetchSheetData()
    }
  } catch (err) {
    console.error('Failed to fetch sheets:', err)
    Swal.fire('Error', 'Failed to load sheet list.', 'error')
  }
}

onMounted(() => {
  fetchSheetNames()
})
</script>

<template>
  <AppLayout>
    <template #content>
      <v-card elevation="4" class="pa-4">
        <v-row class="mb-2">
          <v-col cols="12" md="4">
            <v-select
              v-model="selectedSheet"
              :items="sheetOptions"
              label="Select Sheet"
              variant="outlined"
              density="compact"
              @update:modelValue="fetchSheetData"
            />
          </v-col>
        </v-row>

        <!-- Search and Filter Controls -->
        <v-row class="mb-4">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchQuery"
              label="Search..."
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="selectedFilter"
              :items="filterOptions"
              label="Filter by Status"
              hide-details
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-btn color="secondary" @click="fetchSheetData" :loading="loading" block>
              <v-icon left>mdi-refresh</v-icon>
              Refresh
            </v-btn>
          </v-col>
          <v-col cols="12" md="2">
            <v-btn color="warning" @click="updateAllPending" :loading="isUpdating" block>
              Batch Update
            </v-btn>
          </v-col>
        </v-row>

        <!-- Loading indicator -->
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

        <!-- Data table -->
        <v-table v-if="!loading && filteredData.length > 0" class="elevation-1">
          <thead>
            <tr>
              <th
                v-for="key in Object.keys(tableData[0] || {})"
                :key="key"
                class="font-weight-bold"
              >
                {{ key }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in filteredData"
              :key="index"
              :class="getRowClass(row['Remarks'])"
            >
              <td v-for="(value, key) in row" :key="key">
                <span :class="key === 'Remarks' ? getRemarkColor(row[key]) : ''">
                  {{ formatCell(value) }}
                </span>
              </td>
            </tr>
          </tbody>
        </v-table>

        <!-- No data message -->
        <v-alert v-if="!loading && filteredData.length === 0" type="info" class="mt-4">
          No data found matching your search criteria.
        </v-alert>

        <!-- Summary -->
        <v-card-text v-if="!loading && tableData.length > 0" class="pt-4">
          <strong>Summary:</strong>
          {{ filteredData.length }} of {{ tableData.length }} items shown
        </v-card-text>
      </v-card>
    </template>
  </AppLayout>
</template>

<script>
export default {
  methods: {
    getRowClass(status) {
      return {
        'bg-red-50': status === 'Pending',
        'bg-yellow-50': status === 'On-going',
        'bg-green-50': status === 'Delivered',
      }
    },
    getRemarkColor(status) {
      const colors = {
        Pending: 'red',
        'On-going': 'orange',
        Delivered: 'green',
      }
      return colors[status] || 'primary'
    },
  },
}
</script>

<style scoped>
.bg-red-50 {
  background-color: #fef2f2;
}
.bg-yellow-50 {
  background-color: #fffbeb;
}
.bg-green-50 {
  background-color: #f0fdf4;
}
</style>
