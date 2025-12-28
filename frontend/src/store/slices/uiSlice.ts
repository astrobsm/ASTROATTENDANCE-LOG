import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface Toast {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface UiState {
  sidebarOpen: boolean;
  modalOpen: boolean;
  modalContent: string | null;
  notifications: Notification[];
  toast: Toast | null;
  loading: boolean;
  fingerprintServiceConnected: boolean;
}

const initialState: UiState = {
  sidebarOpen: true,
  modalOpen: false,
  modalContent: null,
  notifications: [],
  toast: null,
  loading: false,
  fingerprintServiceConnected: false
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.modalOpen = true;
      state.modalContent = action.payload;
    },
    closeModal: (state) => {
      state.modalOpen = false;
      state.modalContent = null;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const id = Date.now().toString();
      state.notifications.push({ ...action.payload, id });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    showToast: (state, action: PayloadAction<Toast>) => {
      state.toast = action.payload;
    },
    clearToast: (state) => {
      state.toast = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setFingerprintServiceConnected: (state, action: PayloadAction<boolean>) => {
      state.fingerprintServiceConnected = action.payload;
    }
  }
});

export const {
  toggleSidebar,
  setSidebarOpen,
  openModal,
  closeModal,
  addNotification,
  removeNotification,
  clearNotifications,
  showToast,
  clearToast,
  setLoading,
  setFingerprintServiceConnected
} = uiSlice.actions;

export default uiSlice.reducer;
