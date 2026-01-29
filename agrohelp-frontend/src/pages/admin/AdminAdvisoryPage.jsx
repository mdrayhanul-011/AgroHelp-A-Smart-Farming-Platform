import { useState, useEffect } from "react";

export default function AdminAdvisoryPage() {
  const [advisories, setAdvisories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentAdvisory, setCurrentAdvisory] = useState({
    _id: undefined,
    location: "",
    recommendedCrop: "",
    weather: "",
    soilHealth: "",
    resources: "",
  });

  useEffect(() => {
    fetchAdvisories();
  }, []);

  const fetchAdvisories = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/advisories`, {
        // ❗ স্টেল রেসপন্স এড়াতে
        cache: "no-store",
        headers: { "Accept": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to fetch advisories");
      // GET /advisories থেকে অ্যারে আসে
      setAdvisories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to fetch advisories");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentAdvisory({
      _id: undefined,
      location: "",
      recommendedCrop: "",
      weather: "",
      soilHealth: "",
      resources: "",
    });
    setIsEditMode(false);
  };

  const handleAddOrUpdateAdvisory = async (e) => {
    e.preventDefault();

    const url = isEditMode
      ? `${import.meta.env.VITE_API_URL}/advisories/${currentAdvisory._id}`
      : `${import.meta.env.VITE_API_URL}/advisories`;

    const method = isEditMode ? "PUT" : "POST";

    const token = localStorage.getItem("ag_token");
    if (!token) {
      setError("No token found. Please log in.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          // cache bust
          "Cache-Control": "no-store",
          "Pragma": "no-cache",
        },
        body: JSON.stringify({
          location: String(currentAdvisory.location || "").trim(),
          recommendedCrop: String(currentAdvisory.recommendedCrop || "").trim(),
          weather: String(currentAdvisory.weather || "").trim(),
          soilHealth: String(currentAdvisory.soilHealth || "").trim(),
          resources: String(currentAdvisory.resources || "").trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Request failed");

      // ✅ নিশ্চিতভাবে সার্ভারের ট্রুথ রিফেচ
      await fetchAdvisories();
      resetForm();
    } catch (err) {
      setError(err.message || "Request failed");
    } finally {
      setSaving(false);
    }
  };

  const handleEditAdvisory = (advisory) => {
    // শ্যালো কপি, যাতে স্টেট মিউটেট না হয়
    setCurrentAdvisory({
      _id: advisory._id,
      location: advisory.location || "",
      recommendedCrop: advisory.recommendedCrop || "",
      weather: advisory.weather || "",
      soilHealth: advisory.soilHealth || "",
      resources: advisory.resources || "",
    });
    setIsEditMode(true);
    setError("");
  };

  const handleDeleteAdvisory = async (id) => {
    const token = localStorage.getItem("ag_token");
    if (!token) {
      setError("No token found. Please log in.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const res = await fetch(`${import.meta.env.VITE_API_URL}/advisories/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          "Cache-Control": "no-store",
          "Pragma": "no-cache",
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to delete advisory");

      // ডিলিটের পরও রিফেচ (কনসিস্টেন্সি)
      await fetchAdvisories();
      if (isEditMode && currentAdvisory._id === id) resetForm();
    } catch (err) {
      setError(err.message || "Failed to delete advisory");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="py-12">
      <div className="mx-auto max-w-5xl px-6">
        <h1 className="text-3xl font-bold text-emerald-900 dark:text-white">
          Admin Advisory Dashboard
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Manage crop and soil advisory data.
        </p>

        {error && <div className="mt-4 text-red-600">{error}</div>}

        {/* Add or Edit Advisory Form */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">
              {isEditMode ? "Edit Advisory" : "Add New Advisory"}
            </h3>
            {isEditMode && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm px-3 py-1 rounded-md border hover:bg-black/5 dark:hover:bg-white/10"
              >
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleAddOrUpdateAdvisory} className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="mb-4">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={currentAdvisory.location}
                  onChange={(e) =>
                    setCurrentAdvisory((p) => ({ ...p, location: e.target.value }))
                  }
                  required
                  className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="recommendedCrop" className="block text-sm font-medium text-gray-700">
                  Recommended Crop
                </label>
                <input
                  type="text"
                  id="recommendedCrop"
                  value={currentAdvisory.recommendedCrop}
                  onChange={(e) =>
                    setCurrentAdvisory((p) => ({ ...p, recommendedCrop: e.target.value }))
                  }
                  required
                  className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="mb-4 md:col-span-2">
                <label htmlFor="weather" className="block text-sm font-medium text-gray-700">
                  Weather Advice
                </label>
                <textarea
                  id="weather"
                  rows={2}
                  value={currentAdvisory.weather}
                  onChange={(e) =>
                    setCurrentAdvisory((p) => ({ ...p, weather: e.target.value }))
                  }
                  className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="mb-4 md:col-span-2">
                <label htmlFor="soilHealth" className="block text-sm font-medium text-gray-700">
                  Soil Health Advice
                </label>
                <textarea
                  id="soilHealth"
                  rows={2}
                  value={currentAdvisory.soilHealth}
                  onChange={(e) =>
                    setCurrentAdvisory((p) => ({ ...p, soilHealth: e.target.value }))
                  }
                  className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="mb-4 md:col-span-2">
                <label htmlFor="resources" className="block text-sm font-medium text-gray-700">
                  Resources / Recommendations
                </label>
                <textarea
                  id="resources"
                  rows={2}
                  value={currentAdvisory.resources}
                  onChange={(e) =>
                    setCurrentAdvisory((p) => ({ ...p, resources: e.target.value }))
                  }
                  className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-md disabled:opacity-60"
            >
              {saving
                ? (isEditMode ? "Updating…" : "Adding…")
                : (isEditMode ? "Update Advisory" : "Add Advisory")}
            </button>
          </form>
        </div>

        {/* Advisory List */}
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Advisories List</h3>
            <button
              onClick={fetchAdvisories}
              className="text-sm px-3 py-1 rounded-md border hover:bg-black/5 dark:hover:bg-white/10"
              disabled={loading}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {advisories.map((advisory) => (
              <div
                key={advisory._id}
                className="rounded-2xl p-5 bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10"
              >
                <h3 className="font-semibold">{advisory.location}</h3>
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Recommended Crop:</span> {advisory.recommendedCrop}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Weather:</span> {advisory.weather}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Soil Health:</span> {advisory.soilHealth}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Resources:</span> {advisory.resources}
                </p>

                <div className="mt-4 flex gap-4">
                  <button
                    onClick={() => handleEditAdvisory(advisory)}
                    className="text-emerald-600 hover:text-emerald-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteAdvisory(advisory._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {!loading && advisories.length === 0 && (
              <div className="text-sm text-slate-600">No advisories yet.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
