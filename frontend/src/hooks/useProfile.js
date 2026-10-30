import { useNavigate } from "react-router-dom";
import { getStoredUser, clearAuthStorage, isTokenExpired } from "../utils/auth.js";
import { PROFILE_API } from "../utils/profile.js";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useAvatarUpload from "./useAvatarUpload.js";
import usePasswordChange from "./usePasswordChange.js";
import { getAvatarUrl } from "../utils/avatar";
export default function useProfile() {
  const navigate = useNavigate();
  const storedUser = getStoredUser({});
  const [user, setUser] = useState({
    id: storedUser.id || null,
    full_name: storedUser.full_name || storedUser.name || "",
    email: storedUser.email || "",
    phone: storedUser.phone || "",
    birth_date: storedUser.birth_date || "",
    gender: storedUser.gender || "",
    role: storedUser.role || "CUSTOMER",
    avatar_url: storedUser.avatar_url || ""
  });
  const [form, setForm] = useState({
    full_name: storedUser.full_name || storedUser.name || "",
    phone: storedUser.phone || "",
    birth_date: storedUser.birth_date || "",
    gender: storedUser.gender || ""
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const handleInvalidSession = (message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.") => {
    clearAuthStorage();
    toast.error(message);
    navigate("/login", {
      replace: true
    });
  };
  const getValidToken = () => {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      handleInvalidSession();
      return null;
    }
    return token;
  };
  const {
    fileInputRef,
    uploadingAvatar,
    avatarPreview,
    handleAvatarSelect
  } = useAvatarUpload({
    getValidToken,
    handleInvalidSession,
    setUser
  });
  const {
    passwordOpen,
    codeRequested,
    requestingCode,
    changingPassword,
    passwordError,
    passwordForm,
    openPasswordModal,
    closePasswordModal,
    requestPasswordCode,
    handlePasswordInput,
    changePassword
  } = usePasswordChange({
    getValidToken,
    handleInvalidSession,
    navigate
  });
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const loadProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        if (active) {
          setLoading(false);
        }
        clearAuthStorage();
        navigate("/login", {
          replace: true
        });
        return;
      }
      try {
        const response = await fetch(PROFILE_API, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          },
          signal: controller.signal
        });
        let data = {};
        try {
          data = await response.json();
        } catch {
          data = {};
        }
        if (response.status === 401 || response.status === 403) {
          if (!active) {
            return;
          }
          clearAuthStorage();
          toast.error(data.message || "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          navigate("/login", {
            replace: true
          });
          return;
        }
        if (!response.ok) {
          throw new Error(data.message || "Không thể tải hồ sơ");
        }
        if (!active) {
          return;
        }
        const profile = data.user || {};
        setUser(profile);
        setForm({
          full_name: profile.full_name || "",
          phone: profile.phone || "",
          birth_date: profile.birth_date || "",
          gender: profile.gender || ""
        });
        localStorage.setItem("user", JSON.stringify(profile));
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }
        console.error("LOAD PROFILE ERROR:", error);
        if (active) {
          toast.error(error.message || "Không thể tải hồ sơ");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadProfile();
    return () => {
      active = false;
      controller.abort();
    };
  }, [navigate]);
  const handleChange = event => {
    const {
      name,
      value
    } = event.target;
    setForm(current => ({
      ...current,
      [name]: value
    }));
  };
  const handleEdit = () => {
    setForm({
      full_name: user.full_name || "",
      phone: user.phone || "",
      birth_date: user.birth_date || "",
      gender: user.gender || ""
    });
    setEditing(true);
  };
  const handleCancel = () => {
    setForm({
      full_name: user.full_name || "",
      phone: user.phone || "",
      birth_date: user.birth_date || "",
      gender: user.gender || ""
    });
    setEditing(false);
  };
  const handleSave = async () => {
    if (saving) {
      return;
    }
    const fullName = form.full_name.trim();
    const phone = form.phone.trim();
    if (!fullName) {
      toast.error("Vui lòng nhập họ và tên");
      return;
    }
    if (!/^0\d{9}$/.test(phone)) {
      toast.error("Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0");
      return;
    }
    const token = getValidToken();
    if (!token) {
      return;
    }
    try {
      setSaving(true);
      const response = await fetch(PROFILE_API, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          birth_date: form.birth_date || null,
          gender: form.gender || null
        })
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
        throw new Error(data.message || "Không thể cập nhật thông tin");
      }
      const updatedUser = data.user;
      if (!updatedUser) {
        throw new Error("Server không trả về thông tin người dùng");
      }
      setUser(updatedUser);
      setForm({
        full_name: updatedUser.full_name || "",
        phone: updatedUser.phone || "",
        birth_date: updatedUser.birth_date || "",
        gender: updatedUser.gender || ""
      });
      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.dispatchEvent(new CustomEvent("userUpdated"));
      setEditing(false);
      toast.success("Cập nhật thông tin thành công");
    } catch (error) {
      console.error("SAVE PROFILE ERROR:", error);
      toast.error(error.message || "Không thể cập nhật thông tin");
    } finally {
      setSaving(false);
    }
  };
  const displayName = user.full_name || user.email || "Người dùng";
  const avatarLetter = displayName.trim().charAt(0).toUpperCase() || "U";
  const avatarSource = avatarPreview || getAvatarUrl(user.avatar_url);

  return {
    navigate,
    user,
    form,
    editing,
    loading,
    saving,
    fileInputRef,
    uploadingAvatar,
    handleAvatarSelect,
    passwordOpen,
    codeRequested,
    requestingCode,
    changingPassword,
    passwordError,
    passwordForm,
    openPasswordModal,
    closePasswordModal,
    requestPasswordCode,
    handlePasswordInput,
    changePassword,
    handleChange,
    handleEdit,
    handleCancel,
    handleSave,
    displayName,
    avatarLetter,
    avatarSource,
  };
}
