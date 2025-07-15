<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const drawer = ref(false)

// Logout function
const handleLogout = () => {
  // Clear authentication data
  localStorage.removeItem('isAuthenticated')
  localStorage.removeItem('userRole')
  localStorage.removeItem('username')
  localStorage.removeItem('loginTime')

  // Navigate to logout route (which will redirect to login)
  router.push('/logout')
}

// Navigation items with construction-themed icons
const navigationItems = [
  {
    to: '/',
    title: 'Dashboard',
    icon: 'mdi-view-dashboard',
    subtitle: 'Send to Excel',
  },
  {
    to: '/transactions',
    title: 'Overall Transaction',
    icon: 'mdi-chart-line',
    subtitle: 'transaction',
  },
  {
    to: '/editremarks',
    title: 'Edit Remarks',
    icon: 'mdi-cog',
    subtitle: 'System Configuration',
  },
]
</script>

<template>
  <v-responsive class="border rounded">
    <v-app :theme="theme">
      <!-- Enhanced Navigation Drawer -->
      <v-navigation-drawer class="custom-drawer" v-model="drawer" temporary width="320">
        <!-- Drawer Header -->
        <div class="drawer-header">
          <div class="header-content">
            <v-icon size="40" class="header-icon">mdi-excavator</v-icon>
            <div class="header-text">
              <h3 class="header-title">Haulers Scheduling</h3>
              <p class="header-subtitle">Haul Equipment Scheduler</p>
            </div>
          </div>
        </div>

        <!-- Navigation List -->
        <v-list nav class="navigation-list">
          <v-list-item
            v-for="item in navigationItems"
            :key="item.to"
            :to="item.to"
            :title="item.title"
            :prepend-icon="item.icon"
            class="nav-item"
            rounded="lg"
          >
            <template #subtitle>
              <span class="nav-subtitle">{{ item.subtitle }}</span>
            </template>
          </v-list-item>
        </v-list>

        <!-- Drawer Footer -->
        <template #append>
          <div class="drawer-footer">
            <v-divider class="mb-3"></v-divider>
            <v-list-item
              prepend-icon="mdi-help-circle"
              title="Help & Support"
              class="nav-item"
              rounded="lg"
            />
            <v-list-item
              prepend-icon="mdi-logout"
              title="Sign Out"
              class="nav-item"
              rounded="lg"
              @click="handleLogout"
            />
          </div>
        </template>
      </v-navigation-drawer>

      <!-- Enhanced App Bar -->
      <v-app-bar class="custom-app-bar" color="transparent" elevation="0" height="72">
        <div class="app-bar-content">
          <!-- Menu Button -->
          <v-btn icon @click="drawer = !drawer" class="menu-btn" size="large" variant="text">
            <v-icon>mdi-menu</v-icon>
          </v-btn>

          <!-- Brand Section -->
          <div class="brand-section">
            <v-icon class="brand-icon" size="32">mdi-dump-truck</v-icon>
            <div class="brand-text">
              <h2 class="brand-title">Haulers Scheduling</h2>
              <p class="brand-subtitle">Equipment Scheduler</p>
            </div>
          </div>

          <v-spacer></v-spacer>

          <!-- Status Indicator -->
          <div class="status-indicator">
            <v-chip color="success" variant="flat" size="small" prepend-icon="mdi-check-circle">
              System Online
            </v-chip>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <v-btn
              v-for="action in userActions"
              :key="action.icon"
              :icon="action.icon"
              variant="text"
              class="action-btn"
              size="large"
            >
              <v-icon>{{ action.icon }}</v-icon>
              <v-badge v-if="action.badge" :content="action.badge" color="error" floating />
              <v-tooltip activator="parent" location="bottom">
                {{ action.tooltip }}
              </v-tooltip>
            </v-btn>
          </div>
        </div>
      </v-app-bar>

      <!-- Main Content -->
      <v-main class="main-content">
        <slot name="content"></slot>
      </v-main>
    </v-app>
  </v-responsive>
</template>

