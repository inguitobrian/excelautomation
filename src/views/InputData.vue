<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import Swal from 'sweetalert2'

const form = ref(null)
const submitting = ref(false)
const message = ref({ type: '', text: '' })

const sheetOptions = ref([])
const formData = ref({
  sheetName: '',
  dateRequested: '',
  equipmentActivity: '',
  rsNumber: '',
  poNumber: '',
  atWithdraw: '',
  scheduleDateFrom: '',
  scheduleDateTo: '',
  requestedBy: '',
  from: '',
  to: '',
  assigned: '',
  remarks: '',
  deliveryStart: '',
  deliveredDate: '',
})

//fetching from excel
onMounted(async () => {
  try {
    const res = await fetch(
      'https://script.google.com/macros/s/AKfycbywwa6AOFAIZYUg9GYHl-YDwcQIhf-GHC5xF-7wqcX7cPVEkx-JwnYvfSAmI4Pyn_Uy/exec',
    )
    const data = await res.json()
    //hide the overall transaction
    sheetOptions.value = (data.sheets || []).filter((name) => name !== 'OverallTransaction')
  } catch (err) {
    console.error('Failed to fetch sheets:', err)
  }
})

const handleSubmit = async () => {
  submitting.value = true
  message.value = { type: '', text: '' }

  try {
    const formObj = {
      sheetName: formData.value.sheetName,
      'Date Requested': formData.value.dateRequested,
      'Equipment Activity': formData.value.equipmentActivity,
      'RS Number': formData.value.rsNumber,
      'PO Number': formData.value.poNumber,
      ATW: formData.value.atWithdraw,
      'Date Of Schedule - From': formData.value.scheduleDateFrom,
      'Date Of Schedule - To': formData.value.scheduleDateTo,
      'Requested By': formData.value.requestedBy,
      From: formData.value.from,
      To: formData.value.to,
      'Assigned SL/PM': formData.value.assigned,
      Remarks: formData.value.remarks,
      'Delivery Start': formData.value.deliveryStart,
      'Projected Delivery Date': formData.value.deliveredDate,
    }

    //submitting the data
    const response = await fetch(
      'https://script.google.com/macros/s/AKfycbywwa6AOFAIZYUg9GYHl-YDwcQIhf-GHC5xF-7wqcX7cPVEkx-JwnYvfSAmI4Pyn_Uy/exec',
      {
        method: 'POST',
        body: JSON.stringify(formObj),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      },
    )

    const data = await response.json()
    if (data.status === 'success') {
      await Swal.fire({
        icon: 'success',
        title: 'Submitted Successfully!',
        text: data.message,
        confirmButtonColor: '#2e7d32',
        background: '#f1f8e9',
        color: '#1b5e20',
      })
      handleReset()
    } else {
      throw new Error(data.message)
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Submission Failed',
      text: error.message,
      confirmButtonColor: '#d32f2f',
      background: '#ffebee',
      color: '#c62828',
    })
  } finally {
    submitting.value = false
  }
}

const handleReset = () => {
  form.value.reset()
  formData.value = {
    sheetName: '',
    dateRequested: '',
    equipmentActivity: '',
    rsNumber: '',
    poNumber: '',
    atWithdraw: '',
    scheduleDateFrom: '',
    scheduleDateTo: '',
    requestedBy: '',
    from: '',
    to: '',
    assigned: '',
    remarks: '',
    deliveryStart: '',
    deliveredDate: '',
  }
}
</script>

