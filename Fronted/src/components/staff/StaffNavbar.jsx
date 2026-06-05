import React from 'react';
import { Bell, LayoutGrid } from 'lucide-react';

const StaffNavbar = ({
  staffName = "Staff Member",
  staffRole = "Staff",
  queueName = "CampusQ Queue",
  staffEmail = "",
  isPaused = false,
  onTogglePause = () => {}
}) => {
  const avatarUrl = `https://i.pravatar.cc/120?u=${encodeURIComponent(staffEmail || staffName)}`; // ADDED: dynamic avatar
  return (
    <nav className="staff-navbar">
      <div className="staff-navbar-left">
        <div className="staff-brand">
          <div className="staff-brand-icon">
            <LayoutGrid size={18} />
          </div>
          <span className="staff-brand-text">CampusQ</span>
        </div>

        <div className="staff-queue-meta">
          <p className="staff-queue-label">Queue</p>
          <p className="staff-queue-name">{queueName}</p>
        </div>
      </div>

      <div className="staff-navbar-right">
        <div className="staff-online-pill">
          <span className="staff-online-dot" />
          <span className="staff-online-text">Online</span>
        </div>

        {/* ADDED: pause/resume queue button */}
        <button
          className={`staff-pause-btn ${isPaused ? "paused" : ""}`}
          onClick={onTogglePause}
          type="button"
        >
          {isPaused ? "Resume Queue" : "Pause Queue"}
        </button>

        <button className="staff-alert-btn">
          <Bell size={20} />
        </button>

        <div className="staff-profile">
          <div className="staff-profile-text">
            <p className="staff-profile-name">{staffName}</p>
            <p className="staff-profile-role">{staffRole}</p>
          </div>
          <img
            src={avatarUrl}
            alt="profile"
            className="staff-profile-image"
          />
        </div>
      </div>
    </nav>
  );
};

export default StaffNavbar;
