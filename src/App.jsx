import { Outlet, useLocation, Navigate } from 'react-router-dom'
import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'
import { Toaster } from 'react-hot-toast';
import { Suspense, useEffect, useRef, lazy } from 'react';
import fetchUserDetails from './utils/fetchUserDetails';
import { setUserDetails } from './store/userSlice';
import { setAllCategory,setAllSubCategory,setLoadingCategory } from './store/productSlice';
import { useDispatch, useSelector } from 'react-redux';
import Axios from './utils/Axios';
import SummaryApi from './common/SummaryApi';
import GlobalProvider from './provider/GlobalProvider';
import BottomNavigationBar from './components/BottomNavigationBar';
import ScrollToTop from './components/ScrollToTop';
import isDeliveryBoy from './utils/isDeliveryBoy';
import isAdmin from './utils/isAdmin';
import AxiosToastError from './utils/AxiosToastError';

const SafetyTipsGate = lazy(() => import('./components/SafetyTipsGate'));


function App() {
  const dispatch = useDispatch()
  const location = useLocation()
  const user = useSelector(state => state.user)
  const categoryData = useSelector(state => state.product.allCategory)
  const subCategoryData = useSelector(state => state.product.allSubCategory)
  const catalogRequestInFlight = useRef(false)
  const catalogRequestAttempted = useRef(false)

  useEffect(() => {
    // Explicitly disable dark mode / clear theme settings to operate strictly in light mode
    localStorage.removeItem('theme')
    document.documentElement.classList.remove('dark')

    const fetchUser = async () => {
      if (!localStorage.getItem('accessToken')) return

      const userData = await fetchUserDetails()
      if (userData?.success) {
        dispatch(setUserDetails(userData.data))
      }
    }

    fetchUser().catch(error => {
      console.error("Unable to load the signed-in user:", error)
    })
  }, [dispatch]);

  useEffect(() => {
    const catalogIsReady = categoryData.length > 0 && subCategoryData.length > 0
    const isHomeRoute = location.pathname === "/"

    // The home feed contains this data on the landing page. Other routes retain
    // the legacy fetch so a quick navigation away from Home never leaves the
    // category selectors empty.
    if (isHomeRoute || catalogIsReady || catalogRequestInFlight.current || catalogRequestAttempted.current) {
      return
    }

    const fetchCatalogMetadata = async () => {
      catalogRequestInFlight.current = true
      catalogRequestAttempted.current = true
      dispatch(setLoadingCategory(true))

      try {
        const [categoryResult, subCategoryResult] = await Promise.allSettled([
          Axios(SummaryApi.getCategory),
          Axios(SummaryApi.getSubCategory)
        ])

        if (categoryResult.status === "fulfilled" && categoryResult.value.data?.success) {
          const categories = [...(categoryResult.value.data.data || [])]
            .sort((a, b) => a.name.localeCompare(b.name))
          dispatch(setAllCategory(categories))
        }

        if (subCategoryResult.status === "fulfilled" && subCategoryResult.value.data?.success) {
          const subCategories = [...(subCategoryResult.value.data.data || [])]
            .sort((a, b) => a.name.localeCompare(b.name))
          dispatch(setAllSubCategory(subCategories))
        }

        const failedRequest = [categoryResult, subCategoryResult].find(
          result => result.status === "rejected"
        )
        if (failedRequest) {
          AxiosToastError(failedRequest.reason)
        }
      } finally {
        catalogRequestInFlight.current = false
        dispatch(setLoadingCategory(false))
      }
    }

    fetchCatalogMetadata()
  }, [categoryData.length, dispatch, location.pathname, subCategoryData.length]);

  // Redirect admins to their isolated portal (AFTER all hooks)
  if (isAdmin(user?.role)) {
    return <Navigate to="/admin-portal/dashboard" replace />
  }

  // Redirect delivery boys to their isolated portal (AFTER all hooks)
  if (isDeliveryBoy(user?.role)) {
    return <Navigate to="/delivery-portal/dashboard" replace />
  }

  return (
    <GlobalProvider> 
      <div className="trace-fire-theme">
        <ScrollToTop/>
        <Header/>
        <main className='min-h-[78vh] pt-28 pb-24 lg:pt-20 lg:pb-0'>
          <Suspense fallback={<div role="status" className="flex min-h-[50vh] items-center justify-center text-sm font-semibold text-slate-600">Loading page…</div>}>
            <Outlet/>
          </Suspense>
        </main>
        <Footer/>
        <Toaster/>
        <BottomNavigationBar/>
        <Suspense fallback={null}>
          <SafetyTipsGate />
        </Suspense>
      </div>
    </GlobalProvider>
  )
}

export default App
