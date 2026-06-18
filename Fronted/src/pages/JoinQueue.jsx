import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Building2, Clock3, Users, User, Smartphone, ArrowRight, LayoutGrid } from "lucide-react";
import { API_URL } from "../config";
import socket from "../socket"; // ADDED: realtime updates
import "./JoinQueue.css";

function JoinQueue() {
  const navigate = useNavigate(); // ADDED: navigate to live status page after join
  const { id } = useParams(); // ADDED: queue id from URL (/join/:id)

  const [queue, setQueue] = useState(null); // ADDED: queue details state
  const [name, setName] = useState(""); // ADDED: user full name state
  const [phone, setPhone] = useState(""); // ADDED: user phone state
  const [agree, setAgree] = useState(false); // ADDED: terms checkbox state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [queueStatus, setQueueStatus] = useState("open"); // ADDED: queue status

  // ADDED: allow only letters and spaces for full name
  const handleNameChange = (e) => {
    const value = e.target.value;
    if (/^[A-Za-z\s]*$/.test(value)) {
      setName(value);
    }
  };

  // ADDED: allow numbers and optional leading + for country code
  const handlePhoneChange = (e) => {
    const raw = e.target.value;
    const cleaned = raw.startsWith("+")
      ? `+${raw.slice(1).replace(/\D/g, "")}`
      : raw.replace(/\D/g, "");
    setPhone(cleaned);
  };

  // ADDED: fetch queue details when page opens via QR
  useEffect(() => {
    let isMounted = true;

    async function fetchQueueDetails() {
      try {
        const res = await fetch(`${API_URL}/api/queue/${id}`);
        const data = await res.json();

        if (isMounted) {
          if (data.success) {
            setQueue(data.queue);
            setQueueStatus((data.queue?.status || "OPEN").toLowerCase());
          } else {
            setMessage(data.message || "Queue not found");
          }
        }
      } catch (error) {
        if (isMounted) {
          setMessage("Unable to load queue details");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchQueueDetails();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // ADDED: realtime status change (pause/open)
  useEffect(() => {
    const handler = (updated) => {
      if (updated?.queueId === id) {
        setQueueStatus(updated.status);
        if (updated.status !== "open") {
          setMessage("Queue is paused. Please try later.");
        }
      }
    };
    socket.on("queueStatusChanged", handler);
    return () => socket.off("queueStatusChanged", handler);
  }, [id]);

  // ADDED: join queue submit handler
  const handleJoinQueue = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!name.trim() || !phone.trim()) {
      setMessage("Please enter full name and mobile number");
      return;
    }

    // ADDED: strict validation for name and phone
    if (!/^[A-Za-z\s]+$/.test(name.trim())) {
      setMessage("Full Name can contain only A to Z letters");
      return;
    }

    if (!/^\+?\d+$/.test(phone.trim())) {
      setMessage("Mobile Number can contain only numbers or +");
      return;
    }

    // ADDED: India-only numbers (+91XXXXXXXXXX or 10 digits)
    if (phone.trim().startsWith("+")) {
      if (!/^\+91\d{10}$/.test(phone.trim())) {
        setMessage("Please enter a valid India number (+91 followed by 10 digits)");
        return;
      }
    } else if (!/^\d{10}$/.test(phone.trim())) {
      setMessage("Mobile Number must be exactly 10 digits");
      return;
    }

    if (!agree) {
      setMessage("Please accept Terms of Service and Privacy Policy");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(`${API_URL}/api/queue/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          queueId: id,
          name: name.trim(),
          phone: phone.trim()
        })
      });

      const data = await res.json();

      if (data.success) {
        // ADDED: support both token and tokenNumber from backend response
        const generatedToken = data.token || data.tokenNumber;
        if (!generatedToken) {
          setMessage("Token not received from server. Please try again.");
          return;
        }

        // ADDED: redirect to status page with token
        navigate(`/status/${generatedToken}?queueId=${id}`); // ADDED: pass queueId to avoid token conflicts
        setName("");
        setPhone("");
        setAgree(false);
      } else {
        setMessage(data.message || "Unable to join queue");
      }
    } catch (error) {
      setMessage("Server error while joining queue");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="join-page">
      <header className="join-topbar">
        <div className="brand">
          <div className="brand-icon">
            <LayoutGrid size={16} color="white" />
          </div>
          <span className="text">CampusQ</span>
        </div>
        <div className="topbar-actions">
          <button className="ghost-btn" type="button">Help</button>
          <button className="solid-btn" type="button">Log In</button>
        </div>
      </header>

      <main className="join-main">
        <section className="join-card">
          <div className="queue-head">
            <div className="queue-icon">
              <Building2 size={30} />
            </div>
            <span className={`status-pill ${queueStatus === "open" ? "open" : "paused"}`}>
              {queueStatus.toUpperCase()}
            </span>
            <h1>{queue?.title || "City Registrar Office"}</h1>
            <p>{queue?.subtitle || "Counter 3 - General Enquiries"}</p>
          </div>

          <div className="stats-row">
            <div className="stat-box">
              <p>EST. WAIT TIME</p>
              <h3><Clock3 size={18} /> {queue?.estWaitTime || "15 mins"}</h3>
            </div>
            <div className="stat-box">
              <p>PEOPLE AHEAD</p>
              <h3><Users size={18} /> {queue?.peopleAhead ?? 8}</h3>
            </div>
          </div>

          <form className="join-form" onSubmit={handleJoinQueue}>
            <h2>Join the Queue</h2>
            <p className="subtitle">Please enter your details to reserve your spot.</p>

            <label htmlFor="fullName">Full Name</label>
            <div className="input-wrap">
              <User size={16} />
              <input
                id="fullName"
                type="text"
                placeholder="e.g. Jane Doe"
                value={name}
                onChange={handleNameChange}
                autoComplete="name"
              />
            </div>

            <label htmlFor="mobile">Mobile Number</label>
            <div className="input-wrap">
              <Smartphone size={16} />
              <input
                id="mobile"
                type="text"
                placeholder="(555) 000-0000"
                value={phone}
                onChange={handlePhoneChange}
                inputMode="tel"
                maxLength={16}
                autoComplete="tel"
              />
            </div>

            <p className="hint">We'll text you when it's your turn.</p>

            <label className="agree-row">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span>I agree to the Terms of Service and Privacy Policy.</span>
            </label>

            <button className="join-btn" type="submit" disabled={loading || submitting || queueStatus !== "open"}>
              {submitting ? "Joining..." : "Join Queue"} <ArrowRight size={18} />
            </button>

            {message && <p className="form-message">{message}</p>}
          </form>

          <div className="support-row">
            Need assistance? <button type="button">Contact Support</button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default JoinQueue;
