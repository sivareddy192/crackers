import { Outlet, useLocation, Navigate } from 'react-router-dom'
import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'
import toast, { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import fetchUserDetails from './utils/fetchUserDetails';
import { setUserDetails } from './store/userSlice';
import { setAllCategory,setAllSubCategory,setLoadingCategory } from './store/productSlice';
import { useDispatch, useSelector } from 'react-redux';
import Axios from './utils/Axios';
import SummaryApi from './common/SummaryApi';
import { handleAddItemCart } from './store/cartProduct'
import GlobalProvider from './provider/GlobalProvider';
import CartMobileLink from './components/CartMobile';
import BottomNavigationBar from './components/BottomNavigationBar';
import ScrollToTop from './components/ScrollToTop';
import isDeliveryBoy from './utils/isDeliveryBoy';
import isAdmin from './utils/isAdmin';
import AxiosToastError from './utils/AxiosToastError';
import AppSkeleton from './components/AppSkeleton';
import SafetyTipsGate from './components/SafetyTipsGate';


function App() {
  const dispatch = useDispatch()
  const location = useLocation()
  const user = useSelector(state => state.user)
  const fetchUser = async()=>{
      if(localStorage.getItem('accessToken')){

        const userData = await fetchUserDetails()
        if(userData?.success){
          dispatch(setUserDetails(userData.data))
        }
      }
  }

  const fetchCategory = async()=>{
    try {
        dispatch(setLoadingCategory(true))
        const response = await Axios({
            ...SummaryApi.getCategory
        })
        const { data : responseData } = response
        if(responseData.success){
           dispatch(setAllCategory(responseData.data.sort((a, b) => a.name.localeCompare(b.name)))) 
        }
    } catch (error) {
        AxiosToastError(error)
    }finally{

      dispatch(setLoadingCategory(false))
    }
  }

  const fetchSubCategory = async()=>{
    try {
        const response = await Axios({
            ...SummaryApi.getSubCategory
        })
        const { data : responseData } = response
        if(responseData.success){
           dispatch(setAllSubCategory(responseData.data.sort((a, b) => a.name.localeCompare(b.name)))) 
        }
    } catch (error) {
        AxiosToastError(error)
    }finally{

    }
  }

  useEffect(() => {
    // Explicitly disable dark mode / clear theme settings to operate strictly in light mode
    localStorage.removeItem('theme')
    document.documentElement.classList.remove('dark')

    const initializeApp = async () => {
      try {
        await Promise.all([
          fetchUser(),
          fetchCategory(),
          fetchSubCategory()
        ]);
      } catch (err) {
        console.error("Initialization failed:", err);
      }
    };
    initializeApp();
  }, []);

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
            <Outlet/>
        </main>
        <Footer/>
        <Toaster/>
        <BottomNavigationBar/>
        <SafetyTipsGate />
      </div>
    </GlobalProvider>
  )
}

export default App
