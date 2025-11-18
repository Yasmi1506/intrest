// src/components/PinterestClone.jsx
import React, { useState, useEffect, useRef } from "react";
import { Search, Heart, Download, X, Home, Bell, LogOut } from "lucide-react";
import { auth, logout } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";

const PinterestClone = () => {
  const [images, setImages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("music");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [page, setPage] = useState(1);
  const observer = useRef();
  const lastImageRef = useRef();
  const navigate = useNavigate();

  const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

  const fetchImages = async (query, pageNum) => {
    setLoading(true);
    try {
      const resp = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&page=${pageNum}&per_page=30&client_id=${UNSPLASH_ACCESS_KEY}`
      );
      const data = await resp.json();
      if (pageNum === 1) setImages(data.results);
      else setImages((prev) => [...prev, ...data.results]);
    } catch (e) {
      console.error(e);
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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const user = auth.currentUser;

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
        <img
          src={image.urls.small}
          alt={image.alt_description || ""}
          className="w-full rounded-2xl object-cover"
          loading="lazy"
        />
        {hovered && (
          <div className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl flex flex-col justify-between p-4">
            <div className="flex justify-end">
              <button className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full">
                <Heart size={18} />
              </button>
            </div>
            <div className="flex items-center gap-2 text-white">
              <img
                src={image.user.profile_image.small}
                alt={image.user.name}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm font-medium">{image.user.name}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ---------- HEADER ---------- */}
      <header className="fixed top-0 left-0 right-0 bg-white z-50 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-red-600">Snaply</h1>
            <nav className="hidden md:flex gap-4">
              <button className="px-4 py-2 rounded-full bg-black text-white hover:bg-gray-800 flex items-center gap-1">
                <Home size={18} /> Home
              </button>
              <button className="px-4 py-2 rounded-full hover:bg-gray-100">
                Explore
              </button>
              <button className="px-4 py-2 rounded-full hover:bg-gray-100">
                Create
              </button>
            </nav>
          </div>

          <div className="flex-1 max-w-3xl">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch(e)}
                placeholder="Search for ideas..."
                className="w-full pl-12 pr-4 py-3 rounded-full bg-gray-100 hover:bg-gray-200 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Bell size={24} className="text-gray-600" />
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <img
                  src={
                    user.photoURL ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.displayName || user.email
                    )}`
                  }
                  alt={user.displayName || user.email}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  title="Logout"
                >
                  <LogOut size={20} className="text-gray-600" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 text-sm font-medium"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ---------- MAIN GRID ---------- */}
      <main className="max-w-screen-2xl mx-auto px-4 pt-24 pb-8">
        {images.length === 0 && !loading ? (
          <div className="text-center py-20">
            <Search size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              Start searching
            </h2>
            <p className="text-gray-500">Type something above to see pins</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
            {images.map((img, i) => (
              <ImageCard key={img.id} image={img} index={i} />
            ))}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-red-600"></div>
          </div>
        )}
      </main>

      {/* ---------- MODAL ---------- */}
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
            <div className="flex-1 flex items-center justify-center">
              <img
                src={selectedImage.urls.regular}
                alt={selectedImage.alt_description || ""}
                className="max-w-full max-h-[80vh] rounded-2xl object-contain"
              />
            </div>

            <div className="bg-white rounded-2xl p-6 w-full md:w-96 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedImage.user.profile_image.medium}
                    alt={selectedImage.user.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold">{selectedImage.user.name}</h3>
                    <p className="text-sm text-gray-500">
                      @{selectedImage.user.username}
                    </p>
                  </div>
                </div>
                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm">
                  Follow
                </button>
              </div>

              <h2 className="text-xl font-bold mb-2">
                {selectedImage.alt_description || "Untitled"}
              </h2>
              <p className="text-gray-600 mb-4">
                {selectedImage.description || "No description"}
              </p>

              <div className="flex gap-2 mb-4">
                <button className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-full font-semibold flex items-center justify-center gap-2">
                  <Heart size={18} /> Save
                </button>
                <a
                  href={`${selectedImage.links.download}?force=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-black hover:bg-gray-800 text-white py-3 rounded-full font-semibold flex items-center justify-center gap-2"
                >
                  <Download size={18} /> Download
                </a>
              </div>

              <div className="border-t pt-4 space-y-1 text-sm text-gray-500">
                <p>
                  <strong>Views:</strong>{" "}
                  {selectedImage.views?.toLocaleString() || "N/A"}
                </p>
                <p>
                  <strong>Likes:</strong>{" "}
                  {selectedImage.likes?.toLocaleString() || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PinterestClone;