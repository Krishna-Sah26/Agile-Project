// import React, { useEffect, useState } from "react";
// import "./Dashboard.css";

// const Dashboard = () => {

//   const [user, setUser] = useState(null);

//   useEffect(() => {

//     const storedUser = localStorage.getItem("user");

//     if (!storedUser) {
//       window.location.href = "/";
//     } else {
//       setUser(JSON.parse(storedUser));
//     }

//   }, []);

//   return (
//     <div className="dashboard">

//       {/* HEADER */}
//       <header className="header">

//         <div className="logo">
//         <i className="fa-solid fa-box"></i>
//         <h3>CampusQ</h3>
//         </div>

//         <div className="header-right">
//           <span className="org-name">{user?.orgName}</span>
//           <button className="logout"
//             onClick={() => {
//               localStorage.removeItem("user");
//               window.location.href = "/";
//             }}>
//             Logout
//           </button>
//         </div>

//       </header>


//       {/* MAIN */}
//       <main className="main">

//         <div className="top-bar">

//           <div>
//             <h1>Dashboard</h1>
//             <p>Overview of your organization's active queues.</p>
//           </div>

//           <button className="create-btn">
//             + Create New Queue
//           </button>

//         </div>


//         {/* STATS */}
//         <div className="stats">

//           <div className="stat-card">
//             <p>Total Queues</p>
//             <h2>12</h2>
//           </div>

//           <div className="stat-card">
//             <p>Active Users</p>
//             <h2>1,240</h2>
//           </div>

//           <div className="stat-card">
//             <p>Avg Wait Time</p>
//             <h2>8m 30s</h2>
//           </div>

//         </div>


//         {/* SEARCH */}
//         <div className="search-bar">
//           <input type="text" placeholder="Search queues..." />
//           <select>
//             <option>All Statuses</option>
//           </select>
//         </div>


//         {/* QUEUE CARDS */}
//         <div className="queue-container">

//           <div className="queue-card">
//             <div className="queue-header">
//               <h3>Admissions Office</h3>
//               <i className="fa-solid fa-toggle-on"></i>
//               <span className="status open">Open</span>
//             </div>

//             <p>ID: Q-8821</p>

//             <div className="queue-info">
//               <span>SMS & Email</span>
//               <span>12 mins</span>
//             </div>

//             <div className="public-link">
//               <span>campusq.com/join/adm...</span>
//               <button>Copy</button>
//             </div>

//             <div className="card-buttons">
//               <button>QR Code</button>
//               <button>Edit</button>
//             </div>
//           </div>


//           <div className="queue-card">
//             <div className="queue-header">
//               <h3>Registrar</h3>
//               <i className="fa-solid fa-toggle-off"></i>
//               <span className="status paused">Paused</span>
//             </div>

//             <p>ID: Q-9902</p>

//             <div className="queue-info">
//               <span>Email Only</span>
//               <span>5 mins</span>
//             </div>

//             <div className="public-link">
//               <span>campusq.com/join/reg...</span>
//               <button>Copy</button>
//             </div>

//             <div className="card-buttons">
//               <button>QR Code</button>
//               <button>Edit</button>
//             </div>
//           </div>


//           <div className="queue-card">
//             <div className="queue-header">
//               <h3>Financial Aid</h3>
//                 <i className="fa-solid fa-toggle-on"></i>
//               <span className="status open">Open</span>
//             </div>

//             <p>ID: Q-3312</p>

//             <div className="queue-info">
//               <span>SMS Only</span>
//               <span>20 mins</span>
//             </div>

//             <div className="public-link">
//               <span>campusq.com/join/fin...</span>
//               <button>Copy</button>
//             </div>

//             <div className="card-buttons">
//               <button>QR Code</button>
//               <button>Edit</button>
//             </div>
//           </div>

//         </div>

//       </main>

//     </div>
//   );
// };

// export default Dashboard;

import React, { useEffect, useState } from 'react';
import { 
  Plus, Search, ChevronDown, 
  Clock, QrCode, Pencil, Users, Timer, LayoutGrid, 
  Building2
} from 'lucide-react';
import socket from '../socket'; // ADDED: realtime socket client


import './Dashboard.css';


// ============================
// STAT CARD COMPONENT
// ============================

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="stat-card">
    <div>
      <p className="stat-label">{title}</p>
      <h3 className="stat-value">{value}</h3>
    </div>
    <div className={`stat-icon ${colorClass}`}>
      <Icon size={20} />
    </div>
  </div>
);


// ============================
// QUEUE CARD COMPONENT
// ============================

