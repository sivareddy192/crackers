import { createSlice } from "@reduxjs/toolkit";

const getCachedList = (key) => {
  try {
    const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const initialCategories = getCachedList("tracly_categories");
const initialSubCategories = getCachedList("tracly_subcategories");

const initialValue = {
  allCategory: initialCategories,
  loadingCategory: false,
  allSubCategory: initialSubCategories,
  product: []
};

const productSlice = createSlice({
  name: 'product',
  initialState: initialValue,
  reducers: {
    setAllCategory: (state, action) => {
      const payload = Array.isArray(action.payload) ? action.payload : [];
      state.allCategory = payload;
      try {
        localStorage.setItem("tracly_categories", JSON.stringify(payload));
      } catch {}
    },
    setLoadingCategory: (state, action) => {
      state.loadingCategory = action.payload;
    },
    setAllSubCategory: (state, action) => {
      const payload = Array.isArray(action.payload) ? action.payload : [];
      state.allSubCategory = payload;
      try {
        localStorage.setItem("tracly_subcategories", JSON.stringify(payload));
      } catch {}
    },
  }
});

export const { setAllCategory, setAllSubCategory, setLoadingCategory } = productSlice.actions;

export default productSlice.reducer;
