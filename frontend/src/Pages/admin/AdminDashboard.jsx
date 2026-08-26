import React, { useEffect, useState } from "react";
import { BiSolidCategory } from "react-icons/bi";
import {
  FaBoxOpen,
  FaCrown,
  FaFileAlt,
  FaPuzzlePiece,
  FaRegImage,
  FaShoppingCart,
  FaTags,
  FaUsers,
} from "react-icons/fa";
import { BsPencilSquare } from "react-icons/bs";
import { GiVerticalBanner } from "react-icons/gi";
import { LuTableOfContents } from "react-icons/lu";
import { RiCoupon2Line } from "react-icons/ri";
import { IoNotifications } from "react-icons/io5";
import { LuChartColumnDecreasing } from "react-icons/lu";
import { TbLayoutSidebar, TbLayoutSidebarRight } from "react-icons/tb";
import {
  MdCampaign,
  MdColorLens,
  MdFiberNew,
  MdOutlineSpaceBar,
  MdSettings,
} from "react-icons/md";
import { RiMenuFoldFill, RiMenuUnfoldFill } from "react-icons/ri";
import { SlNote } from "react-icons/sl";
import { useLocation, useNavigate } from "react-router-dom";
import { getRecentOrders } from "../../functions/order";
import AdminBanner from "./AdminBanner";
import AdminBrands from "./AdminBrands";
import AdminCategories from "./AdminCategories";
import AdminColorSettings from "./AdminColorSettings";
import AdminDynamicPages from "./AdminDynamicPages";
import AdminFooter from "./AdminFooter";
import AdminLogo from "./AdminLogo";
import AdminPopups from "./AdminPopups";
import AdminSubs from "./AdminSubs";
import AdminTags from "./AdminTags";
import AllOrders from "./AllOrders";
import AllProducts from "./AllProducts";
import AllUsers from "./AllUsers";
import Dashboard from "./Dashboard";
import ManualOrder from "./ManualOrder";
import MenuCategories from "./MenuCategories";
import NewOrders from "./NewOrders";
import AdminTopbarText from "./TopBar";
import Coupons from "./Coupons";
import AdminBlog from "./AdminBlog";

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedPage, setSelectedPage] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Large screens: collapse/expand sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem("adminSidebarCollapsed");
      return stored ? stored === "true" : true; // default collapsed
    } catch {
      return true; // default collapsed if storage fails
    }
  });
  const [newOrdersCount, setNewOrdersCount] = useState(1);
  // Mobile/tablet collapsible sections
  const [openSection, setOpenSection] = useState(null);
  const toggleSection = (name) =>
    setOpenSection((prev) => (prev === name ? null : name));

  useEffect(() => {
    // Priority: navigation state > URL query > localStorage
    const stateTab = location?.state?.tab;
    if (stateTab) {
      setSelectedPage(stateTab);
      try { localStorage.setItem('selectedPage', stateTab); } catch { }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const params = new URLSearchParams(location.search);
    const queryTab = params.get('tab');
    if (queryTab) {
      setSelectedPage(queryTab);
      try { localStorage.setItem('selectedPage', queryTab); } catch { }
    } else {
      const savedPage = localStorage.getItem("selectedPage");
      if (savedPage) setSelectedPage(savedPage);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("adminSidebarCollapsed", String(isSidebarCollapsed));
    } catch { }
  }, [isSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem("selectedPage", selectedPage);
  }, [selectedPage]);

  useEffect(() => {
    const fetchNewOrdersCount = async () => {
      try {
        const response = await getRecentOrders();
        setNewOrdersCount(response?.orders?.length || 0);
      } catch (error) {
        setNewOrdersCount(0);
      }
    };
    fetchNewOrdersCount();
  }, []);

  useEffect(() => {
    if (location?.pathname === "/admin/orders") {
      setSelectedPage("allOrders");
    } else if (location?.pathname === "/admin/new-orders") {
      setSelectedPage("newOrders");
    } else if (location?.pathname === "/admin/manual-order") {
      setSelectedPage("manualOrder");
    } else if (location?.pathname === "/admin/coupons") {
      setSelectedPage("coupons");
    }
  }, [location?.pathname]);

  // Removed URL auto-sync to prevent unexpected redirects; we will navigate explicitly on clicks where needed.

  const renderContent = () => {
    switch (selectedPage) {
      case "dashboard":
        return (
          <div>
            <Dashboard />
          </div>
        );
      case "logo":
        return (
          <div>
            <AdminLogo />
          </div>
        );
      case "allUsers":
        return (
          <div>
            <AllUsers />
          </div>
        );
      case "allProducts":
        return (
          <div>
            <AllProducts />
          </div>
        );
      case "allOrders":
        return (
          <div>
            <AllOrders />
          </div>
        );
      case "allCategories":
        return (
          <div>
            <AdminCategories />
          </div>
        );
      case "menuCategories":
        return (
          <div>
            <MenuCategories />
          </div>
        );
      case "adminBanner":
        return (
          <div>
            <AdminBanner />
          </div>
        );
      case "allBrands":
        return (
          <div>
            <AdminBrands />
          </div>
        );
      case "allTags":
        return (
          <div>
            <AdminTags />
          </div>
        );
      case "allSubs":
        return (
          <div>
            <AdminSubs />
          </div>
        );
      case "newOrders":
        return (
          <div>
            <NewOrders />
          </div>
        );
      case "manualOrder":
        return (
          <div>
            <ManualOrder />
          </div>
        );
      case "dynamicPages":
        return (
          <div>
            <AdminDynamicPages />
          </div>
        );
      case "topbarText":
        return (
          <div>
            <AdminTopbarText />
          </div>
        );
      case "footer":
        return (
          <div>
            <AdminFooter />
          </div>
        );
      case "colorSettings":
        return (
          <div>
            <AdminColorSettings />
          </div>
        );
      case "popups":
        return (
          <div>
            <AdminPopups />
          </div>
        );
      case "coupons":
        return (
          <div>
            <Coupons />
          </div>
        );
      case "blog":
        return (
          <div>
            <AdminBlog />
          </div>
        );
      default:
        return <div>Select a page from the navigation</div>;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full overflow-hidden">
      {/* Sidebar Toggle Button for Mobile and Tablet */}
      <button
        className="lg:hidden p-4 bg-gray-800 text-white"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <RiMenuUnfoldFill className="text-lg" />
      </button>

      {/* Sidebar */}
      <div
        className={`w-full ${isSidebarCollapsed ? "lg:w-16" : "lg:w-64"
          } bg-gray-800 z-[100] h-auto lg:h-[calc(100vh+64px)] text-white flex flex-col absolute lg:relative transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:transform-none transition-transform duration-200 ease-in-out`}
      >
        <div className="flex items-center justify-between p-4">
          <h2 className={`text-2xl font-bold ${isSidebarCollapsed ? "lg:hidden" : ""}`}>Admin Panel</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedPage("colorSettings")}
              className="lg:hidden p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
              title="Color Settings"
            >
              <MdColorLens className="text-lg" />
            </button>
            {/* Collapse toggle (large screens) */}
            <button
              onClick={() => setIsSidebarCollapsed((v) => !v)}
              className="hidden lg:flex p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? (
                <TbLayoutSidebar className="text-lg" />
              ) : (
                <TbLayoutSidebarRight className="text-lg" />
              )}
            </button>
          </div>
        </div>
        <nav className="flex flex-col gap-2 text-white">
          {/* Dashboard */}
          <button
            className={`flex items-center gap-3 py-2 px-4 text-left ${selectedPage === "dashboard"
              ? "bg-gray-700 rounded-full"
              : "hover:bg-gray-700 rounded-lg"
              }`}
            onClick={() => {
              setSelectedPage("dashboard");
              navigate('/admin-dashboard');
              setIsSidebarOpen(false);
            }}
          >
            <LuChartColumnDecreasing className="text-lg" />
            <span className={`${isSidebarCollapsed ? "lg:hidden" : ""}`}>Dashboard</span>
          </button>

          {/* Products group with hover submenu (lg+) and collapsible (mobile/tablet) */}
          <div className="relative group">
            <button
              className={`w-full flex items-center gap-3 py-2 px-4 text-left ${"hover:bg-gray-700 rounded-lg"}`}
              onClick={() => toggleSection("products")}
            >
              <FaBoxOpen className="text-lg" />
              <span className={`${isSidebarCollapsed ? "lg:hidden" : ""}`}>Products</span>
            </button>
            {/* Hover submenu for desktop */}
            <div className="absolute left-full -top-14 -ml-2 hidden lg:group-hover:block z-50">
              <div className="min-w-[220px] bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-2">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("allProducts");
                    setIsSidebarOpen(false);
                  }}
                >
                  <FaBoxOpen /> All Products
                </button>
                {/* <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("allUsers");
                    setIsSidebarOpen(false);
                  }}
                >
                  <FaUsers /> Users
                </button> */}
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("allTags");
                    setIsSidebarOpen(false);
                  }}
                >
                  <FaTags /> Tags
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("allCategories");
                    setIsSidebarOpen(false);
                  }}
                >
                  <BiSolidCategory /> Categories
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("allBrands");
                    setIsSidebarOpen(false);
                  }}
                >
                  <FaCrown /> Brands
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("allSubs");
                    setIsSidebarOpen(false);
                  }}
                >
                  <RiMenuUnfoldFill /> Subcategories
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("menuCategories");
                    setIsSidebarOpen(false);
                  }}
                >
                  <GiVerticalBanner /> Menu Categories
                </button>
              </div>
            </div>
            {/* Collapsible submenu for mobile/tablet */}
            <div className={`lg:hidden ${openSection === "products" ? "block" : "hidden"} pl-6 pt-1`}>
              <div className="flex flex-col gap-1 pb-2">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("allProducts");
                    setIsSidebarOpen(false);
                  }}
                >
                  <FaBoxOpen /> All Products
                </button>
                {/* <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("allUsers");
                    setIsSidebarOpen(false);
                  }}
                >
                  <FaUsers /> Users
                </button> */}
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("allTags");
                    setIsSidebarOpen(false);
                  }}
                >
                  <FaTags /> Tags
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("allCategories");
                    setIsSidebarOpen(false);
                  }}
                >
                  <BiSolidCategory /> Categories
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("allBrands");
                    setIsSidebarOpen(false);
                  }}
                >
                  <FaCrown /> Brands
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("allSubs");
                    setIsSidebarOpen(false);
                  }}
                >
                  <RiMenuUnfoldFill /> Subcategories
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("menuCategories");
                    setIsSidebarOpen(false);
                  }}
                >
                  <GiVerticalBanner /> Menu Categories
                </button>
              </div>
            </div>
          </div>

          {/* Keep Users standalone */}
          <button
            className={`flex items-center gap-3 py-2 px-4 text-left ${selectedPage === "allUsers"
              ? "bg-gray-700 rounded-full"
              : "hover:bg-gray-700 rounded-full"
              }`}
            onClick={() => {
              setSelectedPage("allUsers");
              setIsSidebarOpen(false);
            }}
          >
            <FaUsers className="text-lg" />
            <span className={`${isSidebarCollapsed ? "lg:hidden" : ""}`}>Users</span>
          </button>

          {/* Coupons - standalone */}
          <button
            className={`flex items-center gap-3 py-2 px-4 text-left hover:bg-gray-700 rounded-full`}
            onClick={() => {
              navigate("/admin/coupons");
              setIsSidebarOpen(false);
            }}
          >
            <RiCoupon2Line className="text-lg" />
            <span className={`${isSidebarCollapsed ? "lg:hidden" : ""}`}>Coupons</span>
          </button>
          {/* Orders group with hover submenu (lg+) and collapsible (mobile/tablet) */}
          <div className="relative group">
            <button
              className={`w-full flex items-center gap-3 py-2 px-4 text-left ${"hover:bg-gray-700 rounded-lg"}`}
              onClick={() => toggleSection("orders")}
            >
              <FaShoppingCart className="text-lg" />
              <span className={`${isSidebarCollapsed ? "lg:hidden" : ""}`}>Orders</span>
              {newOrdersCount > 0 && (
                <span className={`ml-auto bg-red-600 text-white text-xs font-bold rounded-full px-1.5 py-0.5 ${isSidebarCollapsed ? "lg:hidden" : ""}`}>
                  {newOrdersCount}
                </span>
              )}
            </button>
            {/* Hover submenu for desktop */}
            <div className="absolute left-full -top-10 -ml-2 hidden lg:group-hover:block z-50">
              <div className="min-w-[200px] bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-2">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("newOrders");
                    navigate('/admin/new-orders');
                    setIsSidebarOpen(false);
                  }}
                >
                  <MdFiberNew /> New Orders
                  {newOrdersCount > 0 && (
                    <span className="ml-auto text-xs bg-red-600 text-white rounded px-1">
                      {newOrdersCount}
                    </span>
                  )}
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("allOrders");
                    navigate('/admin/orders');
                    setIsSidebarOpen(false);
                  }}
                >
                  <FaShoppingCart /> All Orders
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("manualOrder");
                    setIsSidebarOpen(false);
                  }}
                >
                  <SlNote /> Manual Order
                </button>
              </div>
            </div>
            {/* Collapsible submenu for mobile/tablet */}
            <div className={`lg:hidden ${openSection === "orders" ? "block" : "hidden"} pl-6 pt-1`}>
              <div className="flex flex-col gap-1 pb-2">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("allOrders");
                    navigate('/admin/orders');
                    setIsSidebarOpen(false);
                  }}
                >
                  <FaShoppingCart /> All Orders
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("newOrders");
                    navigate('/admin/new-orders');
                    setIsSidebarOpen(false);
                  }}
                >
                  <MdFiberNew /> New Orders
                  {newOrdersCount > 0 && (
                    <span className="ml-auto text-xs bg-red-600 text-white rounded px-1">
                      {newOrdersCount}
                    </span>
                  )}
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("manualOrder");
                    setIsSidebarOpen(false);
                  }}
                >
                  <SlNote /> Manual Order
                </button>
              </div>
            </div>
          </div>
          {/* Customization group with hover submenu (lg+) and collapsible (mobile/tablet) */}
          <div className="relative group">
            <button
              className={`w-full flex items-center gap-3 py-2 px-4 text-left ${"hover:bg-gray-700 rounded-lg"}`}
              onClick={() => toggleSection("customize")}
            >
              <MdSettings className="text-lg" />
              <span className={`${isSidebarCollapsed ? "lg:hidden" : ""}`}>Customization</span>
            </button>
            {/* Hover submenu for desktop */}
            <div className="absolute left-full -top-40 -ml-2 hidden lg:group-hover:block z-50">
              <div className="min-w-[220px] bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-2">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("logo");
                    setIsSidebarOpen(false);
                  }}
                >
                  <FaRegImage /> Logo
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("topbarText");
                    setIsSidebarOpen(false);
                  }}
                >
                  <MdCampaign /> Topbar
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("adminBanner");
                    setIsSidebarOpen(false);
                  }}
                >
                  <GiVerticalBanner /> Banner
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    navigate("/admin/sections");
                    setIsSidebarOpen(false);
                  }}
                >
                  <FaPuzzlePiece /> Sections Editor
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("footer");
                    setIsSidebarOpen(false);
                  }}
                >
                  <MdOutlineSpaceBar /> Footer
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("colorSettings");
                    setIsSidebarOpen(false);
                  }}
                >
                  <MdColorLens /> Color Settings
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("popups");
                    setIsSidebarOpen(false);
                  }}
                >
                  <IoNotifications /> Popup
                </button>
              </div>
            </div>
            {/* Collapsible submenu for mobile/tablet */}
            <div className={`lg:hidden ${openSection === "customize" ? "block" : "hidden"} pl-6 pt-1`}>
              <div className="flex flex-col gap-1 pb-2">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("logo");
                    setIsSidebarOpen(false);
                  }}
                >
                  <FaRegImage /> Logo
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("topbarText");
                    setIsSidebarOpen(false);
                  }}
                >
                  <MdCampaign /> Topbar
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("adminBanner");
                    setIsSidebarOpen(false);
                  }}
                >
                  <GiVerticalBanner /> Banner
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    navigate("/admin/sections");
                    setIsSidebarOpen(false);
                  }}
                >
                  <FaPuzzlePiece /> Sections Editor
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("footer");
                    setIsSidebarOpen(false);
                  }}
                >
                  <MdOutlineSpaceBar /> Footer
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("colorSettings");
                    setIsSidebarOpen(false);
                  }}
                >
                  <MdColorLens /> Color Settings
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    navigate("/admin/coupons");
                    setIsSidebarOpen(false);
                  }}
                >
                  <RiCoupon2Line /> Coupons
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("popups");
                    setIsSidebarOpen(false);
                  }}
                >
                  <IoNotifications /> Popup
                </button>
              </div>
            </div>
          </div>
          <div className="relative group">
            <button
              className={`w-full flex items-center gap-3 py-2 px-4 text-left ${"hover:bg-gray-700 rounded-lg"}`}
              onClick={() => toggleSection("content")}
            >
              <LuTableOfContents className="text-lg" />
              <span className={`${isSidebarCollapsed ? "lg:hidden" : ""}`}>Content</span>
            </button>
            {/* Hover submenu for desktop */}
            <div className="absolute left-full -top-1 -ml-2 hidden lg:group-hover:block z-50">
              <div className="min-w-[220px] bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-2">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("dynamicPages");
                    setIsSidebarOpen(false);
                  }}
                >
                  <FaFileAlt /> Pages
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("blog");
                    setIsSidebarOpen(false);
                  }}
                >
                  <BsPencilSquare /> Blog
                </button>
              </div>
            </div>
            {/* Collapsible submenu for mobile/tablet */}
            <div className={`lg:hidden ${openSection === "content" ? "block" : "hidden"} pl-6 pt-1`}>
              <div className="flex flex-col gap-1 pb-2">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("dynamicPages");
                    setIsSidebarOpen(false);
                  }}
                >
                  <FaFileAlt /> Pages
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedPage("blog");
                    setIsSidebarOpen(false);
                  }}
                >
                  <BsPencilSquare /> Blog
                </button>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="w-full flex-1 p-2 lg:p-8 lg:pt-0 bg-gray-100 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
