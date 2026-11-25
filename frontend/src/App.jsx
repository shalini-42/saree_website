
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

// Customer components
import UserNavbar from "./components/user/UserNavbar";
import UserFooter from "./components/user/UserFooter";

// Customer pages
import Home from "./pages/user/Home";
import Shop from "./pages/user/Shop";

// Admin pages
import Login from "./pages/Login";
import AdminWelcome from "./pages/admin/AdminWelcome";
import AdminProducts from "./pages/admin/AdminProducts";
import AddProduct from "./pages/admin/AddProduct";
import EditProduct from "./pages/admin/EditProduct";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminSignup from "./pages/admin/AdminSignup";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminNavbar from "./components/admin/AdminNavbar";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminProductDetails from "./pages/admin/AdminProductDetails";
import ProductDetails from "./pages/user/ProductDetails";
import Cart from "./pages/user/Cart";
import CustomerLogin from "./pages/user/Login";
import CustomerRegister from "./pages/user/CustomerRegister";
import Checkout from "./pages/user/Checkout";
import MyOrders from "./pages/user/MyOrders";
import OrderDetails from "./pages/user/OrderDetails";
import Profile from "./pages/user/Profile";
import ChangePassword from "./pages/user/ChangePassword";
import ForgotPassword from "./pages/user/ForgotPassword";
import Wishlist from "./pages/user/Wishlist";
import AdminReturnExchange from "./pages/admin/AdminReturnExchange";
import MyReturns from "./pages/user/MyReturns";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminSettings from "./pages/admin/AdminSettings";
import Contact from "./pages/user/Contact";
import AdminContactMessages from "./pages/admin/AdminContactMessages";

// Customer layout
function UserLayout() {
  return (
    <>
      <UserNavbar />
      <Outlet />
      <UserFooter />
    </>
  );
}

// Temporary page for customer features
function ComingSoon({ title }) {
  return (
    <div
      style={{
        minHeight: "65vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "#fbf8f2",
        color: "#592536",
        textAlign: "center",
        padding: "40px 20px",
      }}
    >
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: "42px" }}>
        {title}
      </h1>

      <p style={{ color: "#8b796c" }}>
        Something beautiful is being prepared for you.
      </p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* CUSTOMER WEBSITE */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetails/>}/>

          {/* REAL SHOP PAGE */}
          <Route path="/shop" element={<Shop />} />

          <Route path="/cart" element={<Cart/>}/>
          <Route path="/checkout" element={<Checkout/>}/>

          <Route path="/my-orders" element={<MyOrders/>}/>

         <Route path="/profile" element={<Profile/>}/>

         <Route
  path="/change-password"
  element={<ChangePassword/>}/>

          <Route path="/my-orders/:id" element={<OrderDetails/>}/>
<Route
  path="/customer/forgot-password"
  element={<ForgotPassword/>}/>
         <Route
  path="/customer/login"
  element={<CustomerLogin/>}/>
        </Route>
<Route
  path="/customer/register"
  element={<CustomerRegister/>}/>
  <Route path="/wishlist" element={<Wishlist/>}/>
   <Route path="/contact" element={<Contact/>}/>

        {/* ADMIN WELCOME */}
        <Route path="/admin" element={<AdminWelcome />} />
        <Route path="/admin/welcome" element={<AdminWelcome />} />

        {/* ADMIN AUTHENTICATION */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/signup" element={<AdminSignup />} />

        {/* ADMIN DASHBOARD */}
        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="/admin/navbar"
          element={<AdminNavbar />}
        />

        {/* ADMIN PRODUCTS */}
        <Route
          path="/admin/products"
          element={<AdminProducts />}
        />

        <Route
          path="/admin/products/add"
          element={<AddProduct />}
        />

        <Route
          path="/admin/products/edit/:id"
          element={<EditProduct />}
        />

        <Route
          path="/admin/products/:id"
          element={<AdminProductDetails />}
        />

        {/* ADMIN CATEGORIES */}
        <Route
          path="/admin/categories"
          element={<AdminCategories />}
        />

        {/* ADMIN ORDERS */}
        <Route
          path="/admin/orders"
          element={<AdminOrders />}
        />

        {/* ADMIN USERS */}
        <Route
          path="/admin/users"
          element={<AdminUsers />}
        />

        {/* ADMIN ANALYTICS */}
        <Route
          path="/admin/analytics"
          element={<AdminAnalytics />}
        />

        {/* UNKNOWN ROUTES */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

        <Route
  path="/admin/return-exchanges"
  element={<AdminReturnExchange/>}/>

  <Route path="/my-returns" element={<MyReturns/>}/>
  <Route
  path="/admin/customers"
  element={<AdminCustomers/>}/>

  <Route
  path="/admin/reviews"
  element={<AdminReviews/>}/>

  <Route
  path="/admin/settings"
  element={<AdminSettings/>}/>

  <Route
  path="/admin/contact-messages"
  element={<AdminContactMessages/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
