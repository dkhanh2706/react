import { useLocation } from "react-router-dom";
import Chatbot from "./Chatbot";
import { useSyncExternalStore } from "react";
import { getAuthOwner } from "../../utils/auth.js";
const subscribe = callback => {
  window.addEventListener("auth-changed", callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener("auth-changed", callback); window.removeEventListener("storage", callback); };
};
function ChatbotWrapper() {
  const location = useLocation();
  const owner = useSyncExternalStore(subscribe, getAuthOwner);
  const hiddenPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
  const isAdminPage = location.pathname.startsWith("/admin");
  const shouldHide = hiddenPaths.includes(location.pathname) || isAdminPage;
  if (shouldHide) {
    return null;
  }
  return <Chatbot key={owner} />;
}
export default ChatbotWrapper;
