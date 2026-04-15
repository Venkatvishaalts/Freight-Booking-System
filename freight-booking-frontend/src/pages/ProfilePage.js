import React, { useState, useEffect } from "react";
import api from "../services/api"; // your Axios instance with token interceptor

// ─── Helpers ────────────────────────────────────────────────────────────────
const STATUS_META = {
  delivered:  { label: "Delivered",  bg: "#d1fae5", color: "#065f46" },
  in_transit: { label: "In Transit", bg: "#dbeafe", color: "#1e40af" },
  pending:    { label: "Pending",    bg: "#fef9c3", color: "#854d0e" },
  cancelled:  { label: "Cancelled",  bg: "#fee2e2", color: "#991b1b" },
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff} days ago`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function Avatar({ name, size = 80 }) {
  const initials = (name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, color: "#fff",
      fontFamily: "'DM Mono', monospace", letterSpacing: 2, flexShrink: 0,
    }}>{initials}</div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{
      background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12,
      padding: "20px 24px", flex: 1, minWidth: 110, position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, width: 4, height: "100%",
        background: accent, borderRadius: "12px 0 0 12px",
      }} />
      <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", fontFamily: "'DM Mono', monospace" }}>
        {value ?? "—"}
      </div>
      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </div>
    </div>
  );
}

function StarRating({ rating }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill={s <= Math.round(rating) ? "#f59e0b" : "#e5e7eb"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      <span style={{ fontSize: 13, color: "#374151", marginLeft: 4, fontWeight: 600 }}>{rating ?? "N/A"}</span>
    </span>
  );
}

function Badge({ status }) {
  const meta = STATUS_META[status] || { label: status, bg: "#f3f4f6", color: "#374151" };
  return (
    <span style={{
      background: meta.bg, color: meta.color,
      fontSize: 11, fontWeight: 700, padding: "3px 10px",
      borderRadius: 20, textTransform: "uppercase", letterSpacing: 0.5,
    }}>{meta.label}</span>
  );
}

function EditField({ label, value, type = "text", onChange, disabled }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </label>
      <input
        type={type} value={value} onChange={onChange} disabled={disabled}
        style={{
          border: "1.5px solid", borderColor: disabled ? "#f3f4f6" : "#d1d5db",
          borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#111827",
          background: disabled ? "#f9fafb" : "#fff", outline: "none",
          fontFamily: "inherit", transition: "border-color 0.2s",
        }}
        onFocus={(e) => { if (!disabled) e.target.style.borderColor = "#2563eb"; }}
        onBlur={(e) => { e.target.style.borderColor = disabled ? "#f3f4f6" : "#d1d5db"; }}
      />
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [user, setUser]                       = useState(null);
  const [recentShipments, setRecentShipments] = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [editMode, setEditMode]               = useState(false);
  const [form, setForm]                       = useState({});
  const [saved, setSaved]                     = useState(false);
  const [saveError, setSaveError]             = useState(null);
  const [activeTab, setActiveTab]             = useState("overview");

  // ── Fetch real profile using token (no id needed) ─────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        // GET /users/me — backend reads user id from JWT token
        const res = await api.get("/users/me");
        setUser(res.data);
      } catch (err) {
        console.error(err.response?.status, err.response?.data);
        setError("Could not load your profile. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    const fetchShipments = async () => {
      try {
        // GET /shipments/shipper/me — backend reads shipper id from JWT token
        const res = await api.get("/shipments/shipper/me?limit=10");
        setRecentShipments(res.data.shipments || res.data);
      } catch (err) {
        console.error("Failed to load shipments:", err.response?.status, err.response?.data);
        // non-fatal — page still works without shipments
      }
    };

    fetchProfile();
    fetchShipments();
  }, []); // ✅ runs once on mount — no id dependency needed

  // ── Edit handlers ─────────────────────────────────────────────────────────
  const startEdit = () => {
    setForm({
      username:     user.username     || "",
      email:        user.email        || "",
      phone:        user.phone        || "",
      company_name: user.company_name || "",
    });
    setEditMode(true);
    setSaved(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      // PUT /users/:id — backend returns updated user object
      const res = await api.put(`/users/${user.id}`, form);
      setUser(res.data);
      setEditMode(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save profile:", err);
      setSaveError("Could not save changes. Please try again.");
    }
  };

  const TABS = ["overview", "shipments", "security"];

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTop: "3px solid #2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ background: "#fff", border: "1.5px solid #fca5a5", borderRadius: 12, padding: "32px 40px", textAlign: "center", maxWidth: 360 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <p style={{ color: "#991b1b", fontWeight: 600, margin: "0 0 16px" }}>{error}</p>
          <button onClick={() => window.location.reload()} style={btnStyle("primary")}>Retry</button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // ── Safely read stats (backend may or may not return them) ────────────────
  const totalShipments = user.total_shipments ?? recentShipments.length;
  const completed      = user.completed  ?? 0;
  const pending        = user.pending    ?? 0;
  const cancelled      = user.cancelled  ?? 0;

  return (
    <div style={{
      minHeight: "100vh", background: "#f8fafc",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      padding: "32px 24px", boxSizing: "border-box",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        input:focus { outline: none; }
        button:active { transform: scale(0.97); }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: -0.5 }}>
            My Profile
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "4px 0 0" }}>
            Manage your account, preferences, and shipment history
          </p>
        </div>

        {/* ── Profile card ── */}
        <div style={{
          background: "#fff", border: "1.5px solid #e5e7eb",
          borderRadius: 16, padding: "28px 32px",
          display: "flex", alignItems: "center", gap: 24,
          flexWrap: "wrap", marginBottom: 20,
        }}>
          <Avatar name={user.username} size={80} />

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{user.username}</h2>
              <span style={{
                background: "#eff6ff", color: "#1d4ed8",
                fontSize: 11, fontWeight: 700, padding: "3px 10px",
                borderRadius: 20, textTransform: "uppercase", letterSpacing: 0.5,
              }}>{user.user_type}</span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>{user.email}</p>
            {user.company_name && (
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#374151", fontWeight: 500 }}>
                🏢 {user.company_name}
              </p>
            )}
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
              <StarRating rating={user.avg_rating} />
              <span style={{ fontSize: 12, color: "#9ca3af" }}>({user.total_reviews ?? 0} reviews)</span>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>• Member since {timeAgo(user.created_at)}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexDirection: "column", alignItems: "flex-end" }}>
            {saved     && <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>✓ Saved!</span>}
            {saveError && <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>{saveError}</span>}
            <div style={{ display: "flex", gap: 10 }}>
              {editMode ? (
                <>
                  <button onClick={() => setEditMode(false)} style={btnStyle("ghost")}>Cancel</button>
                  <button onClick={handleSave} style={btnStyle("primary")}>Save changes</button>
                </>
              ) : (
                <button onClick={startEdit} style={btnStyle("primary")}>Edit profile</button>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
          <StatCard label="Total Shipments" value={totalShipments} accent="#2563eb" />
          <StatCard label="Completed"       value={completed}      accent="#16a34a" />
          <StatCard label="Pending"         value={pending}        accent="#d97706" />
          <StatCard label="Cancelled"       value={cancelled}      accent="#dc2626" />
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#f1f5f9", borderRadius: 10, padding: 4, width: "fit-content" }}>
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600, textTransform: "capitalize",
              background: activeTab === tab ? "#fff" : "transparent",
              color: activeTab === tab ? "#1d4ed8" : "#6b7280",
              boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.2s", fontFamily: "inherit",
            }}>{tab}</button>
          ))}
        </div>

        {/* ── Tab: Overview ── */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={cardStyle}>
              <SectionTitle>Personal information</SectionTitle>
              {editMode ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <EditField label="Full name"    value={form.username}     onChange={(e) => setForm({ ...form, username: e.target.value })} />
                  <EditField label="Email"        value={form.email}        onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" />
                  <EditField label="Phone"        value={form.phone}        onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  <EditField label="Company name" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <InfoRow icon="👤" label="Name"    value={user.username} />
                  <InfoRow icon="✉️" label="Email"   value={user.email} />
                  <InfoRow icon="📞" label="Phone"   value={user.phone || "—"} />
                  <InfoRow icon="🏢" label="Company" value={user.company_name || "—"} />
                  <InfoRow icon="📅" label="Joined"  value={new Date(user.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })} />
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <SectionTitle>Account summary</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <ProgressBar
                  label="Completion rate"
                  value={totalShipments ? Math.round((completed / totalShipments) * 100) : 0}
                  color="#16a34a"
                />
                <ProgressBar
                  label="Cancellation rate"
                  value={totalShipments ? Math.round((cancelled / totalShipments) * 100) : 0}
                  color="#dc2626"
                />
                <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <InfoRow icon="⭐" label="Avg rating"    value={user.avg_rating ? `${user.avg_rating} / 5` : "No ratings yet"} />
                  <InfoRow icon="📝" label="Total reviews" value={user.total_reviews ?? 0} />
                  <InfoRow icon="🆔" label="Account type"  value={user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Shipments ── */}
        {activeTab === "shipments" && (
          <div style={cardStyle}>
            <SectionTitle>Recent shipments</SectionTitle>
            {recentShipments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
                <p style={{ margin: 0 }}>No shipments found yet.</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                    {["Booking ID", "Route", "Weight", "Date", "Status"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#9ca3af", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentShipments.map((s) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #f9fafb" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "12px 12px", fontWeight: 700, color: "#1d4ed8", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                        SH-{s.id}
                      </td>
                      <td style={{ padding: "12px 12px", color: "#374151" }}>
                        {s.pickup_location} → {s.delivery_location}
                      </td>
                      <td style={{ padding: "12px 12px", color: "#6b7280" }}>{s.weight} kg</td>
                      <td style={{ padding: "12px 12px", color: "#6b7280" }}>
                        {new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td style={{ padding: "12px 12px" }}>
                        <Badge status={s.current_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <button style={{ ...btnStyle("ghost"), fontSize: 13 }}>View all shipments →</button>
            </div>
          </div>
        )}

        {/* ── Tab: Security ── */}
        {activeTab === "security" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <ChangePasswordCard userId={user.id} />
            <div style={cardStyle}>
              <SectionTitle>Danger zone</SectionTitle>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 14px" }}>
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button style={{
                background: "#fff", color: "#dc2626", border: "1.5px solid #fca5a5",
                borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>Delete account</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Change Password (self-contained with real API call) ─────────────────────
function ChangePasswordCard({ userId }) {
  const [fields, setFields] = useState({ current: "", newPass: "", confirm: "" });
  const [status, setStatus] = useState(null);
  const [msg, setMsg]       = useState("");

  const handleUpdate = async () => {
    if (!fields.current || !fields.newPass || !fields.confirm) {
      setStatus("error"); setMsg("All fields are required."); return;
    }
    if (fields.newPass !== fields.confirm) {
      setStatus("error"); setMsg("New passwords do not match."); return;
    }
    if (fields.newPass.length < 6) {
      setStatus("error"); setMsg("New password must be at least 6 characters."); return;
    }
    try {
      await api.put(`/users/${userId}/password`, {
        current_password: fields.current,
        new_password:     fields.newPass,
      });
      setStatus("success");
      setMsg("Password updated successfully.");
      setFields({ current: "", newPass: "", confirm: "" });
    } catch (err) {
      setStatus("error");
      setMsg(err.response?.data?.message || "Failed to update password.");
    }
  };

  return (
    <div style={cardStyle}>
      <SectionTitle>Change password</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 400 }}>
        <EditField label="Current password" value={fields.current} type="password"
          onChange={(e) => setFields({ ...fields, current: e.target.value })} />
        <EditField label="New password"     value={fields.newPass} type="password"
          onChange={(e) => setFields({ ...fields, newPass: e.target.value })} />
        <EditField label="Confirm password" value={fields.confirm} type="password"
          onChange={(e) => setFields({ ...fields, confirm: e.target.value })} />
        {msg && (
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: status === "success" ? "#16a34a" : "#dc2626" }}>
            {status === "success" ? "✓ " : "✗ "}{msg}
          </p>
        )}
        <button onClick={handleUpdate} style={{ ...btnStyle("primary"), width: "fit-content", marginTop: 4 }}>
          Update password
        </button>
      </div>
    </div>
  );
}

// ─── Utility components ───────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#0f172a", letterSpacing: -0.2 }}>{children}</h3>;
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 15, width: 22 }}>{icon}</span>
      <span style={{ fontSize: 12, color: "#9ca3af", width: 80, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ProgressBar({ label, value, color }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "#6b7280" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}%</span>
      </div>
      <div style={{ background: "#f3f4f6", borderRadius: 99, height: 6, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, background: color, height: "100%", borderRadius: 99, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#fff", border: "1.5px solid #e5e7eb",
  borderRadius: 16, padding: "24px 28px",
};

function btnStyle(variant) {
  const base = { border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" };
  if (variant === "primary") return { ...base, background: "#1d4ed8", color: "#fff" };
  if (variant === "ghost")   return { ...base, background: "#f1f5f9", color: "#374151", border: "1.5px solid #e5e7eb" };
  return base;
}