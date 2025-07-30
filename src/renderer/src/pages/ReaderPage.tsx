import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.min.mjs';
import {
  FiChevronLeft,
  FiChevronRight,
  FiSettings,
  FiGrid,
  FiMaximize,
  FiMinimize,
  FiBookmark,
} from 'react-icons/fi';
import { IoMdArrowRoundBack } from 'react-icons/io';
import ReaderSettings from '../components/ReaderSettings';
import OverviewGrid from '../components/OverviewGrid';
import BookmarkSidebar from '../components/BookmarkSidebar';
import { bookService } from '../services';
import { Book } from '../services/bookService';
import './ReaderPage.css';

// Enhanced protection for PDF content
const addPDFProtection = () => {
  // Disable text selection on PDF content
  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';

  // Add watermark overlay
  const watermark = document.createElement('div');
  watermark.id = 'pdf-watermark';
  watermark.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
    background-image: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 100px,
      rgba(255, 0, 0, 0.03) 100px,
      rgba(255, 0, 0, 0.03) 200px
    );
    font-family: Arial, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 0, 0, 0.1);
    font-size: 48px;
    font-weight: bold;
    transform: rotate(-45deg);
  `;
  watermark.textContent = 'PROTECTED CONTENT';

  if (!document.getElementById('pdf-watermark')) {
    document.body.appendChild(watermark);
  }
};

const removePDFProtection = () => {
  document.body.style.userSelect = '';
  document.body.style.webkitUserSelect = '';

  const watermark = document.getElementById('pdf-watermark');
  if (watermark) {
    watermark.remove();
  }
};

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.js';

// PDF fetching is now handled via Electron IPC to bypass CORS

interface ReaderPageProps {
  book: Book;
  onBack: () => void;
}

interface Bookmark {
  page: number;
  note: string;
}

const fontOptions = [
  { label: 'Default Font', value: 'inherit' },
  { label: 'Merriweather', value: 'Merriweather, serif' },
  { label: 'Roboto Slab', value: 'Roboto Slab, serif' },
];

const bgOptions = [
  { label: 'White', value: '#fff' },
  { label: 'Sepia', value: '#f6ecd9' },
  { label: 'Gray', value: '#f3f4f6' },
  { label: 'Dark', value: '#181818' },
];

const ReaderPage: React.FC<ReaderPageProps> = ({ book, onBack }) => {
  const [bookUrl, setBookUrl] = useState<string>('');
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [fontSize, setFontSize] = useState<number>(16);
  const [font, setFont] = useState<string>(fontOptions[0].value);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [bgColor, setBgColor] = useState<string>(bgOptions[0].value);
  const [customBg, setCustomBg] = useState<string>('');
  const [singlePage, setSinglePage] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showOverview, setShowOverview] = useState<boolean>(false);
  const [showBookmarks, setShowBookmarks] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [zoom, setZoom] = useState<number>(1.0);
  const [thumbnails, setThumbnails] = useState<{ [key: number]: string }>({});
  const [showFloatingSettings, setShowFloatingSettings] =
    useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Bookmark handlers
  const jumpToBookmark = (targetPage: number) => {
    console.log('[ReaderPage] Jumping to bookmark. Target page:', targetPage);
    setPage(targetPage);
  };

  const removeBookmark = (targetPage: number) => {
    setBookmarks((bms) => bms.filter((bm) => bm.page !== targetPage));
  };

  const editBookmark = (targetPage: number, note: string) => {
    setBookmarks((bms) =>
      bms.map((bm) => (bm.page === targetPage ? { ...bm, note } : bm)),
    );
  };

  // Fullscreen toggle
  const handleFullscreen = () => {
    setIsFullscreen((f) => !f);
  };

  // Navigation
  const goPrev = () => {
    setPage((p) => Math.max(1, p - (singlePage ? 1 : 2)));
  };

  const goNext = () => {
    if (numPages) {
      setPage((p) =>
        Math.min(numPages - (singlePage ? 0 : 1), p + (singlePage ? 1 : 2)),
      );
    }
  };

  // Fetch book details
  useEffect(() => {
    let objectUrl: string | null = null;
    const fetchBookDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get auth data from localStorage
        const authToken = localStorage.getItem('auth_token');
        const userId = localStorage.getItem('user_id');

        console.log('[ReaderPage] Book ID:', book.bookId);
        console.log('[ReaderPage] Auth token:', authToken);
        console.log('[ReaderPage] User ID:', userId);
        // Direct fetch to API
        const apiResponse = await fetch(`https://booksiam.com/book-detail/${book.bookId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'UserId': userId || '',
          },
        });

        if (!apiResponse.ok) {
          throw new Error(`API request failed: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        console.log('[ReaderPage] Book details:', data);

        if (data?.bookUrl) {
          const remoteUrl = data.bookUrl;
          console.log('[ReaderPage] Loading PDF from:', remoteUrl);
          
          try {
            // Use Electron IPC to fetch PDF and bypass CORS
            if (window.electron?.ipcRenderer?.invoke) {
              console.log('[ReaderPage] Fetching PDF via Electron IPC...');
              const result = await window.electron.ipcRenderer.invoke('fetch-pdf', remoteUrl);
              
              if (result.success) {
                // Convert array back to Uint8Array and create blob
                const uint8Array = new Uint8Array(result.data);
                const pdfBlob = new Blob([uint8Array], { type: 'application/pdf' });
                objectUrl = URL.createObjectURL(pdfBlob);
                setBookUrl(objectUrl);
                const loadingTask = pdfjsLib.getDocument(objectUrl);
                const loadedPdf = await loadingTask.promise;
                setPdf(loadedPdf);
                setNumPages(loadedPdf.numPages);
                console.log('[ReaderPage] PDF loaded successfully via IPC, pages:', loadedPdf.numPages);
              } else {
                throw new Error(`IPC fetch failed: ${result.error}`);
              }
            } else {
              // Fallback for non-Electron environment (browser)
              console.log('[ReaderPage] Electron IPC not available, trying proxy fetch...');
              
              // Try proxy first for S3 URLs
              let fetchUrl = remoteUrl;
              if (remoteUrl.includes('booksiam.s3.ap-southeast-1.amazonaws.com')) {
                const urlObj = new URL(remoteUrl);
                const pathWithQuery = urlObj.pathname + urlObj.search;
                fetchUrl = `/s3-proxy${pathWithQuery}`;
                console.log('[ReaderPage] Using proxy URL:', fetchUrl);
              }
              
              const pdfRes = await fetch(fetchUrl);
              if (!pdfRes.ok) throw new Error(`Failed to fetch PDF: ${pdfRes.status}`);
              const pdfBlob = await pdfRes.blob();
              objectUrl = URL.createObjectURL(pdfBlob);
              setBookUrl(objectUrl);
              const loadingTask = pdfjsLib.getDocument(objectUrl);
              const loadedPdf = await loadingTask.promise;
              setPdf(loadedPdf);
              setNumPages(loadedPdf.numPages);
              console.log('[ReaderPage] PDF loaded successfully via proxy, pages:', loadedPdf.numPages);
            }
          } catch (pdfErr) {
            console.error('Error loading PDF:', pdfErr);
            setError('Failed to load PDF: ' + (pdfErr instanceof Error ? pdfErr.message : String(pdfErr)));
          }
        } else {
          setError('No book URL found for this book');
        }
      } catch (err) {
        console.error('Error fetching book details:', err);
        setError('Book not found');
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [book.bookId]);

  // Enable PDF protection
  useEffect(() => {

    return () => {
      removePDFProtection();
    };
  }, []);

  // Render PDF pages
  useEffect(() => {
    if (!pdf || !canvasRef.current || showOverview) return;

    const renderPage = async () => {
      const canvas = canvasRef.current!;
      const context = canvas.getContext('2d')!;
      context.clearRect(0, 0, canvas.width, canvas.height);

      try {
        if (singlePage) {
          const pageObj = await pdf.getPage(page);
          const viewport = pageObj.getViewport({ scale: zoom });
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await pageObj.render({
            canvasContext: context,
            viewport,
          }).promise;
          console.log(
            `[ReaderPage] Rendered single page ${page} at zoom ${zoom}`,
          );
        } else {
          // Double-page mode: show two pages side by side
          const leftPageNum = page;
          const rightPageNum = page + 1;

          if (leftPageNum > pdf.numPages) return;

          const leftPage = await pdf.getPage(leftPageNum);
          const leftViewport = leftPage.getViewport({ scale: zoom });

          // Calculate canvas dimensions with a 10px gap between pages
          const pageGap = 10;
          const canvasHeight = leftViewport.height;
          const totalWidth =
            rightPageNum <= pdf.numPages
              ? leftViewport.width * 2 + pageGap
              : leftViewport.width;

          // Adjust canvas size to fit container width
          const containerWidth =
            containerRef.current?.clientWidth || window.innerWidth;
          const scaleFactor = Math.min(1, (containerWidth - 40) / totalWidth); // 40px for padding
          canvas.height = canvasHeight * scaleFactor;
          canvas.width = totalWidth * scaleFactor;

          // Create a temporary canvas for each page to avoid transform issues
          const tempCanvas = document.createElement('canvas');
          const tempContext = tempCanvas.getContext('2d')!;

          // Render left page on temp canvas first
          const scaledLeftViewport = leftPage.getViewport({
            scale: zoom * scaleFactor,
          });
          tempCanvas.width = scaledLeftViewport.width;
          tempCanvas.height = scaledLeftViewport.height;

          await leftPage.render({
            canvasContext: tempContext,
            viewport: scaledLeftViewport,
          }).promise;

          // Draw left page on main canvas
          context.drawImage(tempCanvas, 0, 0);

          // Render right page if available
          if (rightPageNum <= pdf.numPages) {
            const rightPage = await pdf.getPage(rightPageNum);
            const scaledRightViewport = rightPage.getViewport({
              scale: zoom * scaleFactor,
            });

            // Clear and resize temp canvas for right page
            tempCanvas.width = scaledRightViewport.width;
            tempCanvas.height = scaledRightViewport.height;
            tempContext.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

            await rightPage.render({
              canvasContext: tempContext,
              viewport: scaledRightViewport,
            }).promise;

            // Draw right page on main canvas with offset
            const rightPageX = scaledLeftViewport.width + pageGap * scaleFactor;
            context.drawImage(tempCanvas, rightPageX, 0);
            console.log(
              `[ReaderPage] Rendered double page ${leftPageNum}-${rightPageNum} at zoom ${zoom}`,
            );
          } else {
            console.log(
              `[ReaderPage] Rendered single page ${leftPageNum} in double-page mode (no right page)`,
            );
          }
        }
      } catch (err) {
        console.error('Error rendering page:', err);
        setError('Error rendering PDF');
      }
    };

    renderPage();
  }, [pdf, page, zoom, singlePage, showOverview]);

  // Generate thumbnails for overview
  const generateThumbnails = async () => {
    if (!pdf || Object.keys(thumbnails).length >= pdf.numPages) return;

    const batchSize = 5;
    const totalPages = pdf.numPages;

    for (let i = 1; i <= totalPages; i += batchSize) {
      const pagePromises = [];

      for (let j = i; j < Math.min(i + batchSize, totalPages + 1); j++) {
        if (thumbnails[j]) continue;

        pagePromises.push(
          (async (pageNum: number) => {
            try {
              const page = await pdf.getPage(pageNum);
              const viewport = page.getViewport({ scale: 0.2 });

              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d')!;
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              await page.render({
                canvasContext: context,
                viewport,
              }).promise;

              setThumbnails((prev) => ({
                ...prev,
                [pageNum]: canvas.toDataURL(),
              }));
            } catch (error) {
              console.error(
                `Error generating thumbnail for page ${pageNum}:`,
                error,
              );
            }
          })(j),
        );
      }

      await Promise.all(pagePromises);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === '+') setZoom((z) => Math.min(z + 0.2, 3));
      else if (e.key === '-') setZoom((z) => Math.max(z - 0.2, 0.5));
      else if (e.key === 'g') {
        setShowOverview((prev) => !prev);
        if (!showOverview) generateThumbnails();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pdf, showOverview]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      setZoom(window.innerWidth < 768 ? 0.8 : 1.0);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Progress calculation
  const totalPages = numPages || 1;
  const currentPage = page;
  const progress = (currentPage / totalPages) * 100;
  const appliedBg = customBg || bgColor;
  const truncatedBookName =
    book.bookName.length > 60
      ? `${book.bookName.substring(0, 60)}...`
      : book.bookName;

  // Fullscreen mode
  if (isFullscreen) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center reader-page"
        style={{
          background: appliedBg,
          transition: 'background 0.3s',
          fontFamily: font,
          fontSize: `${fontSize}px`,
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-xl">กำลังโหลดหนังสือ...</div>
          </div>
        ) : error || !bookUrl ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-xl text-red-500">
              {error || 'No book URL provided'}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center h-full w-full overflow-auto">
            <canvas ref={canvasRef} className="shadow-lg m-4" />
          </div>
        )}
        <button
          type="button"
          onClick={handleFullscreen}
          className="fixed top-6 right-6 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition z-50"
          title="Exit Fullscreen"
        >
          <FiMinimize size={28} />
        </button>
        <div
          className="fixed top-6 right-24 z-50"
          onMouseEnter={() => setShowFloatingSettings(true)}
          onMouseLeave={() => setShowFloatingSettings(false)}
          tabIndex={0}
          onFocus={() => setShowFloatingSettings(true)}
          onBlur={() => setShowFloatingSettings(false)}
        >
          <button
            type="button"
            className="bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition"
            title="Settings"
            style={{ outline: 'none' }}
          >
            <FiSettings size={24} />
          </button>
          {showFloatingSettings && (
            <div
              className="mt-3 w-[420px] max-w-full"
              style={{ position: 'absolute', right: 0, zIndex: 100 }}
            >
              <ReaderSettings
                fontSize={fontSize}
                setFontSize={setFontSize}
                font={font}
                setFont={setFont}
                fontOptions={fontOptions}
                bgColor={bgColor}
                setBgColor={setBgColor}
                customBg={customBg}
                setCustomBg={setCustomBg}
                bgOptions={bgOptions}
                singlePage={singlePage}
                setSinglePage={setSinglePage}
                zoom={zoom}
                setZoom={setZoom}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full p-0 m-0 reader-page"
      style={{
        background: appliedBg,
        transition: 'background 0.3s',
        fontFamily: font,
        fontSize: `${fontSize}px`,
      }}
      ref={containerRef}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-t-none p-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-white text-2xl"
            onClick={onBack}
          >
            <IoMdArrowRoundBack />
          </button>
          <span className="text-white text-xl font-bold ml-2">
            {truncatedBookName}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={() => {
              setShowOverview(true);
              generateThumbnails();
            }}
            title="Overview"
            className="text-white"
          >
            <FiGrid size={22} />
          </button>
          <button
            type="button"
            onClick={() => setShowBookmarks(true)}
            title="Bookmarks"
            className="text-white"
          >
            <FiBookmark size={22} />
          </button>
          {/* <button
            type="button"
            onClick={handleFullscreen}
            title="Fullscreen"
            className="text-white"
          >
            {isFullscreen ? <FiMinimize size={22} /> : <FiMaximize size={22} />}
          </button> */}
          <button
            type="button"
            onClick={() => setShowSettings((prev) => !prev)}
            title="Settings"
            className="text-white"
          >
            <FiSettings size={22} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <ReaderSettings
          fontSize={fontSize}
          setFontSize={setFontSize}
          font={font}
          setFont={setFont}
          fontOptions={fontOptions}
          bgColor={bgColor}
          setBgColor={setBgColor}
          customBg={customBg}
          setCustomBg={setCustomBg}
          bgOptions={bgOptions}
          singlePage={singlePage}
          setSinglePage={setSinglePage}
          zoom={zoom}
          setZoom={setZoom}
        />
      )}

      {/* Overview and Bookmarks */}
      {showOverview && (
        <OverviewGrid
          pages={Array.from(
            { length: numPages || 0 },
            (_, i) => `Page ${i + 1}`,
          )}
          thumbnails={thumbnails}
          bookmarks={bookmarks.map((bm) => bm.page)}
          searchTerm=""
          onJump={(idx: number) => {
            setPage(idx + 1);
            setShowOverview(false);
          }}
          onClose={() => setShowOverview(false)}
        />
      )}
      {showBookmarks && (
        <BookmarkSidebar
          bookmarks={bookmarks}
          onJump={jumpToBookmark}
          onRemove={removeBookmark}
          onEdit={editBookmark}
          onClose={() => setShowBookmarks(false)}
        />
      )}

      {/* Main Reading Area */}
      <div
        className="p-8 flex flex-col justify-between"
        style={{ minHeight: 'calc(100vh - 200px)' }}
      >
        <div className="flex flex-col items-center justify-center w-full h-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <div className="text-lg text-gray-600">Loading book...</div>
              <div className="text-sm text-gray-400">Please wait while we prepare your reading experience</div>
            </div>
          ) : error || !bookUrl ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="text-6xl text-red-300">📚</div>
              <div className="text-xl text-red-500 text-center max-w-md">
                {error || 'No book URL provided'}
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full overflow-auto pb-4">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  className="shadow-2xl rounded-lg border border-gray-200"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
                {/* Page loading overlay */}
                {pdf && (
                  <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                    Page {page} of {numPages}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation and Progress */}
        <div className="w-full mt-6 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          {/* Progress bar with percentage */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500">Progress</span>
            <span className="text-xs font-medium text-blue-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full mb-6 cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const percentage = clickX / rect.width;
              const targetPage = Math.max(1, Math.min(numPages, Math.ceil(percentage * numPages)));
              setPage(targetPage);
            }}>
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Navigation controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                disabled={page <= 1}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous page (←)"
              >
                <FiChevronLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Prev</span>
              </button>

              <button
                type="button"
                onClick={goNext}
                disabled={numPages ? page >= numPages - (singlePage ? 0 : 1) : true}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next page (→)"
              >
                <span className="text-sm font-medium">Next</span>
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Page info and quick jump */}
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">
                Page <span className="font-medium text-gray-800">{currentPage}</span> of <span className="font-medium text-gray-800">{totalPages}</span>
              </div>

              {/* Quick jump input */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={numPages}
                  value={page}
                  onChange={(e) => {
                    const newPage = parseInt(e.target.value);
                    if (newPage >= 1 && newPage <= numPages) {
                      setPage(newPage);
                    }
                  }}
                  className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  title="Jump to page"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReaderPage;
