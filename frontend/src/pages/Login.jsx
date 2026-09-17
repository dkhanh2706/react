import { useState } from "react";
import api from "../api/axios";

function Login() {
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      console.log(res.data);

      localStorage.setItem("token", res.data.token);

      alert("Đăng nhập thành công");
    } catch (error) {
      console.log(error);

      alert(error.response.data.message);
    }
  };

  return (
    <div>
      <h2>Đăng nhập</h2>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <br />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br />

      <button onClick={handleLogin}>Đăng nhập</button>
    </div>
  );
}

export default Login;
