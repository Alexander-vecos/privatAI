import { create } from 'zustand';

interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

type ModalType = 'keyAuth' | 'emailAuth' | 'fileUpload' | 'fileViewer' | 'keyGenerate' | null;

interface UIState {
  // Navigation visibility
  isBottomNavVisible: boolean;
  isSidebarVisible: boolean;
  isRightPanelVisible: boolean;

  // Modal state
  activeModal: ModalType;
  viewingFileId: string | null;

  // Preview state
  isPreviewZoomed: boolean;
  previewZoomLevel: number;

  // Safe Area insets
  safeAreaInsets: SafeAreaInsets;

  // Actions
  toggleNavVisibility: () => void;
  showNav: () => void;
  hideNav: () => void;
  setPreviewZoom: (zoomed: boolean, level?: number) => void;
  setSafeAreaInsets: (insets: SafeAreaInsets) => void;
  openModal: (modal: ModalType) => void;
  openFileViewer: (fileId: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  isBottomNavVisible: true,
  isSidebarVisible: true,
  isRightPanelVisible: false,

  activeModal: null,
  viewingFileId: null,

  isPreviewZoomed: false,
  previewZoomLevel: 1,

  safeAreaInsets: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },

  toggleNavVisibility: () =>
    set((state) => ({
      isBottomNavVisible: !state.isBottomNavVisible,
      isSidebarVisible: !state.isSidebarVisible,
    })),

  showNav: () =>
    set({
      isBottomNavVisible: true,
      isSidebarVisible: true,
    }),

  hideNav: () =>
    set({
      isBottomNavVisible: false,
      isSidebarVisible: false,
    }),

  setPreviewZoom: (zoomed, level = 1) =>
    set({
      isPreviewZoomed: zoomed,
      previewZoomLevel: level,
    }),

  setSafeAreaInsets: (insets) => set({ safeAreaInsets: insets }),

  openModal: (modal) => set({ activeModal: modal }),

  openFileViewer: (fileId) =>
    set({ activeModal: 'fileViewer', viewingFileId: fileId }),

  closeModal: () =>
    set({ activeModal: null, viewingFileId: null, isPreviewZoomed: false }),
}));
