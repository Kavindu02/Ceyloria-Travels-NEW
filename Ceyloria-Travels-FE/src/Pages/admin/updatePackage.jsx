import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import mediaUpload from "../../utils/mediaUpload"; // Supabase upload function
import { safeParseJSON } from "../../utils/jsonParser.js";

export default function UpdatePackage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Load package data
  useEffect(() => {
    if (!id) return;
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/packages/${id}`)
      .then(res => {
        const data = res.data;
        data.images = safeParseJSON(data.images);
        data.citiesCovered = safeParseJSON(data.citiesCovered);
        data.itinerary = safeParseJSON(data.itinerary);
        data.inclusions = safeParseJSON(data.inclusions);
        data.exclusions = safeParseJSON(data.exclusions);

        const fallbackItinerary = Array.isArray(data.citiesCovered)
          ? data.citiesCovered
              .map((place) => String(place || "").trim())
              .filter(Boolean)
              .map((place, idx) => ({
                day: String(idx + 1),
                place,
                description: "",
                accommodation: "",
                mealsIncluded: "",
                includedActivities: [],
                entranceFees: [],
              }))
          : [];

        const parsedItinerary = Array.isArray(data.itinerary)
          ? data.itinerary
          : [];
        const baseItinerary = parsedItinerary.length
          ? parsedItinerary
          : fallbackItinerary;
        const normalizedItinerary = normalizeItineraryForForm(baseItinerary);
        data.itinerary = normalizedItinerary.length
          ? normalizedItinerary
          : [
              {
                day: "",
                place: "",
                description: "",
                accommodation: "",
                mealsIncluded: "",
                includedActivities: "",
                entranceFees: "",
              },
            ];

        data.inclusions = Array.isArray(data.inclusions) && data.inclusions.length ? data.inclusions : [""];
        data.exclusions = Array.isArray(data.exclusions) && data.exclusions.length ? data.exclusions : [""];
        data.images = Array.isArray(data.images) ? data.images : [];
        setPkg(data);
      })
      .catch(err => console.error("Error fetching package:", err));
  }, [id]);

  const handleChange = (field, value) => {
    setPkg(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, index, value) => {
    const updated = [...pkg[field]];
    updated[index] = value;
    setPkg(prev => ({ ...prev, [field]: updated }));
  };

  const handleAddArrayField = (field) => {
    setPkg(prev => ({ ...prev, [field]: [...prev[field], ""] }));
  };

  const handleItineraryChange = (index, subField, value) => {
    const updated = [...pkg.itinerary];
    updated[index] = { ...updated[index], [subField]: value };
    setPkg(prev => ({ ...prev, itinerary: updated }));
  };

  const handleAddItineraryItem = () => {
    const nextDay = pkg.itinerary.length + 1;
    setPkg(prev => ({
      ...prev,
      itinerary: [
        ...prev.itinerary,
        {
          day: String(nextDay),
          place: "",
          description: "",
          accommodation: "",
          mealsIncluded: "",
          includedActivities: "",
          entranceFees: "",
        },
      ],
    }));
  };

  const handleRemoveItineraryItem = (index) => {
    const updated = pkg.itinerary.filter((_, i) => i !== index);
    setPkg(prev => ({ ...prev, itinerary: updated }));
  };

  function normalizeList(value) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof value === "string") {
      return value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }

  function normalizeItineraryForForm(items) {
    if (!Array.isArray(items)) return [];
    return items.map((item, idx) => {
      if (item && typeof item === "object") {
        const day = item.day !== undefined ? String(item.day).trim() : "";
        const place = item.place !== undefined ? String(item.place).trim() : "";
        const description =
          item.description !== undefined
            ? String(item.description).trim()
            : "";
        const accommodation =
          item.accommodation !== undefined
            ? String(item.accommodation).trim()
            : "";
        const mealsIncluded =
          item.mealsIncluded !== undefined
            ? String(item.mealsIncluded).trim()
            : "";
        const includedActivities = Array.isArray(item.includedActivities)
          ? item.includedActivities.map((entry) => String(entry).trim()).filter(Boolean).join("\n")
          : item.includedActivities !== undefined
            ? String(item.includedActivities).trim()
            : "";
        const entranceFees = Array.isArray(item.entranceFees)
          ? item.entranceFees.map((entry) => String(entry).trim()).filter(Boolean).join("\n")
          : item.entranceFees !== undefined
            ? String(item.entranceFees).trim()
            : "";
        return {
          day,
          place,
          description,
          accommodation,
          mealsIncluded,
          includedActivities,
          entranceFees,
        };
      }
      if (typeof item === "string") {
        return {
          day: String(idx + 1),
          place: item.trim(),
          description: "",
          accommodation: "",
          mealsIncluded: "",
          includedActivities: "",
          entranceFees: "",
        };
      }
      return {
        day: String(idx + 1),
        place: "",
        description: "",
        accommodation: "",
        mealsIncluded: "",
        includedActivities: "",
        entranceFees: "",
      };
    });
  }

  function normalizeItineraryItems(items) {
    if (!Array.isArray(items)) return [];
    return items
      .map((item, idx) => {
        if (item && typeof item === "object") {
          const day = item.day !== undefined ? String(item.day).trim() : "";
          const place = item.place !== undefined ? String(item.place).trim() : "";
          const description =
            item.description !== undefined
              ? String(item.description).trim()
              : "";
          const accommodation =
            item.accommodation !== undefined
              ? String(item.accommodation).trim()
              : "";
          const mealsIncluded =
            item.mealsIncluded !== undefined
              ? String(item.mealsIncluded).trim()
              : "";
          const includedActivities = normalizeList(item.includedActivities);
          const entranceFees = normalizeList(item.entranceFees);
          return {
            day,
            place,
            description,
            accommodation,
            mealsIncluded,
            includedActivities,
            entranceFees,
          };
        }
        if (typeof item === "string") {
          return {
            day: String(idx + 1),
            place: item.trim(),
            description: "",
            accommodation: "",
            mealsIncluded: "",
            includedActivities: [],
            entranceFees: [],
          };
        }
        return {
          day: String(idx + 1),
          place: "",
          description: "",
          accommodation: "",
          mealsIncluded: "",
          includedActivities: [],
          entranceFees: [],
        };
      })
      .filter(
        (item) =>
          item.day ||
          item.place ||
          item.description ||
          item.accommodation ||
          item.mealsIncluded ||
          item.includedActivities.length > 0 ||
          item.entranceFees.length > 0,
      );
  }

  const buildCitiesCovered = (items) => {
    const places = items.map((item) => item.place).filter(Boolean);
    return Array.from(new Set(places));
  };

  const handleImageUpload = async (field, index, file) => {
    if (!file) return;
    try {
      setUploading(true);
      const url = await mediaUpload(file);
      const updated = [...pkg[field]];
      updated[index] = url;
      setPkg(prev => ({ ...prev, [field]: updated }));
    } catch (err) {
      console.error("Image upload failed:", err);
      alert(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const normalizedItinerary = normalizeItineraryItems(pkg.itinerary);
    const citiesCovered = buildCitiesCovered(normalizedItinerary);
    const payload = {
      ...pkg,
      itinerary: normalizedItinerary,
      citiesCovered,
    };

    axios
      .put(`${import.meta.env.VITE_BACKEND_URL}/packages/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(() => {
        alert("Package updated!");
        navigate("/admin/packages");
      })
      .catch(err => {
        console.error("Error updating package:", err);
        alert(err.response?.data?.message || "Update failed");
      });
  };

  if (!pkg) return <div className="p-10 text-white">Loading package...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-white">
      <button
        onClick={() => navigate("/admin/packages")}
        className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors font-medium"
      >
        <FaArrowLeft /> Back to Packages
      </button>

      <div>
        <h1 className="text-3xl font-bold">Edit Package: {pkg.title}</h1>
        <p className="text-slate-400">Update curated package details</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900/50 border border-white/10 rounded-2xl p-8 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Title</label>
          <input
            type="text"
            value={pkg.title}
            onChange={e => handleChange("title", e.target.value)}
            className="w-full h-12 rounded-xl bg-slate-800 border border-white/10 px-4 text-white focus:border-teal-500 outline-none transition"
          />
        </div>

        {/* Short Description */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Short Description</label>
          <input
            type="text"
            value={pkg.shortDescription}
            onChange={e => handleChange("shortDescription", e.target.value)}
            className="w-full h-12 rounded-xl bg-slate-800 border border-white/10 px-4 text-white focus:border-teal-500 outline-none transition"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Description</label>
          <textarea
            value={pkg.description}
            onChange={e => handleChange("description", e.target.value)}
            className="w-full min-h-24 rounded-xl bg-slate-800 border border-white/10 p-4 text-white focus:border-teal-500 outline-none transition resize-none"
          />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Price</label>
          <input
            type="number"
            value={pkg.price}
            onChange={e => handleChange("price", e.target.value)}
            className="w-full h-12 rounded-xl bg-slate-800 border border-white/10 px-4 text-white focus:border-teal-500 outline-none transition"
          />
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Duration</label>
          <input
            type="text"
            value={pkg.duration}
            onChange={e => handleChange("duration", e.target.value)}
            className="w-full h-12 rounded-xl bg-slate-800 border border-white/10 px-4 text-white focus:border-teal-500 outline-none transition"
          />
        </div>

        {/* Rating Text */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Rating Text (e.g. 4.9/5)</label>
          <input
            type="text"
            value={pkg.ratingText || "4.9/5"}
            onChange={(e) => handleChange("ratingText", e.target.value)}
            className="w-full h-12 rounded-xl bg-slate-800 border border-white/10 px-4 text-white focus:border-teal-500 outline-none transition"
            placeholder="e.g. 4.9/5"
          />
        </div>

        {/* Star Count */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Number of Stars (Select 1-5)</label>
          <select
            value={pkg.starCount || 5}
            onChange={(e) => handleChange("starCount", parseInt(e.target.value))}
            className="w-full h-12 rounded-xl bg-slate-800 border border-white/10 px-4 text-white focus:border-teal-500 outline-none transition"
          >
            <option value="1">1 Star</option>
            <option value="2">2 Stars</option>
            <option value="3">3 Stars</option>
            <option value="4">4 Stars</option>
            <option value="5">5 Stars</option>
          </select>
        </div>

        {/* Itinerary */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-300">Itinerary</label>
          {pkg.itinerary.map((item, idx) => (
            <div key={idx} className="bg-slate-800/60 border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">Day {idx + 1}</span>
                {pkg.itinerary.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItineraryItem(idx)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Day Number</label>
                  <input
                    type="text"
                    value={item.day}
                    onChange={(e) => handleItineraryChange(idx, "day", e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full h-10 rounded-lg bg-slate-900 border border-white/10 px-3 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Place</label>
                  <input
                    type="text"
                    value={item.place}
                    onChange={(e) => handleItineraryChange(idx, "place", e.target.value)}
                    placeholder="e.g. Kandy"
                    className="w-full h-10 rounded-lg bg-slate-900 border border-white/10 px-3 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Description</label>
                <textarea
                  value={item.description}
                  onChange={(e) => handleItineraryChange(idx, "description", e.target.value)}
                  placeholder="What happens on this day..."
                  rows={2}
                  className="w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition resize-none text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Accommodation</label>
                  <input
                    type="text"
                    value={item.accommodation}
                    onChange={(e) => handleItineraryChange(idx, "accommodation", e.target.value)}
                    placeholder="e.g. Elephas Resort or similar - 4 Star"
                    className="w-full h-10 rounded-lg bg-slate-900 border border-white/10 px-3 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Meals Included</label>
                  <input
                    type="text"
                    value={item.mealsIncluded}
                    onChange={(e) => handleItineraryChange(idx, "mealsIncluded", e.target.value)}
                    placeholder="e.g. Breakfast"
                    className="w-full h-10 rounded-lg bg-slate-900 border border-white/10 px-3 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Included Activities</label>
                  <textarea
                    value={item.includedActivities}
                    onChange={(e) => handleItineraryChange(idx, "includedActivities", e.target.value)}
                    placeholder="One item per line"
                    rows={3}
                    className="w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition resize-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Entrance Fees</label>
                  <textarea
                    value={item.entranceFees}
                    onChange={(e) => handleItineraryChange(idx, "entranceFees", e.target.value)}
                    placeholder="One item per line"
                    rows={3}
                    className="w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition resize-none text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddItineraryItem}
            className="text-xs bg-slate-800 border border-white/10 hover:bg-slate-700 text-teal-400 px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <img src="/admin-add-icon.svg" alt="add" className="w-4 h-4" />Add Day
          </button>
        </div>

        {/* Inclusions */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Inclusions</label>
          {pkg.inclusions.map((item, idx) => (
            <input
              key={idx}
              type="text"
              value={item}
              onChange={e => handleArrayChange("inclusions", idx, e.target.value)}
              className="w-full h-12 rounded-xl bg-slate-800 border border-white/10 px-4 text-white focus:border-teal-500 outline-none transition"
            />
          ))}
          <button type="button" onClick={() => handleAddArrayField("inclusions")} className="text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700 text-teal-400 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"><img src="/admin-add-icon.svg" alt="add" className="w-4 h-4" />Add Inclusion</button>
        </div>

        {/* Exclusions */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Exclusions</label>
          {pkg.exclusions.map((item, idx) => (
            <input
              key={idx}
              type="text"
              value={item}
              onChange={e => handleArrayChange("exclusions", idx, e.target.value)}
              className="w-full h-12 rounded-xl bg-slate-800 border border-white/10 px-4 text-white focus:border-teal-500 outline-none transition"
            />
          ))}
          <button type="button" onClick={() => handleAddArrayField("exclusions")} className="text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700 text-teal-400 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"><img src="/admin-add-icon.svg" alt="add" className="w-4 h-4" />Add Exclusion</button>
        </div>

        {/* Images */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Images</label>
          {pkg.images.map((img, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={img}
                onChange={e => handleArrayChange("images", idx, e.target.value)}
                className="w-full h-12 rounded-xl bg-slate-800 border border-white/10 px-4 text-white focus:border-teal-500 outline-none transition"
                placeholder="Image URL"
              />
              <input
                type="file"
                accept="image/*"
                onChange={e => handleImageUpload("images", idx, e.target.files[0])}
                className="px-2 py-2 rounded-lg text-sm bg-slate-800 border border-slate-700"
              />
            </div>
          ))}
          <button type="button" onClick={() => handleAddArrayField("images")} className="text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700 text-teal-400 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"><img src="/admin-add-icon.svg" alt="add" className="w-4 h-4" />Add Image</button>
          {uploading && <p className="text-yellow-400 mt-1">Uploading image...</p>}
        </div>

        {/* Submit */}
        <button type="submit" className="w-full h-14 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold text-lg hover:shadow-lg hover:shadow-blue-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2">
          Update Package
        </button>
      </form>
    </div>
  );
}
