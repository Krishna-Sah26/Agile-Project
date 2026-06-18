import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { LayoutGrid, Megaphone, Clock3, Users } from "lucide-react";
import { API_URL } from "../config";
import socket, { joinQueueRoom, leaveQueueRoom } from "../socket"; // ADDED: socket.io client
import "./QueueStatus.css";

function QueueStatus() {
  const { token } = useParams(); // ADDED: token from route /status/:token
  const location = useLocation(); // ADDED: read queueId from query params
  const navigate = useNavigate(); // ADDED: navigate back to join queue page
  const [status, setStatus] = useState(null); // ADDED: live status data
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [position, setPosition] = useState(0); // ADDED: user position
  const [waitTime, setWaitTime] = useState(0); // ADDED: estimated wait
  const [turnAlert, setTurnAlert] = useState(false); // ADDED: show "now your turn" banner
  const audioRef = useRef(null); // ADDED: notification sound

  // ADDED: leave queue button handler (go back to join page)
  const handleLeaveQueue = () => {
    const queueId = status?.queue?.id || status?.queueId;
    if (queueId) {
      navigate(`/join/${queueId}`);
      return;
    }
    navigate(-1);
  };

  const queryQueueId = new URLSearchParams(location.search).get("queueId"); // ADDED: queueId from URL

  // ADDED: fetch queue status from backend
  const fetchStatus = async () => {
    try {
      const queueId = queryQueueId || status?.queue?.id || status?.queueId;
      const url = queueId
        ? `${API_URL}/api/queue/status/${token}?queueId=${encodeURIComponent(queueId)}`
        : `${API_URL}/api/queue/status/${token}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setStatus(data);
        setTurnAlert(data.userStatus === "serving"); // ADDED: show alert when serving
        setError("");
        setUpdatedAt(new Date().toLocaleTimeString());
      } else {
        setError(data.message || "Unable to fetch status");
      }
    } catch (fetchError) {
      setError("Unable to fetch status");
    }
  };

  // ADDED: fetch position + estimated wait time
  const fetchPosition = async () => {
    try {
      const queueId = queryQueueId || status?.queue?.id || status?.queueId;
      const url = queueId
        ? `${API_URL}/api/queue/position/${token}?queueId=${encodeURIComponent(queueId)}`
        : `${API_URL}/api/queue/position/${token}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setPosition(data.position);
        setWaitTime(data.estimatedWait);
      }
    } catch (posErr) {
      // ignore position error
    }
  };

  // ADDED: initial fetch + 5s live polling
  useEffect(() => {
    fetchStatus();
    fetchPosition();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [token]);

  // ADDED: realtime socket update
  useEffect(() => {
    const handler = (data) => {
      fetchStatus();
      fetchPosition();

      // ADDED: play sound when this user's token is called
      if (data?.token === token && data?.status === "serving") {
        setTurnAlert(true);
        if (!audioRef.current) {
          audioRef.current = new Audio("/notify.mp3");
        }
        audioRef.current.play().catch(() => {});
      }
    };
    socket.on("queueUpdated", handler);
    return () => socket.off("queueUpdated", handler);
  }, [token]);

  // ADDED: join socket room for this queue
  useEffect(() => {
    const queueId = status?.queue?.id || status?.queueId;
    if (queueId) {
      joinQueueRoom(queueId);
      return () => leaveQueueRoom(queueId);
    }
    return undefined;
  }, [status?.queue?.id, status?.queueId]);

  return (
    <div className="status-page">
      <header className="status-topbar">
        <div className="status-brand">
          <div className="status-brand-icon">
            <LayoutGrid size={14} color="white" />
          </div>
          <span>CampusQ</span>
        </div>
        <div className="status-actions">
          <button type="button">Help</button>
          <button type="button" className="leave-btn" onClick={handleLeaveQueue}>Leave Queue</button>
        </div>
      </header>

      <main className="status-main">
        <section className="status-hero">
          <span className="live-pill">Live Status</span>
          {turnAlert && (
            <div className="turn-alert">Now your turn — please proceed to the counter.</div>
          )}
          <p className="token-label">YOUR TOKEN NUMBER</p>
          <h1>{status?.token || token}</h1>
          <p>Please wait in the main lobby. We will notify you when it's your turn.</p>
        </section>

        <section className="status-cards">
          <div className="status-card">
            <div className="icon green"><Megaphone size={16} /></div>
            <p>NOW SERVING</p>
            <h3>{status?.nowServing || "None"}</h3>
          </div>

          <div className="status-card">
            <div className="icon orange"><Clock3 size={16} /></div>
            <p>EST. WAIT TIME</p>
            <h3>~{waitTime} mins</h3>
          </div>

          <div className="status-card">
            <div className="icon purple"><Users size={16} /></div>
            <p>POSITION</p>
            <h3>{position} Ahead</h3>
          </div>
        </section>

        <section className="status-location">
          <div>
            <h4>{status?.queue?.title || "Student Services Center"}</h4>
            <p>{status?.queue?.subtitle || "Building C, Room 204"}</p>
          </div>
          <button type="button">View on Map</button>
        </section>

        {error && <p className="status-error">{error}</p>}
      </main>

      <footer className="status-footer">
        <span>Connected to CampusQ Realtime</span>
        <span>Last updated: {updatedAt || "Just now"}</span>
      </footer>
    </div>
  );
}

export default QueueStatus;