<style scoped>
/* App Bar Styles */
.custom-app-bar {
  background: linear-gradient(135deg, #2e7d32 0%, #388e3c 50%, #43a047 100%);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.app-bar-content {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 16px;
}

.menu-btn {
  color: white;
  margin-right: 16px;
  transition: all 0.3s ease;
}

.menu-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon {
  color: #fff;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.brand-text {
  color: white;
}

.brand-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.brand-subtitle {
  font-size: 0.75rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 500;
}

.status-indicator {
  margin-right: 16px;
}

.action-buttons {
  display: flex;
  gap: 4px;
  margin-right: 8px;
}

.action-btn {
  color: white;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.theme-toggle {
  color: white;
  transition: all 0.3s ease;
}

.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: rotate(180deg);
}

/* Drawer Styles */
.custom-drawer {
  background: linear-gradient(180deg, #f1f8e9 0%, #e8f5e8 100%);
  border-right: 1px solid rgba(46, 125, 50, 0.1);
}

.drawer-header {
  background: linear-gradient(135deg, #2e7d32 0%, #388e3c 100%);
  padding: 24px 20px;
  color: white;
  position: relative;
  overflow: hidden;
}

.drawer-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M20 20h60v60h-60z" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/><path d="M30 30h40v40h-40z" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/></svg>');
  opacity: 0.3;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.header-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 8px;
  backdrop-filter: blur(10px);
}

.header-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

.header-subtitle {
  font-size: 0.875rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 400;
}

.navigation-list {
  padding: 16px 12px;
}

.nav-item {
  margin-bottom: 8px;
  border-radius: 12px !important;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.nav-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(46, 125, 50, 0.1), transparent);
  transition: left 0.5s ease;
}

.nav-item:hover::before {
  left: 100%;
}

.nav-item:hover {
  background: rgba(46, 125, 50, 0.08);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.15);
}

.nav-item.v-list-item--active {
  background: rgba(46, 125, 50, 0.15);
  border-left: 4px solid #2e7d32;
}

.nav-subtitle {
  font-size: 0.75rem;
  opacity: 0.7;
  color: #2e7d32;
}

.drawer-footer {
  padding: 16px 12px;
  background: rgba(46, 125, 50, 0.05);
}

/* Main Content */
.main-content {
  background: linear-gradient(135deg, #f1f8e9 0%, #e8f5e8 50%, #dcedc8 100%);
  min-height: 100vh;
  position: relative;
}

.main-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 30%, rgba(139, 195, 74, 0.1) 0%, transparent 40%),
    radial-gradient(circle at 80% 60%, rgba(104, 159, 56, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(76, 175, 80, 0.05) 0%, transparent 60%);
  pointer-events: none;
}

/* Dark theme overrides */
.v-theme--dark .custom-drawer {
  background: linear-gradient(180deg, #1b5e20 0%, #2e7d32 100%);
}

.v-theme--dark .drawer-footer {
  background: rgba(0, 0, 0, 0.3);
}

.v-theme--dark .nav-item:hover {
  background: rgba(139, 195, 74, 0.1);
}

.v-theme--dark .main-content {
  background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%);
}

/* Responsive Design */
@media (max-width: 768px) {
  .brand-text {
    display: none;
  }

  .status-indicator {
    display: none;
  }

  .action-buttons {
    margin-right: 0;
  }

  .brand-title {
    font-size: 1.25rem;
  }
}

/* Animations */
@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.custom-drawer {
  animation: slideIn 0.3s ease-out;
}

/* Scroll behavior */
.navigation-list {
  scrollbar-width: thin;
  scrollbar-color: rgba(46, 125, 50, 0.3) transparent;
}

.navigation-list::-webkit-scrollbar {
  width: 6px;
}

.navigation-list::-webkit-scrollbar-track {
  background: transparent;
}

.navigation-list::-webkit-scrollbar-thumb {
  background: rgba(46, 125, 50, 0.3);
  border-radius: 3px;
}

.navigation-list::-webkit-scrollbar-thumb:hover {
  background: rgba(46, 125, 50, 0.5);
}
</style>
