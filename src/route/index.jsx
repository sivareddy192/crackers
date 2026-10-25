import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home";
import SearchP from "../pages/SearchP";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import OtpVerification from "../pages/OtpVerification";
import ResetPassword from "../pages/ResetPassword";
import UserMenuMobile from "../pages/UserMenuMobile";
import Dashboard from "../admin/Dashboard";
import Profile from "../pages/Profile";
import MyOrders from "../pages/MyOrders";
import Address from "../pages/Address";
import ProductList from "../pages/ProductList";
import ProductCatalog from "../pages/ProductCatalog";
import ProductCategories from "../pages/ProductCategories";
import ProductDisplay from "../pages/ProductDisplay";
import CartMobile from "../pages/CartMobile";
import CheckoutPage from "../pages/CheckoutPage";
import Success from "../pages/Success";
import Cancel from "../pages/Cancel";
import OrderDetails from "../pages/OrderDetails";
import VerifyEmail from "../pages/VerifyEmail";
import AccountPrivacy from "../pages/AccountPrivacy";
import ShopNowRedirect from "../pages/ShopNowRedirect";
import SafetyTips from "../pages/SafetyTips";
import AboutUs from "../pages/AboutUs";
import TermsAndConditions from "../pages/TermsAndConditions";
import ContactUs from "../pages/ContactUs";

// Delivery portal
import DeliveryBoyDashboard from "../pages/DeliveryBoyDashboard";
import DeliveryLayout from "../components/DeliveryLayout";
import DeliveryNotifications from "../pages/DeliveryNotifications";
import DeliveryOrderDetails from "../pages/DeliveryOrderDetails";

// Admin portal
import AdminLayout from "../components/AdminLayout";
import AdminDashboard from "../pages/AdminDashboard";
import Category from "../pages/Category";
import SubCategory from "../pages/SubCategory";
import UploadProduct from "../pages/UploadProduct";
import ProductAdmin from "../pages/ProductAdmin";
import AdminOrders from "../pages/AdminOrders";
import BannerAdmin from "../pages/BannerAdmin";
import ManageUsers from "../pages/ManageUsers";
import Coupons from "../pages/Coupon";
import AdminReviews from "../pages/AdminReviews";
import AdminNotifications from "../pages/AdminNotifications";
import AdminOrderDetails from "../pages/AdminOrderDetails";
import FestivalOfferAdmin from "../pages/FestivalOfferAdmin";

const router = createBrowserRouter([
    // ─── Delivery Boy Portal ───────────────────────────────────────────────
    {
        path: "delivery-portal",
        element: <DeliveryLayout />,
        children: [
            { path: "dashboard", element: <DeliveryBoyDashboard /> },
            { path: "notifications", element: <DeliveryNotifications /> },
            { path: "order/:orderId", element: <DeliveryOrderDetails /> }
        ]
    },

    // ─── Admin Portal ──────────────────────────────────────────────────────
    {
        path: "admin-portal",
        element: <AdminLayout />,
        children: [
            { path: "dashboard",       element: <AdminDashboard /> },
            { path: "category",        element: <Category /> },
            { path: "subcategory",     element: <SubCategory /> },
            { path: "upload-product",  element: <UploadProduct /> },
            { path: "product",         element: <ProductAdmin /> },
            { path: "orders",          element: <AdminOrders /> },
            { path: "banners",         element: <BannerAdmin /> },
            { path: "manage-users",    element: <ManageUsers /> },
            { path: "coupons",         element: <Coupons /> },
            {
                path: "order/:orderId",
                element: <AdminOrderDetails />
            },
            { path: "reviews",         element: <AdminReviews /> },
            { path: "notifications",   element: <AdminNotifications /> },
            { path: "festival-offers", element: <FestivalOfferAdmin /> },
        ]
    },

    // ─── Customer / User App ───────────────────────────────────────────────
    {
        path: "/",
        element: <App />,
        children: [
            { path: "",                element: <Home /> },
            { path: "safety-tips",     element: <SafetyTips /> },
            { path: "about-us",        element: <AboutUs /> },
            { path: "terms-and-conditions", element: <TermsAndConditions /> },
            { path: "contact-us",     element: <ContactUs /> },
            { path: "categories",      element: <ProductCategories /> },
            { path: "products",        element: <ProductCatalog /> },
            { path: "search",          element: <SearchP /> },
            { path: "login",           element: <Login /> },
            { path: "register",        element: <Register /> },
            { path: "forgot-password", element: <ForgotPassword /> },
            { path: "verification-otp",element: <OtpVerification /> },
            { path: "reset-password",  element: <ResetPassword /> },
            { path: "verify-email",    element: <VerifyEmail /> },
            { path: "shop-now",        element: <ShopNowRedirect /> },
            { path: "user-menu",       element: <UserMenuMobile /> },

            // User dashboard (profile, orders, address only)
            {
                path: "dashboard",
                element: <Dashboard />,
                children: [
                    { path: "profile",   element: <Profile /> },
                    { path: "myorders",  element: <MyOrders /> },
                    { path: "address",   element: <Address /> },
                    {
                        path: "order-details/:orderId",
                        element: <OrderDetails />
                    },
                    { path: "privacy",   element: <AccountPrivacy /> },
                ]
            },

            // Product browsing
            {
                path: ":category",
                children: [
                    { path: ":subCategory", element: <ProductList /> }
                ]
            },
            { path: "product/:product", element: <ProductDisplay /> },
            { path: "cart",             element: <CartMobile /> },
            { path: "checkout",         element: <CheckoutPage /> },
            { path: "success",          element: <Success /> },
            { path: "cancel",           element: <Cancel /> },
        ]
    },
]);

export default router