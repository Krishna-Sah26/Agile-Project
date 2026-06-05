import { LayoutGrid } from "lucide-react";
import { useState } from "react";
import "../index.css";
import { auth } from "../firebase";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
const provider = new GoogleAuthProvider();
import { useNavigate } from "react-router-dom";


function Register() {

  // Google Login State
  const [googleUser, setGoogleUser] = useState(null);
  const [googleStep, setGoogleStep] = useState(false);

  // Toggle: Login / Register
  const [isLogin, setIsLogin] = useState(false);
  // Errors
  const [errors, setErrors] = useState({});


  // Form Data
  const [form, setForm] = useState({
    orgName: "",
    type: "",
    email: "",
    password: "",
    agree: false,
  });

  const getDashboardPath = (role) => {
    if (role === "staff" || role === "supervisor") {
      return "/staff-dashboard";
    }
    return "/dashboard";
  };

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  }

function validateForm() {

  let newErrors = {};

  // ============================
  // ORG NAME (Basic Check) - REGISTER MODE ONLY
  // ============================
  if (!isLogin && !/^[A-Za-z ]{3,50}$/.test(form.orgName)) {
    newErrors.orgName =
      "Only letters allowed (3-50 chars)";
  }


 

  // ============================
// ORG NAME vs TYPE MATCH
// ============================
if (!isLogin && form.type) {

  const name = form.orgName.toLowerCase().trim();
  const type = form.type.toLowerCase().trim();

  if (type === "hospital" && !name.includes("hospital")) {
    newErrors.orgName =
      "For Hospital type, name must include 'Hospital'";
  }

  else if (type === "college" &&
    !name.includes("college") &&
    !name.includes("school")) {

    newErrors.orgName =
      "For College type, name must include 'College' or 'School'";
  }

  else if (type === "office" && !name.includes("office")) {

    newErrors.orgName =
      "For Office type, name must include 'Office'";
  }

  else if (type === "shop" &&
    !name.includes("shop") &&
    !name.includes("store")) {

    newErrors.orgName =
      "For Shop type, name must include 'Shop' or 'Store'";
  }

  else if (type === "airport" && !name.includes("airport")) {

    newErrors.orgName =
      "For Airport type, name must include 'Airport'";
  }

  else if (
    type === "other" &&
    (
      name.includes("hospital") ||
      name.includes("college") ||
      name.includes("school") ||
      name.includes("office") ||
      name.includes("shop") ||
      name.includes("store") ||
      name.includes("airport")
    )
  ) {

    newErrors.orgName =
      "For Other type, name should not include specific keywords";
  }

}

  // ============================
  // EMAIL
  // ============================
  if (
    !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.email)
  ) {
    newErrors.email =
      "Enter valid email (example@mail.com)";
  }

  // ============================
  // PASSWORD (Min 8 + Strong) - REGISTER MODE ONLY
  // ============================
  if (!isLogin && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)) {
    newErrors.password =
      "Min 8 chars, needs Upper, Lower & Number";
  }

  // ============================
  // TERMS
  // ============================
  if (!isLogin && !form.agree) {
    newErrors.agree =
      "Accept Terms first";
  }

  setErrors(newErrors);

  return Object.keys(newErrors).length === 0;
}


