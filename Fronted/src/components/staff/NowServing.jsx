import React, { useEffect, useRef, useState } from 'react';
import { User, Clock, Phone, Timer } from 'lucide-react';

const InfoTile = ({ icon: Icon, label, value, subValue, highlight }) => (
  <div className={`serving-info-tile ${highlight ? 'serving-info-tile-highlight' : ''}`}>
    <div className={`serving-info-icon ${highlight ? 'serving-info-icon-highlight' : ''}`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="serving-info-label">{label}</p>
      <p className={`serving-info-value ${highlight ? 'serving-info-value-highlight' : ''}`}>{value}</p>
      {subValue && <p className="serving-info-subvalue">{subValue}</p>}
    </div>
  </div>
);

const NowServing = ({ serving, isPaused = false }) => {
  const [serviceSeconds, setServiceSeconds] = useState(0); // ADDED: live service timer
  const pauseStartRef = useRef(null); // ADDED: pause start time
  const totalPausedMsRef = useRef(0); // ADDED: total paused duration

  // ADDED: update service timer every second
  useEffect(() => {
    if (!serving?.updatedAt) {
      setServiceSeconds(0);
      pauseStartRef.current = null;
      totalPausedMsRef.current = 0;
      return undefined;
    }

    const startedAt = new Date(serving.updatedAt).getTime();
    const tick = () => {
      if (isPaused) {
        if (!pauseStartRef.current) {
          pauseStartRef.current = Date.now();
        }
        return;
      }

      if (pauseStartRef.current) {
        totalPausedMsRef.current += Date.now() - pauseStartRef.current;
        pauseStartRef.current = null;
      }

      const diffMs = Date.now() - startedAt - totalPausedMsRef.current;
      const diff = Math.max(0, Math.floor(diffMs / 1000));
      setServiceSeconds(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [serving?.updatedAt, isPaused]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")} : ${String(secs).padStart(2, "0")}`;
  };
  return (
    <section className="now-serving-panel">
      <div className="now-serving-main">
        <div className="now-serving-badge">
          <div className="now-serving-dot" />
          <span>Now Serving</span>
        </div>
        <h1 className="now-serving-ticket">{serving?.token || "None"}</h1>
        <p className="now-serving-service">{serving?.queueId || "No active queue"}</p>
      </div>

      <div className="now-serving-grid">
        <InfoTile icon={User} label="Visitor Name" value={serving?.name || "—"} />
        <InfoTile
          icon={Clock}
          label="Waited For"
          value={serving?.createdAt ? `${Math.max(1, Math.floor((Date.now() - new Date(serving.createdAt).getTime()) / 60000))} mins` : "—"}
          subValue={serving?.createdAt ? `Since ${new Date(serving.createdAt).toLocaleTimeString()}` : ""}
        />
        <InfoTile icon={Phone} label="Contact" value={serving?.phone || "—"} />
        <InfoTile icon={Timer} label="Service Timer" value={serving ? formatDuration(serviceSeconds) : "—"} highlight={true} />
      </div>
    </section>
  );
};

export default NowServing;
