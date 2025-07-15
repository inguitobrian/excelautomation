<script setup>
import { ref, onMounted, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'

const overallData = ref([])
const loadingOverall = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref('')
const sortOrder = ref('asc')

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

function formatHeader(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

const filteredData = computed(() => {
  if (!searchQuery.value) return overallData.value

  return overallData.value.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchQuery.value.toLowerCase()),
    ),
  )
})

const sortedData = computed(() => {
  if (!sortBy.value) return filteredData.value

  return [...filteredData.value].sort((a, b) => {
    const aVal = a[sortBy.value]
    const bVal = b[sortBy.value]

    if (sortOrder.value === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return sortedData.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredData.value.length / itemsPerPage.value)
})

const headers = computed(() => {
  return Object.keys(overallData.value[0] || {})
})

const fetchOverallTransaction = async () => {
  loadingOverall.value = true
  try {
    const res = await fetch(
      'https://script.google.com/macros/s/AKfycbywwa6AOFAIZYUg9GYHl-YDwcQIhf-GHC5xF-7wqcX7cPVEkx-JwnYvfSAmI4Pyn_Uy/exec?sheetName=OverallTransaction',
    )
    const data = await res.json()
    overallData.value = data.rows || []
  } catch (err) {
    console.error('Failed to fetch Overall Transaction data:', err)
  } finally {
    loadingOverall.value = false
  }
}

const refreshData = () => {
  fetchOverallTransaction()
}

const sortData = (column) => {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortOrder.value = 'asc'
  }
}

const exportToPDF = () => {
  const printWindow = window.open('', '_blank')

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Transaction Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          @media print { body { margin: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Transaction Report</div>
          <div>Generated on: ${new Date().toLocaleDateString()}</div>
        </div>
        <div class="info">
          Total Records: ${filteredData.value.length}
        </div>
        <table>
          <thead>
            <tr>
              ${headers.value.map((header) => `<th>${formatHeader(header)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${filteredData.value
              .map(
                (row) => `
              <tr>
                ${headers.value.map((header) => `<td>${formatCell(row[header])}</td>`).join('')}
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `

  printWindow.document.write(htmlContent)
  printWindow.document.close()

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }
}

const exportToCSV = () => {
  const csvContent = [
    headers.value.map(formatHeader).join(','),
    ...filteredData.value.map((row) =>
      headers.value
        .map((header) => {
          const value = formatCell(row[header])
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        })
        .join(','),
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `transaction-data-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

onMounted(fetchOverallTransaction)
</script>

<template>
  <AppLayout>
    <template #content>
      <div class="transaction-view">
        <!-- Header Section -->
        <div class="header-section">
          <h1 class="page-title">Transaction Summary</h1>
          <p class="page-subtitle">Overview of all transaction records</p>
        </div>

        <!-- Stats Cards -->
        <div class="stats-section">
          <v-row>
            <v-col cols="12" sm="6" md="3">
              <v-card class="stats-card">
                <v-card-text class="text-center">
                  <v-icon size="24" class="mb-2" color="primary">mdi-database</v-icon>
                  <div class="stats-number">{{ overallData.length.toLocaleString() }}</div>
                  <div class="stats-label">Total Records</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-card class="stats-card">
                <v-card-text class="text-center">
                  <v-icon size="24" class="mb-2" color="success">mdi-filter-check</v-icon>
                  <div class="stats-number">{{ filteredData.length.toLocaleString() }}</div>
                  <div class="stats-label">Filtered Results</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-card class="stats-card">
                <v-card-text class="text-center">
                  <v-icon size="24" class="mb-2" color="info">mdi-table</v-icon>
                  <div class="stats-number">{{ headers.length }}</div>
                  <div class="stats-label">Columns</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-card class="stats-card">
                <v-card-text class="text-center">
                  <v-icon size="24" class="mb-2" color="warning">mdi-book-open</v-icon>
                  <div class="stats-number">{{ totalPages }}</div>
                  <div class="stats-label">Pages</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- Main Data Card -->
        <v-card class="main-card">
          <!-- Controls -->
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h6">Transaction Data</span>
            <div class="controls-group">
              <v-btn
                color="success"
                variant="outlined"
                prepend-icon="mdi-download"
                @click="exportToCSV"
                :disabled="!filteredData.length"
                class="mr-2"
              >
                CSV
              </v-btn>
              <v-btn
                color="error"
                variant="outlined"
                prepend-icon="mdi-file-pdf-box"
                @click="exportToPDF"
                :disabled="!filteredData.length"
                class="mr-2"
              >
                PDF
              </v-btn>
              <v-btn
                color="primary"
                variant="outlined"
                prepend-icon="mdi-refresh"
                @click="refreshData"
                :loading="loadingOverall"
              >
                Refresh
              </v-btn>
            </div>
          </v-card-title>

          <v-card-text>
            <div class="search-controls mb-4">
              <v-text-field
                v-model="searchQuery"
                prepend-inner-icon="mdi-magnify"
                label="Search transactions..."
                variant="outlined"
                hide-details
                clearable
                class="search-field"
              />
              <v-select
                v-model="itemsPerPage"
                :items="[10, 25, 50, 100]"
                label="Items per page"
                variant="outlined"
                hide-details
                class="items-select"
              />
            </div>

            <!-- Loading State -->
            <div v-if="loadingOverall" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" size="48" class="mb-4" />
              <p class="text-body-1">Loading transaction data...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="!overallData.length" class="text-center py-8">
              <v-icon size="48" color="grey-lighten-1" class="mb-4">mdi-database-off</v-icon>
              <h3 class="text-h6 mb-2">No Data Available</h3>
              <p class="text-body-2 mb-4">There are no transaction records to display.</p>
              <v-btn color="primary" @click="refreshData">Try Again</v-btn>
            </div>

            <!-- No Search Results -->
            <div v-else-if="!filteredData.length" class="text-center py-8">
              <v-icon size="48" color="grey-lighten-1" class="mb-4">mdi-file-search</v-icon>
              <h3 class="text-h6 mb-2">No Results Found</h3>
              <p class="text-body-2 mb-4">No transactions match your search criteria.</p>
              <v-btn color="primary" variant="text" @click="searchQuery = ''">Clear Search</v-btn>
            </div>

            <!-- Data Table -->
            <div v-else class="table-container">
              <v-table hover>
                <thead>
                  <tr>
                    <th
                      v-for="(key, index) in headers"
                      :key="index"
                      class="table-header"
                      @click="sortData(key)"
                      style="cursor: pointer"
                    >
                      <div class="d-flex align-center">
                        <span>{{ formatHeader(key) }}</span>
                        <v-icon v-if="sortBy === key" size="16" class="ml-1">
                          {{ sortOrder === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                        </v-icon>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, rowIndex) in paginatedData" :key="rowIndex">
                    <td v-for="(value, key) in row" :key="key" class="table-cell">
                      {{ formatCell(value) }}
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </div>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="d-flex justify-space-between align-center mt-4">
              <span class="text-body-2">
                Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to
                {{ Math.min(currentPage * itemsPerPage, filteredData.length) }} of
                {{ filteredData.length }} entries
              </span>
              <v-pagination
                v-model="currentPage"
                :length="totalPages"
                :total-visible="5"
                color="primary"
              />
            </div>
          </v-card-text>
        </v-card>
      </div>
    </template>
  </AppLayout>
</template>

<style scoped>
.transaction-view {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header-section {
  margin-bottom: 24px;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  color: #25c025;
  margin-bottom: 8px;
}

.page-subtitle {
  color: #666;
  font-size: 1rem;
}

.stats-section {
  margin-bottom: 24px;
}

.stats-card {
  transition: transform 0.2s ease;
}

.stats-card:hover {
  transform: translateY(-2px);
}

.stats-number {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.stats-label {
  font-size: 0.875rem;
  color: #666;
}

.main-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.controls-group {
  display: flex;
  gap: 8px;
}

.search-controls {
  display: flex;
  gap: 16px;
  align-items: center;
}

.search-field {
  flex: 1;
  max-width: 400px;
}

.items-select {
  width: 150px;
}

.table-container {
  overflow-x: auto;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.table-header {
  background-color: #a0eb89;
  font-weight: 600;
  user-select: none;
}

.table-header:hover {
  background-color: #e8f5e8;
}

.table-cell {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
}

/* Responsive */
@media (max-width: 768px) {
  .transaction-view {
    padding: 16px;
  }

  .controls-group {
    flex-direction: column;
    gap: 8px;
  }

  .search-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .search-field {
    max-width: none;
  }
}

/* Dark theme */
.v-theme--dark .transaction-view {
  background-color: #121212;
}

.v-theme--dark .table-header {
  background-color: #1e1e1e;
}

.v-theme--dark .table-header:hover {
  background-color: #2d2d2d;
}
</style>
