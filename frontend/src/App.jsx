import { lazy, Suspense, useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import DynamicPage from './Pages/DynamicPage';
import NotFound from "./Pages/NotFound";
import AdminRoute from "./components/AdminRoute";
import MetaPixelTracker from './components/MetaPixelTracker';
import Navbar from "./components/Navbar";
import CategoryBarSection from "./components/CategoryBarSection";
import Popup from "./components/Popup";
import { getUserAPI } from "./functions/auth";
import { recordVisit } from "./functions/traffic";
import { setUser } from "./store/authSlice";
import { Analytics } from "@vercel/analytics/react";



const Home = lazy(() => import("./Pages/Home"));
const Signup = lazy(() => import("./Pages/Signup"));
const ProductsBySub = lazy(() => import('./Pages/product/ProductsBySub'))
const ProductsByBrand = lazy(() => import('./Pages/product/ProductsByBrand'))
const Login = lazy(() => import("./Pages/Login"));
const CategoryPage = lazy(() => import("./Pages/CategoryPage"));
const SingleProduct = lazy(() => import("./Pages/product/SingleProduct"));
const Cart = lazy(() => import("./Pages/Cart"));
const Checkout = lazy(() => import("./Pages/Checkout"));
const Shop = lazy(() => import("./Pages/Shop"));
const Search = lazy(() => import("./Pages/Search"));
const History = lazy(() => import("./Pages/user/History"));
const AdminDashboard = lazy(() => import("./Pages/admin/AdminDashboard"));
const AllOrders = lazy(() => import("./Pages/admin/AllOrders"));
const AdminSections = lazy(() => import("./Pages/admin/AdminSections"));
const CreateProduct = lazy(() => import("./Pages/admin/CreateProduct"));
const EditProduct = lazy(() => import("./Pages/admin/EditProduct"));
const AdminUsers = lazy(() => import("./Pages/admin/AdminUsers"));
const AdminColorSettings = lazy(() => import("./Pages/admin/AdminColorSettings"));
const OrderDetails = lazy(() => import("./Pages/admin/OrderDetails"));
const NewOrders = lazy(() => import("./Pages/admin/NewOrders"));
const Footer = lazy(() => import("./components/Footer"));
const ManualOrder = lazy(() => import('./Pages/admin/ManualOrder'));
const Coupons = lazy(() => import('./Pages/admin/Coupons'));
const Blog = lazy(() => import('./Pages/Blog'));
const BlogPost = lazy(() => import('./Pages/BlogPost'));

const App = () => {
  const navigateTo = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation(); // Get current route
  const { user } = useSelector((state) => state.auth);
  // console.log("Current User---->", user?.username);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await getUserAPI();
        dispatch(setUser(response?.user));
      } catch (error) {
        // console.log("Error fetching user", error);
        if (window.location.pathname !== "/signup") {
          navigateTo("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [dispatch, navigateTo]);

  // Notify index.html splash to hide when app is ready
  useEffect(() => {
    if (!loading) {
      window.dispatchEvent(new Event('app-ready'));
    }
  }, [loading]);



  // Record visit on route changes (immediate)
  useEffect(() => {
    const path = location.pathname + (location.search || "");
    recordVisit({ path });
  }, [location.pathname, location.search]);

  if (loading) {
    return (
      <div className="w-screen h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-b-primary border-t-secondary opacity-90"></div>
      </div>
    );
  }

  // List of pages where Navbar should be hidden
  const hiddenNavbarRoutes = ["/signup", "/login","/cart/checkout"];
  const shouldHideNavbar = hiddenNavbarRoutes.includes(location.pathname);

  return (
    <>
      <MetaPixelTracker />
      
      {/* DEV PREVIEW BANNER - Remove this before production */}
      {window.location.hostname.includes('dev--') && (
        <div className="bg-yellow-400 text-black text-center py-2 font-bold">
          🚧 DEV PREVIEW - Testing Changes 🚧
        </div>
      )}
      
      <div className="flex flex-col">
        {/* Conditionally render Navbar and Category Bar */}
        {!shouldHideNavbar && (
          <>
            <Navbar />
            <CategoryBarSection />
          </>
        )}
        
        {/* Popup Component - appears on all pages */}
        <Popup />

        <Suspense
          fallback={
            <div className="w-screen h-screen flex justify-center items-center">
              <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-secondary opacity-90"></div>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={!user ? <Signup /> : <Home />} />
            <Route path="/login" element={!user ? <Login /> : <Home />} />
            <Route path="/product/:slug" element={<SingleProduct />} />
            <Route path="/cart" element={<Cart />} />

            {/* Protected Routes for Logged-in Users */}
            <Route >
              <Route path="/cart/checkout" element={<Checkout />} />
              <Route path="/order-history" element={<History />} />
            </Route>

            <Route path="/shop" element={<Shop />} />
            <Route path="/search" element={<Search />} />
            <Route path="/category/:categorySlug/subcategory/:subcategorySlug" element={<ProductsBySub />} />
            <Route path="/category/:categorySlug" element={<CategoryPage />} />
            <Route path="/brand/:brandSlug" element={<ProductsByBrand />} />
            <Route path="/blogs" element={<Blog />} />
            <Route path="/blogs/:slug" element={<BlogPost />} />

            {/* Protected Routes for Admin Only */}
            <Route element={<AdminRoute />}>
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/admin/orders" element={<AllOrders />} />
              <Route path="/admin/new-orders" element={<NewOrders />} />
              <Route path="/admin/sections" element={<AdminSections />} />
              <Route path="/add-product" element={<CreateProduct />} />
              <Route path="/edit-product/:slug" element={<EditProduct />} />
              <Route path="/admin-users" element={<AdminUsers />} />
              <Route path="/admin-color-settings" element={<AdminColorSettings />} />
              <Route path="/admin/orders/:orderId" element={<OrderDetails />} />
              <Route path="/admin/manual-order" element={<ManualOrder />} />
              <Route path="/admin/coupons" element={<Coupons />} />
            </Route>

            {/* Direct access to color settings for admins */}
            <Route path="/color-settings" element={<AdminColorSettings />} />

            <Route path="/:slug" element={<DynamicPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              zIndex: 10020, // Higher than WriteReviewModal z-index (10006)
            },
          }}
        />
      </div>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
      <Analytics />
    </>
  );
};

export default App;
