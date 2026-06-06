import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import mediaUpload from "../../utils/mediaUpload";


export default function AddPackageAdminPage() {
  const navigate = useNavigate();
  const [pkg, setPkg] = useState({
    title: "",
    shortDescription: "",
    description: "",
    price: 0,
    duration: "",
    itinerary: [
      {
        day: "",
        place: "",
        description: "",
        accommodation: "",
        mealsIncluded: "",
        includedActivities: "",
        entranceFees: "",
      },
    ],
    inclusions: [""],
    exclusions: [""],
    images: [],
    ratingText: "4.9/5",
    starCount: 5,
  });

  const [uploading, setUploading] = useState(false);

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

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    setUploading(true);

    try {
      const urls = [];
      for (let i = 0; i < files.length; i++) {
        const url = await mediaUpload(files[i]);
        urls.push(url);
      }
      setPkg(prev => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (err) {
      console.error("Upload error:", err);
      alert(err);
    } finally {
      setUploading(false);
    }
  };

  const normalizeList = (value) => {
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
  };

  const normalizeItineraryItems = (items) => {
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
  };

  const buildCitiesCovered = (items) => {
    const places = items.map((item) => item.place).filter(Boolean);
    return Array.from(new Set(places));
  };

  const handleSubmit = (e) => {
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
      .post(`${import.meta.env.VITE_BACKEND_URL}/packages`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        alert("Package added successfully!");
        navigate("/admin/packages");
      })
      .catch((err) => {
        console.error("Error adding package:", err);
        alert(err.response?.data?.message || "Failed to add package");
      });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => navigate("/admin/packages")}
        className="text-slate-400 hover:text-white flex items-center gap-2 mb-6 transition-colors font-medium"
      >
        <FaArrowLeft /> Back to Packages
      </button>

      <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Add New Travel Package</h1>
          <p className="text-slate-400 mt-1">Create a curated package with complete trip details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Title</label>
          <input
            type="text"
            value={pkg.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className="w-full h-12 rounded-xl bg-slate-800 border border-white/10 px-4 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
          />
        </div>

        {/* Short Description */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Short Description</label>
          <input
            type="text"
            value={pkg.shortDescription}
            onChange={(e) => handleChange("shortDescription", e.target.value)}
            className="w-full h-12 rounded-xl bg-slate-800 border border-white/10 px-4 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Description</label>
          <textarea
            value={pkg.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition resize-none"
            rows="4"
          />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Price</label>
          <input
            type="number"
            value={pkg.price}
            onChange={(e) => handleChange("price", e.target.value)}
            className="w-full h-12 rounded-xl bg-slate-800 border border-white/10 px-4 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
          />
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Duration</label>
          <input
            type="text"
            value={pkg.duration}
            onChange={(e) => handleChange("duration", e.target.value)}
            className="w-full h-12 rounded-xl bg-slate-800 border border-white/10 px-4 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
          />
        </div>

        {/* Rating Text */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Rating Text (e.g. 4.9/5)</label>
          <input
            type="text"
            value={pkg.ratingText}
            onChange={(e) => handleChange("ratingText", e.target.value)}
            className="w-full h-12 rounded-xl bg-slate-800 border border-white/10 px-4 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
            placeholder="e.g. 4.9/5"
          />
        </div>

        {/* Star Count */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Number of Stars (Select 1-5)</label>
          <select
            value={pkg.starCount}
            onChange={(e) => handleChange("starCount", parseInt(e.target.value))}
            className="w-full h-12 rounded-xl bg-slate-800 border border-white/10 px-4 text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
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
              onChange={(e) => handleArrayChange("inclusions", idx, e.target.value)}
              className="w-full h-12 rounded-xl bg-slate-800 border border-white/10 px-4 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
            />
          ))}
          <button type="button" onClick={() => handleAddArrayField("inclusions")} className="text-xs bg-slate-800 border border-white/10 hover:bg-slate-700 text-teal-400 px-3 py-2 rounded-lg transition-colors flex items-center gap-2"><img src="/admin-add-icon.svg" alt="add" className="w-4 h-4" />Add Inclusion</button>
        </div>

        {/* Exclusions */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Exclusions</label>
          {pkg.exclusions.map((item, idx) => (
            <input
              key={idx}
              type="text"
              value={item}
              onChange={(e) => handleArrayChange("exclusions", idx, e.target.value)}
              className="w-full h-12 rounded-xl bg-slate-800 border border-white/10 px-4 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
            />
          ))}
          <button type="button" onClick={() => handleAddArrayField("exclusions")} className="text-xs bg-slate-800 border border-white/10 hover:bg-slate-700 text-teal-400 px-3 py-2 rounded-lg transition-colors flex items-center gap-2"><img src="/admin-add-icon.svg" alt="add" className="w-4 h-4" />Add Exclusion</button>
        </div>

        {/* Images */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-300">Images</label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="w-full text-sm text-slate-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:bg-slate-800 file:text-white hover:file:bg-slate-700"
          />
          {uploading && <p className="text-xs text-yellow-500">Uploading images...</p>}
          <div className="flex gap-2 flex-wrap mt-2">
            {pkg.images.map((img, idx) => (
              <img key={idx} src={img} alt={`img-${idx}`} className="w-24 h-24 object-cover rounded-lg border border-white/10" />
            ))}
          </div>
        </div>

          <button type="submit" className="w-full h-14 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold text-lg hover:shadow-lg hover:shadow-blue-600/20 transition flex items-center justify-center gap-2"><img src="/admin-add-icon.svg" alt="add" className="w-5 h-5" />Add Package</button>
        </form>
      </div>
    </div>
  );
}
