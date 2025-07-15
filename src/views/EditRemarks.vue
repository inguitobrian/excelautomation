<script setup>
import { ref, onMounted, computed } from 'vue'
import Swal from 'sweetalert2'
import AppLayout from '@/components/layout/AppLayout.vue'

const sheetName = 'Arvin'
const tableData = ref([])
const loading = ref(true)
const isUpdating = ref(false)
const searchQuery = ref('')
const selectedFilter = ref('All')

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
  loading.value = true
  try {
    const response = await fetch(
      `https://script.google.com/macros/s/AKfycbywwa6AOFAIZYUg9GYHl-YDwcQIhf-GHC5xF-7wqcX7cPVEkx-JwnYvfSAmI4Pyn_Uy/exec?sheetName=${sheetName}`,
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    tableData.value = data.rows || []
  } catch (err) {
    console.error('Fetch error:', err)
    Swal.fire('Error', 'Failed to load sheet data. Please try again.', 'error')
  } finally {
    loading.value = false
  }
}

const updateRemark = async (rowIndex) => {
  const originalIndex = tableData.value.findIndex((row) => row === filteredData.value[rowIndex])
  const row = tableData.value[originalIndex]

  if (!row['RS Number']) {
    Swal.fire('Missing RS Number', 'This row does not have an RS Number.', 'warning')
    return
  }

  // Confirm before updating
  const result = await Swal.fire({
    title: 'Confirm Update',
    text: `Update remarks for RS Number: ${row['RS Number']} to "${row['Remarks']}"?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, Update',
    cancelButtonText: 'Cancel',
  })

  if (!result.isConfirmed) return

  isUpdating.value = true
  try {
    const response = await fetch(
      'https://script.google.com/macros/s/AKfycbywwa6AOFAIZYUg9GYHl-YDwcQIhf-GHC5xF-7wqcX7cPVEkx-JwnYvfSAmI4Pyn_Uy/exec',
      {
        method: 'POST',
        body: JSON.stringify({
          action: 'updateRemarks',
          sheetName,
          rsNumber: row['RS Number'],
          remarks: row['Remarks'],
        }),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      },
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    if (result.status === 'success') {
      Swal.fire('Success', result.message, 'success')
      await fetchSheetData() // Refresh table to show updated data
    } else {
      Swal.fire('Error', result.message || 'Update failed', 'error')
    }
  } catch (err) {
    console.error('Update error:', err)
    Swal.fire('Error', 'Failed to update remarks. Please try again.', 'error')
  } finally {
    isUpdating.value = false
  }
}

// Batch update function
const updateAllPending = async () => {
  const pendingRows = tableData.value.filter((row) => row['Remarks'] === 'Pending')

  if (pendingRows.length === 0) {
    Swal.fire('Info', 'No pending items to update.', 'info')
    return
  }

  const result = await Swal.fire({
    title: 'Batch Update',
    text: `Update ${pendingRows.length} pending items to "On-going"?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, Update All',
    cancelButtonText: 'Cancel',
  })

  if (!result.isConfirmed) return

  isUpdating.value = true
  try {
    // Update all pending items to "On-going"
    const updatePromises = pendingRows.map((row) => {
      row['Remarks'] = 'On-going'
      return fetch(
        'https://script.google.com/macros/s/AKfycbywwa6AOFAIZYUg9GYHl-YDwcQIhf-GHC5xF-7wqcX7cPVEkx-JwnYvfSAmI4Pyn_Uy/exec',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'updateRemarks',
            sheetName,
            rsNumber: row['RS Number'],
            remarks: 'On-going',
          }),
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
        },
      )
    })

    await Promise.all(updatePromises)
    Swal.fire('Success', `Updated ${pendingRows.length} items to "On-going"`, 'success')
    await fetchSheetData()
  } catch (err) {
    console.error('Batch update error:', err)
    Swal.fire('Error', 'Failed to update some items. Please try again.', 'error')
  } finally {
    isUpdating.value = false
  }
}

onMounted(fetchSheetData)
</script>

<template>
  <AppLayout>
    <template #content>
      <v-card elevation="4" class="pa-4">
        <v-card-title class="text-h6 font-weight-bold mb-4">
          📝 Edit Remarks - {{ sheetName }}
        </v-card-title>

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
              <th class="font-weight-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in filteredData"
              :key="index"
              :class="getRowClass(row['Remarks'])"
            >
              <td v-for="(value, key) in row" :key="key">
                <v-select
                  v-if="key === 'Remarks'"
                  v-model="row[key]"
                  :items="remarkOptions"
                  density="compact"
                  hide-details
                  variant="outlined"
                  :color="getRemarkColor(row[key])"
                />
                <span v-else>{{ value }}</span>
              </td>
              <td>
                <v-btn
                  size="small"
                  color="primary"
                  :loading="isUpdating"
                  @click="updateRemark(index)"
                  variant="outlined"
                >
                  <v-icon left size="small">mdi-content-save</v-icon>
                  Save
                </v-btn>
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
