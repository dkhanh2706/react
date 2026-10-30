import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { AVATAR_API } from "../utils/profile.js";
export default function useAvatarUpload({
  getValidToken,
  handleInvalidSession,
  setUser
}) {
  const fileInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const handleAvatarSelect = event => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Chỉ chọn JPG, PNG hoặc WEBP");
      event.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 2MB");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
    uploadAvatar(file);
  };
  const uploadAvatar = async file => {
    const token = getValidToken();
    if (!token) {
      return;
    }
    try {
      setUploadingAvatar(true);
      const body = new FormData();
      body.append("avatar", file);
      const response = await fetch(AVATAR_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body
      });
      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }
      if (response.status === 401 || response.status === 403) {
        handleInvalidSession(data.message);
        return;
      }
      if (!response.ok) {
        throw new Error(data.message || "Không thể tải ảnh đại diện");
      }
      const updatedUser = data.user;
      if (!updatedUser) {
        throw new Error("Server không trả về thông tin người dùng");
      }
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.dispatchEvent(new CustomEvent("userUpdated"));
      setAvatarPreview("");
      toast.success("Đổi ảnh đại diện thành công");
    } catch (error) {
      console.error("UPLOAD AVATAR ERROR:", error);
      setAvatarPreview("");
      toast.error(error.message || "Không thể đổi ảnh đại diện");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  return {
    fileInputRef,
    uploadingAvatar,
    avatarPreview,
    handleAvatarSelect
  };
}
