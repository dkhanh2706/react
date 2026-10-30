export const normalizeAirport = value => {
  if (!value) {
    return "";
  }
  const text = value.toLowerCase().trim().replace(/\./g, "").replace(/\s+/g, " ");
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
  return airports[text] || value.toUpperCase();
};
export const normalizeDate = value => {
  if (!value) {
    return "";
  }
  const text = value.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  // DD/MM/YYYY
  // DD-MM-YYYY
  const match = text.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (!match) {
    return "";
  }
  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  const year = match[3];
  return `${year}-${month}-${day}`;
};
