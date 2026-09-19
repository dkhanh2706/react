import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const logout = () => {
    localStorage.removeItem("token");

    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div className="home">
      <h1>✈️ Airline Booking</h1>

      <h2>Xin chào {user?.full_name}</h2>

      <p>Chào mừng bạn đến hệ thống đặt vé máy bay trực tuyến</p>

      <div className="search-box">
        <h3>Tìm chuyến bay</h3>

        <input placeholder="Điểm đi" />

        <input placeholder="Điểm đến" />

        <button>Tìm kiếm</button>
      </div>

      <button onClick={logout}>Đăng xuất</button>
    </div>
  );
}

export default Home;
