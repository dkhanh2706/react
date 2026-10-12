import { useLocation } from "react-router-dom";
import Chatbot from "./Chatbot";

function ChatbotWrapper() {
  const location = useLocation();

  const hiddenPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];

  const isAdminPage = location.pathname.startsWith("/admin");

  const shouldHide = hiddenPaths.includes(location.pathname) || isAdminPage;

  if (shouldHide) {
    return null;
  }

  return <Chatbot />;
}

export default ChatbotWrapper;
