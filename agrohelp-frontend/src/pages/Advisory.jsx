import { useState, useEffect } from "react";

export default function Advisory() {
  const [advisories, setAdvisories] = useState([]);
  const [filteredAdvisories, setFilteredAdvisories] = useState([]);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAdvisories();
  }, []);

  useEffect(() => {
    // Filter advisories based on the search query
    if (searchQuery) {
      const filtered = advisories.filter(advisory =>
        advisory.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAdvisories(filtered);
    } else {
      setFilteredAdvisories(advisories);
    }
  }, [searchQuery, advisories]);

  const fetchAdvisories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/advisories`);
      const data = await response.json();

      if (response.ok) {
        setAdvisories(data);
        setFilteredAdvisories(data);
      } else {
        throw new Error(data.message || 'Failed to fetch advisories');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="py-12 bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-6">
        <h1 className="text-3xl font-bold text-emerald-900 dark:text-white">Crop & Soil Advisory</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Soil, season and climate-aware suggestions.</p>

        {error && <p className="mt-4 text-red-600">{error}</p>}

        <div className="mt-6 flex items-center justify-between">
          <input
            type="text"
            placeholder="Search by location..."
            className="w-1/2 p-2 border rounded-md text-slate-800 dark:text-white dark:bg-gray-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAdvisories.map((advisory, index) => (
            <div
              key={index}
              className="rounded-xl bg-white dark:bg-gray-800 shadow-lg border p-5"
            >
              <h3 className="text-xl font-semibold text-emerald-900 dark:text-white">{advisory.location}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium">Recommended Crop:</span> {advisory.recommendedCrop}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium">Weather:</span> {advisory.weather}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium">Soil Health:</span> {advisory.soilHealth}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium">Resources:</span> {advisory.resources}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
