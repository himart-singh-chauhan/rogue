// Profile → My Passes (and the event page): the member's spectator passes with their QR codes.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiCall } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import TicketPass from "./TicketPass";

export default function MyPasses({ eventId = null, title = "My Event Passes", style }) {
  const { user } = useAuth();
  const [tickets, setTickets] = useState(null);
  useEffect(() => {
    if (!user?.token) return;
    apiCall("/tickets/mine", "GET", null, user.token).then(setTickets).catch(() => setTickets([]));
  }, [user?.token]);
  if (!user || !tickets) return null;
  const list = eventId ? tickets.filter((t) => t.event?.id === eventId) : tickets;
  if (!list.length) {
    return eventId ? null : (
      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, ...style }}>
        You don't have any event passes yet. <Link to="/events" style={{ color: "#FF6A00", fontWeight: 800 }}>See live events</Link>
      </div>
    );
  }
  return (
    <section style={{ display: "grid", gap: 14, ...style }}>
      <h3 style={{ fontSize: 18, fontWeight: 950, textTransform: "uppercase", margin: 0, color: "white" }}>{title}</h3>
      {list.map((t) => <TicketPass key={t.id} ticket={t} memberName={user.name} />)}
    </section>
  );
}
