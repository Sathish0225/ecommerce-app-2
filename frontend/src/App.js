import React, { useState, useEffect, createContext, useContext } from "react";
import "./App.css";

// Context for authentication
const AuthContext = createContext();
const CartContext = createContext();

// Custom hooks
const useAuth = () => useContext(AuthContext);
const useCart = () => useContext(CartContext);

// API base URL
const API_BASE_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";

// API helper functions
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  if (config.body && typeof config.body === "object") {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "API request failed");
  }

  return response.json();
};

// Components
const Header = ({ currentView, setCurrentView }) => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1
              className="text-2xl font-bold text-gray-900 cursor-pointer"
              onClick={() => setCurrentView("home")}
            >
              TechHub
            </h1>
          </div>

          <nav className="hidden md:flex space-x-8">
            <button
              onClick={() => setCurrentView("home")}
              className={`${
                currentView === "home" ? "text-blue-600" : "text-gray-700"
              } hover:text-blue-600 transition-colors`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentView("products")}
              className={`${
                currentView === "products" ? "text-blue-600" : "text-gray-700"
              } hover:text-blue-600 transition-colors`}
            >
              Products
            </button>
            {user && user.role === "admin" && (
              <button
                onClick={() => setCurrentView("admin")}
                className={`${
                  currentView === "admin" ? "text-blue-600" : "text-gray-700"
                } hover:text-blue-600 transition-colors`}
              >
                Admin
              </button>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView("cart")}
              className={`relative p-2 ${
                currentView === "cart" ? "text-blue-600" : "text-gray-700"
              } hover:text-blue-600 transition-colors`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m2.6 8L6 3H4m3 10v6a1 1 0 001 1h8a1 1 0 001-1v-6M9 19h.01M17 19h.01"
                />
              </svg>
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Hi, {user.name}</span>
                {user.role === "admin" && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    Admin
                  </span>
                )}
                <button
                  onClick={() => setCurrentView("orders")}
                  className={`${
                    currentView === "orders" ? "text-blue-600" : "text-gray-700"
                  } hover:text-blue-600 transition-colors`}
                >
                  Orders
                </button>
                <button
                  onClick={logout}
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentView("login")}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const HeroSection = ({ setCurrentView }) => {
  return (
    <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to TechHub
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Discover the latest in technology. From smartphones to laptops, we
            have everything you need.
          </p>
          <button
            onClick={() => setCurrentView("products")}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Shop Now
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product, onAddToCart }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      await onAddToCart(product.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <img
        src={product.image_url}
        alt={product.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {product.name}
        </h3>
        <p className="text-gray-600 mb-4 text-sm line-clamp-2">
          {product.description}
        </p>
        <div className="flex justify-between items-center mb-2">
          <span className="text-2xl font-bold text-blue-600">
            ${product.price}
          </span>
          <span className="text-sm text-gray-500">Stock: {product.stock}</span>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={isLoading || product.stock === 0}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading
            ? "Adding..."
            : product.stock === 0
            ? "Out of Stock"
            : "Add to Cart"}
        </button>
      </div>
    </div>
  );
};

const ProductsView = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [selectedCategory, searchTerm]);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      if (searchTerm) params.append("search", searchTerm);

      const data = await apiCall(`/api/products?${params}`);
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await apiCall("/api/categories");
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Products</h2>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={addToCart}
          />
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found.</p>
        </div>
      )}
    </div>
  );
};