<template>
  <AppLayout>
    <template #content>
      <v-container class="pa-4" max-width="800px">
        <!-- Main Form Card -->
        <v-card
          elevation="8"
          class="construction-card pa-6"
          style="
            background: linear-gradient(135deg, #e8f5e8, #ffffff);
            border-radius: 16px;
            border: 2px solid #4caf50;
          "
        >
          <!-- Form Header -->
          <div class="form-header text-center mb-4">
            <v-icon size="36" class="header-icon mb-1">mdi-dump-truck</v-icon>
            <h3 class="form-title">Construction Truck Haul - Equipment Request</h3>
            <v-divider
              class="custom-divider mx-auto mt-2"
              style="width: 80px; height: 2px; background: #4caf50"
            ></v-divider>
          </div>

          <v-form ref="form" @submit.prevent="handleSubmit">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.sheetName"
                  :items="sheetOptions"
                  label="Project Sheet"
                  name="sheetName"
                  required
                  variant="outlined"
                  density="compact"
                  color="green"
                  prepend-inner-icon="mdi-file-document"
                  class="construction-field"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.dateRequested"
                  label="Date Requested"
                  type="date"
                  required
                  variant="outlined"
                  density="compact"
                  color="green"
                  prepend-inner-icon="mdi-calendar"
                  class="construction-field"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="formData.equipmentActivity"
                  label="Equipment Activity"
                  required
                  variant="outlined"
                  density="compact"
                  color="green"
                  prepend-inner-icon="mdi-cogs"
                  class="construction-field"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.rsNumber"
                  label="RS Number"
                  required
                  variant="outlined"
                  density="compact"
                  color="green"
                  prepend-inner-icon="mdi-identifier"
                  class="construction-field"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.poNumber"
                  label="PO Number"
                  required
                  variant="outlined"
                  density="compact"
                  color="green"
                  prepend-inner-icon="mdi-file-document-outline"
                  class="construction-field"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="formData.atWithdraw"
                  label="Authority to Withdraw"
                  required
                  variant="outlined"
                  density="compact"
                  color="green"
                  prepend-inner-icon="mdi-certificate"
                  class="construction-field"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.scheduleDateFrom"
                  label="Schedule From"
                  type="date"
                  required
                  variant="outlined"
                  density="compact"
                  color="green"
                  prepend-inner-icon="mdi-calendar-start"
                  class="construction-field"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.scheduleDateTo"
                  label="Schedule To"
                  type="date"
                  required
                  variant="outlined"
                  density="compact"
                  color="green"
                  prepend-inner-icon="mdi-calendar-end"
                  class="construction-field"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.requestedBy"
                  label="Requested By"
                  required
                  variant="outlined"
                  density="compact"
                  color="green"
                  prepend-inner-icon="mdi-account"
                  class="construction-field"
                />
              </v-col>
              <v-col cols="6" md="3">
                <v-text-field
                  v-model="formData.from"
                  label="From"
                  required
                  variant="outlined"
                  density="compact"
                  color="green"
                  prepend-inner-icon="mdi-map-marker"
                  class="construction-field"
                />
              </v-col>
              <v-col cols="6" md="3">
                <v-text-field
                  v-model="formData.to"
                  label="To"
                  required
                  variant="outlined"
                  density="compact"
                  color="green"
                  prepend-inner-icon="mdi-map-marker-check"
                  class="construction-field"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.assigned"
                  label="Assigned SL/PM"
                  required
                  variant="outlined"
                  density="compact"
                  color="green"
                  prepend-inner-icon="mdi-account-hard-hat"
                  class="construction-field"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.remarks"
                  :items="['Delivered', 'On-going', 'Pending']"
                  label="Status"
                  required
                  variant="outlined"
                  density="compact"
                  color="green"
                  prepend-inner-icon="mdi-information"
                  class="construction-field"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.deliveryStart"
                  label="Delivery Start"
                  type="date"
                  required
                  variant="outlined"
                  density="compact"
                  color="green"
                  prepend-inner-icon="mdi-truck-delivery"
                  class="construction-field"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.deliveredDate"
                  label="Projected Delivery Date"
                  type="date"
                  required
                  variant="outlined"
                  density="compact"
                  color="green"
                  prepend-inner-icon="mdi-calendar-check"
                  class="construction-field"
                />
              </v-col>
            </v-row>

            <!-- Alert Message -->
            <v-alert
              v-if="message.text"
              :type="message.type"
              class="my-4"
              border="start"
              border-color="green"
              style="background: #e8f5e8"
            >
              {{ message.text }}
            </v-alert>

            <!-- Action Buttons -->
            <div class="action-buttons mt-4">
              <v-row justify="center" dense>
                <v-col cols="12" sm="5">
                  <v-btn
                    type="submit"
                    color="green-darken-1"
                    block
                    :loading="submitting"
                    :disabled="submitting"
                    size="default"
                    elevation="2"
                    class="construction-btn-primary"
                  >
                    <v-icon left size="small">mdi-cloud-upload</v-icon>
                    {{ submitting ? 'Submitting...' : 'Submit to Excel' }}
                  </v-btn>
                </v-col>
                <v-col cols="12" sm="5">
                  <v-btn
                    color="grey-darken-1"
                    block
                    @click="handleReset"
                    size="default"
                    variant="outlined"
                    class="construction-btn-secondary"
                  >
                    <v-icon left size="small">mdi-refresh</v-icon>
                    Reset Form
                  </v-btn>
                </v-col>
              </v-row>
            </div>
          </v-form>
        </v-card>
      </v-container>
    </template>
  </AppLayout>
</template>

<style scoped>
.construction-header {
  padding: 20px;
  background: linear-gradient(135deg, #2e7d32, #4caf50);
  border-radius: 15px;
  color: white;
  box-shadow: 0 8px 20px rgba(76, 175, 80, 0.3);
}

.construction-icon {
  color: #fff3e0 !important;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.construction-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.construction-subtitle {
  font-size: 1.2rem;
  font-weight: 400;
  margin: 0;
  opacity: 0.9;
}

.construction-card {
  box-shadow: 0 12px 40px rgba(76, 175, 80, 0.2);
  transition: all 0.3s ease;
}

.construction-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 50px rgba(76, 175, 80, 0.25);
}

.form-header {
  background: linear-gradient(135deg, #f1f8e9, #e8f5e8);
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #a5d6a7;
}

.header-icon {
  color: #2e7d32 !important;
}

.form-title {
  color: #1b5e20;
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
}

.form-section {
  background: #fafafa;
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid #4caf50;
}

.section-title {
  color: #2e7d32;
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  color: #4caf50 !important;
}

.construction-field {
  margin-bottom: 8px;
}

.construction-field :deep(.v-field) {
  border-radius: 8px;
  border: 2px solid #e0e0e0;
  transition: all 0.3s ease;
}

.construction-field :deep(.v-field:hover) {
  border-color: #4caf50;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.15);
}

.construction-field :deep(.v-field.v-field--focused) {
  border-color: #2e7d32;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.25);
}

.action-buttons {
  background: linear-gradient(135deg, #f1f8e9, #e8f5e8);
  padding: 24px;
  border-radius: 12px;
  border: 2px solid #c8e6c9;
}

.construction-btn-primary {
  font-weight: 600;
  text-transform: none;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.construction-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
}

.construction-btn-secondary {
  font-weight: 600;
  text-transform: none;
  border-radius: 8px;
  border: 2px solid #757575;
  transition: all 0.3s ease;
}

.construction-btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(117, 117, 117, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
  .construction-title {
    font-size: 2rem;
  }

  .construction-subtitle {
    font-size: 1rem;
  }

  .form-section {
    padding: 16px;
  }

  .action-buttons {
    padding: 20px;
  }
}
</style>
