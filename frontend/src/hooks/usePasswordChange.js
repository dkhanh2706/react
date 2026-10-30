import { useState } from "react";
import { clearAuthStorage } from "../utils/auth.js";
import { PASSWORD_CODE_API, PASSWORD_CHANGE_API } from "../utils/profile.js";
import toast from "react-hot-toast";
export default function usePasswordChange({
  getValidToken,
  handleInvalidSession,
  navigate
}) {
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [codeRequested, setCodeRequested] = useState(false);
  const [requestingCode, setRequestingCode] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    code: "",
    newPassword: "",
    confirmPassword: ""
  });
  const openPasswordModal = () => {
    setPasswordForm({
      code: "",
      newPassword: "",
      confirmPassword: ""
    });
    setCodeRequested(false);
    setPasswordError("");
    setPasswordOpen(true);
  };
  const closePasswordModal = () => {
    if (requestingCode || changingPassword) {
      return;
    }
    setPasswordOpen(false);
    setCodeRequested(false);
    setPasswordError("");
    setPasswordForm({
      code: "",
      newPassword: "",
      confirmPassword: ""
    });
  };
  const requestPasswordCode = async () => {
    if (requestingCode) {
      return;
    }
    const token = getValidToken();
    if (!token) {
      return;
    }
    try {
      setRequestingCode(true);
      setPasswordError("");
      const response = await fetch(PASSWORD_CODE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
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
        throw new Error(data.message || "Không thể gửi mã xác nhận");
      }
      setCodeRequested(true);
      toast.success(data.message || "Mã xác nhận đã được gửi đến email của bạn");
    } catch (error) {
      console.error("REQUEST CODE ERROR:", error);
      const message = error.message || "Không thể gửi mã xác nhận";
      setPasswordError(message);
      toast.error(message);
    } finally {
      setRequestingCode(false);
    }
  };
  const handlePasswordInput = event => {
    const {
      name,
      value
    } = event.target;
    let nextValue = value;
    if (name === "code") {
      nextValue = value.replace(/\D/g, "").slice(0, 6);
    }
    setPasswordForm(current => ({
      ...current,
      [name]: nextValue
    }));
    if (passwordError) {
      setPasswordError("");
    }
  };
  const changePassword = async () => {
    if (changingPassword) {
      return;
    }
    const {
      code,
      newPassword,
      confirmPassword
    } = passwordForm;
    if (!/^\d{6}$/.test(code)) {
      const message = "Mã xác nhận phải gồm 6 chữ số";
      setPasswordError(message);
      toast.error(message);
      return;
    }
    if (newPassword.length < 8 || new TextEncoder().encode(newPassword).length > 72) {
      const message = "Mật khẩu mới phải từ 8 ký tự và không vượt quá 72 byte";
      setPasswordError(message);
      toast.error(message);
      return;
    }
    if (newPassword !== confirmPassword) {
      const message = "Xác nhận mật khẩu không khớp";
      setPasswordError(message);
      toast.error(message);
      return;
    }
    const token = getValidToken();
    if (!token) {
      return;
    }
    try {
      setChangingPassword(true);
      setPasswordError("");
      const response = await fetch(PASSWORD_CHANGE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          code,
          newPassword,
          confirmPassword
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
        throw new Error(data.message || "Không thể đổi mật khẩu");
      }
      toast.success(data.message || "Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      clearAuthStorage();
      navigate("/login", {
        replace: true
      });
    } catch (error) {
      console.error("CHANGE PASSWORD ERROR:", error);
      const message = error.message || "Không thể đổi mật khẩu";
      setPasswordError(message);
      toast.error(message);
    } finally {
      setChangingPassword(false);
    }
  };
  return {
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
  };
}
