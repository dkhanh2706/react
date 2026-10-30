function AirlinePartners() {
  // code = mã IATA của hãng, hiển thị như mã hãng trên vé máy bay
  const airlines = [
    { name: "Vietnam Airlines", code: "VN" },
    { name: "Vietjet Air", code: "VJ" },
    { name: "Bamboo Airways", code: "QH" },
    { name: "Pacific Airlines", code: "BL" },
    { name: "Vietravel Airlines", code: "VU" },
  ];

  return (
    <section className="partners">
      <h2>✈️ Đối tác hàng không</h2>

      <div className="airline-list">
        {airlines.map((item) => (
          <div className="airline" key={item.code}>
            <span className="airline-code">{item.code}</span>

            <span>{item.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default AirlinePartners;
