import { useState } from "react";
import { getAvatarUrl } from "../../utils/avatar";

// The parent controls avatar size and shape; unavailable images keep initials.
export default function AccountAvatar({ url, name, fallback }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const source = getAvatarUrl(url);
  if (!source || failedUrl === source) {
    return <>{fallback || name?.trim().charAt(0).toUpperCase() || "U"}</>;
  }
  return <img src={source} alt={`Ảnh đại diện ${name || ""}`} onError={() => setFailedUrl(source)}
    style={{ width: "100%", height: "100%", borderRadius: "inherit", objectFit: "cover", display: "block" }} />;
}
