import React from 'react';
import { SkipForward, Bell, CheckCircle2 } from 'lucide-react';

const ActionButtons = ({ onCallNext, onSkip, onMarkServed }) => {
  return (
    <div className="staff-actions-wrap">
      <div className="staff-actions-grid">
        <button className="staff-action-btn action-skip" onClick={onSkip}>
          <SkipForward size={20} />
          Skip
        </button>
        <button className="staff-action-btn action-call" onClick={onCallNext}>
          <Bell size={22} />
          Call Next
        </button>
        <button className="staff-action-btn action-served" onClick={onMarkServed}>
          <CheckCircle2 size={22} />
          Mark Served
        </button>
      </div>
    </div>
  );
};

export default ActionButtons;
