import React from 'react';

import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface Bookmark {
  page: number;
  note: string;
}

interface BookmarkSidebarProps {
  bookmarks: Bookmark[];
  onJump: (page: number) => void;
  onRemove: (page: number) => void;
  onEdit: (page: number, note: string) => void;
  onClose: () => void;
}

const BookmarkSidebar: React.FC<BookmarkSidebarProps> = ({
  bookmarks,
  onJump,
  onRemove,
  onEdit,
  onClose,
}) => {
  const [editing, setEditing] = React.useState<number | null>(null);
  const [editNote, setEditNote] = React.useState('');
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div
      className={`fixed top-0 right-0 h-full z-40 flex flex-col transition-all duration-300 ${collapsed ? 'w-10' : 'w-80'}`}
      style={{ background: '#fff', boxShadow: '0 0 10px #0002' }}
    >
      {/* Collapse/Expand Toggle */}
      <button
        className={`absolute left-0 top-1/2 -translate-y-1/2 bg-blue-100 border border-blue-300 rounded-l px-1 py-2 z-50 transition-all duration-300 ${collapsed ? 'w-8' : 'w-4'}`}
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        {collapsed ? <FiChevronLeft /> : <FiChevronRight />}
      </button>
      {!collapsed && (
        <>
          <div className="flex items-center justify-between p-4 border-b font-bold text-lg">
            Bookmarks
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-blue-600"
            >
              &times;
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {bookmarks.length === 0 && (
              <div className="text-gray-400">No bookmarks yet.</div>
            )}
            {bookmarks.map((bm) => (
              <div
                key={bm.page}
                className="border rounded p-2 flex flex-col gap-1 bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Page {bm.page + 1}</span>
                  <button
                    onClick={() => onJump(bm.page)}
                    className="text-xs text-blue-500 underline"
                  >
                    Go
                  </button>
                  <button
                    onClick={() => onRemove(bm.page)}
                    className="text-xs text-red-400 ml-auto"
                  >
                    Remove
                  </button>
                </div>
                {editing === bm.page ? (
                  <div className="flex gap-2 mt-1">
                    <input
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      className="border px-2 py-1 rounded text-xs flex-1"
                      placeholder="Bookmark note..."
                    />
                    <button
                      onClick={() => {
                        onEdit(bm.page, editNote);
                        setEditing(null);
                      }}
                      className="text-xs px-2 py-1 rounded bg-blue-500 text-white"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="text-xs px-2 py-1 rounded bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-gray-700">
                      {bm.note || (
                        <span className="italic text-gray-400">No note</span>
                      )}
                    </span>
                    <button
                      onClick={() => {
                        setEditing(bm.page);
                        setEditNote(bm.note);
                      }}
                      className="text-xs text-gray-500 ml-auto"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BookmarkSidebar;
