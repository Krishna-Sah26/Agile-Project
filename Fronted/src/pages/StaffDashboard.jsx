import React, { useEffect, useRef, useState } from 'react';
import StaffNavbar from '../components/staff/StaffNavbar';
import StatsCards from '../components/staff/StatsCards';
import NowServing from '../components/staff/NowServing';
import UpNextPanel from '../components/staff/UpNextPanel';
import ActionButtons from '../components/staff/ActionButtons';
import { API_URL } from "../config";
import socket, { joinQueueRoom, leaveQueueRoom } from '../socket'; // ADDED: socket.io client
import '../styles/staff.css';

const StaffDashboard = () => {
  const [waiting, setWaiting] = useState([]); // ADDED: waiting queue list
  const [serving, setServing] = useState(null); // ADDED: current serving
  const [staffProfile, setStaffProfile] = useState(null); // ADDED: staff profile data
  const [staffQueues, setStaffQueues] = useState([]); // ADDED: queues for staff org
  const [activeQueueId, setActiveQueueId] = useState(""); // ADDED: selected queueId
  const [activeQueueName, setActiveQueueName] = useState(""); // ADDED: selected queue name
  const [activeQueueStatus, setActiveQueueStatus] = useState("open"); // ADDED: active queue status
  const [manualOpen, setManualOpen] = useState(false); // ADDED: manual ticket modal
  const [manualName, setManualName] = useState(""); // ADDED: manual ticket name
  const [manualPhone, setManualPhone] = useState(""); // ADDED: manual ticket phone
  const [servedToday, setServedToday] = useState(0); // ADDED: served today count
  const [error, setError] = useState(""); // ADDED: error state
  const joinedRoomsRef = useRef(new Set()); // ADDED: track joined rooms

  // ADDED: fetch waiting list for staff dashboard
  const fetchWaiting = async (queueIdOverride) => {
    const queueId = queueIdOverride || activeQueueId;
    if (!queueId) return;
    try {
      const res = await fetch(
        `${API_URL}/api/queue/list?status=waiting&queueId=${encodeURIComponent(queueId)}`
      );
      const data = await res.json();
      if (data.success) {
        setWaiting(data.users || []);
      } else {
        setError(data.message || "Unable to fetch waiting list");
      }
    } catch (err) {
      setError("Unable to fetch waiting list");
    }
  };

  // ADDED: fetch currently serving user
  const fetchServing = async (queueIdOverride) => {
    const queueId = queueIdOverride || activeQueueId;
    if (!queueId) return;
    try {
      const res = await fetch(
        `${API_URL}/api/queue/list?status=serving&limit=1&queueId=${encodeURIComponent(queueId)}`
      );
      const data = await res.json();
      if (data.success) {
        setServing((data.users || [])[0] || null);
      }
    } catch (err) {
      // keep existing serving on error
    }
  };

  // ADDED: fetch stats (served today)
  const fetchStats = async (queueIdOverride) => {
    const queueId = queueIdOverride || activeQueueId;
    if (!queueId) return;
    try {
      const url = queueId
        ? `${API_URL}/api/queue/stats?queueId=${queueId}`
        : `${API_URL}/api/queue/stats`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setServedToday(data.servedToday || 0);
      }
    } catch (err) {
      // ignore stats error
    }
  };

  // ADDED: call next user
  const handleCallNext = async () => {
    if (!activeQueueId) {
      setError("No active queue selected");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/queue/call-next`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueId: activeQueueId })
      });
      const data = await res.json();
      if (data.success) {
        setServing(data.nextUser || null);
        fetchWaiting(activeQueueId);
      } else {
        setError(data.message || "Unable to call next");
      }
    } catch (err) {
      setError("Unable to call next");
    }
  };

  // ADDED: mark current serving as served
  const handleMarkServed = async () => {
    if (!activeQueueId) {
      setError("No active queue selected");
      return;
    }
    if (!serving?.token) {
      setError("No serving user to complete");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/queue/mark-served`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: serving.token, queueId: activeQueueId })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Unable to mark served");
      }
      fetchServing(activeQueueId);
      fetchWaiting(activeQueueId);
    } catch (err) {
      setError("Unable to mark served");
    }
  };

  // ADDED: skip next waiting user (move to end)
  const handleSkip = async () => {
    if (!activeQueueId) {
      setError("No active queue selected");
      return;
    }
    if (!waiting.length) {
      setError("No waiting user to skip");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/queue/skip`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: waiting[0].token, queueId: activeQueueId })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Unable to skip user");
      }
      fetchWaiting(activeQueueId);
    } catch (err) {
      setError("Unable to skip user");
    }
  };

  // ADDED: load staff profile from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      setStaffProfile(JSON.parse(stored));
    }
  }, []);

  // ADDED: load queues for staff org and set active queue
  const fetchStaffQueues = async () => {
    if (!staffProfile?.orgName) return;
    try {
      const res = await fetch(
        `${API_URL}/api/admin/queues?organization=${encodeURIComponent(staffProfile.orgName)}`
      );
      const data = await res.json();
      if (data.success) {
        const queues = data.queues || [];
        setStaffQueues(queues);
        if (!activeQueueId && queues.length) {
          const staffDept = (staffProfile?.department || "").trim().toLowerCase();
          const matched = staffDept
            ? queues.find((q) => (q.name || "").trim().toLowerCase() === staffDept)
            : null;
          const selected = matched || queues[0];
          setActiveQueueId(selected.queueId);
          setActiveQueueName(selected.name || selected.queueId);
        }
      }
    } catch (err) {
      setError("Unable to load queues for this organization");
    }
  };

  useEffect(() => {
    if (staffProfile?.orgName) {
      fetchStaffQueues();
    }
  }, [staffProfile?.orgName]);

  useEffect(() => {
    if (!activeQueueId) return;
    const found = staffQueues.find((q) => q.queueId === activeQueueId);
    if (found) {
      setActiveQueueName(found.name || found.queueId);
      setActiveQueueStatus(found.status || "open");
    }
  }, [activeQueueId, staffQueues]);

  // ADDED: initial fetch + refresh
  useEffect(() => {
    if (!activeQueueId) return;
    fetchWaiting(activeQueueId);
    fetchServing(activeQueueId);
    fetchStats(activeQueueId);
    const interval = setInterval(() => {
      fetchWaiting(activeQueueId);
      fetchServing(activeQueueId);
      fetchStats(activeQueueId);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeQueueId]);

  // ADDED: realtime socket update
  useEffect(() => {
    const handler = () => {
      if (!activeQueueId) return;
      fetchWaiting(activeQueueId);
      fetchServing(activeQueueId);
      fetchStats(activeQueueId);
    };
    socket.on("queueUpdated", handler);
    return () => socket.off("queueUpdated", handler);
  }, [activeQueueId]);

  // ADDED: realtime queue status updates
  useEffect(() => {
    const onStatusChanged = (updated) => {
      if (!updated?._id) return;
      setStaffQueues((prev) =>
        prev.map((q) => (q._id === updated._id ? updated : q))
      );
    };
    socket.on("queueStatusChanged", onStatusChanged);
    return () => socket.off("queueStatusChanged", onStatusChanged);
  }, []);

  // ADDED: join selected queue room for realtime updates
  useEffect(() => {
    if (!activeQueueId) return undefined;
    if (!joinedRoomsRef.current.has(activeQueueId)) {
      joinQueueRoom(activeQueueId);
      joinedRoomsRef.current.add(activeQueueId);
    }
    return () => {
      if (joinedRoomsRef.current.has(activeQueueId)) {
        leaveQueueRoom(activeQueueId);
        joinedRoomsRef.current.delete(activeQueueId);
      }
    };
  }, [activeQueueId]);

  // ADDED: manual add ticket handler
  const handleManualAdd = async () => {
    if (!activeQueueId) {
      setError("No active queue selected");
      return;
    }
    if (!manualName.trim() || !manualPhone.trim()) {
      setError("Please enter name and phone");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/queue/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queueId: activeQueueId,
          name: manualName.trim(),
          phone: manualPhone.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setManualOpen(false);
        setManualName("");
        setManualPhone("");
        fetchWaiting(activeQueueId);
      } else {
        setError(data.message || "Unable to add ticket");
      }
    } catch (err) {
      setError("Unable to add ticket");
    }
  };

  // ADDED: staff pause/resume queue
  const handleTogglePause = async () => {
    const activeQueue = staffQueues.find((q) => q.queueId === activeQueueId);
    if (!activeQueue?._id) {
      setError("Unable to pause: queue not found");
      return;
    }
    try {
      const res = await fetch(
        `${API_URL}/api/admin/toggle-queue/${activeQueue._id}`,
        { method: "PUT" }
      );
      const data = await res.json();
      if (data?.success && data?.queue) {
        setStaffQueues((prev) =>
          prev.map((q) => (q._id === data.queue._id ? data.queue : q))
        );
      } else {
        setError(data?.message || "Unable to pause queue");
      }
    } catch (err) {
      setError("Unable to pause queue");
    }
  };

  return (
    <div className="staff-dashboard">
      <StaffNavbar
        staffName={staffProfile?.name || staffProfile?.email || "Staff Member"}
        staffRole={staffProfile?.role || "Staff"}
        queueName={activeQueueName || staffProfile?.department || staffProfile?.orgName || "CampusQ Queue"}
        staffEmail={staffProfile?.email || ""} // ADDED: avatar seed
        isPaused={activeQueueStatus !== "open"}
        onTogglePause={handleTogglePause}
      />

      <main className="staff-main">
        <div className="staff-layout">
          <div className="staff-left">
            <StatsCards
              waitingCount={waiting.length}
              servedCount={servedToday}
              avgWait={`${waiting.length * 5}m`}
            />

            <div className="staff-main-card">
              <NowServing serving={serving} isPaused={activeQueueStatus !== "open"} />
              <ActionButtons
                onCallNext={handleCallNext}
                onSkip={handleSkip}
                onMarkServed={handleMarkServed}
              />
            </div>
          </div>

          <UpNextPanel tickets={waiting} onManualAdd={() => setManualOpen(true)} />
        </div>
        {error && <p className="staff-error">{error}</p>}
      </main>

      {manualOpen && (
        <div className="staff-modal-overlay">
          <div className="staff-modal">
            <h3>Manually Add Ticket</h3>
            <input
              className="staff-modal-input"
              placeholder="Full Name"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
            />
            <input
              className="staff-modal-input"
              placeholder="Phone Number"
              value={manualPhone}
              onChange={(e) => setManualPhone(e.target.value.replace(/\\D/g, ""))}
              maxLength={10}
            />
            <div className="staff-modal-actions">
              <button onClick={() => setManualOpen(false)}>Cancel</button>
              <button onClick={handleManualAdd}>Add Ticket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
