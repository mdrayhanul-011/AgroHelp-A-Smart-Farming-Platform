import { useState, useEffect } from "react";

export default function AdminMarketPage() {
  const [markets, setMarkets] = useState([]);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false); // Track if user is admin
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentMarket, setCurrentMarket] = useState({
    product: "",
    price: "",
    trend: "",
    trendChange: "",
  });

  useEffect(() => {
    fetchMarkets();
    checkAdminStatus();
  }, []);

  const fetchMarkets = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/markets`);
      const data = await response.json();
      if (response.ok) {
        setMarkets(data);
      } else {
        throw new Error(data.message || "Failed to fetch market data");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Check if the user is admin
  const checkAdminStatus = () => {
    const token = localStorage.getItem("ag_token");
    if (token) {
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      setIsAdmin(decodedToken.designation === "admin");
    }
  };

  const handleAddOrUpdateMarket = async (e) => {
    e.preventDefault();
    const url = isEditMode
      ? `${import.meta.env.VITE_API_URL}/markets/${currentMarket._id}`
      : `${import.meta.env.VITE_API_URL}/markets`;
    const method = isEditMode ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("ag_token")}`,
        },
        body: JSON.stringify(currentMarket),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Request failed");

      if (isEditMode) {
        setMarkets((prev) =>
          prev.map((market) =>
            market._id === currentMarket._id ? currentMarket : market
          )
        );
      } else {
        setMarkets((prev) => [data.market, ...prev]);
      }

      setCurrentMarket({
        product: "",
        price: "",
        trend: "",
        trendChange: "",
      });
      setIsEditMode(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditMarket = (market) => {
    setCurrentMarket(market);
    setIsEditMode(true);
  };

  const handleDeleteMarket = async (id) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/markets/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("ag_token")}`,
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setMarkets((prev) => prev.filter((market) => market._id !== id));
      } else {
        throw new Error(data.message || "Failed to delete market");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="py-12">
      <div className="mx-auto max-w-5xl px-6">
        <h1 className="text-3xl font-bold text-emerald-900 dark:text-white">Admin Market Dashboard</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Manage market data here.</p>

        {error && <p className="mt-4 text-red-600">{error}</p>}

        {/* Add or Edit Market Form */}
        {isAdmin && (
          <div className="mt-8">
            <h3 className="font-semibold text-lg">{isEditMode ? "Edit" : "Add"} Market</h3>
            <form onSubmit={handleAddOrUpdateMarket} className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="mb-4">
                  <label
                    htmlFor="product"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Product
                  </label>
                  <input
                    type="text"
                    id="product"
                    value={currentMarket.product}
                    onChange={(e) =>
                      setCurrentMarket({ ...currentMarket, product: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Price
                  </label>
                  <input
                    type="number"
                    id="price"
                    value={currentMarket.price}
                    onChange={(e) =>
                      setCurrentMarket({ ...currentMarket, price: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="trend"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Trend
                  </label>
                  <input
                    type="text"
                    id="trend"
                    value={currentMarket.trend}
                    onChange={(e) =>
                      setCurrentMarket({ ...currentMarket, trend: e.target.value })
                    }
                    className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="trendChange"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Trend Change
                  </label>
                  <input
                    type="text"
                    id="trendChange"
                    value={currentMarket.trendChange}
                    onChange={(e) =>
                      setCurrentMarket({ ...currentMarket, trendChange: e.target.value })
                    }
                    className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-md"
              >
                {isEditMode ? "Update Market" : "Add Market"}
              </button>
            </form>
          </div>
        )}

        {/* Market List */}
        <div className="mt-12">
          <h3 className="font-semibold text-lg">Market Trends</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {markets.map((market) => (
              <div
                key={market._id}
                className="rounded-2xl p-5 bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10"
              >
                <h3 className="font-semibold">{market.product}</h3>
                <p className="text-sm text-slate-600">
                  Avg ৳ {market.price}/ton • 7-day trend: {market.trend} {market.trendChange}
                </p>

                {isAdmin && (
                  <div className="mt-4 flex gap-4">
                    <button
                      onClick={() => handleEditMarket(market)}
                      className="text-emerald-600 hover:text-emerald-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMarket(market._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
