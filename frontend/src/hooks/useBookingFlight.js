import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { readBookingDraft } from "../utils/bookingDraft.js";

export default function useBookingFlight() {
  const location = useLocation();
  const [params] = useSearchParams();
  const flightId = params.get("flightId") || location.state?.flight?.id;
  const [loaded, setLoaded] = useState(null);
  const [failure, setFailure] = useState(null);
  const matches = value => value?.id != null && flightId != null && String(value.id) === String(flightId);
  const draft = readBookingDraft(flightId);
  const initial = matches(location.state?.flight) ? location.state.flight : draft?.flight;
  const error = failure?.id === String(flightId) ? failure.message : "";
  const flight = error ? null : matches(loaded) ? loaded : initial;

  useEffect(() => {
    if (!flightId) return;
    const controller = new AbortController();
    api.get(`/flights/${encodeURIComponent(flightId)}`, { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) { setLoaded(data.data); setFailure(null); }
    }).catch(err => {
      if (!controller.signal.aborted) setFailure({ id: String(flightId), message: err.response?.data?.message || "Không tải được chuyến bay. Vui lòng tìm lại chuyến." });
    });
    return () => controller.abort();
  }, [flightId]);

  return { flight, flightId, draft, navigation: matches(location.state?.flight) ? location.state : {}, error, loading: !!flightId && !flight && !error };
}
