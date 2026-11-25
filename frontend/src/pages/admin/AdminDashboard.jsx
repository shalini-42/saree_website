
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Package,
  CalendarDays,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  BarChart3,
  Award,
} from "lucide-react";

import AdminNavbar from "../../components/admin/AdminNavbar";
import api from "../../services/api";
import "./AdminDashboard.css";

const getOrdersArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.orders)) return data.orders;
  return [];
};

const getOrderTotal = (order) =>
  Number(
    order.total_amount ??
      order.total ??
      order.grand_total ??
      order.total_price ??
      order.amount ??
      0
  );

const getOrderItems = (order) =>
  order.items || order.order_items || order.orderitem_set || [];

const getOrderDate = (order) => {
  const value = order.created_at || order.order_date || order.date;
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getStatus = (order) =>
  String(order.status || "Pending").toLowerCase();

const getPaymentStatus = (order) =>
  String(order.payment_status || "").toLowerCase();

const isCancelled = (order) =>
  ["cancelled", "canceled"].includes(getStatus(order));

const isRevenueOrder = (order) =>
  !isCancelled(order) && !["refunded", "failed"].includes(getPaymentStatus(order));

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const formatDate = (value) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getCustomerName = (order) =>
  order.customer_name ||
  order.full_name ||
  order.username ||
  order.user?.username ||
  order.user?.first_name ||
  order.shipping_name ||
  "Customer";

const getOrderNumber = (order) =>
  order.order_number || order.order_id || `#${order.id}`;

const getProductName = (item) =>
  item.product_name ||
  item.name ||
  item.product?.title ||
  item.product?.name ||
  "Saree";

const getProductQuantity = (item) =>
  Number(item.quantity || 1);

const getProductImage = (item) =>
  item.product_image ||
  item.image ||
  item.product?.thumbnail ||
  item.product?.image ||
  "";

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const startOfWeek = (date) => {
  const result = startOfDay(date);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  return result;
};

const startOfMonth = (date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [chartPeriod, setChartPeriod] = useState("weekly");

  const fetchOrders = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("orders/");
      setOrders(getOrdersArray(response.data));
    } catch (err) {
      console.error("Dashboard orders error:", err);
      setError(
        err.response?.data?.detail ||
          "Unable to load dashboard data. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const revenueOrders = useMemo(
    () => orders.filter(isRevenueOrder),
    [orders]
  );

  const totalRevenue = useMemo(
    () =>
      revenueOrders.reduce(
        (total, order) => total + getOrderTotal(order),
        0
      ),
    [revenueOrders]
  );

  const deliveredOrders = orders.filter(
    (order) => getStatus(order) === "delivered"
  ).length;

  const pendingOrders = orders.filter(
    (order) => getStatus(order) === "pending"
  ).length;

  const shippedOrders = orders.filter(
    (order) => getStatus(order) === "shipped"
  ).length;

  const processingOrders = orders.filter(
    (order) => getStatus(order) === "processing"
  ).length;

  const averageOrderValue = revenueOrders.length
    ? totalRevenue / revenueOrders.length
    : 0;

  const chartData = useMemo(() => {
    const now = new Date();
    const data = [];

    if (chartPeriod === "daily") {
      for (let i = 6; i >= 0; i--) {
        const date = startOfDay(now);
        date.setDate(date.getDate() - i);

        data.push({
          key: date.toDateString(),
          label: date.toLocaleDateString("en-IN", {
            weekday: "short",
          }),
          date,
          revenue: 0,
          count: 0,
        });
      }
    } else if (chartPeriod === "weekly") {
      for (let i = 7; i >= 0; i--) {
        const date = startOfWeek(now);
        date.setDate(date.getDate() - i * 7);

        data.push({
          key: date.toDateString(),
          label: `Week ${8 - i}`,
          date,
          revenue: 0,
          count: 0,
        });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const date = new Date(
          now.getFullYear(),
          now.getMonth() - i,
          1
        );

        data.push({
          key: date.toDateString(),
          label: date.toLocaleDateString("en-IN", {
            month: "short",
          }),
          date,
          revenue: 0,
          count: 0,
        });
      }
    }

    revenueOrders.forEach((order) => {
      const orderDate = getOrderDate(order);
      if (!orderDate) return;

      let bucket;

      if (chartPeriod === "daily") {
        bucket = data.find(
          (item) =>
            item.date.toDateString() ===
            startOfDay(orderDate).toDateString()
        );
      } else if (chartPeriod === "weekly") {
        const orderWeek = startOfWeek(orderDate).toDateString();
        bucket = data.find(
          (item) => item.date.toDateString() === orderWeek
        );
      } else {
        const orderMonth = startOfMonth(orderDate).toDateString();
        bucket = data.find(
          (item) => item.date.toDateString() === orderMonth
        );
      }

      if (bucket) {
        bucket.revenue += getOrderTotal(order);
        bucket.count += 1;
      }
    });

    return data;
  }, [orders, revenueOrders, chartPeriod]);

  const maxRevenue = Math.max(
    ...chartData.map((item) => item.revenue),
    1
  );

  const bestSellingProducts = useMemo(() => {
    const products = {};

    orders.forEach((order) => {
      if (isCancelled(order)) return;

      getOrderItems(order).forEach((item) => {
        const name = getProductName(item);
        const quantity = getProductQuantity(item);
        const key = String(
          item.product?.id || item.product_id || name
        );

        if (!products[key]) {
          products[key] = {
            id: key,
            name,
            quantity: 0,
            image: getProductImage(item),
          };
        }

        products[key].quantity += quantity;
      });
    });

    return Object.values(products)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [orders]);

  const statusData = [
    { label: "Pending", count: pendingOrders, className: "pending" },
    {
      label: "Processing",
      count: processingOrders,
      className: "processing",
    },
    { label: "Shipped", count: shippedOrders, className: "shipped" },
    {
      label: "Delivered",
      count: deliveredOrders,
      className: "delivered",
    },
  ];

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => {
          const dateA = getOrderDate(a)?.getTime() || 0;
          const dateB = getOrderDate(b)?.getTime() || 0;
          return dateB - dateA;
        })
        .slice(0, 6),
    [orders]
  );

  const getStatusClass = (status) =>
    String(status || "pending")
      .toLowerCase()
      .replaceAll(" ", "-");

  return (
    <div className="ad-dashboard-page">
      <AdminNavbar />

      <main className="ad-dashboard-main">
        <section className="ad-dashboard-heading">
          <div>
            <span className="ad-eyebrow">SĀRIKA ADMINISTRATION</span>
            <h1>Sales Overview</h1>
            <p>
              Track your store performance, orders, and product sales.
            </p>
          </div>

          <button
            className="ad-refresh-button"
            onClick={() => fetchOrders(true)}
            disabled={loading || refreshing}
          >
            <RefreshCw
              size={16}
              className={refreshing ? "ad-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </section>

        {error && (
          <div className="ad-error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button onClick={() => fetchOrders(true)}>Try again</button>
          </div>
        )}

        {loading ? (
          <div className="ad-loading">
            <div className="ad-loader"></div>
            <p>Loading sales analytics...</p>
          </div>
        ) : (
          <>
            <section className="ad-stat-grid">
              <article className="ad-stat-card ad-stat-revenue">
                <div className="ad-stat-top">
                  <span>Total Revenue</span>
                  <div className="ad-stat-icon">
                    <IndianRupee size={19} />
                  </div>
                </div>
                <h2>{formatCurrency(totalRevenue)}</h2>
                <p>From {revenueOrders.length} active orders</p>
              </article>

              <article className="ad-stat-card">
                <div className="ad-stat-top">
                  <span>Total Orders</span>
                  <div className="ad-stat-icon">
                    <ShoppingBag size={19} />
                  </div>
                </div>
                <h2>{orders.length}</h2>
                <p>All customer orders</p>
              </article>

              <article className="ad-stat-card">
                <div className="ad-stat-top">
                  <span>Average Order Value</span>
                  <div className="ad-stat-icon">
                    <TrendingUp size={19} />
                  </div>
                </div>
                <h2>{formatCurrency(averageOrderValue)}</h2>
                <p>Average per active order</p>
              </article>

              <article className="ad-stat-card">
                <div className="ad-stat-top">
                  <span>Delivered Orders</span>
                  <div className="ad-stat-icon">
                    <Package size={19} />
                  </div>
                </div>
                <h2>{deliveredOrders}</h2>
                <p>Successfully delivered</p>
              </article>
            </section>

            <section className="ad-analytics-grid">
              <article className="ad-panel ad-sales-panel">
                <div className="ad-panel-heading">
                  <div>
                    <span className="ad-panel-eyebrow">
                      REVENUE PERFORMANCE
                    </span>
                    <h2>Sales Analytics</h2>
                  </div>

                  <div className="ad-period-select">
                    <CalendarDays size={15} />
                    <select
                      value={chartPeriod}
                      onChange={(e) => setChartPeriod(e.target.value)}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                <div className="ad-chart-summary">
                  <strong>{formatCurrency(totalRevenue)}</strong>
                  <span>Total recorded revenue</span>
                </div>

                <div className="ad-chart">
                  {chartData.map((item) => (
                    <div className="ad-chart-column" key={item.key}>
                      <div className="ad-chart-bar-area">
                        <span className="ad-chart-value">
                          {item.revenue > 0
                            ? formatCurrency(item.revenue)
                            : ""}
                        </span>
                        <div
                          className={`ad-chart-bar ${
                            item.revenue === 0 ? "ad-chart-bar-empty" : ""
                          }`}
                          style={{
                            height: `${
                              item.revenue > 0
                                ? Math.max(
                                    (item.revenue / maxRevenue) * 100,
                                    5
                                  )
                                : 3
                            }%`,
                          }}
                          title={`${item.label}: ${formatCurrency(
                            item.revenue
                          )}`}
                        />
                      </div>
                      <span className="ad-chart-label">{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className="ad-chart-footer">
                  <span>
                    <span className="ad-chart-dot"></span>
                    Sales revenue
                  </span>
                  <span>
                    {chartPeriod === "daily"
                      ? "Last 7 days"
                      : chartPeriod === "weekly"
                      ? "Last 8 weeks"
                      : "Last 6 months"}
                  </span>
                </div>
              </article>

              <article className="ad-panel ad-status-panel">
                <div className="ad-panel-heading">
                  <div>
                    <span className="ad-panel-eyebrow">
                      ORDER MANAGEMENT
                    </span>
                    <h2>Order Status</h2>
                  </div>
                  <div className="ad-status-total">{orders.length}</div>
                </div>

                <div className="ad-status-list">
                  {statusData.map((item) => {
                    const percentage = orders.length
                      ? (item.count / orders.length) * 100
                      : 0;

                    return (
                      <div className="ad-status-item" key={item.label}>
                        <div className="ad-status-info">
                          <span className={`ad-status-dot ${item.className}`} />
                          <span>{item.label}</span>
                          <strong>{item.count}</strong>
                        </div>
                        <div className="ad-status-track">
                          <div
                            className={`ad-status-progress ${item.className}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="ad-status-footer">
                  <div>
                    <Clock size={17} />
                    <span>Awaiting processing</span>
                  </div>
                  <strong>{pendingOrders + processingOrders}</strong>
                </div>
              </article>
            </section>

            <section className="ad-bottom-grid">
              <article className="ad-panel ad-products-panel">
                <div className="ad-panel-heading">
                  <div>
                    <span className="ad-panel-eyebrow">
                      PRODUCT PERFORMANCE
                    </span>
                    <h2>Best-Selling Sarees</h2>
                  </div>
                  <Award size={21} className="ad-heading-icon" />
                </div>

                {bestSellingProducts.length ? (
                  <div className="ad-best-sellers">
                    {bestSellingProducts.map((product, index) => (
                      <div className="ad-best-product" key={product.id}>
                        <span className="ad-product-rank">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <div className="ad-product-image">
                          {product.image ? (
                            <img
                              src={
                                product.image.startsWith("http")
                                  ? product.image
                                  : `http://127.0.0.1:8000${product.image}`
                              }
                              alt={product.name}
                            />
                          ) : (
                            <ShoppingBag size={20} />
                          )}
                        </div>

                        <div className="ad-product-info">
                          <strong>{product.name}</strong>
                          <span>{product.quantity} items sold</span>
                        </div>

                        <ArrowUpRight
                          size={17}
                          className="ad-product-arrow"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ad-empty-small">
                    <ShoppingBag size={25} />
                    <p>No product sales data available yet.</p>
                  </div>
                )}
              </article>

              <article className="ad-panel ad-quick-panel">
                <div className="ad-panel-heading">
                  <div>
                    <span className="ad-panel-eyebrow">
                      STORE ACTIVITY
                    </span>
                    <h2>Order Summary</h2>
                  </div>
                  <BarChart3 size={21} className="ad-heading-icon" />
                </div>

                <div className="ad-quick-stat">
                  <div className="ad-quick-icon pending">
                    <Clock size={18} />
                  </div>
                  <div>
                    <strong>{pendingOrders}</strong>
                    <span>Pending orders</span>
                  </div>
                </div>

                <div className="ad-quick-stat">
                  <div className="ad-quick-icon shipped">
                    <Truck size={18} />
                  </div>
                  <div>
                    <strong>{shippedOrders}</strong>
                    <span>Orders in transit</span>
                  </div>
                </div>

                <div className="ad-quick-stat">
                  <div className="ad-quick-icon delivered">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <strong>{deliveredOrders}</strong>
                    <span>Completed deliveries</span>
                  </div>
                </div>
              </article>
            </section>

            <section className="ad-panel ad-recent-panel">
              <div className="ad-panel-heading">
                <div>
                  <span className="ad-panel-eyebrow">
                    LATEST STORE ACTIVITY
                  </span>
                  <h2>Recent Orders</h2>
                </div>
                <span className="ad-recent-count">
                  {recentOrders.length} recent
                </span>
              </div>

              {recentOrders.length ? (
                <div className="ad-recent-table-wrap">
                  <table className="ad-recent-table">
                    <thead>
                      <tr>
                        <th>ORDER</th>
                        <th>CUSTOMER</th>
                        <th>DATE</th>
                        <th>AMOUNT</th>
                        <th>PAYMENT</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="ad-order-number">
                            {getOrderNumber(order)}
                          </td>
                          <td>{getCustomerName(order)}</td>
                          <td>{formatDate(getOrderDate(order))}</td>
                          <td className="ad-order-amount">
                            {formatCurrency(getOrderTotal(order))}
                          </td>
                          <td>
                            <span
                              className={`ad-payment-badge ${getStatusClass(
                                order.payment_status || "pending"
                              )}`}
                            >
                              {order.payment_status || "Pending"}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`ad-order-badge ${getStatusClass(
                                order.status
                              )}`}
                            >
                              {order.status || "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="ad-empty-small">
                  <Package size={25} />
                  <p>No orders have been placed yet.</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
