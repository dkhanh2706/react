import { Navigate, useLocation } from "react-router-dom";

// Keep old bookmarks and callers working through the same search and login flow.
export default function FlightList() {
  const location = useLocation();
  return <Navigate to={`/flights${location.search}`} state={location.state} replace />;
}
