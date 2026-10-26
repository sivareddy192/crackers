import { Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import router from './route/index.jsx'
import { Provider } from 'react-redux'
import { store } from './store/store.js'

// NOTE: StrictMode intentionally off — double-invoke effects harm LCP/perf metrics.
// Re-enable locally during development if needed.
createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    {/* null fallback: the inline critical shell in index.html fills the viewport
        during JS load. A spinner fallback here would cause CLS when React mounts. */}
    <Suspense fallback={null}>
      <RouterProvider router={router} />
    </Suspense>
  </Provider>
)