import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { normalizeSeatClass, normalizeSeatStatus, normalizeSeats } from "../utils/booking.js";
import useBookingFlight from "./useBookingFlight.js";
import { clearBookingDraft } from "../utils/bookingDraft.js";
import { BAGGAGE_OPTIONS, MEAL_OPTIONS } from "../utils/passenger.js";
export default function useSeatBooking() {
  const navigate = useNavigate();
  const { flight, draft, navigation, loading, error } = useBookingFlight();
  const passenger = draft?.passenger || navigation.passenger;
  const choices = draft?.services || navigation.services || {};
  const baggage = BAGGAGE_OPTIONS.find(item => item.weight === Number(choices.baggage_weight)) || BAGGAGE_OPTIONS[0];
  const meal = MEAL_OPTIONS.find(item => item.value === choices.meal_type) || MEAL_OPTIONS[0];
  const services = { baggage_weight: baggage.weight, baggage_price: baggage.price,
    meal_type: meal.value, meal_name: meal.label, meal_price: meal.price,
    insurance: !!choices.insurance, insurance_price: choices.insurance ? 50000 : 0 };
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [holdingSeat, setHoldingSeat] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để đặt vé");
      navigate("/login", {
        replace: true
      });
    }
  }, [navigate]);
  useEffect(() => {
    const fetchSeats = async () => {
      if (!flight?.id) {
        return;
      }
      try {
        setLoadingSeats(true);
        const response = await api.get(`/seats/flight/${flight.id}`);
        const rawSeats = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setSeats(normalizeSeats(rawSeats));
        setSelectedSeat(normalizeSeats(rawSeats).find(seat => seat.held_by_me && seat.status === "HOLD") || null);
      } catch (error) {
        console.error("Lỗi tải ghế:", error.response?.data || error);
        toast.error("Không thể tải danh sách ghế");
      } finally {
        setLoadingSeats(false);
      }
    };
    fetchSeats();
  }, [flight?.id]);
  const reloadSeats = async () => {
    if (!flight?.id) {
      return;
    }
    try {
      const response = await api.get(`/seats/flight/${flight.id}`);
      const rawSeats = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setSeats(normalizeSeats(rawSeats));
    } catch (error) {
      console.error("Lỗi reload ghế:", error.response?.data || error);
    }
  };
  const chooseSeat = async seat => {
    if (holdingSeat || creatingBooking) return;
    const seatStatus = normalizeSeatStatus(seat.status);

    // BOOKED
    if (seatStatus === "BOOKED") {
      toast.error("Ghế này đã có người đặt");
      return;
    }

    // HOLD
    if (seatStatus === "HOLD" && !seat.held_by_me) {
      toast.error("Ghế này đang được người khác giữ");
      return;
    }
    try {
      setHoldingSeat(true);
      const holdData = {
        flight_id: flight.id,
        seat_id: seat.id,
        seat_class: normalizeSeatClass(seat.class)
      };
      const response = await api.post("/bookings/hold-seat", holdData);
      setSelectedSeat({
        ...seat,
        class: normalizeSeatClass(seat.class),
        status: "HOLD",
        hold_expires_at: response.data?.hold_expires_at
      });
      toast.success(`Đã chọn ghế ${seat.seat_number}`);
      await reloadSeats();
    } catch (error) {
      console.error("Lỗi giữ ghế:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Không thể giữ ghế");
      await reloadSeats();
    } finally {
      setHoldingSeat(false);
    }
  };
  const baggagePrice = Number(services?.baggage_price || 0);
  const mealPrice = Number(services?.meal_price || 0);
  const insurancePrice = Number(services?.insurance_price || 0);
  const servicePrice = baggagePrice + mealPrice + insurancePrice;
  const getSeatFare = () => {
    const basePrice = Number(flight?.price || 0);
    const seatClass = normalizeSeatClass(selectedSeat?.class);

    // Giữ logic cũ của project:
    // BUSINESS = giá gốc * 1.5
    if (seatClass === "BUSINESS") {
      return basePrice * 1.5;
    }
    return seatClass === "FIRST" ? basePrice * 2 : basePrice;
  };
  const getSeatSurcharge = () => {
    const basePrice = Number(flight?.price || 0);
    return Math.max(0, getSeatFare() - basePrice);
  };
  const totalPrice = () => {
    return getSeatFare() + servicePrice;
  };
  const goPayment = async () => {
    if (!selectedSeat) {
      toast.error("Vui lòng chọn ghế trước khi tiếp tục");
      return;
    }
    if (!passenger) {
      toast.error("Không tìm thấy thông tin hành khách");
      navigate("/passenger-info", {
        state: {
          flight
        }
      });
      return;
    }
    if (creatingBooking) {
      return;
    }
    try {
      setCreatingBooking(true);
      const bookingData = {
        // FLIGHT
        flight_id: flight.id,
        // SEAT
        seat_id: selectedSeat.id,
        // PASSENGER
        passenger: {
          full_name: passenger.full_name,
          gender: passenger.gender,
          date_of_birth: passenger.date_of_birth,
          document_type: passenger.document_type,
          document_number: passenger.document_number,
          phone: passenger.phone,
          email: passenger.email
        },
        // SERVICES
        services: {
          baggage_weight: Number(services?.baggage_weight || 0),
          meal_type: services?.meal_type || "NONE",
          insurance: Boolean(services?.insurance)
        }
      };
      const response = await api.post("/bookings", bookingData);
      const serverBooking = response.data?.booking;
      clearBookingDraft(flight.id);
      const serverServices = response.data?.services || services;
      const serverPricing = response.data?.pricing || {
        base_price: Number(flight.price || 0),
        seat_surcharge: getSeatSurcharge(),
        baggage_price: baggagePrice,
        meal_price: mealPrice,
        insurance_price: insurancePrice,
        total_price: totalPrice()
      };
      navigate(`/payment?bookingId=${serverBooking.id}`, {
        state: {
          flight,
          seat: selectedSeat,
          passenger,
          services: serverServices,
          pricing: serverPricing,
          booking: serverBooking,
          price: Number(serverBooking?.total_price || serverPricing?.total_price || totalPrice()),
          hold_expires_at: response.data?.hold_expires_at || selectedSeat?.hold_expires_at
        }
      });
    } catch (error) {
      console.error("Lỗi tạo booking:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Không thể tạo booking");
      await reloadSeats();
    } finally {
      setCreatingBooking(false);
    }
  };
  const firstSeats = seats.filter(seat => normalizeSeatClass(seat.class) === "FIRST");
  const businessSeats = seats.filter(seat => normalizeSeatClass(seat.class) === "BUSINESS");
  const economySeats = seats.filter(seat => normalizeSeatClass(seat.class) === "ECONOMY");
  return {
    navigate,
    flight,
    loading,
    error,
    passenger,
    services,
    seats,
    selectedSeat,
    loadingSeats,
    creatingBooking,
    holdingSeat,
    chooseSeat,
    baggagePrice,
    mealPrice,
    insurancePrice,
    getSeatSurcharge,
    totalPrice,
    goPayment,
    firstSeats,
    businessSeats,
    economySeats
  };
}