const QueueCard = ({ title, status, id, activeUsers, avgService, link, active, onQRClick, onToggle, onCopy, onCreateStaff }) => (

  <div className={`queue-card ${status === 'Offline' ? 'offline' : ''}`}>

    {/* HEADER */}
    <div className="queue-header">

      <div>
        <h4>{title}</h4>
        <span className={`status ${status.toLowerCase()}`}>
          {status}
        </span>
      </div>

      <button className={`toggle ${active ? "active" : ""}`} onClick={onToggle}>
        <div className="toggle-slider"></div>
      </button>

    </div>

    <p className="queue-id">ID: {id}</p>


    {/* INFO */}
    <div className="queue-info">

      <div>
        <p className="info-label">Active Users</p>
        <p className="info-value">
          <Users size={14}/> {activeUsers}
        </p>
      </div>

      <div>
        <p className="info-label">Avg Service</p>
        <p className="info-value">
          <Clock size={14}/> {avgService}
        </p>
      </div>

    </div>


    {/* LINK */}
    <div className="link-box">
      <p className="info-label">Public Link</p>

      <div className="link-row">
        <span>{link}</span>
        <button onClick={onCopy}>Copy</button>
      </div>

    </div>


    {/* FOOTER */}
    <div className="queue-footer">

      <button onClick={() => onQRClick(id)}>
        <QrCode size={16}/> QR Code
      </button>

      {/* ADDED: create staff button per department */}
      <button onClick={() => onCreateStaff(title)}>
        + Create Staff
      </button>

      <button>
        <Pencil size={16}/> Edit
      </button>

    </div>

  </div>

);


// ============================
// MAIN DASHBOARD COMPONENT
// ============================

