import React from 'react';
import { User, Plus } from 'lucide-react';

const TicketItem = ({ id, name, wait, tag }) => (
  <div className="upnext-ticket">
    <div className="upnext-ticket-top">
      <h4 className="upnext-ticket-id">{id}</h4>
      <span className="upnext-ticket-wait">{wait} wait</span>
    </div>
    <div className="upnext-ticket-user">
      <User size={16} />
      <span>{name}</span>
    </div>
    {tag && <span className="upnext-ticket-tag">{tag}</span>}
  </div>
);

const UpNextPanel = ({ tickets = [], onManualAdd }) => {
  return (
    <aside className="upnext-panel">
      <div className="upnext-header">
        <div className="upnext-header-left">
          <h3>Up Next</h3>
          <span>{tickets.length}</span>
        </div>
        <button className="upnext-view-btn">View All</button>
      </div>

      <div className="upnext-list">
        {tickets.length === 0 && (
          <p className="upnext-empty">No waiting users</p>
        )}

        {tickets.map((ticket, index) => (
          <TicketItem
            key={ticket._id || ticket.token}
            id={ticket.token}
            name={ticket.name}
            wait={`${(index + 1) * 5} min`}
            tag={ticket.queueId}
          />
        ))}
      </div>

      <div className="upnext-footer">
        <button className="upnext-add-btn" onClick={onManualAdd}>
          <Plus size={18} />
          Manually Add Ticket
        </button>
      </div>
    </aside>
  );
};

export default UpNextPanel;
