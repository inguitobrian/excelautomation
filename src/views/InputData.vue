<script setup>
import { ref, onMounted } from 'vue'

import AppLayout from '@/components/layout/AppLayout.vue'

const form = ref(null)
const submitting = ref(false)
const message = ref({ type: '', text: '' })

const sheetOptions = ref([])
const formData = ref({
  sheetName: '',
  dateRequested: '',
  equipmentActivity: '',
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
      'Equipment No. Activity': formData.value.equipmentActivity,
      'Date Of Schedule - From': formData.value.scheduleDateFrom,
      'Date Of Schedule - To': formData.value.scheduleDateTo,
      'Requested By': formData.value.requestedBy,
      From: formData.value.from,
      To: formData.value.to,
      'Assigned SL/PM': formData.value.assigned,
      Remarks: formData.value.remarks,
      'Delivery Start': formData.value.deliveryStart,
      'Delivered Date': formData.value.deliveredDate,
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
      message.value = { type: 'success', text: data.message }
      handleReset()
    } else {
      throw new Error(data.message)
    }
  } catch (error) {
    message.value = { type: 'error', text: error.message }
  } finally {
    submitting.value = false
    setTimeout(() => (message.value.text = ''), 4000)
  }
}

const handleReset = () => {
  form.value.reset()
  formData.value = {
    sheetName: '',
    dateRequested: '',
    equipmentActivity: '',
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
      <v-container class="pa-6" max-width="700px">
        <v-card
          elevation="6"
          class="pa-6"
          style="background: linear-gradient(135deg, #fff3e0, #ffffff); border-radius: 16px"
        >
          <v-card-title class="text-h5 font-weight-bold text-center mb-4 text-orange-darken-2">
            🛠️ Equipment Request Form
          </v-card-title>

          <v-form ref="form" @submit.prevent="handleSubmit">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.sheetName"
                  :items="sheetOptions"
                  label="Select Project Sheet"
                  name="sheetName"
                  required
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.dateRequested"
                  label="Date Requested"
                  type="date"
                  required
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="formData.equipmentActivity"
                  label="Equipment No. / Activity"
                  required
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.scheduleDateFrom"
                  label="Schedule From"
                  type="date"
                  required
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.scheduleDateTo"
                  label="Schedule To"
                  type="date"
                  required
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.requestedBy"
                  label="Requested By"
                  required
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col cols="6" md="3">
                <v-text-field
                  v-model="formData.from"
                  label="From"
                  required
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col cols="6" md="3">
                <v-text-field
                  v-model="formData.to"
                  label="To"
                  required
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.assigned"
                  label="Assigned SL/PM"
                  required
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.remarks"
                  :items="['Delivered', 'On-going']"
                  label="Remarks"
                  required
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.deliveryStart"
                  label="Delivery Start"
                  type="date"
                  required
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.deliveredDate"
                  label="Delivered Date"
                  type="date"
                  required
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
            </v-row>

            <v-alert
              v-if="message.text"
              :type="message.type"
              class="my-4"
              border="start"
              border-color="orange"
            >
              {{ message.text }}
            </v-alert>

            <v-row class="mt-4" justify="center" align="center">
              <v-col cols="12" sm="6">
                <v-btn
                  type="submit"
                  color="orange"
                  block
                  :loading="submitting"
                  :disabled="submitting"
                  size="large"
                  elevation="2"
                >
                  Send to Excel
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6">
                <v-btn
                  color="grey-darken-1"
                  block
                  @click="handleReset"
                  size="large"
                  variant="outlined"
                >
                  Cancel
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-card>
      </v-container>
    </template>
  </AppLayout>
</template>
