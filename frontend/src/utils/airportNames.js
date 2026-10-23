// Tên hiển thị dùng chung cho vé và đánh giá; giữ nguyên giá trị lưu trên vé.
const destinations = [
  ["Hà Nội", "HAN", "HaNoi"],
  ["TP. Hồ Chí Minh", "SGN", "HoChiMinh", "HoChiMinhCity", "TPHCM", "SaiGon"],
  ["Đà Nẵng", "DAD", "DaNang"],
  ["Phú Quốc", "PQC", "PhuQuoc"],
  ["Nha Trang", "CXR", "NhaTrang", "CamRanh"],
  ["Đà Lạt", "DLI", "DaLat"],
  ["Huế", "HUI", "Hue"],
  ["Cần Thơ", "VCA", "CanTho"],
  ["Tokyo - Haneda", "HND"],
  ["Tokyo - Narita", "NRT"],
  ["Singapore", "SIN"],
];

const normalize = value => String(value).normalize("NFD").replace(/\p{M}/gu, "")
  .replace(/[đĐ]/g, "d").replace(/[^a-z0-9]/gi, "").toLowerCase();
const names = new Map(destinations.flatMap(([name, ...aliases]) =>
  [name, ...aliases].map(alias => [normalize(alias), name])));

export function airportName(value, fallback = "—") {
  const text = String(value ?? "").trim();
  return text ? names.get(normalize(text)) || text : fallback;
}
