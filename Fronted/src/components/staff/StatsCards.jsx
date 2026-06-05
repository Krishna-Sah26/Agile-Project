import React from 'react';
import { Users, CheckCircle, Clock } from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, colorClass, bgClass }) => (
  <div className="staff-stat-card">
    <div className="staff-stat-content">
      <p className="staff-stat-label">{label}</p>
      <h3 className="staff-stat-value">{value}</h3>
    </div>
    <div className={`staff-stat-icon ${bgClass} ${colorClass}`}>
      <Icon size={24} />
    </div>
  </div>
);

const StatsCards = ({ waitingCount = 0, servedCount = 0, avgWait = "0m" }) => {
  return (
    <div className="staff-stats-grid">
      <StatCard label="Waiting" value={waitingCount} icon={Users} colorClass="icon-blue" bgClass="icon-blue-bg" />
      <StatCard label="Served Today" value={servedCount} icon={CheckCircle} colorClass="icon-green" bgClass="icon-green-bg" />
      <StatCard label="Avg Wait" value={avgWait} icon={Clock} colorClass="icon-orange" bgClass="icon-orange-bg" />
    </div>
  );
};

export default StatsCards;
