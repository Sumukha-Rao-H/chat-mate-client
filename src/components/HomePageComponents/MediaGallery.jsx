import React, { useState } from "react";
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { ArrowRight, Download, Share2, CheckSquare, Square } from "lucide-react";

const ITEMS_PER_PAGE = 6;

const MediaGallery = ({ mediaItems = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  const toggleGallery = () => {
    setIsExpanded(!isExpanded);
    setPage(0);
    setSelectedItems([]); // reset selections on toggle
  };

  const totalPages = Math.ceil(mediaItems.length / ITEMS_PER_PAGE);
  const startIndex = page * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = mediaItems.slice(startIndex, endIndex);
  const latestItem = mediaItems[mediaItems.length - 1];
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentItem = mediaItems[currentIndex];

  const handlePrevPage = () => {
    setPage((prev) => Math.max(prev - 1, 0));
  };

  const handleNextPage = () => {
    setPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const toggleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const isItemSelected = (id) => selectedItems.includes(id);

  const selectAll = () => {
    const pageItemIds = currentItems.map((item) => item.id);
    const allSelected = pageItemIds.every((id) => selectedItems.includes(id));

    if (allSelected) {
      // Deselect all
      setSelectedItems((prev) => prev.filter((id) => !pageItemIds.includes(id)));
    } else {
      // Select all
      setSelectedItems((prev) => [...new Set([...prev, ...pageItemIds])]);
    }
  };

  const downloadFile = async (url, filename) => {
    try {
      const response = await fetch(url, { mode: "cors" }); // mode may vary based on CORS policy
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
  
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename || "download"; // Optional custom name
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleShare = async (url) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check this out!",
          text: "Here's a cool file for you!",
          url: url,
        });
        console.log("Shared successfully");
      } catch (error) {
        console.error("Error sharing", error);
      }
    } else {
      alert("Web Share API not supported in this browser.");
    }
  };

  const handleBatchDownload = async () => {
    if (selectedItems.length === 0) return;

    selectedItems.forEach(async (id) => {
      const item = mediaItems.find((i) => i.id === id);
      if (!item || item.type !== "image") return;

      try {
        const response = await fetch(item.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `image-${item.id}.jpg`;
        document.body.appendChild(a);
        a.click();

        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error("Download failed for item:", item.id, error);
      }
    });
  };

  const handleBatchShare = async () => {
    if (selectedItems.length === 0) return;

    const selectedUrls = selectedItems
      .map((id) => {
        const item = mediaItems.find((i) => i.id === id);
        return item?.url;
      })
      .filter(Boolean);

    if (navigator.share && selectedUrls.length === 1) {
      try {
        await navigator.share({
          title: "Shared Media",
          text: "Check out this media item!",
          url: selectedUrls[0],
        });
        console.log("Shared successfully");
      } catch (error) {
        console.error("Share failed:", error);
      }
    } else {
      try {
        const text = selectedUrls.join("\n");
        await navigator.clipboard.writeText(text);
        alert("Links copied to clipboard!");
      } catch (error) {
        console.error("Clipboard copy failed:", error);
      }
    }
  };

  return (
    <div className="relative flex justify-end px-4 py-2 bg-transparent">
      <div className="relative">
        {/* Small Preview Button */}
        <div
          onClick={toggleGallery}
          className="w-16 h-16 rounded-lg overflow-hidden cursor-pointer opacity-30 hover:opacity-100 transition-opacity duration-300 bg-gray-200 bg-opacity-20 flex items-center justify-center"
        >
          {latestItem ? (
            latestItem.type === "image" ? (
              <img
                src={latestItem.url}
                alt={`Latest Media`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="relative w-full h-full bg-black flex items-center justify-center">
                <img
                  src={latestItem.url}
                  alt={`Latest Video`}
                  className="w-full h-full object-cover opacity-70"
                />
                <span className="absolute text-white text-xs font-bold">▶</span>
              </div>
            )
          ) : (
            <span className="text-xs text-gray-600">No Media</span>
          )}
        </div>

        {/* Expanded Gallery */}
        {isExpanded && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg p-4 space-y-2 z-20">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold">Media Gallery</h3>
              <button
                onClick={toggleGallery}
                className="p-1 rounded-full hover:bg-gray-200 transition"
              >
                <XMarkIcon className="h-4 w-4 text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            {/* Action Buttons */}
            {mediaItems.length > 0 && (
              <div className="flex justify-between items-center mb-2">
                <button
                  onClick={selectAll}
                  className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
                >
                  {currentItems.every((item) => selectedItems.includes(item.id)) ? (
                    <>
                      <CheckSquare className="h-4 w-4" /> Deselect All
                    </>
                  ) : (
                    <>
                      <Square className="h-4 w-4" /> Select All
                    </>
                  )}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleBatchDownload}
                    disabled={selectedItems.length === 0}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                      selectedItems.length === 0
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-blue-500 hover:bg-gray-100"
                    }`}
                  >
                    <Download className="h-4 w-4" /> Download
                  </button>
                  <button
                    onClick={handleBatchShare}
                    disabled={selectedItems.length === 0}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                      selectedItems.length === 0
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-green-500 hover:bg-gray-100"
                    }`}
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </button>
                </div>
              </div>
            )}

            {/* Media Grid */}
            <div className="grid grid-cols-3 gap-2">
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <div
                    key={item.id}
                    className={`relative w-full h-24 rounded overflow-hidden cursor-pointer group ${
                      isItemSelected(item.id) ? "ring-2 ring-blue-400" : ""
                    }`}
                  >
                    <div
                      onClick={() => toggleSelectItem(item.id)}
                      className="absolute top-1 left-1 bg-white bg-opacity-70 rounded-full p-1 z-10"
                    >
                      {isItemSelected(item.id) ? (
                        <CheckSquare className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </div>

                    <div
                      onClick={() => setFullscreenMedia(item)}
                      className="w-full h-full flex items-center justify-center hover:opacity-80 transition"
                    >
                      {item.type === "image" ? (
                        <img
                          src={item.url}
                          alt={`Media ${item.id}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="relative w-full h-full bg-black flex items-center justify-center text-white text-xs">
                          <img
                            src={item.url}
                            alt={`Video ${item.id}`}
                            className="w-full h-full object-cover opacity-70"
                          />
                          <span className="absolute text-sm font-bold">▶</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 col-span-3 text-center">
                  No media files
                </p>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-2">
              <button
                onClick={handlePrevPage}
                disabled={page === 0}
                className={`flex items-center gap-1 text-xs ${
                  page === 0
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-blue-500 hover:underline"
                }`}
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Previous
              </button>

              <span className="text-xs text-gray-500">
                Page {page + 1} of {totalPages}
              </span>

              <button
                onClick={handleNextPage}
                disabled={page === totalPages - 1}
                className={`flex items-center gap-1 text-xs ${
                  page === totalPages - 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-blue-500 hover:underline"
                }`}
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Fullscreen Media Viewer */}
        {fullscreenMedia && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center p-4">
              {/* Close Button */}
              <button
                onClick={() => setFullscreenMedia(null)}
                className="absolute top-4 right-4 text-white bg-gray-700 bg-opacity-70 hover:bg-opacity-100 p-2 rounded-full"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>

              {/* Media Display */}
              {fullscreenMedia.type === "image" ? (
                <img
                  src={fullscreenMedia.url}
                  alt="Fullscreen Media"
                  className="max-w-full max-h-full object-contain rounded"
                />
              ) : (
                <video
                  src={fullscreenMedia.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-full rounded"
                />
              )}

              {/* Buttons */}
              <div className="absolute bottom-8 flex gap-4">
                <button
                  onClick={() => downloadFile(fullscreenMedia.url, fullscreenMedia.name)}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:bg-gray-200 px-4 py-2 rounded shadow-md transition"
                >
                  <Download className="h-4 w-4 text-blue-600" />
                  Download
                </button>

                <button
                  onClick={() => handleShare(fullscreenMedia.url)}
                  className="flex items-center gap-2 text-green-500 hover:bg-gray-200 px-4 py-2 rounded shadow-md transition"
                >
                  <Share2 className="h-4 w-4 text-green-500" />
                  Share
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaGallery;
