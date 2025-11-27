import React, { useState, useEffect, useRef } from "react";
import { Search, Heart, Download, X, Home, Bell, LogOut, Sparkles, AlertCircle, Info } from "lucide-react";
import { auth, logout } from "../firebase/firebase";   // <-- make sure this path is correct
import { signOut } from "firebase/auth";

const PinterestClone = () => {
  const [images, setImages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("music");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [page, setPage] = useState(1);
  const [user, setUser] = useState(null);

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiModal, setAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSuccess, setAiSuccess] = useState("");
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const observer = useRef();
  const lastImageRef = useRef();

  const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

  // Get current user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setImageLoadFailed(false); // Reset image load state when user changes
      console.log("Current user:", currentUser);
      console.log("User photoURL:", currentUser?.photoURL);
      console.log("User displayName:", currentUser?.displayName);
    });
    return unsubscribe;
  }, []);

  // LOGOUT FUNCTION -------------------------
  const handleLogout = async () => {
    try {
      await signOut(auth); // Firebase logout
      console.log("Logged out");
      window.location.href = "/login";  // Redirect (optional)
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // --------------------------- UNSPLASH FETCH ---------------------------
  const fetchImages = async (query, pageNum) => {
    setLoading(true);
    try {
      const resp = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&page=${pageNum}&per_page=30&client_id=${UNSPLASH_ACCESS_KEY}`
      );
      const data = await resp.json();
      if (pageNum === 1) setImages(data.results || []);
      else setImages((prev) => [...prev, ...(data.results || [])]);
    } catch (e) {
      console.error("Unsplash error:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchImages(searchQuery, page);
  }, [page]);

  useEffect(() => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setPage((p) => p + 1);
    });

    if (lastImageRef.current) observer.current.observe(lastImageRef.current);
  }, [loading, images]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchImages(searchQuery, 1);
  };

  // --------------------------- AI GENERATION ---------------------------
  const AI_APIS = {
    pollinations: "https://image.pollinations.ai/prompt/",
    picsum: "https://picsum.photos/seed/",
  };

  const generateAIImage = async () => {
    if (!aiPrompt.trim()) {
      setAiError("Please enter a prompt");
      return;
    }

    setAiLoading(true);
    setAiError("");
    setAiSuccess("");

    try {
      const encoded = encodeURIComponent(aiPrompt);
      const imageUrl = `${AI_APIS.pollinations}${encoded}?width=800&height=800&seed=${Date.now()}`;

      const testImage = new Image();
      await new Promise((resolve, reject) => {
        testImage.onload = resolve;
        testImage.onerror = reject;
        testImage.src = imageUrl;
      });

      const aiImageObj = {
        id: `ai-${Date.now()}`,
        urls: { small: imageUrl, regular: imageUrl, full: imageUrl },
        alt_description: aiPrompt,
        user: {
          name: "AI Generated",
          profile_image: { small: "https://ui-avatars.com/api/?name=AI&background=ef4444&color=fff" },
        },
        isAI: true,
      };

      setImages((prev) => [aiImageObj, ...prev]);
      setAiSuccess("Image generated successfully! 🎨");

      setTimeout(() => {
        setAiModal(false);
        setAiPrompt("");
        setAiSuccess("");
      }, 2000);
    } catch (err) {
      console.error("AI error:", err);
      setAiError("Failed to generate image");
    }

    setAiLoading(false);
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename || "snaply-image.jpg";
      link.click();
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  // --------------------------- IMAGE CARD ---------------------------
  const ImageCard = ({ image, index }) => {
    const [hovered, setHovered] = useState(false);

    return (
      <div
        ref={index === images.length - 1 ? lastImageRef : null}
        className="relative break-inside-avoid mb-4 group cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setSelectedImage(image)}
      >
        <img src={image.urls.small} alt="" className="w-full rounded-2xl object-cover" loading="lazy" />

        {image.isAI && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs flex gap-1">
            <Sparkles size={12} /> AI
          </div>
        )}

        {hovered && (
          <div className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex justify-end gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(image.urls.regular, `snaply-${image.id}.jpg`);
                }}
                className="bg-white p-2 rounded-full shadow"
              >
                <Download size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --------------------------- MAIN UI ---------------------------
  return (
    <div className="min-h-screen bg-white">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 bg-white z-50 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between">

          {/* LEFT SECTION */}
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-red-600">Snaply</h1>

            <button className="px-4 py-2 rounded-full bg-black text-white flex items-center gap-1">
              <Home size={18} /> Home
            </button>

            <button
              onClick={() => setAiModal(true)}
              className="px-4 py-2 rounded-full bg-red-600 text-white flex items-center gap-2"
            >
              <Sparkles size={18} /> AI Create
            </button>
          </div>

          {/* SEARCH BAR */}
          <div className="flex-1 max-w-xl mx-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch(e)}
                placeholder="Search…"
                className="w-full pl-12 pr-4 py-3 rounded-full bg-gray-100 focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* RIGHT SECTION */}
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Bell size={22} />
            </button>

            {/* PROFILE ICON */}
            {user?.photoURL && !imageLoadFailed ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="w-9 h-9 rounded-full object-cover border-2 border-red-500"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  console.error("Image load error:", e);
                  setImageLoadFailed(true);
                }}
                onLoad={() => console.log("Image loaded successfully")}
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-red-600 to-pink-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.displayName?.charAt(0).toUpperCase() || "U"}
              </div>
            )}

            {/* LOGOUT BUTTON (FIXED & VISIBLE) */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-full border border-red-300"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* GRID */}
      <main className="max-w-screen-2xl mx-auto px-4 pt-24 pb-8">
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
          {images.map((img, i) => (
            <ImageCard key={img.id} image={img} index={i} />
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-6">
            <div className="h-10 w-10 rounded-full border-4 border-gray-300 border-t-red-600 animate-spin"></div>
          </div>
        )}
      </main>

      {/* ---------- IMAGE MODAL ---------- */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 z-10"
          >
            <X size={24} />
          </button>

          <div
            className="max-w-6xl w-full flex flex-col md:flex-row gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <img
                src={selectedImage.urls.regular}
                alt={selectedImage.alt_description || ""}
                className="max-w-full max-h-[75vh] rounded-2xl object-contain shadow-2xl"
              />
              
              {/* Download Button in Modal */}
              <button
                onClick={() => handleDownload(selectedImage.urls.full || selectedImage.urls.regular, `snaply-${selectedImage.id}.jpg`)}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-3 rounded-full flex items-center gap-2 font-medium shadow-lg transition-transform hover:scale-105"
              >
                <Download size={20} />
                Download Image
              </button>

              {/* Image Info */}
              <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-lg">
                <img
                  src={selectedImage.user.profile_image.small}
                  alt={selectedImage.user.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-semibold text-gray-800">{selectedImage.user.name}</p>
                  {selectedImage.alt_description && (
                    <p className="text-sm text-gray-600">{selectedImage.alt_description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------- AI GENERATION MODAL --------------------------- */}
      {aiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="text-red-600" /> Generate AI Image
            </h2>

            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe the image you want... (e.g., 'a futuristic city at sunset with flying cars')"
              className="w-full h-28 p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-red-500 outline-none resize-none"
            ></textarea>

            {/* Info about free API */}
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
              <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">Using free Pollinations.ai API - No API key needed!</p>
            </div>

            {/* Status Messages */}
            {aiError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{aiError}</p>
              </div>
            )}

            {aiSuccess && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                <Sparkles size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">{aiSuccess}</p>
              </div>
            )}

            {aiLoading && (
              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-700 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  Generating your AI masterpiece... This may take 5-15 seconds.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setAiModal(false);
                  setAiPrompt("");
                  setAiError("");
                  setAiSuccess("");
                }}
                disabled={aiLoading}
                className="px-4 py-2 bg-gray-200 rounded-full hover:bg-gray-300 disabled:opacity-50 transition"
              >
                Cancel
              </button>

              <button
                onClick={generateAIImage}
                disabled={aiLoading || !aiPrompt.trim()}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-full hover:from-red-700 hover:to-pink-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
              >
                {aiLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PinterestClone;