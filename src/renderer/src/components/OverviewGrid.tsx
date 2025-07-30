import React from 'react';

interface OverviewGridProps {
  pages: string[];
  thumbnails: { [key: number]: string };
  bookmarks: number[];
  searchTerm: string;
  onJump: (page: number) => void;
  onClose: () => void;
}

const OverviewGrid: React.FC<OverviewGridProps> = ({
  pages,
  thumbnails,
  bookmarks,
  searchTerm,
  onJump,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-30 flex flex-col items-center justify-center my-[6px]">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-7xl w-[95vw] max-h-[85vh] overflow-auto relative">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-2xl font-bold leading-none"
          onClick={onClose}
          title="Close overview"
        >
          ×
        </button>

        <div className="my-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Page Overview</h2>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {pages.length} pages total
              </span>
              {bookmarks.length > 0 && (
                <span className="text-sm text-yellow-600">
                  • {bookmarks.length} bookmarked
                </span>
              )}
              {searchTerm && (
                <span className="text-sm text-blue-600">
                  • Searching: "{searchTerm}"
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Click any page to jump to it
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {pages.map((text, idx) => {
            const pageNum = idx + 1;
            const thumbnail = thumbnails[pageNum];
            const isHighlighted = searchTerm && text.toLowerCase().includes(searchTerm.toLowerCase());
            const isBookmarked = bookmarks.includes(idx);

            return (
              <div
                key={idx}
                className={`border-2 rounded-lg cursor-pointer relative transition-all hover:shadow-lg ${isHighlighted ? 'ring-2 ring-blue-400 border-blue-400' : 'border-gray-200 hover:border-blue-300'
                  } ${isBookmarked ? 'bg-yellow-50' : 'bg-white'}`}
                onClick={() => onJump(pageNum)}
              >
                {/* Page thumbnail */}
                <div className="aspect-[3/4] bg-gray-100 rounded-t-lg overflow-hidden relative">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={`Page ${pageNum}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="text-2xl mb-1">📄</div>
                        <div className="text-xs">Loading...</div>
                      </div>
                    </div>
                  )}

                  {/* Page number overlay */}
                  <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {pageNum}
                  </div>

                  {/* Bookmark indicator */}
                  {isBookmarked && (
                    <div className="absolute top-2 left-2 text-yellow-400 text-lg drop-shadow-lg">
                      ★
                    </div>
                  )}

                  {/* Search highlight indicator */}
                  {isHighlighted && (
                    <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Match
                    </div>
                  )}
                </div>

                {/* Page text preview (if search term) */}
                {searchTerm && isHighlighted && (
                  <div className="p-2 text-xs bg-gray-50 rounded-b-lg border-t">
                    <div
                      className="line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html: text.slice(0, 100).replace(
                          new RegExp(`(${searchTerm})`, 'gi'),
                          '<mark class="bg-yellow-200">$1</mark>',
                        ) + (text.length > 100 ? '...' : ''),
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OverviewGrid;
