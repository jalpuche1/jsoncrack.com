import { create } from "zustand";
import type { NodeData } from "../../../../../types/graph";

interface EditState {
  isEditing: boolean;
  editingNodeId: string | null;
  editingRowIndex: number | null;
  editValue: string;
  originalValue: string;
}

interface EditActions {
  startEditing: (nodeId: string, rowIndex: number, currentValue: string) => void;
  cancelEditing: () => void;
  updateEditValue: (value: string) => void;
  saveEdit: () => Promise<void>;
  isRowEditing: (nodeId: string, rowIndex: number) => boolean;
}

const initialState: EditState = {
  isEditing: false,
  editingNodeId: null,
  editingRowIndex: null,
  editValue: "",
  originalValue: "",
};

export const useEdit = create<EditState & EditActions>((set, get) => ({
  ...initialState,
  
  startEditing: (nodeId: string, rowIndex: number, currentValue: string) => {
    set({
      isEditing: true,
      editingNodeId: nodeId,
      editingRowIndex: rowIndex,
      editValue: String(currentValue),
      originalValue: String(currentValue),
    });
  },
  
  cancelEditing: () => {
    set(initialState);
  },
  
  updateEditValue: (value: string) => {
    set({ editValue: value });
  },
  
  saveEdit: async () => {
    const { editingNodeId, editingRowIndex, editValue } = get();
    
    if (editingNodeId === null || editingRowIndex === null) return;
    
    try {
      const { updateNodeValue } = await import("../lib/utils/updateNodeValue");
      await updateNodeValue(editingNodeId, editingRowIndex, editValue);
      set(initialState);
    } catch (error) {
      console.error("Failed to save edit:", error);
    }
  },
  
  isRowEditing: (nodeId: string, rowIndex: number) => {
    const state = get();
    return state.isEditing && 
           state.editingNodeId === nodeId && 
           state.editingRowIndex === rowIndex;
  },
}));