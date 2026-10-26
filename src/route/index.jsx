import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home";
const SearchP = lazy(() => import("../pages/SearchP"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const OtpVerification = lazy(() => import("../pages/OtpVerification"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));
const UserMenuMobile = lazy(() => import("../pages/UserMenuMobile"));
const Dashboard = lazy(() => import("../admin/Dashboard"));
const Profile = lazy(() => import("../pages/Profile"));
const MyOrders = lazy(() => import("../pages/MyOrders"));
const Address = lazy(() => import("../pages/Address"));
const ProductList = lazy(() => import("../pages/ProductList"));
const ProductCatalog = lazy(() => import("../pages/ProductCatalog"));
const ProductCategories = lazy(() => import("../pages/ProductCategories"));
const ProductDisplay = lazy(() => import("../pages/ProductDisplay"));
const CartMobile = lazy(() => import("../pages/CartMobile"));
const CheckoutPage = lazy(() => import("../pages/CheckoutPage"));
const Success = lazy(() => import("../pages/Success"));
const Cancel = lazy(() => import("../pages/Cancel"));
const OrderDetails = lazy(() => import("../pages/OrderDetails"));
const VerifyEmail = lazy(() => import("../pages/VerifyEmail"));
const AccountPrivacy = lazy(() => import("../pages/AccountPrivacy"));
const ShopNowRedirect = lazy(() => import("../pages/ShopNowRedirect"));
const SafetyTips = lazy(() => import("../pages/SafetyTips"));
const AboutUs = lazy(() => import("../pages/AboutUs"));
const TermsAndConditions = lazy(() => import("../pages/TermsAndConditions"));
const ContactUs = lazy(() => import("../pages/ContactUs"));

const DeliveryBoyDashboard = lazy(() => import("../pages/DeliveryBoyDashboard"));
const DeliveryLayout = lazy(() => import("../components/DeliveryLayout"));
const DeliveryNotifications = lazy(() => import("../pages/DeliveryNotifications"));
const DeliveryOrderDetails = lazy(() => import("../pages/DeliveryOrderDetails"));

const AdminLayout = lazy(() => import("../components/AdminLayout"));
const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));
const Category = lazy(() => import("../pages/Category"));
const SubCategory = lazy(() => import("../pages/SubCategory"));
const UploadProduct = lazy(() => import("../pages/UploadProduct"));
const ProductAdmin = lazy(() => import("../pages/ProductAdmin"));
const AdminOrders = lazy(() => import("../pages/AdminOrders"));
const BannerAdmin = lazy(() => import("../pages/BannerAdmin"));
const ManageUsers = lazy(() => import("../pages/ManageUsers"));
const Coupons = lazy(() => import("../pages/Coupon"));
const AdminReviews = lazy(() => import("../pages/AdminReviews"));
const AdminNotifications = lazy(() => import("../pages/AdminNotifications"));
const AdminOrderDetails = lazy(() => import("../pages/AdminOrderDetails"));
const FestivalOfferAdmin = lazy(() => import("../pages/FestivalOfferAdmin"));

const router = createBrowserRouter([
    {
        path: "delivery-portal",
        element: <DeliveryLayout />,
        children: [
            { path: "dashboard", element: <DeliveryBoyDashboard /> },
            { path: "notifications", element: <DeliveryNotifications /> },
            { path: "order/:orderId", element: <DeliveryOrderDetails /> }
        ]
    },

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