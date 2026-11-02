const normalizeChatText = value => String(value ?? "").normalize("NFD")
  .replace(/\p{M}/gu, "").replace(/đ/gi, "d").toLowerCase()
  .replace(/\./g, "").replace(/\s+/g, " ").trim();

const airports = {
    // HÀ NỘI
    "hà nội": "HAN",
    "ha noi": "HAN",
    hn: "HAN",
    "nội bài": "HAN",
    "noi bai": "HAN",
    han: "HAN",
    // TP.HCM
    hcm: "SGN",
    tphcm: "SGN",
    "tp hcm": "SGN",
    "tp hồ chí minh": "SGN",
    "tp ho chi minh": "SGN",
    "thành phố hồ chí minh": "SGN",
    "thanh pho ho chi minh": "SGN",
    "hồ chí minh": "SGN",
    "ho chi minh": "SGN",
    "sài gòn": "SGN",
    "sai gon": "SGN",
    "tân sơn nhất": "SGN",
    "tan son nhat": "SGN",
    sgn: "SGN",
    // ĐÀ NẴNG
    "đà nẵng": "DAD",
    "da nang": "DAD",
    dad: "DAD",
    // PHÚ QUỐC
    "phú quốc": "PQC",
    "phu quoc": "PQC",
    pqc: "PQC",
    // NHA TRANG
    "nha trang": "CXR",
    "cam ranh": "CXR",
    cxr: "CXR",
    // ĐÀ LẠT
    "đà lạt": "DLI",
    "da lat": "DLI",
    "liên khương": "DLI",
    "lien khuong": "DLI",
    dli: "DLI",
    // HUẾ
    huế: "HUI",
    hue: "HUI",
    "phú bài": "HUI",
    "phu bai": "HUI",
    hui: "HUI",
    // CẦN THƠ
    "cần thơ": "VCA",
    "can tho": "VCA",
    vca: "VCA",
    // TOKYO
    haneda: "HND",
    "tokyo haneda": "HND",
    hnd: "HND",
    narita: "NRT",
    "tokyo narita": "NRT",
    nrt: "NRT",
    // SINGAPORE
    singapore: "SIN",
    changi: "SIN",
    sin: "SIN"
};
const airportAliases = new Map(Object.entries(airports).map(([name, code]) => [normalizeChatText(name), code]));
export const chatAirportCodes = [...new Set(airportAliases.values())];

export const normalizeAirport = value => {
  if (typeof value !== "string") return "";
  return airportAliases.get(normalizeChatText(value)) || "";
};

export const normalizeDate = value => {
  if (typeof value !== "string") return "";
  const text = value.trim();
  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(text) ? text
    : match ? `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}` : "";
  if (!normalized) return "";
  const date = new Date(`${normalized}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === normalized ? normalized : "";
};