const CartView = () => {
  const { cartItems, updateCartItem, removeFromCart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  const total = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await apiCall("/api/orders", { method: "POST" });
      alert(`Order placed successfully! Order ID: ${response.order_id}`);
      clearCart();
    } catch (error) {
      alert("Error placing order: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Cart</h2>
          <p className="text-gray-500 text-lg mb-8">Your cart is empty</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h2>

      <div className="bg-white rounded-lg shadow-md p-6">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center py-4 border-b border-gray-200 last:border-b-0"
          >
            <img
              src={item.product.image_url}
              alt={item.product.name}
              className="w-16 h-16 object-cover rounded-md mr-4"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {item.product.name}
              </h3>
              <p className="text-gray-600">${item.product.price}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => updateCartItem(item.id, item.quantity - 1)}
                className="p-1 rounded-md hover:bg-gray-100"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
              </button>
              <span className="w-8 text-center">{item.quantity}</span>
              <button
                onClick={() => updateCartItem(item.id, item.quantity + 1)}
                className="p-1 rounded-md hover:bg-gray-100"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </button>
              <button
                onClick={() => removeFromCart(item.id)}
                className="p-1 text-red-500 hover:bg-red-50 rounded-md ml-4"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
            <div className="text-right ml-4">
              <p className="font-semibold">
                ${(item.product.price * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-semibold">
              Total: ${total.toFixed(2)}
            </span>
            <button
              onClick={() => clearCart()}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              Clear Cart
            </button>
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-3 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Processing..." : "Checkout"}
          </button>
        </div>
      </div>
    </div>
  );
};

const LoginView = ({ setCurrentView }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const data = await apiCall(endpoint, {
        method: "POST",
        body: formData,
      });

      login(data.token, data.user);
      setCurrentView("home");
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isLogin ? "Login" : "Sign Up"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <p className="text-center mt-4 text-gray-600">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-500 hover:text-blue-700 ml-1"
          >
            {isLogin ? "Sign up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
};

const OrdersView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await apiCall("/api/orders");
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Your Orders</h2>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Order #{order.id.slice(-8)}
                  </h3>
                  <p className="text-gray-600">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-blue-600">
                    ${order.total_amount.toFixed(2)}
                  </p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm ${
                      order.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : order.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2"
                  >
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>${item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AdminView = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    category: "",
    stock: "",
    specifications: {},
  });

  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchDashboardData();
    } else if (activeTab === "products") {
      fetchProducts();
    } else if (activeTab === "orders") {
      fetchOrders();
    } else if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await apiCall("/api/admin/dashboard");
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await apiCall("/api/products");
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await apiCall("/api/admin/orders");
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiCall("/api/admin/users");
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products";
      const method = editingProduct ? "PUT" : "POST";

      await apiCall(endpoint, {
        method,
        body: {
          ...productForm,
          price: parseFloat(productForm.price),
          stock: parseInt(productForm.stock),
        },
      });

      alert(
        editingProduct
          ? "Product updated successfully!"
          : "Product created successfully!"
      );
      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm({
        name: "",
        description: "",
        price: "",
        image_url: "",
        category: "",
        stock: "",
        specifications: {},
      });
      fetchProducts();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image_url: product.image_url,
      category: product.category,
      stock: product.stock.toString(),
      specifications: product.specifications || {},
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await apiCall(`/api/admin/products/${productId}`, { method: "DELETE" });
        alert("Product deleted successfully!");
        fetchProducts();
      } catch (error) {
        alert("Error deleting product: " + error.message);
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await apiCall(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        body: { status },
      });
      alert("Order status updated successfully!");
      fetchOrders();
    } catch (error) {
      alert("Error updating order status: " + error.message);
    }
  };

  const renderDashboard = () => {
    if (!dashboardData) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600">
              {dashboardData.total_users}
            </p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900">
              Total Products
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {dashboardData.total_products}
            </p>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-900">
              Total Orders
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {dashboardData.total_orders}
            </p>
          </div>
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-900">
              Total Revenue
            </h3>
            <p className="text-3xl font-bold text-yellow-600">
              ${dashboardData.total_revenue.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
            <div className="space-y-3">
              {dashboardData.recent_orders.map((order) => (
                <div
                  key={order.id}
                  className="flex justify-between items-center py-2 border-b"
                >
                  <div>
                    <p className="font-medium">#{order.id.slice(-8)}</p>
                    <p className="text-sm text-gray-600">{order.user_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${order.total_amount.toFixed(2)}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        order.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Low Stock Products</h3>
            <div className="space-y-3">
              {dashboardData.low_stock_products.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center py-2 border-b"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.category}</p>
                  </div>
                  <span className="text-red-600 font-semibold">
                    {product.stock} left
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Product Management</h3>
        <button
          onClick={() => setShowProductForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Add Product
        </button>
      </div>

      {showProductForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-semibold mb-4">
            {editingProduct ? "Edit Product" : "Add New Product"}
          </h4>
          <form
            onSubmit={handleProductSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <input
              type="text"
              placeholder="Product Name"
              value={productForm.name}
              onChange={(e) =>
                setProductForm({ ...productForm, name: e.target.value })
              }
              className="px-4 py-2 border rounded-md"
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Price"
              value={productForm.price}
              onChange={(e) =>
                setProductForm({ ...productForm, price: e.target.value })
              }
              className="px-4 py-2 border rounded-md"
              required
            />
            <input
              type="text"
              placeholder="Category"
              value={productForm.category}
              onChange={(e) =>
                setProductForm({ ...productForm, category: e.target.value })
              }
              className="px-4 py-2 border rounded-md"
              required
            />
            <input
              type="number"
              placeholder="Stock"
              value={productForm.stock}
              onChange={(e) =>
                setProductForm({ ...productForm, stock: e.target.value })
              }
              className="px-4 py-2 border rounded-md"
              required
            />
            <input
              type="url"
              placeholder="Image URL"
              value={productForm.image_url}
              onChange={(e) =>
                setProductForm({ ...productForm, image_url: e.target.value })
              }
              className="px-4 py-2 border rounded-md col-span-2"
              required
            />
            <textarea
              placeholder="Description"
              value={productForm.description}
              onChange={(e) =>
                setProductForm({ ...productForm, description: e.target.value })
              }
              className="px-4 py-2 border rounded-md col-span-2"
              rows="3"
              required
            />
            <div className="col-span-2 flex space-x-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                {editingProduct ? "Update Product" : "Add Product"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProductForm(false);
                  setEditingProduct(null);
                  setProductForm({
                    name: "",
                    description: "",
                    price: "",
                    image_url: "",
                    category: "",
                    stock: "",
                    specifications: {},
                  });
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      className="h-10 w-10 rounded-md object-cover"
                      src={product.image_url}
                      alt={product.name}
                    />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${product.price}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.stock}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Order Management</h3>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                  #{order.id.slice(-8)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div className="font-medium">{order.user_name}</div>
                    <div className="text-gray-500">{order.user_email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${order.total_amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : order.status === "processing"
                        ? "bg-blue-100 text-blue-800"
                        : order.status === "shipped"
                        ? "bg-purple-100 text-purple-800"
                        : order.status === "delivered"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleUpdateOrderStatus(order.id, e.target.value)
                    }
                    className="border rounded px-2 py-1 text-xs"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">User Management</h3>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === "admin"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h2>

      <div className="mb-8">
        <nav className="flex space-x-8">
          {["dashboard", "products", "orders", "users"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm capitalize`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div>
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "products" && renderProducts()}
          {activeTab === "orders" && renderOrders()}
          {activeTab === "users" && renderUsers()}
        </div>
      )}
    </div>
  );
};

// Context Providers
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await apiCall("/api/auth/me");
      setUser(userData);
    } catch (error) {
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const login = (token, userData) => {
    localStorage.setItem("token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCartItems([]);
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      const data = await apiCall("/api/cart");
      setCartItems(data);
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      alert("Please login to add items to cart");
      return;
    }

    try {
      await apiCall("/api/cart/add", {
        method: "POST",
        body: { product_id: productId, quantity },
      });
      fetchCart();
    } catch (error) {
      alert("Error adding to cart: " + error.message);
    }
  };

  const updateCartItem = async (cartItemId, quantity) => {
    try {
      await apiCall(`/api/cart/${cartItemId}`, {
        method: "PUT",
        body: { quantity },
      });
      fetchCart();
    } catch (error) {
      alert("Error updating cart: " + error.message);
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await apiCall(`/api/cart/${cartItemId}`, {
        method: "DELETE",
      });
      fetchCart();
    } catch (error) {
      alert("Error removing from cart: " + error.message);
    }
  };

  const clearCart = async () => {
    try {
      await apiCall("/api/cart", {
        method: "DELETE",
      });
      setCartItems([]);
    } catch (error) {
      alert("Error clearing cart: " + error.message);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Main App Component
const App = () => {
  const [currentView, setCurrentView] = useState("home");

  const renderView = () => {
    switch (currentView) {
      case "products":
        return <ProductsView />;
      case "cart":
        return <CartView />;
      case "login":
        return <LoginView setCurrentView={setCurrentView} />;
      case "orders":
        return <OrdersView />;
      case "admin":
        return <AdminView />;
      default:
        return (
          <>
            <HeroSection setCurrentView={setCurrentView} />
            <div className="py-16">
              <ProductsView />
            </div>
          </>
        );
    }
  };

  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen bg-gray-50">
          <Header currentView={currentView} setCurrentView={setCurrentView} />
          <main>{renderView()}</main>
        </div>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
