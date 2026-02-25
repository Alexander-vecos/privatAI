import { create } from 'zustand';
import { FileData } from '../firebase/firestoreAdapter';
import { Timestamp } from 'firebase/firestore';

interface FileState {
  // Files
  files: FileData[];
  selectedFileIds: string[];

  // Upload progress
  isUploading: boolean;
  uploadProgress: Map<string, number>;

  // Error handling
  error: string | null;

  // Pagination
  pageSize: number;
  hasMore: boolean;
  lastDoc: any;

  // Actions
  addFile: (file: FileData) => void;
  removeFile: (fileId: string) => void;
  setFiles: (files: FileData[]) => void;
  toggleFileSelection: (fileId: string) => void;
  clearSelection: () => void;

  // Upload actions
  startUpload: () => void;
  setUploadProgress: (fileId: string, progress: number) => void;
  completeUpload: () => void;

  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useFileStore = create<FileState>((set) => ({
  files: [],
  selectedFileIds: [],

  isUploading: false,
  uploadProgress: new Map(),

  error: null,

  pageSize: 20,
  hasMore: true,
  lastDoc: null,

  addFile: (file) =>
    set((state) => ({
      files: [file, ...state.files],
    })),

  removeFile: (fileId) =>
    set((state) => ({
      files: state.files.filter((f) => f.id !== fileId),
    })),

  setFiles: (files) => set({ files }),

  toggleFileSelection: (fileId) =>
    set((state) => ({
      selectedFileIds: state.selectedFileIds.includes(fileId)
        ? state.selectedFileIds.filter((id) => id !== fileId)
        : [...state.selectedFileIds, fileId],
    })),

  clearSelection: () => set({ selectedFileIds: [] }),

  startUpload: () => set({ isUploading: true, error: null }),

  setUploadProgress: (fileId, progress) =>
    set((state) => {
      const newProgress = new Map(state.uploadProgress);
      newProgress.set(fileId, progress);
      return { uploadProgress: newProgress };
    }),

  completeUpload: () =>
    set({
      isUploading: false,
      uploadProgress: new Map(),
    }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),
}));
