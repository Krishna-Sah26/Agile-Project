import { LayoutGrid } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, QrCode, BellRing } from "lucide-react";
import heroImg from "../assets/hero.jpg";
import "./Landing.css";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing">

      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-left">

          <div className="logo-box">
            <LayoutGrid size={20} color="white"/>
          </div>
          <span className="logo-text">
            CampusQ
          </span>

        </div>
        <button className="login-btn" onClick={() => navigate("register")}>
          Login
        </button>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-left">
          <h1>Simplify Organization Queues</h1>
          <p>
            Efficiently manage lines and wait times with our streamlined
            digital queue management system.
          </p>

          <div className="hero-buttons">
            <button
              className="primary-btn"
              onClick={() => navigate("/register")}
            >
              Register Organization
            </button>
            <button className="secondary-btn">Learn More</button>
          </div>
        </div>

        <div className="hero-right hero-image">
          <img
            src={heroImg}
            alt="Hero illustration"
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="how">
        <h2>How it works</h2>
        <p>Three simple steps to manage your organization's queues.</p>

        <div className="cards">
          <div className="card">
            <div className="icon-box">
              <PlusCircle size={32} />
            </div>
            <h3>Create Queue</h3>
            <p>Define your queue parameters and set up a line in seconds.</p>
          </div>

          <div className="card">
            <div className="icon-box">
              <QrCode size={32} />
            </div>
            <h3>Share QR/Link</h3>
            <p>Users join via mobile simply by scanning a code.</p>
          </div>

          <div className="card">
            <div className="icon-box">
              <BellRing size={32} />
            </div>
            <h3>Call Next</h3>
            <p>Notify users instantly when it's their turn to be served.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div>
          <h3>Ready to get started?</h3>
          <p>Join organizations simplifying their queue management today.</p>
        </div>

        <button
          className="primary-btn"
          onClick={() => navigate("/register")}
        >
          Get Started Now
        </button>
      </section>

      {/* Footer */}
      {/* Footer */}
      <footer className="footer" >
        <div className="footer-left">
          <div className="logo-box">
            <LayoutGrid size={20} color="white" />
          </div>
          <span className="logo-text">CampusQ</span>
        </div>
        <div className="footer-links">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Contact</span>
        </div>
        <div>© 2026 CampusQ Inc.</div>
      </footer>
    </div>
  );
};

export default Landing;