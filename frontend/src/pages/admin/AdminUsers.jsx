import { useEffect, useState } from "react";
import {
  Search,
  Users,
  ShieldCheck,
  UserRound,
  RefreshCw,
  Crown,
  Sparkles,
  Calendar,
} from "lucide-react";
import api from "../../services/api";
import "./AdminUsers.css";

// Helper to extract clean initials for luxury avatars
const getInitials = (name = "") => {
  if (!name) return "S";
  const parts = name.trim().split(/[ _.-]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all"); // "all" | "Admin" | "Customer"
  const [viewMode, setViewMode] = useState("cards"); // "cards" | "table"

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("admin/users/");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      setUsers(data);
    } catch (err) {
      console.error("Users loading error:", err);
      setError(
        err.response?.data?.detail ||
          "Unable to load users. Please check your admin login."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users by search input AND role filter tab
  const filteredUsers = users.filter((user) => {
    const matchesSearch = `${user.username || ""} ${user.email || ""} ${user.account_type || ""}`
      .toLowerCase()
      .includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterRole === "Admin") return user.account_type === "Admin";
    if (filterRole === "Customer") return user.account_type !== "Admin";
    return true;
  });

  const adminCount = users.filter((user) => user.account_type === "Admin").length;
  const customerCount = users.length - adminCount;

  return (
    <div className="sarika-admin-users">
      <div className="sarika-container">
        {/* Royal Accent Strip */}
        <div className="sarika-accent-strip" />

        {/* Header */}
        <header className="sarika-header">
          <div>
            <span className="sarika-subtitle-chip">❖ Atelier Client Roster</span>
            <h1 className="sarika-title">
              SĀRIKA <span className="sarika-title-slash">/</span> Registered Patrons
            </h1>
            <p className="sarika-tagline">
              Oversee high-patronage accounts, administrators, and bespoke clientele.
            </p>
          </div>

          <button
            onClick={fetchUsers}
            disabled={loading}
            className="sarika-btn-refresh"
          >
            <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
            <span>{loading ? "Refreshing..." : "Refresh Roster"}</span>
          </button>
        </header>

        {/* 3 Luxury Stat Cards */}
        <div className="sarika-stats-grid">
          <div className="sarika-stat-card" style={{ animationDelay: "0.05s" }}>
            <div className="sarika-stat-top">
              <span className="sarika-stat-label">Total Accounts</span>
              <div className="sarika-stat-icon-wrap">
                <Users size={20} />
              </div>
            </div>
            <div className="sarika-stat-value">{users.length}</div>
            <p className="sarika-stat-desc">All registered atelier accounts</p>
          </div>

          <div className="sarika-stat-card" style={{ animationDelay: "0.15s" }}>
            <div className="sarika-stat-top">
              <span className="sarika-stat-label">Royal Administrators</span>
              <div className="sarika-stat-icon-wrap">
                <ShieldCheck size={20} />
              </div>
            </div>
            <div className="sarika-stat-value">{adminCount}</div>
            <p className="sarika-stat-desc">Full atelier management privilege</p>
          </div>

          <div className="sarika-stat-card" style={{ animationDelay: "0.25s" }}>
            <div className="sarika-stat-top">
              <span className="sarika-stat-label">Saree Patrons</span>
              <div className="sarika-stat-icon-wrap">
                <UserRound size={20} />
              </div>
            </div>
            <div className="sarika-stat-value patrons">{customerCount}</div>
            <p className="sarika-stat-desc">Bespoke luxury connoisseurs</p>
          </div>
        </div>

        {/* Filter & View Control Strip */}
        <div className="sarika-controls-card">
          {/* Search Box */}
          <div className="sarika-search-wrap">
            <Search size={16} className="sarika-search-icon" />
            <input
              type="text"
              placeholder="Search patrons by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sarika-search-input"
            />
          </div>

          {/* Role Filter Tabs */}
          <div className="sarika-filter-tabs">
            <button
              onClick={() => setFilterRole("all")}
              className={`sarika-tab-btn ${filterRole === "all" ? "active" : ""}`}
            >
              All Patrons ({users.length})
            </button>
            <button
              onClick={() => setFilterRole("Customer")}
              className={`sarika-tab-btn ${filterRole === "Customer" ? "active" : ""}`}
            >
              Clients ({customerCount})
            </button>
            <button
              onClick={() => setFilterRole("Admin")}
              className={`sarika-tab-btn ${filterRole === "Admin" ? "active" : ""}`}
            >
              Admins ({adminCount})
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="sarika-view-toggle">
            <button
              onClick={() => setViewMode("cards")}
              className={`sarika-toggle-btn ${viewMode === "cards" ? "active" : ""}`}
            >
              Directory
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`sarika-toggle-btn ${viewMode === "table" ? "active" : ""}`}
            >
              Registry
            </button>
          </div>
        </div>

        {/* Dynamic Content Display */}
        {loading ? (
          <div className="sarika-state-box">
            <div className="sarika-royal-spinner" />
            <h3 style={{ fontFamily: "Playfair Display, serif", color: "var(--primary)", margin: 0 }}>
              Gathering Patron Directory...
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "6px" }}>
              Syncing client accounts from SĀRIKA vault
            </p>
          </div>
        ) : error ? (
          <div className="sarika-state-box" style={{ borderColor: "var(--primary)" }}>
            <p style={{ color: "var(--primary)", fontWeight: 600 }}>{error}</p>
            <button
              onClick={fetchUsers}
              className="sarika-btn-refresh"
              style={{ marginTop: "14px", marginInline: "auto" }}
            >
              Try Again
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="sarika-state-box">
            <div style={{ fontSize: "36px", color: "var(--accent-gold)" }}>❖</div>
            <h3 style={{ fontFamily: "Playfair Display, serif", color: "var(--primary)", margin: "10px 0 4px" }}>
              No Accounts Matched
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
              {search
                ? "Try adjusting your search criteria or role filters."
                : "No registered accounts recorded yet."}
            </p>
          </div>
        ) : viewMode === "cards" ? (
          /* LUXURY CARDS DIRECTORY */
          <div className="sarika-directory-grid">
            {filteredUsers.map((user) => {
              const isAdmin = user.account_type === "Admin";
              const initials = getInitials(user.username);

              return (
                <div
                  key={user.id}
                  className={`sarika-patron-card ${isAdmin ? "admin-card" : "patron-card"}`}
                >
                  <div>
                    <div className="sarika-card-header">
                      <div className={`sarika-avatar ${isAdmin ? "admin" : "patron"}`}>
                        {initials}
                      </div>

                      <div className="sarika-user-info">
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <h3 className="sarika-username">{user.username}</h3>
                          {isAdmin && <Crown size={14} color="var(--accent-gold)" />}
                        </div>
                        <p className="sarika-user-email">{user.email || "No email on record"}</p>
                      </div>
                    </div>

                    <div style={{ marginBottom: "14px" }}>
                      <span className={`sarika-badge ${isAdmin ? "admin" : "patron"}`}>
                        {isAdmin ? "✦ Royal Administrator" : "● Valued Patron"}
                      </span>
                    </div>
                  </div>

                  <div className="sarika-card-meta">
                    <span className="sarika-user-id">REF #{user.id}</span>
                    <span className="sarika-joined-date">
                      {user.registration_date
                        ? `Joined ${new Date(user.registration_date).toLocaleDateString("en-IN", {
                            month: "short",
                            year: "numeric",
                          })}`
                        : "Heirloom Patron"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* EDITORIAL REGISTRY TABLE */
          <div className="sarika-table-wrap">
            <table className="sarika-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Patron</th>
                  <th>Email Address</th>
                  <th>Tier / Role</th>
                  <th style={{ textAlign: "right" }}>Inducted Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isAdmin = user.account_type === "Admin";
                  const initials = getInitials(user.username);

                  return (
                    <tr key={user.id}>
                      <td style={{ color: "var(--dark-gold)", fontWeight: 700, fontFamily: "monospace" }}>
                        #{user.id}
                      </td>

                      <td>
                        <div className="sarika-cell-user">
                          <div className={`sarika-table-avatar ${isAdmin ? "admin" : "patron"}`}>
                            {initials}
                          </div>
                          <div>
                            <span className="sarika-table-username">{user.username}</span>
                          </div>
                        </div>
                      </td>

                      <td style={{ color: "var(--text-muted)" }}>{user.email || "—"}</td>

                      <td>
                        <span className={`sarika-badge ${isAdmin ? "admin" : "patron"}`}>
                          {isAdmin ? "Royal Admin" : "Patron"}
                        </span>
                      </td>

                      <td style={{ textAlign: "right", color: "var(--text-muted)" }}>
                        {user.registration_date
                          ? new Date(user.registration_date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <p style={{ marginTop: "48px", textAlign: "center", fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--dark-gold)" }}>
          ❖ SĀRIKA LUXURY ATELIER · REGISTERED CLIENTELE DIRECTORY ❖
        </p>
      </div>
    </div>
  );
}

export default AdminUsers;
