import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  MapPin,
  Clock,
  Star,
  Heart,
  Share2,
  Check,
  X,
  ChevronDown,
  ShieldCheck,
  Plane,
  Calendar,
  Info,
  ArrowRight,
} from "lucide-react";
import { safeParseJSON } from "../../utils/jsonParser.js";
import TravelCard from "../../components/TravelCard.jsx";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const BUCKET_NAME = "images";

// Helper for images
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  let targetImage = Array.isArray(imagePath)
    ? imagePath.find(Boolean)
    : imagePath;
  if (typeof targetImage === "object" && targetImage !== null) {
    targetImage =
      targetImage.url ||
      targetImage.src ||
      targetImage.path ||
      targetImage.name ||
      null;
  }
  if (!targetImage || typeof targetImage !== "string") return null;
  targetImage = targetImage.replace(/\\/g, "/");
  if (/^(https?:|data:|blob:)/i.test(targetImage)) return targetImage;
  if (targetImage.startsWith("/") || targetImage.includes("/storage/"))
    return targetImage;
  if (!SUPABASE_URL) return targetImage;
  const base = SUPABASE_URL.replace(/\/$/, "");
  const imgPath = String(targetImage).replace(/^\//, "");
  return `${base}/storage/v1/object/public/${BUCKET_NAME}/${imgPath}`;
};

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeItineraryItems = (rawItems) => {
  if (!Array.isArray(rawItems)) return [];
  return rawItems
    .map((item, idx) => {
      if (item && typeof item === "object") {
        const day = item.day ?? item.title ?? item.dayNumber ?? item.dayNo ?? "";
        const place = item.place ?? item.city ?? item.location ?? "";
        const description = item.description ?? item.details ?? "";
        const accommodation = item.accommodation ?? "";
        const mealsIncluded = item.mealsIncluded ?? item.meals ?? "";
        const includedActivities = normalizeList(item.includedActivities);
        const entranceFees = normalizeList(item.entranceFees);
        return {
          day: day !== null && day !== undefined ? String(day).trim() : "",
          place: place !== null && place !== undefined ? String(place).trim() : "",
          description:
            description !== null && description !== undefined
              ? String(description).trim()
              : "",
          accommodation:
            accommodation !== null && accommodation !== undefined
              ? String(accommodation).trim()
              : "",
          mealsIncluded:
            mealsIncluded !== null && mealsIncluded !== undefined
              ? String(mealsIncluded).trim()
              : "",
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

const formatDayLabel = (dayValue, index) => {
  const raw = dayValue ? String(dayValue).trim() : "";
  if (!raw) return `Day ${index + 1}`;
  return /^day\b/i.test(raw) ? raw : `Day ${raw}`;
};

const PackageOverviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const bookingSectionRef = useRef(null);
  const bookingFormRef = useRef(null);
  const [package_, setPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [recommendedPackages, setRecommendedPackages] = useState([]);
  const [bookingForm, setBookingForm] = useState({
    packageName: "",
    name: "",
    contactNumber: "",
    date: "",
    adults: 1,
    kids: 0,
    infants: 0,
  });
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [expandedDays, setExpandedDays] = useState([]);

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/packages/${id}`,
        );
        if (!res.ok) throw new Error("Failed to load package");
        const data = await res.json();
        setPackage(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    if (id) fetchPackage();
  }, [id]);

  useEffect(() => {
    if (package_?.title) {
      setBookingForm((prev) => ({
        ...prev,
        packageName: package_.title,
      }));
    }
  }, [package_?.title]);

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/packages`);
        if (!res.ok) return;
        const data = await res.json();
        // Filter out the current package
        const otherPackages = data.filter((p) => String(p.id) !== String(id));
        // Shuffle the array
        const shuffled = otherPackages.sort(() => 0.5 - Math.random());
        // Pick top 3
        setRecommendedPackages(shuffled.slice(0, 3));
      } catch (err) {
        console.error("Failed to load recommended packages:", err);
      }
    };
    if (id) fetchRecommended();
  }, [id]);

  const images = safeParseJSON(package_?.images);
  const mainImage = getImageUrl(images[selectedImageIndex] || images[0]);

  const parsedCities = safeParseJSON(package_?.citiesCovered);
  const cities = Array.isArray(parsedCities)
    ? parsedCities.map((c) => String(c).trim()).filter(Boolean)
    : [];

  const parsedItinerary = safeParseJSON(package_?.itinerary);
  const itineraryItems = normalizeItineraryItems(parsedItinerary);
  const itineraryPlaces = itineraryItems
    .map((item) => item.place)
    .filter(Boolean);
  const displayCities = cities.length
    ? cities
    : Array.from(new Set(itineraryPlaces));
  const finalItinerary = itineraryItems.length
    ? itineraryItems
    : displayCities.map((place, idx) => ({
        day: String(idx + 1),
        place,
        description: "",
      }));

  const parsedInclusions = safeParseJSON(package_?.inclusions);
  const inclusions = Array.isArray(parsedInclusions)
    ? parsedInclusions.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const finalInclusions = inclusions;

  const parsedExclusions = safeParseJSON(package_?.exclusions);
  const exclusions = Array.isArray(parsedExclusions)
    ? parsedExclusions.map((item) => String(item).trim()).filter(Boolean)
    : [];

  useEffect(() => {
    setExpandedDays(finalItinerary.map(() => false));
  }, [id, finalItinerary.length]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cc007e]"></div>
      </div>
    );
  if (!package_)
    return <div className="p-8 text-center">Package not found</div>;

  const handleBookingChange = (field, value) => {
    setBookingForm((prev) => ({ ...prev, [field]: value }));
  };

  const allItineraryExpanded =
    expandedDays.length > 0 && expandedDays.every(Boolean);

  const handleToggleDay = (index) => {
    setExpandedDays((prev) =>
      prev.map((isOpen, idx) => (idx === index ? !isOpen : isOpen)),
    );
  };

  const handleToggleAllDays = () => {
    setExpandedDays((prev) => {
      const shouldExpand = prev.length > 0 ? !prev.every(Boolean) : true;
      return prev.map(() => shouldExpand);
    });
  };

  const handleScrollToBookingForm = () => {
    const targetElement = bookingFormRef.current || bookingSectionRef.current;
    if (!targetElement) return;

    const headerOffset = 96;
    const top =
      targetElement.getBoundingClientRect().top +
      window.pageYOffset -
      headerOffset;

    window.scrollTo({
      top: Math.max(top, 0),
      behavior: "smooth",
    });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingBooking(true);

    try {
      const payload = {
        packageName: bookingForm.packageName || package_?.title || "",
        name: bookingForm.name,
        contactNumber: bookingForm.contactNumber,
        date: bookingForm.date,
        adults: Number(bookingForm.adults) || 0,
        kids: Number(bookingForm.kids) || 0,
        infants: Number(bookingForm.infants) || 0,
      };

      const configuredBase = import.meta.env.VITE_BACKEND_URL;
      const possibleBases = [
        configuredBase,
        window.location.origin,
      ].filter(Boolean);

      const baseUrls = [...new Set(possibleBases.map((b) => b.replace(/\/$/, "")))];

      let lastError = null;
      let successResponse = null;

      for (const baseUrl of baseUrls) {
        try {
          const response = await fetch(`${baseUrl}/api/package-booking`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          let data = {};
          try {
            data = await response.json();
          } catch (_) {
            data = {};
          }

          if (response.ok) {
            successResponse = data;
            break;
          }

          lastError = new Error(data?.message || "Failed to send package inquiry");
        } catch (requestError) {
          lastError = requestError;
        }
      }

      if (!successResponse) {
        throw lastError || new Error("Failed to send package inquiry");
      }

      toast.success("Package inquiry sent successfully! We'll contact you soon.");
      setBookingForm((prev) => ({
        packageName: package_?.title || prev.packageName,
        name: "",
        contactNumber: "",
        date: "",
        adults: 1,
        kids: 0,
        infants: 0,
      }));
    } catch (error) {
      toast.error(error.message || "Failed to send package inquiry");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  return (
    <div className="bg-white min-h-screen font-sans text-gray-800 pb-16 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* --- LEFT COLUMN: IMAGE GALLERY --- */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Image */}
            <div className="aspect-[4/3] w-full bg-gray-100 rounded-2xl overflow-hidden border border-gray-100 relative group">
              <img
                src={mainImage}
                alt={package_.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-gray-800 shadow-sm">
                Best Seller
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === idx ? "border-[#cc007e] ring-2 ring-[#cc007e]/20" : "border-transparent opacity-70 hover:opacity-100"}`}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* --- RIGHT COLUMN: PRODUCT DETAILS (BUY BOX) --- */}
          <div className="lg:col-span-5">
            <div className="sticky top-8">
              {/* Header Info */}
              <div className="mb-6 border-b border-gray-100 pb-6">
                <div className="flex justify-end items-start mb-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator
                            .share({
                              title: package_.title,
                              text: `Check out this travel package: ${package_.title}`,
                              url: window.location.href,
                            })
                            .catch(console.error);
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success("Link copied to clipboard!");
                        }
                      }}
                      className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-[#cc007e] transition-colors"
                      title="Share Package"
                    >
                      <Share2 size={20} />
                    </button>
                  </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 leading-tight">
                  {package_.title}
                </h1>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-yellow-500 font-bold">
                    <Star size={16} fill="currentColor" />
                    <span>4.9</span>
                  </div>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500">120+ Bookings</span>
                </div>
              </div>

              {/* Price & Actions */}
              <div className="space-y-6">
                <div>
                  <p className="text-gray-500 text-sm mb-1">
                    Starting price per person
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-gray-900">
                      $ {package_.price?.toLocaleString()}
                    </span>
                    <span className="text-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                      Available Now
                    </span>
                  </div>
                </div>

                {/* Quick Specs Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-3">
                    <Clock className="text-[#cc007e]" size={20} />
                    <div>
                      <p className="text-xs text-gray-500 uppercase">
                        Duration
                      </p>
                      <p className="font-semibold text-gray-900">
                        {package_.duration}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-3">
                    <Plane className="text-[#cc007e]" size={20} />
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Type</p>
                      <p className="font-semibold text-gray-900">
                        All Inclusive
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleScrollToBookingForm}
                    className="w-full bg-[#cc007e] hover:bg-[#a30065] text-white text-lg font-bold py-4 rounded-xl shadow-lg shadow-[#cc007e]/30 transition-transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    Book Now <ArrowRight size={20} />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <ShieldCheck size={14} className="text-green-600" />
                  <span>Free cancellation up to 48 hours before trip</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- BOTTOM SECTION: TABS --- */}
        <div
          ref={bookingSectionRef}
          className="mt-16 md:mt-24 border-t border-gray-100 pt-8"
        >
          {/* Tabs Header */}
          <div className="grid grid-cols-4 sm:flex border-b border-gray-200 mb-6 sm:mb-8">
            {["Overview", "Itinerary", "Inclusions", "Exclusions"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`px-2 sm:px-6 py-3 sm:py-4 font-bold text-[11px] sm:text-sm uppercase tracking-wide border-b-2 transition-colors text-center whitespace-nowrap ${activeTab === tab.toLowerCase()
                    ? "border-[#cc007e] text-[#cc007e]"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Tab Content */}
            <div className="lg:col-span-8 max-w-4xl">
              {activeTab === "overview" && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                    About this Package
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-base sm:text-lg break-words [overflow-wrap:anywhere]">
                    {package_.description ||
                      package_.shortDescription ||
                      "Experience the best of Sri Lanka with this carefully curated package."}
                  </p>

                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Covered Cities
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {displayCities.length > 0 ? (
                        displayCities.map((c, idx) => (
                          <span
                            key={idx}
                            className="bg-[#cc007e]/10 text-[#cc007e] px-3 py-1 rounded-full text-sm font-semibold"
                          >
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">Sri Lanka</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#cc007e]/5 p-4 sm:p-6 rounded-xl border border-[#cc007e]/20">
                    <h4 className="font-bold text-[#cc007e] mb-2 flex items-center gap-2">
                      <Info size={18} /> Why travelers love this
                    </h4>
                    <ul className="space-y-2 text-sm sm:text-base text-[#cc007e]/80 break-words [overflow-wrap:anywhere]">
                      <li>
                        • Verified local guides ensuring authentic experiences
                      </li>
                      <li>
                        • Hassle-free transportation in air-conditioned vehicles
                      </li>
                      <li>
                        • Customizable accommodation upgrades available
                      </li>
                      <li>
                        • Flexible and customizable itinerary options
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "itinerary" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                      What's Itinerary
                    </h3>
                    {finalItinerary.length > 0 && (
                      <button
                        type="button"
                        onClick={handleToggleAllDays}
                        className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 transition"
                      >
                        {allItineraryExpanded ? "Collapse All" : "Expand All"}
                      </button>
                    )}
                  </div>
                  {finalItinerary.length > 0 ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
                      <div className="space-y-3 sm:space-y-4">
                        {finalItinerary.map((item, idx) => {
                          const dayLabel = formatDayLabel(item.day, idx);
                          const title = item.place
                            ? `${dayLabel}: ${item.place}`
                            : dayLabel;
                          const isOpen = !!expandedDays[idx];
                          const detailSections = [
                            {
                              title: "Accommodation",
                              items: item.accommodation ? [item.accommodation] : [],
                            },
                            {
                              title: "Meals Included",
                              items: item.mealsIncluded ? [item.mealsIncluded] : [],
                            },
                            {
                              title: "Included Activities",
                              items: item.includedActivities || [],
                            },
                            {
                              title: "Entrance Fees",
                              items: item.entranceFees || [],
                            },
                          ].filter((section) => section.items.length > 0);
                          const hasDescription = Boolean(item.description);
                          const hasDetails = detailSections.length > 0;

                          return (
                            <div
                              key={`${dayLabel}-${idx}`}
                              className="border border-gray-100 rounded-2xl overflow-hidden bg-gray-50"
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleDay(idx)}
                                className={`w-full flex items-center justify-between gap-4 px-4 sm:px-6 py-4 text-left transition ${isOpen ? "bg-gray-50" : "bg-gray-50 hover:bg-gray-100"}`}
                              >
                                <span className="flex items-center gap-3">
                                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-gray-400"></span>
                                  <span className="text-sm sm:text-base font-semibold text-gray-900 leading-none break-words [overflow-wrap:anywhere]">
                                    {title}
                                  </span>
                                </span>
                                <ChevronDown
                                  size={20}
                                  className={`shrink-0 transition-transform ${isOpen ? "rotate-180 text-gray-700" : "text-gray-400"}`}
                                />
                              </button>
                              {isOpen && (
                                <div className="px-4 sm:px-6 pb-4 border-t border-gray-100 bg-gray-50">
                                  {hasDescription && (
                                    <p className="pt-4 text-gray-600 text-sm sm:text-base leading-relaxed break-words [overflow-wrap:anywhere]">
                                      {item.description}
                                    </p>
                                  )}
                                  {hasDetails && (
                                    <div className={`space-y-3 ${hasDescription ? "mt-4" : "pt-4"}`}>
                                      {detailSections.map((section) => (
                                        <div key={section.title} className="flex items-start gap-3">
                                          <Check
                                            size={16}
                                            className="mt-0.5 text-gray-500"
                                          />
                                          <div className="space-y-1">
                                            <p className="text-sm font-semibold text-gray-900">
                                              {section.title}
                                            </p>
                                            {section.items.map((line, lineIdx) => (
                                              <p
                                                key={`${section.title}-${lineIdx}`}
                                                className="text-sm text-gray-600 leading-relaxed break-words [overflow-wrap:anywhere]"
                                              >
                                                {line}
                                              </p>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {!hasDescription && !hasDetails && (
                                    <p className="pt-4 text-gray-600 text-sm sm:text-base leading-relaxed">
                                      Details coming soon.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                      <h3 className="text-lg font-medium text-gray-900">
                        No itinerary listed
                      </h3>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "inclusions" && (
                <div className="animate-fadeIn">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5 sm:mb-6">
                    What's Included
                  </h3>
                  {finalInclusions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {finalInclusions.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <Check className="text-green-500 shrink-0" size={20} />
                          <span className="text-gray-700 font-medium text-sm sm:text-base break-words [overflow-wrap:anywhere]">{item}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                      <h3 className="text-lg font-medium text-gray-900">
                        No inclusions listed
                      </h3>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "exclusions" && (
                <div className="animate-fadeIn">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5 sm:mb-6">
                    What's Excluded
                  </h3>
                  {exclusions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {exclusions.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <X className="text-red-500 shrink-0" size={20} />
                          <span className="text-gray-700 font-medium text-sm sm:text-base break-words [overflow-wrap:anywhere]">{item}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                      <h3 className="text-lg font-medium text-gray-900">
                        No exclusions listed
                      </h3>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Booking Form (Right Side) */}
            <div ref={bookingFormRef} id="package-booking-form" className="lg:col-span-4">
              <div className="lg:sticky lg:top-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#cc007e] font-bold mb-2">
                  Package Booking
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mb-5">
                  Book This Package
                </h3>

                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Package
                    </label>
                    <input
                      type="text"
                      value={bookingForm.packageName}
                      readOnly
                      className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={bookingForm.name}
                      onChange={(e) => handleBookingChange("name", e.target.value)}
                      required
                      className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-gray-900 focus:border-[#cc007e] focus:ring-2 focus:ring-[#cc007e]/20 outline-none"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      value={bookingForm.contactNumber}
                      onChange={(e) =>
                        handleBookingChange("contactNumber", e.target.value)
                      }
                      required
                      className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-gray-900 focus:border-[#cc007e] focus:ring-2 focus:ring-[#cc007e]/20 outline-none"
                      placeholder="Enter contact number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={bookingForm.date}
                      onChange={(e) => handleBookingChange("date", e.target.value)}
                      required
                      className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-gray-900 focus:border-[#cc007e] focus:ring-2 focus:ring-[#cc007e]/20 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Adults
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={bookingForm.adults}
                        onChange={(e) => handleBookingChange("adults", e.target.value)}
                        required
                        className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-gray-900 focus:border-[#cc007e] focus:ring-2 focus:ring-[#cc007e]/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Kids
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={bookingForm.kids}
                        onChange={(e) => handleBookingChange("kids", e.target.value)}
                        required
                        className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-gray-900 focus:border-[#cc007e] focus:ring-2 focus:ring-[#cc007e]/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Infants
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={bookingForm.infants}
                        onChange={(e) =>
                          handleBookingChange("infants", e.target.value)
                        }
                        required
                        className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-gray-900 focus:border-[#cc007e] focus:ring-2 focus:ring-[#cc007e]/20 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingBooking}
                    className="w-full h-12 rounded-xl bg-[#cc007e] hover:bg-[#a30065] text-white font-bold transition disabled:opacity-60"
                  >
                    {isSubmittingBooking ? "Sending..." : "Send Booking Inquiry"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* --- RECOMMENDED PACKAGES --- */}
        {recommendedPackages.length > 0 && (
          <div className="mt-16 md:mt-24 border-t border-gray-100 pt-16">
            <div className="text-center mb-12">
              <span className="text-[#cc007e] font-bold tracking-[0.2em] uppercase text-xs block mb-3">
                Discover More
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                You Might Also Like
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {recommendedPackages.map((pkg) => {
                const parsedCities = safeParseJSON(pkg.citiesCovered);
                return (
                  <div key={pkg.id} className="h-full">
                    <TravelCard
                      image={pkg.images}
                      title={pkg.title}
                      location={parsedCities?.join(", ")}
                      duration={pkg.duration}
                      description={pkg.shortDescription}
                      price={pkg.price}
                      ratingText={pkg.ratingText}
                      starCount={pkg.starCount}
                      id={pkg.id}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PackageOverviewPage;
