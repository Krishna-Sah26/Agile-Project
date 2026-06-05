import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import "./StaffLogin.css";

function StaffLogin() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "staff",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);

      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.message || "Login failed");
        setLoading(false);
        return;
      }

      if (data.user?.role !== form.role) {
        alert("Selected role does not match your account.");
        setLoading(false);
        return;
      }

      if (data.user?.role !== "staff" && data.user?.role !== "supervisor") {
        alert("This page is only for staff/supervisor login.");
        setLoading(false);
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/staff-dashboard";
    } catch (error) {
      alert(error.message || "Unable to login");
      setLoading(false);
    }
  };

  return (
    <div className="staff-login-page">
      <form className="staff-login-card" onSubmit={handleSubmit}>
        <h2>Staff Login</h2>
        <p>Use the credentials sent by your admin.</p>

        <label>Email</label>
        <input
          name="email"
          type="email"
          placeholder="staff@company.com"
          value={form.email}
          onChange={handleChange}
          required
        />

        <label>Password</label>
        <input
          name="password"
          type="password"
          placeholder="Enter password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <label>Role</label>
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="staff">Staff</option>
          <option value="supervisor">Supervisor</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login to Staff Dashboard"}
        </button>
      </form>
    </div>
  );
}

export default StaffLogin;
