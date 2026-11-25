
import { useEffect, useState } from "react";
import api from "../../services/api";

import {
  Store,
  Building2,
  Truck,
  CreditCard,
  ShoppingBag,
  ShieldCheck,
  Save,
  RotateCcw,
  Upload,
  CheckCircle2,
  X,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Settings,
  Loader2,
} from "lucide-react";

import "./AdminSettings.css";

const BACKEND_URL = "http://127.0.0.1:8000";

const initialSettings = {
  storeName: "SĀRIKA",
  tagline: "The Art of Indian Elegance",
  email: "",
  phone: "",
  address: "",
  website: "",
  gstNumber: "",
  businessName: "",
  businessAddress: "",
  shippingCharge: "80",
  freeShipping: "2000",
  estimatedDelivery: "5",
  codEnabled: true,
  onlinePaymentEnabled: true,
  orderEmailNotification: true,
  orderAutoConfirm: false,
  returnDays: "7",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const sectionFields = {
  store: ["storeName", "tagline", "email", "phone", "address", "website"],
  business: ["businessName", "gstNumber", "businessAddress"],
  shipping: ["shippingCharge", "freeShipping", "estimatedDelivery"],
  payment: ["codEnabled", "onlinePaymentEnabled"],
  orders: ["orderEmailNotification", "orderAutoConfirm", "returnDays"],
  security: ["currentPassword", "newPassword", "confirmPassword"],
};

const apiToForm = (data) => ({
  storeName: data.store_name ?? "SĀRIKA",
  tagline: data.tagline ?? "The Art of Indian Elegance",
  email: data.store_email ?? "",
  phone: data.store_phone ?? "",
  address: data.store_address ?? "",
  website: data.website ?? "",
  gstNumber: data.gst_number ?? "",
  businessName: data.business_name ?? "",
  businessAddress: data.business_address ?? "",
  shippingCharge: String(data.shipping_charge ?? 80),
  freeShipping: String(data.free_shipping_minimum ?? 2000),
  estimatedDelivery: String(data.estimated_delivery_days ?? 5),
  codEnabled: data.cod_enabled ?? true,
  onlinePaymentEnabled: data.online_payment_enabled ?? true,
  orderEmailNotification: data.order_email_notification ?? true,
  orderAutoConfirm: data.order_auto_confirm ?? false,
  returnDays: String(data.return_days ?? 7),
});

const formToApi = (settings) => ({
  store_name: settings.storeName,
  tagline: settings.tagline,
  store_email: settings.email,
  store_phone: settings.phone,
  store_address: settings.address,
  website: settings.website,
  gst_number: settings.gstNumber,
  business_name: settings.businessName,
  business_address: settings.businessAddress,
  shipping_charge: settings.shippingCharge,
  free_shipping_minimum: settings.freeShipping,
  estimated_delivery_days: Number(settings.estimatedDelivery),
  cod_enabled: settings.codEnabled,
  online_payment_enabled: settings.onlinePaymentEnabled,
  order_email_notification: settings.orderEmailNotification,
  order_auto_confirm: settings.orderAutoConfirm,
  return_days: Number(settings.returnDays),
});

function getLogoUrl(logo) {
  if (!logo) return "";

  return logo.startsWith("http")
    ? logo
    : `${BACKEND_URL}${logo}`;
}

function AdminSettings() {
  const [settings, setSettings] = useState({ ...initialSettings });

  const [activeTab, setActiveTab] = useState("store");

  const [logoPreview, setLogoPreview] = useState("");
  const [logoFile, setLogoFile] = useState(null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dialog, setDialog] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const tabs = [
    { id: "store", label: "Store Profile", icon: Store },
    { id: "business", label: "Business Details", icon: Building2 },
    { id: "shipping", label: "Shipping", icon: Truck },
    { id: "payment", label: "Payments", icon: CreditCard },
    { id: "orders", label: "Order Settings", icon: ShoppingBag },
    { id: "security", label: "Security", icon: ShieldCheck },
  ];

  const updateSetting = (name, value) => {
    setSettings((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const showDialog = (title, message, type = "success") => {
    setDialog({
      open: true,
      type,
      title,
      message,
    });
  };

  const closeDialog = () => {
    setDialog((previous) => ({
      ...previous,
      open: false,
    }));
  };

  // LOAD SETTINGS FROM DJANGO
  const loadSettings = async () => {
    try {
      const response = await api.get("admin/settings/");

      const data = response.data;

      setSettings((previous) => ({
        ...previous,
        ...apiToForm(data),
      }));

      setLogoPreview(getLogoUrl(data.store_logo));
    } catch (error) {
      console.error("Settings loading error:", error);

      showDialog(
        "Unable to Load Settings",
        error.response?.data?.detail ||
          "Could not load store settings. Please check your admin login and Django server.",
        "error"
      );
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await loadSettings();
      setLoading(false);
    };

    initialize();

    return () => {
      if (logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, []);

  // LOGO UPLOAD
  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showDialog(
        "Invalid File",
        "Please select a valid image file.",
        "error"
      );

      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showDialog(
        "File Too Large",
        "Please select an image smaller than 2 MB.",
        "error"
      );

      event.target.value = "";
      return;
    }

    if (logoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  // VALIDATION
  const validateSettings = () => {
    if (activeTab === "store") {
      if (!settings.storeName.trim()) {
        showDialog(
          "Store Name Required",
          "Please enter your store name.",
          "error"
        );

        return false;
      }

      if (
        settings.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)
      ) {
        showDialog(
          "Invalid Email",
          "Please enter a valid store email.",
          "error"
        );

        return false;
      }
    }

    if (activeTab === "shipping") {
      const shipping = Number(settings.shippingCharge);
      const threshold = Number(settings.freeShipping);
      const delivery = Number(settings.estimatedDelivery);

      if (
        !Number.isFinite(shipping) ||
        !Number.isFinite(threshold) ||
        !Number.isInteger(delivery) ||
        shipping < 0 ||
        threshold < 0 ||
        delivery < 1
      ) {
        showDialog(
          "Invalid Shipping Details",
          "Enter valid shipping charges, free shipping threshold and delivery days.",
          "error"
        );

        return false;
      }
    }

    if (activeTab === "orders") {
      const days = Number(settings.returnDays);

      if (!Number.isInteger(days) || days < 0) {
        showDialog(
          "Invalid Return Window",
          "Please enter a valid number of return days.",
          "error"
        );

        return false;
      }
    }

    if (activeTab === "security") {
      if (
        !settings.currentPassword ||
        !settings.newPassword ||
        !settings.confirmPassword
      ) {
        showDialog(
          "Required Fields",
          "Please enter all three password fields.",
          "error"
        );

        return false;
      }

      if (settings.newPassword !== settings.confirmPassword) {
        showDialog(
          "Password Mismatch",
          "New password and confirm password do not match.",
          "error"
        );

        return false;
      }

      if (settings.currentPassword === settings.newPassword) {
        showDialog(
          "Invalid Password",
          "New password must be different from your current password.",
          "error"
        );

        return false;
      }

      if (settings.newPassword.length < 8) {
        showDialog(
          "Weak Password",
          "Password must contain at least 8 characters.",
          "error"
        );

        return false;
      }
    }

    return true;
  };

  // SAVE SETTINGS AND CHANGE ADMIN PASSWORD
  const handleSave = async () => {
    if (!validateSettings()) return;

    setSaving(true);

    try {
      // ADMIN CHANGE PASSWORD
      if (activeTab === "security") {
        const response = await api.post(
          "admin/change-password/",
          {
            current_password: settings.currentPassword,
            new_password: settings.newPassword,
            confirm_password: settings.confirmPassword,
          }
        );

        setSettings((previous) => ({
          ...previous,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));

        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);

        showDialog(
          "Password Updated",
          response.data.message ||
            "Your administrator password has been changed successfully.",
          "success"
        );

        return;
      }

      // NORMAL SETTINGS
      const allData = formToApi(settings);

      const fieldMap = {
        store: [
          "store_name",
          "tagline",
          "store_email",
          "store_phone",
          "store_address",
          "website",
        ],

        business: [
          "business_name",
          "gst_number",
          "business_address",
        ],

        shipping: [
          "shipping_charge",
          "free_shipping_minimum",
          "estimated_delivery_days",
        ],

        payment: [
          "cod_enabled",
          "online_payment_enabled",
        ],

        orders: [
          "order_email_notification",
          "order_auto_confirm",
          "return_days",
        ],
      };

      const payload = {};

      fieldMap[activeTab].forEach((field) => {
        payload[field] = allData[field];
      });

      if (activeTab === "store" && logoFile) {
        const formData = new FormData();

        Object.entries(payload).forEach(([key, value]) => {
          formData.append(key, value);
        });

        formData.append("store_logo", logoFile);

        await api.patch("admin/settings/", formData);
      } else {
        await api.patch("admin/settings/", payload);
      }

      if (activeTab === "store") {
        setLogoFile(null);
      }

      showDialog(
        "Settings Saved Successfully",
        `Your ${
          tabs.find((tab) => tab.id === activeTab).label
        } settings have been updated in the database.`,
        "success"
      );

    } catch (error) {
      console.error("Settings saving error:", error);

      const errorData = error.response?.data;

      let errorMessage =
        errorData?.message ||
        errorData?.error ||
        errorData?.detail ||
        "Unable to save changes. Please try again.";

      if (Array.isArray(errorData?.error)) {
        errorMessage = errorData.error.join(", ");
      }

      if (errorData?.errors) {
        errorMessage = JSON.stringify(errorData.errors);
      }

      showDialog(
        "Save Failed",
        errorMessage,
        "error"
      );

    } finally {
      setSaving(false);
    }
  };

  // RESET CURRENT SECTION
  const handleReset = () => {
    setDialog({
      open: true,
      type: "confirm",
      title: "Reset This Section?",
      message:
        "Your unsaved changes in this section will be discarded.",
    });
  };

  const confirmReset = async () => {
    try {
      setLoading(true);

      const response = await api.get("admin/settings/");

      const saved = apiToForm(response.data);

      setSettings((previous) => {
        const updated = { ...previous };

        sectionFields[activeTab].forEach((field) => {
          updated[field] =
            saved[field] ?? initialSettings[field];
        });

        return updated;
      });

      if (activeTab === "store") {
        setLogoFile(null);

        if (logoPreview.startsWith("blob:")) {
          URL.revokeObjectURL(logoPreview);
        }

        setLogoPreview(
          getLogoUrl(response.data.store_logo)
        );
      }

      if (activeTab === "security") {
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      }

      setDialog({
        open: true,
        type: "success",
        title: "Section Reset",
        message:
          "The section has been restored to its last saved database values.",
      });

    } catch (error) {
      console.error("Settings reset error:", error);

      showDialog(
        "Reset Failed",
        error.response?.data?.detail ||
          "Unable to reload saved settings.",
        "error"
      );

    } finally {
      setLoading(false);
    }
  };

  // INPUT COMPONENT
  const renderInput = (
    label,
    name,
    placeholder,
    type = "text"
  ) => (
    <div className="as-field">
      <label htmlFor={name}>{label}</label>

      <input
        id={name}
        type={type}
        value={settings[name]}
        placeholder={placeholder}
        min={type === "number" ? 0 : undefined}
        onChange={(event) =>
          updateSetting(name, event.target.value)
        }
      />
    </div>
  );

  // PASSWORD INPUT
  const renderPasswordInput = (
    label,
    name,
    placeholder,
    visible,
    toggleVisibility
  ) => (
    <div className="as-field">
      <label htmlFor={name}>{label}</label>

      <div className="as-password-input">
        <input
          id={name}
          type={visible ? "text" : "password"}
          value={settings[name]}
          placeholder={placeholder}
          autoComplete="new-password"
          onChange={(event) =>
            updateSetting(name, event.target.value)
          }
        />

        <button
          type="button"
          onClick={toggleVisibility}
          aria-label={`Toggle ${label} visibility`}
        >
          {visible ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}
        </button>
      </div>
    </div>
  );

  // TOGGLE COMPONENT
  const renderToggle = (
    title,
    description,
    name
  ) => (
    <div className="as-toggle-row" key={name}>
      <div className="as-toggle-info">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>

      <button
        type="button"
        className={`as-switch ${
          settings[name] ? "active" : ""
        }`}
        role="switch"
        aria-checked={settings[name]}
        onClick={() =>
          updateSetting(name, !settings[name])
        }
      >
        <span />
      </button>
    </div>
  );

  // TAB CONTENT
  const renderContent = () => {
    switch (activeTab) {
      case "store":
        return (
          <>
            <div className="as-section-heading">
              <div>
                <span className="as-eyebrow">
                  YOUR BRAND
                </span>

                <h2>Store Profile</h2>

                <p>
                  Manage your boutique identity and contact details.
                </p>
              </div>

              <Store size={27} />
            </div>

            <div className="as-logo-area">
              <div className="as-logo-preview">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Store logo preview"
                  />
                ) : (
                  <span>SĀRIKA</span>
                )}
              </div>

              <div>
                <h4>Store Logo</h4>

                <p>
                  Upload a square logo image. Maximum 2 MB.
                </p>

                <label className="as-upload-btn">
                  <Upload size={15} />
                  Upload Logo

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                </label>
              </div>
            </div>

            <div className="as-form-grid">
              {renderInput(
                "Store Name",
                "storeName",
                "SĀRIKA"
              )}

              {renderInput(
                "Store Tagline",
                "tagline",
                "Your brand tagline"
              )}

              {renderInput(
                "Store Email",
                "email",
                "store@example.com",
                "email"
              )}

              {renderInput(
                "Contact Number",
                "phone",
                "+91 XXXXX XXXXX",
                "tel"
              )}

              {renderInput(
                "Website URL",
                "website",
                "https://example.com"
              )}

              <div className="as-field as-full">
                <label htmlFor="address">
                  Store Address
                </label>

                <textarea
                  id="address"
                  rows="3"
                  value={settings.address}
                  placeholder="Enter your store address"
                  onChange={(event) =>
                    updateSetting(
                      "address",
                      event.target.value
                    )
                  }
                />
              </div>
            </div>
          </>
        );

      case "business":
        return (
          <>
            <div className="as-section-heading">
              <div>
                <span className="as-eyebrow">
                  LEGAL INFORMATION
                </span>

                <h2>Business Details</h2>

                <p>
                  Maintain your registered business information.
                </p>
              </div>

              <Building2 size={27} />
            </div>

            <div className="as-form-grid">
              {renderInput(
                "Registered Business Name",
                "businessName",
                "Enter registered business name"
              )}

              {renderInput(
                "GST Identification Number",
                "gstNumber",
                "Enter GSTIN"
              )}

              <div className="as-field as-full">
                <label htmlFor="businessAddress">
                  Registered Business Address
                </label>

                <textarea
                  id="businessAddress"
                  rows="4"
                  value={settings.businessAddress}
                  placeholder="Enter registered business address"
                  onChange={(event) =>
                    updateSetting(
                      "businessAddress",
                      event.target.value
                    )
                  }
                />
              </div>
            </div>
          </>
        );

      case "shipping":
        return (
          <>
            <div className="as-section-heading">
              <div>
                <span className="as-eyebrow">
                  DELIVERY EXPERIENCE
                </span>

                <h2>Shipping Configuration</h2>

                <p>
                  Set delivery charges and estimated delivery times.
                </p>
              </div>

              <Truck size={27} />
            </div>

            <div className="as-form-grid">
              {renderInput(
                "Standard Shipping Charge (₹)",
                "shippingCharge",
                "80",
                "number"
              )}

              {renderInput(
                "Free Shipping Above (₹)",
                "freeShipping",
                "2000",
                "number"
              )}

              {renderInput(
                "Estimated Delivery (Days)",
                "estimatedDelivery",
                "5",
                "number"
              )}
            </div>

            <div className="as-note">
              <Sparkles size={18} />

              <p>
                Set a free-shipping threshold to encourage customers
                to increase their cart value.
              </p>
            </div>
          </>
        );

      case "payment":
        return (
          <>
            <div className="as-section-heading">
              <div>
                <span className="as-eyebrow">
                  CHECKOUT EXPERIENCE
                </span>

                <h2>Payment Methods</h2>

                <p>
                  Choose which payment methods customers can use.
                </p>
              </div>

              <CreditCard size={27} />
            </div>

            <div className="as-payment-card">
              <div className="as-payment-icon">₹</div>

              <div className="as-payment-copy">
                <h4>Cash on Delivery</h4>

                <p>
                  Allow customers to pay when their order arrives.
                </p>
              </div>

              <span className="as-payment-status">
                COD
              </span>
            </div>

            {renderToggle(
              "Cash on Delivery",
              "Enable or disable COD at checkout.",
              "codEnabled"
            )}

            <div className="as-payment-card">
              <div className="as-payment-icon">
                <CreditCard size={22} />
              </div>

              <div className="as-payment-copy">
                <h4>Online Payments</h4>

                <p>
                  Enable payments through your configured payment gateway.
                </p>
              </div>

              <span className="as-payment-status">
                ONLINE
              </span>
            </div>

            {renderToggle(
              "Online Payment",
              "Allow customers to pay online.",
              "onlinePaymentEnabled"
            )}

            <div className="as-note">
              <ShieldCheck size={18} />

              <p>
                These switches are preferences only. Connect your
                payment gateway before accepting live payments.
              </p>
            </div>
          </>
        );

      case "orders":
        return (
          <>
            <div className="as-section-heading">
              <div>
                <span className="as-eyebrow">
                  ORDER MANAGEMENT
                </span>

                <h2>Order Preferences</h2>

                <p>
                  Configure your order handling preferences.
                </p>
              </div>

              <ShoppingBag size={27} />
            </div>

            {renderToggle(
              "Order Email Notifications",
              "Enable notifications for new orders.",
              "orderEmailNotification"
            )}

            {renderToggle(
              "Automatic Order Confirmation",
              "Automatically confirm orders after successful placement.",
              "orderAutoConfirm"
            )}

            <div className="as-form-grid as-single-field">
              {renderInput(
                "Return Window (Days)",
                "returnDays",
                "7",
                "number"
              )}
            </div>
          </>
        );

      case "security":
        return (
          <>
            <div className="as-section-heading">
              <div>
                <span className="as-eyebrow">
                  ACCOUNT PROTECTION
                </span>

                <h2>Security Settings</h2>

                <p>
                  Update your administrator account password.
                </p>
              </div>

              <ShieldCheck size={27} />
            </div>

            <div className="as-security-note">
              <Lock size={22} />

              <div>
                <h4>Keep your account secure</h4>

                <p>
                  Use a strong password that you do not use
                  on other websites.
                </p>
              </div>
            </div>

            <div className="as-form-grid">
              {renderPasswordInput(
                "Current Password",
                "currentPassword",
                "Enter current password",
                showCurrentPassword,
                () =>
                  setShowCurrentPassword((previous) => !previous)
              )}

              {renderPasswordInput(
                "New Password",
                "newPassword",
                "Minimum 8 characters",
                showNewPassword,
                () =>
                  setShowNewPassword((previous) => !previous)
              )}

              {renderPasswordInput(
                "Confirm New Password",
                "confirmPassword",
                "Confirm new password",
                showConfirmPassword,
                () =>
                  setShowConfirmPassword((previous) => !previous)
              )}
            </div>

            <div className="as-note">
              <ShieldCheck size={18} />

              <p>
                Your password is verified securely by Django.
                Password fields are cleared after a successful update.
              </p>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="as-loading">
        <Loader2
          size={30}
          className="as-loader-icon"
        />

        <p>Loading SĀRIKA settings...</p>
      </div>
    );
  }

  return (
    <div className="as-page">
      <div className="as-container">
        {/* PAGE HEADER */}

        <div className="as-page-header">
          <div>
            <span className="as-eyebrow">
              SĀRIKA ADMINISTRATION
            </span>

            <h1>Store Settings</h1>

            <p>
              Manage your boutique preferences and configurations.
            </p>
          </div>

          <div className="as-header-icon">
            <Settings size={25} />
          </div>
        </div>

        {/* SETTINGS LAYOUT */}

        <div className="as-layout">
          <aside className="as-sidebar">
            <div className="as-sidebar-heading">
              SETTINGS MENU
            </div>

            {tabs.map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  type="button"
                  key={tab.id}
                  className={`as-tab ${
                    activeTab === tab.id ? "active" : ""
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={18} />

                  <span>{tab.label}</span>

                  {activeTab === tab.id && (
                    <span className="as-tab-indicator" />
                  )}
                </button>
              );
            })}

            <div className="as-sidebar-footer">
              <Sparkles size={15} />

              <span>Elegance in every detail</span>
            </div>
          </aside>

          {/* CONTENT */}

          <main className="as-content">
            <div className="as-content-inner">
              {renderContent()}
            </div>

            {/* ACTION BUTTONS */}

            <div className="as-actions">
              <button
                type="button"
                className="as-reset-btn"
                onClick={handleReset}
                disabled={saving}
              >
                <RotateCcw size={16} />
                Reset
              </button>

              <button
                type="button"
                className="as-save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2
                    size={17}
                    className="as-loader-icon"
                  />
                ) : (
                  <Save size={17} />
                )}

                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </main>
        </div>
      </div>

      {/* DIALOG */}

      {dialog.open && (
        <div
          className="as-dialog-overlay"
          onClick={closeDialog}
        >
          <div
            className="as-dialog"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="as-dialog-close"
              onClick={closeDialog}
              aria-label="Close dialog"
            >
              <X size={19} />
            </button>

            <div
              className={`as-dialog-icon ${dialog.type}`}
            >
              {dialog.type === "confirm" ? (
                <RotateCcw size={27} />
              ) : dialog.type === "error" ? (
                <X size={27} />
              ) : dialog.type === "info" ? (
                <Settings size={27} />
              ) : (
                <CheckCircle2 size={29} />
              )}
            </div>

            <span className="as-dialog-eyebrow">
              SĀRIKA · ADMIN PORTAL
            </span>

            <h3>{dialog.title}</h3>

            <p>{dialog.message}</p>

            <div className="as-dialog-actions">
              {dialog.type === "confirm" ? (
                <>
                  <button
                    type="button"
                    className="as-dialog-cancel"
                    onClick={closeDialog}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="as-dialog-confirm"
                    onClick={confirmReset}
                  >
                    Yes, Reset
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="as-dialog-confirm"
                  onClick={closeDialog}
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSettings;
