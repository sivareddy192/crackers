const rawBaseURL =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BASE_URL ||
    import.meta.env.VITE_CONFIG_URL ||
    import.meta.env.CONFIG_URL ||
    "http://localhost:8088";

export const baseURL = rawBaseURL ? rawBaseURL.trim().replace(/\/+$/, "") : "";
const SummaryApi = {
    register : {
        url : 'api/user/register',
        method : 'post'
    },
    login:{
        url : 'api/user/login',
        method:"post"
    },
    verifyEmail : {
        url : 'api/user/verify-email',
        method : 'post'
    },
    forgot_password:{
        url:'api/user/forgot-password',
        method:"put"
    },
    forgot_password_otp_verification : {
        url : 'api/user/verify-forgot-password-otp',
        method : 'put'
    },
    resetPassword : {
        url : "/api/user/reset-password",
        method : 'put'
    },
    refreshToken : {
        url : 'api/user/refresh-token',
        method : 'post'
    },
    userDetails : {
        url : '/api/user/details',
        method : "get"
    },
    logout:{
        url:'/api/user/logout',
        method:'post'
    },
    uploadAvatar : {
        url : "/api/user/upload-avatar",
        method : 'put'
    },
    updateUserDetails : {
        url : '/api/user/update-user',
        method : 'put'
    },
    uploadcategory : {
        url : '/api/category/upload-category',
        method : 'post'
    },
    uploadImage: {
        url: '/api/file/upload',
        method: "post",
    },
    uploadVideo: {
        url: '/api/file/upload-video',
        method: "post",
    },
    getCategory : {
        url : '/api/category/get',
        method : 'get'
    },
    updateCategory : {
        url : '/api/category/update',
        method : 'put'
    },
    deleteCategory : {
        url : '/api/category/delete',
        method : 'delete'
    },
    createSubCategory : {
        url : '/api/subcategory/create',
        method : 'post'
    },
    getSubCategory : {
        url : '/api/subcategory/get',
        method : 'post'
    },
    updateSubCategory : {
        url : '/api/subcategory/update',
        method : 'put'
    },
    deleteSubCategory : {
        url : '/api/subcategory/delete',
        method : 'delete'
    },
    createProduct : {
        url : '/api/product/create',
        method : 'post'
    },
    getProduct : {
        url : '/api/product/get',
        method : 'post'
    },
    getProductByCategory : {
        url : '/api/product/get-product-by-category',
        method : 'post'
    },
    getProductByCategoryAndSubCategory : {
        url : '/api/product/get-product-by-category-and-subcategory',
        method : 'post'
    },
    getProductDetails : {
        url : '/api/product/get-product-details',
        method : 'post'
    },
    updateProductDetails : {
        url : "/api/product/update-product-details",
        method : 'put'
    },
    deleteProduct : {
        url : "/api/product/delete-product",
        method : 'delete'
    },
    searchProduct : {
        url : '/api/product/search-product',
        method : 'post'
    },
    product_offers : {
        url : '/api/product/get-offers',
        method : 'get'
    },
    addTocart: {
        url: "/api/cart/create",
        method: "post"
    },
    getCartItem: { 
        url: "/api/cart/get",
        method: "get"
    },
    updateCartItemQty : {
        url : '/api/cart/update-qty',
        method : 'put'
    },
    deleteCartItem : {
        url : '/api/cart/delete-cart-item',
        method : 'delete'
    },
    createAddress : {
        url : '/api/address/create',
        method : 'post'
    },
    getAddress : {
        url : '/api/address/get',
        method : 'get'
    },

    updateAddress : {
        url : '/api/address/update',
        method : 'put'
    },
    disableAddress : {
        url : '/api/address/disable',
        method : 'delete'
    },
    CashOnDeliveryOrder : {
        url : "/api/order/cash-on-delivery",
        method : 'post'
    },
    payment_url : {
        url : "/api/order/checkout",
        method : 'post'
    },
    verify_payment: {
        url: "/api/order/verify-payment",
        method: "post"
    },
    cart: {
    reorder: {
      url: "/api/order/reorder",
      method: "post",
    },
  },
    order: {
        cod: {
            url: "/api/order/cod",
            method: "post"
        },
        reorder: {
            url: "/api/order/reorder",
            method: "post"
        },
        getOrders: {
            url: "/api/order/my-orders",
            method: "get"
        },
        cancelOrder: {
            url: "/api/order/cancel/:orderId",
            method: "put"
        },
        deleteOrder: {
            url: "/api/order/delete/:id",
            method: "delete"
        },
        assignOrder: {
            url: "/api/order/assign",
            method: "post"
        },
        scanAssignOrder: {
            url: "/api/order/scan-assign",
            method: "post"
        },
        getOrderItems: {
            url: "/api/order/order-items",
            method: "get"
        }
    },

    deliveryBoy: {
        getDeliveryBoys: {
            url: "/api/delivery-boy/get-delivery-boys",
            method: "get"
        },
        sendOtp: {
            url: "/api/delivery-boy/send-otp",
            method: "post"
        },
        verifyOtp: {
            url: "/api/delivery-boy/verify-otp",
            method: "post"
        }
    },

    admin: {
    getOrders: {
        url: "/api/admin/orders",
        method: "get",
    },

    updateOrderStatus: {
        url: "/api/admin/orders",
        method: "put",
    },
    getStats: {
        url: "/api/admin/stats",
        method: "get",
    },
    },
    
    coupon_list: {
    url: "/api/coupon/all",
    method: "get"
  },

  // Create Coupon (Admin)
  coupon_create: {
    url: "/api/coupon/create",
    method: "post"
  },

  // Update Coupon (Admin)
  coupon_update: (id) => ({
    url: `/api/coupon/update/${id}`,
    method: "put"
  }),

  // Delete Coupon (Admin)
  coupon_delete: (id) => ({
    url: `/api/coupon/delete/${id}`,
    method: "delete"
  }),

  coupon_send_email: {
    url: "/api/coupon/send-offer-email",
    method: "post"
  },

  /* ------------------------------------------
      APPLY COUPON DURING CHECKOUT
  ------------------------------------------- */
  coupon_apply: {
    url: "/api/coupon/apply",
    method: "post"
  },
    addBanner : {
        url : '/api/banner/add-banner',
        method : 'post'
    },
    getBanner : {
        url : '/api/banner/get',
        method : 'get'
    },
    updateBanner : {
        url : '/api/banner/update-banner',
        method : 'put'
    },
    deleteBanner : {
        url : '/api/banner/delete-banner',
        method : 'delete'
    },
    all_users : {
        url : '/api/user/all-users',
        method : 'get'
    },
    update_user_role : {
        url : '/api/user/update-role',
        method : 'put'
    },
    admin_update_user : {
        url : '/api/user/admin-update-user',
        method : 'put'
    },
    delete_user : {
        url : '/api/user/delete-user',
        method : 'delete'
    },
    request_delete : {
        url : '/api/user/request-delete',
        method : 'put'
    },
    review_add : {
        url : '/api/review/add',
        method : 'post'
    },
    review_get : (productId) => ({
        url : `/api/review/get/${productId}`,
        method : 'get'
    }),
    review_get_all : {
        url : '/api/review/get-all',
        method : 'get'
    },
    review_update : {
        url : '/api/review/update',
        method : 'put'
    },
    review_delete : {
        url : '/api/review/delete',
        method : 'delete'
    },
    notification : {
        get : {
            url : '/api/notification/get',
            method : 'get'
        },
        markRead : {
            url : '/api/notification/mark-read',
            method : 'put'
        },
        markAllRead : {
            url : '/api/notification/mark-all-read',
            method : 'put'
        },
        delete : {
            url : '/api/notification/delete',
            method : 'delete'
        }
    },
    festivalOffer : {
        add : {
            url : '/api/festival-offer/add',
            method : 'post'
        },
        get : {
            url : '/api/festival-offer/get',
            method : 'get'
        },
        update : {
            url : '/api/festival-offer/update',
            method : 'put'
        },
        delete : {
            url : '/api/festival-offer/delete',
            method : 'delete'
        },
        sendBlast : {
            url : '/api/festival-offer/send-blast',
            method : 'post'
        }
    }
}

export default SummaryApi