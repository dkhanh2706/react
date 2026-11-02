import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { getInitialPassenger, passengerFromProfile, BAGGAGE_OPTIONS, MEAL_OPTIONS } from "../utils/passenger.js";
import api from "../api/axios";
import toast from "react-hot-toast";
export default function usePassengerInfo() {
  const location = useLocation();
  const navigate = useNavigate();
  const flight = location.state?.flight;
  const [passenger, setPassenger] = useState(getInitialPassenger);
  const editedFields = useRef(new Set());
  const [baggageWeight, setBaggageWeight] = useState(0);
  const [mealType, setMealType] = useState("NONE");
  const [insurance, setInsurance] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để đặt vé");
      navigate("/login", {
        replace: true
      });
      return;
    }
    const controller = new AbortController();
    api.get("/users/profile", { signal: controller.signal }).then(({ data }) => {
      if (controller.signal.aborted || !data.user) return;
      const profile = passengerFromProfile(data.user);
      setPassenger(current => ({ ...current, ...Object.fromEntries(
        ["full_name", "email", "phone", "gender", "date_of_birth"].filter(key => !editedFields.current.has(key)).map(key => [key, profile[key]])
      ) }));
    }).catch(error => {
      if (!controller.signal.aborted) console.error("Không tải được thông tin hồ sơ hành khách", error);
    });
    return () => controller.abort();
  }, [navigate]);
  const selectedBaggage = useMemo(() => {
    return BAGGAGE_OPTIONS.find(item => Number(item.weight) === Number(baggageWeight)) || BAGGAGE_OPTIONS[0];
  }, [baggageWeight]);
  const selectedMeal = useMemo(() => {
    return MEAL_OPTIONS.find(item => item.value === mealType) || MEAL_OPTIONS[0];
  }, [mealType]);
  const baseFlightPrice = Number(flight?.price || 0);
  const baggagePrice = Number(selectedBaggage?.price || 0);
  const mealPrice = Number(selectedMeal?.price || 0);
  const insurancePrice = insurance ? 50000 : 0;
  const servicePrice = baggagePrice + mealPrice + insurancePrice;
  const temporaryPrice = baseFlightPrice + servicePrice;
  const handlePassengerChange = event => {
    const {
      name,
      value
    } = event.target;
    editedFields.current.add(name);
    setPassenger(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const validateForm = () => {
    const fullName = passenger.full_name.trim();
    const documentNumber = passenger.document_number.trim();
    const phone = passenger.phone.trim();
    const email = passenger.email.trim();

    // FULL NAME
    if (!fullName) {
      toast.error("Vui lòng nhập họ và tên hành khách");
      return false;
    }
    if (fullName.length < 2) {
      toast.error("Họ và tên hành khách không hợp lệ");
      return false;
    }

    // GENDER
    if (!passenger.gender) {
      toast.error("Vui lòng chọn giới tính");
      return false;
    }

    // DATE OF BIRTH
    if (!passenger.date_of_birth) {
      toast.error("Vui lòng chọn ngày sinh");
      return false;
    }
    const birthDate = new Date(passenger.date_of_birth);
    const today = new Date();
    if (Number.isNaN(birthDate.getTime()) || birthDate > today) {
      toast.error("Ngày sinh không hợp lệ");
      return false;
    }

    // DOCUMENT
    if (!passenger.document_type) {
      toast.error("Vui lòng chọn loại giấy tờ");
      return false;
    }
    if (!documentNumber) {
      toast.error("Vui lòng nhập số CCCD/Hộ chiếu");
      return false;
    }
    if (passenger.document_type === "CCCD") {
      if (!/^(\d{9}|\d{12})$/.test(documentNumber)) {
        toast.error("Số CCCD/CMND phải gồm 9 hoặc 12 chữ số");
        return false;
      }
    } else if (passenger.document_type === "PASSPORT") {
      if (!/^[A-Z0-9]{6,20}$/i.test(documentNumber)) {
        toast.error("Số hộ chiếu phải gồm 6–20 chữ cái hoặc chữ số");
        return false;
      }
    } else {
      toast.error("Loại giấy tờ không hợp lệ");
      return false;
    }

    // PHONE
    if (!phone) {
      toast.error("Vui lòng nhập số điện thoại");
      return false;
    }
    const normalizedPhone = phone.replace(/\s/g, "");
    if (!/^(0\d{9}|\+84\d{9})$/.test(normalizedPhone)) {
      toast.error("Số điện thoại không hợp lệ");
      return false;
    }

    // EMAIL
    if (!email) {
      toast.error("Vui lòng nhập email");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Email không hợp lệ");
      return false;
    }
    return true;
  };
  const handleContinue = () => {
    if (!validateForm()) {
      return;
    }
    const passengerData = {
      full_name: passenger.full_name.trim(),
      gender: passenger.gender,
      date_of_birth: passenger.date_of_birth,
      document_type: passenger.document_type,
      document_number: passenger.document_number.trim().toUpperCase(),
      phone: passenger.phone.trim(),
      email: passenger.email.trim()
    };
    const services = {
      baggage_weight: Number(selectedBaggage.weight || 0),
      baggage_price: Number(selectedBaggage.price || 0),
      meal_type: selectedMeal.value,
      meal_name: selectedMeal.label,
      meal_price: Number(selectedMeal.price || 0),
      insurance: Boolean(insurance),
      insurance_price: Number(insurancePrice),
      service_price: Number(servicePrice)
    };
    navigate("/booking", {
      state: {
        flight,
        passenger: passengerData,
        services
      }
    });
  };
  return {
    navigate,
    flight,
    passenger,
    baggageWeight,
    setBaggageWeight,
    mealType,
    setMealType,
    insurance,
    setInsurance,
    selectedBaggage,
    selectedMeal,
    baseFlightPrice,
    baggagePrice,
    mealPrice,
    insurancePrice,
    temporaryPrice,
    handlePassengerChange,
    handleContinue
  };
}