const Dashboard = () => {

  const [user, setUser] = useState(null);
  const [qrImage, setQrImage] = useState(""); // ADDED: QR image state
  const [showQR, setShowQR] = useState(false); // ADDED: QR popup state
  const [showModal, setShowModal] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false); // ADDED: create queue modal
  const [queues, setQueues] = useState([]); // ADDED: admin queues
  const [queueForm, setQueueForm] = useState({ name: "", avgServiceTime: 5 }); // ADDED: queue form
  const [stats, setStats] = useState({ totalQueues: 0, activeUsers: 0, avgWait: 0 }); // ADDED: dashboard stats
  const [search, setSearch] = useState(""); // ADDED: search query
  const [statusFilter, setStatusFilter] = useState("all"); // ADDED: status filter
  const [staff, setStaff] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
    phone: "",
    department: ""
  });


  // ============================
  // AUTH CHECK
  // ============================

  useEffect(() => {

    const storedUser = localStorage.getItem("user");

    if (!storedUser) {

      window.location.href = "/";

    } else {

      setUser(JSON.parse(storedUser));

    }

  }, []);

  // ADDED: load queues once user is set
  useEffect(() => {
    if (user?.orgName) {
      fetchQueues();
      fetchStats();
    }
  }, [user?.orgName]);

  // ADDED: realtime queue updates
  useEffect(() => {
    const onCreated = (newQueue) => {
      if (newQueue?.organization === user?.orgName) {
        setQueues((prev) => [...prev, newQueue]);
      }
    };
    const onStatusChanged = (updated) => {
      setQueues((prev) =>
        prev.map((q) => (q._id === updated._id ? updated : q))
      );
    };
    socket.on("queueCreated", onCreated);
    socket.on("queueStatusChanged", onStatusChanged);
    socket.on("queueUpdated", fetchStats); // ADDED: stats refresh on user join/call next
    return () => {
      socket.off("queueCreated", onCreated);
      socket.off("queueStatusChanged", onStatusChanged);
      socket.off("queueUpdated", fetchStats);
    };
  }, [user?.orgName]);

  // ADDED: polling stats every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
    }, 5000);
    return () => clearInterval(interval);
  }, [user?.orgName]);


  // ============================
  // LOGOUT FUNCTION
  // ============================

  const handleLogout = () => {

    localStorage.removeItem("user");

    window.location.href = "/";

  };


  // ============================
  // QR CODE HANDLER
  // ============================

  const handleQR = async (id) => { // ADDED: backend QR fetch function
    try {
      const res = await fetch(`http://localhost:5000/api/queue/qr/${id}`);
      const data = await res.json();
      setQrImage(data.qr);
      setShowQR(true);
    } catch (error) {
      console.error("QR fetch failed:", error);
    }
  };
  // ============================
  // CREATE QUEUE HANDLER
  // ============================
  const createQueue = () => {
    setShowQueueModal(true);
  };

  // ADDED: allow only letters/numbers/spaces for department name
  const handleQueueNameChange = (e) => {
    const value = e.target.value.replace(/[^A-Za-z0-9\s]/g, "");
    setQueueForm({ ...queueForm, name: value });
  };

  // ADDED: allow only 1-30 minutes for avg service time
  const handleAvgTimeChange = (e) => {
    const raw = String(e.target.value).replace(/\D/g, "");
    if (!raw) {
      setQueueForm({ ...queueForm, avgServiceTime: "" });
      return;
    }
    let num = Math.min(30, Math.max(1, parseInt(raw, 10)));
    setQueueForm({ ...queueForm, avgServiceTime: num });
  };

  // ADDED: fetch queues for admin dashboard
  const fetchQueues = async () => {
    if (!user?.orgName) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/queues?organization=${encodeURIComponent(user.orgName)}`
      );
      const data = await res.json();
      if (data.success) {
        setQueues(data.queues || []);
      }
    } catch (error) {
      console.error("Failed to load queues:", error);
    }
  };

  // ADDED: create queue API
  const handleCreateQueue = async () => {
    if (!queueForm.name.trim()) {
      alert("Queue name is required");
      return;
    }

    // ADDED: validate name (letters/numbers/spaces)
    if (!/^[A-Za-z0-9\s]+$/.test(queueForm.name.trim())) {
      alert("Department name can contain only letters and numbers");
      return;
    }

    // ADDED: validate avg service time (1-30)
    const avgTime = Number(queueForm.avgServiceTime);
    if (!avgTime || avgTime < 1 || avgTime > 30) {
      alert("Avg Service Time must be between 1 and 30 minutes");
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/admin/create-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: queueForm.name,
          avgServiceTime: avgTime,
          organization: user?.orgName || ""
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowQueueModal(false);
        setQueueForm({ name: "", avgServiceTime: 5 });
      } else {
        alert(data.message || "Failed to create queue");
      }
    } catch (error) {
      alert("Failed to create queue");
    }
  };

  // ADDED: toggle queue status
  const handleToggleQueue = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/admin/toggle-queue/${id}`, {
        method: "PUT"
      });
    } catch (error) {
      alert("Failed to toggle queue");
    }
  };

  // ADDED: fetch dashboard stats
  const fetchStats = async () => {
    try {
      const org = user?.orgName ? `?organization=${encodeURIComponent(user.orgName)}` : "";
      const res = await fetch(`http://localhost:5000/api/dashboard/stats${org}`);
      const data = await res.json();
      setStats({
        totalQueues: data.totalQueues || 0,
        activeUsers: data.activeUsers || 0,
        avgWait: data.avgWait || 0
      });
    } catch (error) {
      // ignore stats error
    }
  };

  // ============cd
  // create a handle Queue for stafff credental
  // =========
  // ADDED: allow only digits in staff phone field
  const handleStaffPhoneChange = (e) => {
    const onlyDigits = e.target.value.replace(/\D/g, "");
    setStaff({ ...staff, phone: onlyDigits });
  };

  async function handleCreateStaff() {
    try {
      if (!staff.name || !staff.email || !staff.password || !staff.role) {
        alert("Please fill all required fields.");
        return;
      }

      // ADDED: optional phone must be exactly 10 digits
      if (staff.phone && !/^\d{10}$/.test(staff.phone.trim())) {
        alert("Phone must be exactly 10 digits.");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/create-staff",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: staff.name,
            email: staff.email,
            password: staff.password,
            role: staff.role,
            phone: staff.phone,
            department: staff.department,
            orgName: user?.orgName,
            orgType: user?.orgType,
            createdBy: user?.email
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("Staff account created. Staff can now login from /register.");
        setShowModal(false);
        setStaff({
          name: "",
          email: "",
          password: "",
          role: "staff",
          phone: "",
          department: ""
        });
      } else {
        alert(data.message || "Failed to create staff account");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong while creating staff.");
    }
  }
  // ============================
  // UI
  // ============================

  return (

    <div className="dashboard-wrapper">

      {/* NAVBAR */}
      <nav className="navbar">

        <div className="nav-left">

          <div className="logo-box">
            <LayoutGrid size={18} color="white"/>
          </div>

          <span className="logo-text">
            CampusQ
          </span>

        </div>


        <div className="nav-right">

          <button className="org-btn">
            <Building2 size={16}/>
            {user?.orgName}
          </button>

          <button 
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </nav>
      {/* MAIN CONTENT */}
      <main className="main-content">


        {/* HEADER */}
        <div className="header">

          <div>
            <h1>WelCome</h1>
            <p>
              Overview of your organization's active queues.
            </p>
          </div>

          <button className="create-btn" onClick={createQueue}>
            <Plus size={18}/>
            Create New Queue
          </button>

          {/* ADDED: keep header button (global create staff) */}
          <button
            className="create-staff-btn"
            onClick={() => setShowModal(true)}
          >
            + Create Staff
          </button>

        </div>


        {showModal && (
  <div className="modal-overlay">
    <div className="modal">
      <h3>Create Staff Account</h3>

      <input
        type="text"
        placeholder="Staff Name"
        value={staff.name}
        onChange={(e) =>
          setStaff({ ...staff, name: e.target.value })
        }
      />

      <input
        type="email"
        placeholder="Staff Email"
        value={staff.email}
        onChange={(e) =>
          setStaff({ ...staff, email: e.target.value })
        }
      />

      <select
        value={staff.role}
        onChange={(e) =>
          setStaff({ ...staff, role: e.target.value })
        }
      >
        <option value="staff">Staff</option>
        <option value="supervisor">Supervisor</option>
      </select>

      <input
        type="text"
        placeholder="Department (optional)"
        value={staff.department}
        onChange={(e) =>
          setStaff({ ...staff, department: e.target.value })
        }
      />

      <input
        type="tel"
        placeholder="Phone (optional)"
        value={staff.phone}
        onChange={handleStaffPhoneChange}
        inputMode="numeric"
        maxLength={10}
      />

      <input
        type="password"
        placeholder="Temporary Password"
        value={staff.password}
        onChange={(e) =>
          setStaff({ ...staff, password: e.target.value })
        }
      />

      <div className="modal-actions">
        <button onClick={() => setShowModal(false)}>
          Cancel
        </button>

        <button onClick={handleCreateStaff}>
          Create
        </button>
      </div>
    </div>
  </div>
)}
        {/* STATS */}
        <div className="stats-grid">

          <StatCard
            title="Total Queues"
            value={stats.totalQueues}
            icon={Plus}
            colorClass="blue"
          />

          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            icon={Users}
            colorClass="green"
          />

          <StatCard
            title="Avg Wait Time"
            value={`${stats.avgWait} mins`}
            icon={Timer}
            colorClass="orange"
          />

        </div>



        {/* SEARCH */}
        <div className="search-bar">

          <div className="search-box">

            <Search size={18}/>

            <input
              type="text"
              placeholder="Search queues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

          </div>


          <div className="filter-btn">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="paused">Paused</option>
            </select>
            
          </div>

        </div>



        {/* QUEUES */}
        <div className="queues-grid">
          {queues.filter((queue) => {
            const searchValue = search.trim().toLowerCase();
            const matchesSearch =
              queue.name.toLowerCase().includes(searchValue) ||
              queue.queueId.toLowerCase().includes(searchValue);
            const matchesStatus = statusFilter === "all" || queue.status === statusFilter;
            return matchesSearch && matchesStatus;
          }).length === 0 && (
            <p className="upnext-empty">No queues created yet</p>
          )}
          {queues
            .filter((queue) => {
              const searchValue = search.trim().toLowerCase();
              const matchesSearch =
                queue.name.toLowerCase().includes(searchValue) ||
                queue.queueId.toLowerCase().includes(searchValue);
              const matchesStatus = statusFilter === "all" || queue.status === statusFilter;
              return matchesSearch && matchesStatus;
            })
            .map((queue) => (
            <QueueCard
              key={queue._id}
              title={queue.name}
              status={queue.status === "open" ? "Open" : "Paused"}
              id={queue.queueId}
              activeUsers={queue.activeUsers || 0}
              avgService={`${queue.avgServiceTime} mins`}
              link={`http://localhost:5173/join/${queue.queueId}`}
              active={queue.status === "open"}
              onQRClick={handleQR}
              onToggle={() => handleToggleQueue(queue._id)}
              onCopy={() => navigator.clipboard.writeText(`http://localhost:5173/join/${queue.queueId}`)}
              onCreateStaff={(deptName) => {
                // ADDED: prefill department for this queue
                setStaff((prev) => ({ ...prev, department: deptName }));
                setShowModal(true);
              }}
            />
          ))}
        </div>


      </main>

      {/* ADDED: QR popup modal */}
      {showQR && (
        <div className="qr-popup">
          <div className="qr-box">
            <h2>Scan to Join Queue</h2>
            <p>
              By scanning this QR you agree to join the queue.
              Please wait until your turn.
            </p>
            <img src={qrImage} alt="QR" />
            <button onClick={() => setShowQR(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* ADDED: Create Queue Modal */}
      {showQueueModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Create Queue</h3>
            <input
              type="text"
              placeholder="Department Name"
              value={queueForm.name}
              onChange={handleQueueNameChange}
            />
            <input
              type="number"
              placeholder="Avg Service Time (mins)"
              value={queueForm.avgServiceTime}
              min={1}
              max={30}
              onChange={handleAvgTimeChange}
            />
            <div className="modal-actions">
              <button onClick={() => setShowQueueModal(false)}>
                Cancel
              </button>
              <button onClick={handleCreateQueue}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}


    </div>

    // heya trial hai
    

  );

};


export default Dashboard;