// COMBINED: Google Login with smart flow
async function handleGoogleLogin() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // ✅ Case 1: Registration Mode + Org Details Already Filled
    if (!isLogin && form.orgName && form.type) {
      // SAVE TO BACKEND
      const response = await fetch(
        "http://localhost:5000/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firebaseUID: user.uid,
            email: user.email,
            orgName: form.orgName,
            orgType: form.type,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        const savedUser = {
          email: user.email,
          orgName: form.orgName,
          orgType: form.type,
          uid: user.uid,
          role: "admin" // ADDED: default role for org owner
        };

        localStorage.setItem("user", JSON.stringify(savedUser));
        alert("Google Registration Successful ✅");
        window.location.href = getDashboardPath(savedUser.role);
      } else {
        alert(data.message || "Registration failed");
      }
    }

    // ✅ Case 2: Registration Mode + Need to Fill Org Details
    else if (!isLogin && (!form.orgName || !form.type)) {
      // Auto-fill email and ask to complete org details
      setForm((prev) => ({
        ...prev,
        email: user.email,
      }));
      alert("Google verified ✅\nNow complete Organization Name & Type");
    }

    // ✅ Case 3: Login Mode - Just use email directly
    else if (isLogin) {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: user.email
        })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        alert("Google Login Successful ✅");
        window.location.href = getDashboardPath(data.user?.role);
      } else {
        alert(data.message || "Login failed");
      }
    }

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

  // dashboard redirect after login or registration
  const navigate = useNavigate();
  async function handleSubmit(e) {

  e.preventDefault();

  if (!validateForm()) return;

  try {

    // ======================
    // LOGIN
    // ======================
    if (isLogin) {

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );

      // GET USER FROM BACKEND
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          email: form.email
        })

      });
      const data = await response.json();
      if (data.success) {
        // SAVE USER
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        alert("Login Successful ✅");

        // GO DASHBOARD
        window.location.href = getDashboardPath(data.user?.role);

      } else {

        alert(data.message);

      }

    }

    // ======================
    // REGISTER
    // ======================
    else {

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );

      // SAVE IN MONGODB
      const response = await fetch("http://localhost:5000/api/register", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          firebaseUID: userCredential.user.uid,

          email: form.email,

          orgName: form.orgName,

          orgType: form.type

        })

      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Register failed, non-JSON response:", text);
        throw new Error(`Register failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {

        // SAVE USER
        const savedUser = { email: form.email, orgName: form.orgName, orgType: form.type, uid: userCredential.user.uid, role: "admin" }; // ADDED: default role
        localStorage.setItem("user", JSON.stringify(savedUser));

        console.log("Registered and saved user:", savedUser);

        alert("Account Created Successfully");
        window.location.href = getDashboardPath(savedUser.role); // ADDED: go to admin dashboard


      } else {
        alert(data.message);
      }

    }

  }
 
  catch (error) {

    console.error(error);

    alert(error.message);

  }

}






  return (
    <div className="auth-page">

      {/* Navbar */}
      <div className="navbar">
  <div className="logo">
    <div className="logo-box">
      <LayoutGrid size={18} color="white" />
    </div>
    <h3>CampusQ</h3>
  </div>

  <p>Need help? Contact Support</p>
</div>


      {/* Center */}
      <div className="center">

        <div className="auth-box">

          {/* LOGO / TITLE */}
          <h2>Welcome </h2>
          <p>Queue Management for Modern Organizations</p>

          {/* TOGGLE */}
          <div className="tab">

            <button
              className={!isLogin ? "active" : ""}
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>

            <button
              className={isLogin ? "active" : ""}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>

          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit}>

            {/* REGISTER ONLY */}
            {!isLogin && (

              <>
                <label>Organization Name</label>
                <div className="input-box">
                  <i className="fa-solid fa-building"></i>
                  <input
                    type="text"
                    name="orgName"
                    
                  placeholder="e.g.State University"
                  value={form.orgName}
                  onChange={handleChange}
                  required
                  className={errors.orgName ? "input-error" : ""}
                  
                />
                </div>
                {errors.orgName && (
  <p className="error-text">{errors.orgName}</p>
)}


                <label>Organization Type</label>
                <div className="input-box">
                  <i className="fa-solid fa-list"></i>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  required
                  className={errors.orgName ? "input-error" : ""}
                >
                 
                  <option value="">Select Type</option>
                  <option>Hospital</option>
                  <option>College</option>
                  <option>Shop</option>
                  <option>Office</option>
                  <option>Airport</option>
                  <option>Other</option>

                </select>
                </div>
              </>
              

            )}


            {/* EMAIL */}
            <label>Email Address</label>
            <div className="input-box">
             <i className="fa-solid fa-envelope"></i>
            <input
              type="email"
              name="email"
              placeholder="e.g. admin@university.edu"
              value={form.email}
              onChange={handleChange}
              required
              className={errors.email ? "input-error" : ""}
            />
            </div>
            {errors.email && (
  <p className="error-text">{errors.email}</p>
)}


            {/* PASSWORD */}
            <label>Password</label>
             <div className="input-box">
             <i className="fa-solid fa-lock"></i>
            <input
            
              type="password"
              name="password"
              placeholder="Enter password"
              value={form.password}
              onChange={handleChange}
              required
              className={errors.password ? "input-error" : ""}
            />
            </div>
            {errors.password && (
  <p className="error-text">{errors.password}</p>
)}


            {/* TERMS */}
            {!isLogin && (

              <label className="check">
                {errors.agree && (
  <p className="error-text">{errors.agree}</p>
)}


                <input
                  type="checkbox"
                  name="agree"
                  checked={form.agree}
                  onChange={handleChange}
                   className={errors.orgName ? "input-error" : ""} 
                />

                I agree to Terms of Service

              </label>
            )}

            {/* BUTTON */}
            <button className="main-btn">

              {isLogin ? "Login" : "Register"}

            </button>
            
          </form>
        <div style={{ marginTop: "15px" }}>
          <button
              type="button"
               className="google-btn"
                onClick={handleGoogleLogin}
                
                >
               Continue with Google
          </button>
        </div>
        </div>
        
      </div>

      {/* Footer */}
      <footer>
        © 2026 CampusQ. All rights reserved.
      </footer>

    </div>
  );
}




export default Register;

