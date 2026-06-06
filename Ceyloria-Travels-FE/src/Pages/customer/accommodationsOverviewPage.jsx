import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  MapPin,
  Star,
  Share2,
  ShieldCheck,
  ArrowRight,
  Check,
  X,
} from 'lucide-react';
import { safeParseJSON } from '../../utils/jsonParser.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const BUCKET_NAME = "images";

// ---------------------- REUSABLE ANIMATION COMPONENT ----------------------
const Reveal = ({ children, className = "", delay = 0, direction = "up" }) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    let observer;
    const currentElement = domRef.current;

    if (currentElement) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1, rootMargin: "50px" }
      );

      observer.observe(currentElement);
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, []);

  const getTransform = () => {
    if (!isVisible) {
      if (direction === "up") return "translate-y-10 opacity-0";
      if (direction === "left") return "-translate-x-10 opacity-0";
      if (direction === "right") return "translate-x-10 opacity-0";
    }
    return "translate-y-0 translate-x-0 opacity-100";
  };

  return (
    <div
      ref={domRef}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 ease-out transform ${getTransform()} ${className}`}
    >
      {children}
    </div>
  );
};

// --- Helper for images ---
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  let targetImage = Array.isArray(imagePath) ? imagePath.find(Boolean) : imagePath;
  if (typeof targetImage === 'object' && targetImage !== null) {
    targetImage = targetImage.url || targetImage.src || targetImage.path || targetImage.name || null;
  }
  if (!targetImage || typeof targetImage !== 'string') return null;
  targetImage = targetImage.replace(/\\/g, '/');
  if (/^(https?:|data:|blob:)/i.test(targetImage)) return targetImage;
  if (targetImage.startsWith('/') || targetImage.includes('/storage/')) return targetImage;
  if (!SUPABASE_URL) return targetImage;
  const base = SUPABASE_URL.replace(/\/$/, '');
  const imgPath = String(targetImage).replace(/^\//, '');
  return `${base}/storage/v1/object/public/${BUCKET_NAME}/${imgPath}`;
};

const AccommodationOverviewPage = () => {
  const { id } = useParams();
  const bookingSectionRef = useRef(null);

  // State
  const [accommodation, setAccommodation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [bookingForm, setBookingForm] = useState({
    name: '',
    contactNumber: '',
    date: '',
    boardType: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAccommodation = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/accommodations/${id}`);
        if (!res.ok) throw new Error('Failed to load accommodation');
        const data = await res.json();
        setAccommodation(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    if (id) fetchAccommodation();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-16 h-16 border-4 border-neutral-100 border-t-[#c8007b] rounded-full animate-spin"></div>
    </div>
  );

  if (!accommodation) return <div className="p-8 text-center bg-white min-h-screen pt-32">Accommodation not found</div>;

  // Image Logic
  const parsedImages = safeParseJSON(accommodation.images) || [];
  const images = (Array.isArray(parsedImages) ? parsedImages : [parsedImages]).filter(img => img && String(img).trim() !== "");
  const mainImage = getImageUrl(images[selectedImageIndex] || images[0]);

  // Price Calculation
  const pricePerNight = accommodation.pricePerNight || 0;

  const parsedPackages = safeParseJSON(accommodation.packages) || [];
  const packageList = Array.isArray(parsedPackages) ? parsedPackages : [];
  const metaPackage = packageList.find((item) => item?.type === "accommodation_meta") || {};
  const parsedInclusions = safeParseJSON(metaPackage.inclusions ?? accommodation.inclusions, []);
  const parsedExclusions = safeParseJSON(metaPackage.exclusions ?? accommodation.exclusions, []);
  const legacyAmenities = safeParseJSON(accommodation.amenities, []);
  const inclusions = Array.isArray(parsedInclusions)
    ? parsedInclusions.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const fallbackInclusions = Array.isArray(legacyAmenities)
    ? legacyAmenities.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const finalInclusions = inclusions.length ? inclusions : fallbackInclusions;
  const exclusions = Array.isArray(parsedExclusions)
    ? parsedExclusions.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const overviewText =
    accommodation.description ||
    "Experience premium comfort and curated hospitality with this accommodation.";

  const extractBoardPrice = (label) => {
    const matched = packageList.find((item) => {
      const boardType = String(item?.boardType || item?.type || item?.name || "").toLowerCase();
      return boardType.includes(label);
    });

    if (!matched) return 0;

    return Number(matched?.price ?? matched?.pricePerNight ?? 0) || 0;
  };

  const fullBoardPrice = extractBoardPrice("full");
  const halfBoardPrice = extractBoardPrice("half");

  const handleBookingChange = (field, value) => {
    setBookingForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      const payload = {
        accommodationName: accommodation?.name || '',
        name: bookingForm.name,
        contactNumber: bookingForm.contactNumber,
        date: bookingForm.date,
        boardType: bookingForm.boardType,
      };

      const configuredBase = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
      const sameOriginBase = window.location.origin.replace(/\/$/, '');
      const fallbackBases = [configuredBase, sameOriginBase];

      const uniqueBases = [...new Set(fallbackBases.filter(Boolean))];
      let lastErrorMessage = 'Failed to send booking inquiry';
      let succeeded = false;

      for (const base of uniqueBases) {
        try {
          const response = await fetch(`${base}/api/accommodation-booking`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          let data = null;
          try {
            data = await response.json();
          } catch {
            data = null;
          }

          if (response.ok) {
            succeeded = true;
            break;
          }

          lastErrorMessage = data?.message || `Request failed (${response.status})`;
        } catch (networkErr) {
          lastErrorMessage = networkErr?.message || 'Network error';
        }
      }

      if (!succeeded) {
        throw new Error(lastErrorMessage || 'Failed to send booking inquiry');
      }

      toast.success("Inquiry sent successfully! We'll contact you soon.");
      setBookingForm({
        name: '',
        contactNumber: '',
        date: '',
        boardType: '',
      });
    } catch (error) {
      toast.error(error.message || 'Failed to send booking inquiry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: accommodation.name,
          text: `Check out this accommodation: ${accommodation.name}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error('Sharing failed:', error);
      }
    }
  };

  const handleScrollToBookingForm = () => {
    bookingSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="bg-white min-h-screen font-sans text-gray-800 pb-16 pt-20 selection:bg-[#c8007b] selection:text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-4">
            <Reveal direction="up">
              <div className="aspect-[4/3] w-full bg-gray-100 rounded-2xl overflow-hidden border border-gray-100 relative group">
                <img
                  src={mainImage || "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop"}
                  alt={accommodation.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </Reveal>

            {images.length > 1 && (
              <Reveal direction="up">
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === idx ? 'border-[#c8007b] ring-2 ring-[#c8007b]/20' : 'border-transparent opacity-70 hover:opacity-100'}`}
                    >
                      <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </Reveal>
            )}
          </div>

          <div className="lg:col-span-5">
            <Reveal direction="up" className="sticky top-8">
              <div className="mb-6 border-b border-gray-100 pb-6">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 text-[#c8007b] text-sm font-semibold">
                    <MapPin size={16} />
                    <span className="bg-[#c8007b]/10 text-[#c8007b] text-xs px-2 py-0.5 rounded-full font-semibold">
                      {accommodation.location || "Sri Lanka"}
                    </span>
                  </div>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-[#c8007b] transition-colors"
                    title="Share Accommodation"
                  >
                    <Share2 size={20} />
                  </button>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 leading-tight">
                  {accommodation.name}
                </h1>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-yellow-500 font-bold">
                    <Star size={16} fill="currentColor" />
                    <span>{accommodation.rating || "4.8"}</span>
                  </div>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500">Premium Stay</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Starting From</p>
                    <h4 className="text-3xl font-black text-gray-900">${pricePerNight}</h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Full Board</p>
                    <p className="text-xl font-black text-[#c8007b] mt-2">
                      {fullBoardPrice > 0 ? `$${fullBoardPrice.toLocaleString()}` : "Not available"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Half Board</p>
                    <p className="text-xl font-black text-[#c8007b] mt-2">
                      {halfBoardPrice > 0 ? `$${halfBoardPrice.toLocaleString()}` : "Not available"}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-gray-500 font-semibold text-sm">Base Rate</span>
                    <span className="text-2xl font-black text-[#c8007b]">${pricePerNight.toLocaleString()}</span>
                  </div>

                  <button
                    onClick={handleScrollToBookingForm}
                    className="w-full bg-[#c8007b] hover:bg-[#a30065] text-white text-lg font-bold py-4 rounded-xl shadow-lg shadow-[#c8007b]/30 transition-transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    Book Your Stay <ArrowRight size={20} />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <ShieldCheck size={14} className="text-green-600" />
                  <span>Guaranteed Best Rates</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        <div ref={bookingSectionRef} className="mt-16 border-t border-gray-100 pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 lg:order-2">
              <Reveal direction="up" className="lg:sticky lg:top-24">
                <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-[#c8007b]/10 blur-3xl" />
                  <div className="relative">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#c8007b] font-bold mb-2">
                      Accommodation Inquiry
                    </p>
                    <h3 className="text-2xl font-bold text-gray-900 mb-5">Book This Stay</h3>

                    <form onSubmit={handleBookingSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={bookingForm.name}
                          onChange={(e) => handleBookingChange('name', e.target.value)}
                          required
                          className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-gray-900 focus:border-[#c8007b] focus:ring-2 focus:ring-[#c8007b]/20 outline-none"
                          placeholder="Enter your name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Number</label>
                        <input
                          type="tel"
                          value={bookingForm.contactNumber}
                          onChange={(e) => handleBookingChange('contactNumber', e.target.value)}
                          required
                          className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-gray-900 focus:border-[#c8007b] focus:ring-2 focus:ring-[#c8007b]/20 outline-none"
                          placeholder="Enter contact number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          value={bookingForm.date}
                          onChange={(e) => handleBookingChange('date', e.target.value)}
                          required
                          className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-gray-900 focus:border-[#c8007b] focus:ring-2 focus:ring-[#c8007b]/20 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Board Type</label>
                        <select
                          value={bookingForm.boardType}
                          onChange={(e) => handleBookingChange('boardType', e.target.value)}
                          required
                          className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-gray-900 focus:border-[#c8007b] focus:ring-2 focus:ring-[#c8007b]/20 outline-none"
                        >
                          <option value="">Select board type</option>
                          <option value="Full Board">Full Board</option>
                          <option value="Half Board">Half Board</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-12 rounded-xl bg-[#c8007b] hover:bg-[#a30065] text-white font-bold transition disabled:opacity-60"
                      >
                        {isSubmitting ? 'Sending...' : 'Send Booking Inquiry'}
                      </button>
                    </form>
                  </div>
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-8 max-w-4xl lg:order-1">
              <div className="grid grid-cols-3 sm:flex border-b border-gray-200 mb-6 sm:mb-8">
                {["Overview", "Inclusions", "Exclusions"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase())}
                    className={`px-2 sm:px-6 py-3 sm:py-4 font-bold text-xs sm:text-sm uppercase tracking-wide border-b-2 transition-colors text-center whitespace-nowrap ${
                      activeTab === tab.toLowerCase()
                        ? "border-[#c8007b] text-[#c8007b]"
                        : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === "overview" && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">About this Stay</h3>
                  <p className="text-gray-600 leading-relaxed text-base sm:text-lg break-words [overflow-wrap:anywhere]">
                    {overviewText}
                  </p>
                </div>
              )}

              {activeTab === "inclusions" && (
                <div className="animate-fadeIn">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5 sm:mb-6">What's Included</h3>
                  {finalInclusions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {finalInclusions.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <Check className="text-green-500 shrink-0" size={20} />
                          <span className="text-gray-700 font-medium text-sm sm:text-base break-words [overflow-wrap:anywhere]">{item}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                      <h3 className="text-lg font-medium text-gray-900">No inclusions listed</h3>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "exclusions" && (
                <div className="animate-fadeIn">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5 sm:mb-6">What's Excluded</h3>
                  {exclusions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {exclusions.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <X className="text-red-500 shrink-0" size={20} />
                          <span className="text-gray-700 font-medium text-sm sm:text-base break-words [overflow-wrap:anywhere]">{item}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                      <h3 className="text-lg font-medium text-gray-900">No exclusions listed</h3>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccommodationOverviewPage;
