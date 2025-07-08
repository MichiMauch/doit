import { configureStore } from '@reduxjs/toolkit';

// Minimaler Redux Store für @hello-pangea/dnd
export const store = configureStore({
  reducer: {
    // Leerer Reducer - wir brauchen nur den Store für das Drag&Drop Package
    dnd: () => ({}),
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;