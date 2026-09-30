import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api/flights";

function FlightManagement() {
  const [flights, setFlights] = useState([]);

  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    flight_number: "",
    airline_id: 1,
    airplane_id: 1,
    departure_airport_id: 1,
    arrival_airport_id: 2,
    departure_time: "",
    arrival_time: "",
    price: 2000000,
    status: "AVAILABLE",
  });

  // =========================
  // GET FLIGHTS
  // =========================

  const loadFlights = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        API_URL,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log(response.data);

      setFlights(response.data.data || response.data);
    } catch (error) {
      console.log(error);

      alert("Không tải được danh sách chuyến bay");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadFlights();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // =========================
  // CHANGE INPUT
  // =========================

  const handleChange = (e) => {
    setForm({
      ...form,

      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // CREATE / UPDATE
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (editId) {
        await axios.put(
          `${API_URL}/${editId}`,

          form,

          config,
        );

        alert("Cập nhật chuyến bay thành công");
      } else {
        await axios.post(
          API_URL,

          form,

          config,
        );

        alert("Thêm chuyến bay thành công");
      }

      resetForm();

      loadFlights();
    } catch (error) {
      console.log(error.response);

      alert(error.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  // =========================
  // EDIT
  // =========================

  const handleEdit = (flight) => {
    setEditId(flight.id);

    setForm({
      flight_number: flight.flight_number,

      airline_id: flight.airline_id,

      airplane_id: flight.airplane_id,

      departure_airport_id: flight.departure_airport_id,

      arrival_airport_id: flight.arrival_airport_id,

      departure_time: flight.departure_time
        ? flight.departure_time.substring(0, 16)
        : "",

      arrival_time: flight.arrival_time
        ? flight.arrival_time.substring(0, 16)
        : "",

      price: flight.price,

      status: flight.status,
    });
  };

  // =========================
  // DELETE
  // =========================

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa chuyến bay?")) return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(
        `${API_URL}/${id}`,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      alert("Xóa chuyến bay thành công");

      loadFlights();
    } catch (error) {
      console.log(error);

      alert("Xóa thất bại");
    }
  };

  // =========================
  // RESET
  // =========================

  const resetForm = () => {
    setEditId(null);

    setForm({
      flight_number: "",
      airline_id: 1,
      airplane_id: 1,
      departure_airport_id: 1,
      arrival_airport_id: 2,
      departure_time: "",
      arrival_time: "",
      price: 2000000,
      status: "AVAILABLE",
    });
  };

  return (
    <div
      style={{
        padding: "30px",
      }}
    >
      <h2>Quản lý chuyến bay</h2>

      <form onSubmit={handleSubmit}>
        <input
          name="flight_number"
          placeholder="Mã chuyến bay"
          value={form.flight_number}
          onChange={handleChange}
        />

        <br />
        <br />

        <input
          type="datetime-local"
          name="departure_time"
          value={form.departure_time}
          onChange={handleChange}
        />

        <br />
        <br />

        <input
          type="datetime-local"
          name="arrival_time"
          value={form.arrival_time}
          onChange={handleChange}
        />

        <br />
        <br />

        <input
          type="number"
          name="price"
          value={form.price}
          onChange={handleChange}
        />

        <br />
        <br />

        <button type="submit">{editId ? "Cập nhật" : "Thêm chuyến bay"}</button>

        {editId && (
          <button type="button" onClick={resetForm}>
            Hủy
          </button>
        )}
      </form>

      <hr />

      <h3>Danh sách chuyến bay</h3>

      <table border="1" width="100%" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>

            <th>Mã chuyến</th>

            <th>Hãng bay</th>

            <th>Giá</th>

            <th>Status</th>

            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {flights.map((flight) => (
            <tr key={flight.id}>
              <td>{flight.id}</td>

              <td>{flight.flight_number}</td>

              <td>{flight.airline || flight.airline_id}</td>

              <td>
                {Number(flight.price).toLocaleString()}
                VNĐ
              </td>

              <td>{flight.status}</td>

              <td>
                <button onClick={() => handleEdit(flight)}>Sửa</button>

                <button onClick={() => handleDelete(flight.id)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default FlightManagement;
