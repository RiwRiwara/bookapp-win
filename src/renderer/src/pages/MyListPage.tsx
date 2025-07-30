import React, { useState, useEffect } from 'react';
import { FaHeart } from 'react-icons/fa';
import bookService, { Book } from '../services/bookService';
import ReaderPage from './ReaderPage';
import BookDetailPage from './BookDetailPage';

// Local fallback data while waiting for API (optional)
const fallbackBooks: Book[] = [];

const MyListPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>(fallbackBooks);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [removingFavorite, setRemovingFavorite] = useState<number | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await bookService.getFavoriteBooks();
        if (res.success && res.data) {
          setBooks(res.data);
        }
      } catch (error) {
        console.error('Failed to load favorite books', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async (bookId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    
    try {
      setRemovingFavorite(bookId);
      const result = await bookService.removeFavoriteBook(bookId);
      
      if (result.success) {
        // Remove the book from the local state
        setBooks(prevBooks => prevBooks.filter(book => book.bookId !== bookId));
      } else {
        console.error('Failed to remove favorite:', result.error);
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    } finally {
      setRemovingFavorite(null);
    }
  };

  // If currently reading
  if (readingBook) {
    return (
      <ReaderPage book={readingBook} onBack={() => setReadingBook(null)} />
    );
  }

  // If a book is selected show detail screen
  if (selectedBook) {
    return (
      <BookDetailPage
        book={selectedBook}
        onBack={() => setSelectedBook(null)}
        onRead={() => setReadingBook(selectedBook)}
      />
    );
  }

  // Separate books into reading and unread categories
  const readingBooks = books.filter(
    (book) =>
      book.readPercent && book.readPercent > 0 && book.readPercent < 100,
  );
  const unreadBooks = books.filter(
    (book) => !book.readPercent || book.readPercent === 0,
  );

  function BookCard({ book }: { book: Book }) {
    return (
      <div
        onClick={() => setSelectedBook(book)}
        className="relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
      >
        {/* Heart icon in top-right corner */}
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={(e) => handleRemoveFavorite(book.bookId, e)}
            disabled={removingFavorite === book.bookId}
            className="p-1 rounded-full bg-white/80 hover:bg-white transition-all duration-200 hover:scale-110 disabled:opacity-50"
            title="ลบออกจากรายการโปรด"
          >
            <FaHeart 
              className={`text-red-500 ${removingFavorite === book.bookId ? 'animate-pulse' : ''}`} 
            />
          </button>
        </div>

        {/* Book cover image that fills the card */}
        <div className="relative pb-[140%]">
          <img
            src={
              book.imageUrl && book.imageUrl.trim() !== ''
                ? book.imageUrl
                : 'https://placehold.co/200x300?text=book'
            }
            alt={book.bookName}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Progress bar for reading books */}
        {book.readPercent !== undefined && book.readPercent > 0 && (
          <div className="w-full bg-gray-200 h-1">
            <div
              className="bg-blue-500 h-1"
              style={{ width: `${book.readPercent}%` }}
            />
          </div>
        )}

        {/* Book info */}
        <div className="p-3 bg-white">
          <h3 className="font-medium text-base truncate">{book.bookName}</h3>
          <p className="text-xs text-gray-600 truncate">{book.artist}</p>

          {/* Reading progress text */}
          {book.readPercent !== undefined && book.readPercent > 0 && (
            <p className="text-xs text-blue-500 mt-1">
              อ่านแล้ว {book.readPercent}%
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">ลิสต์ของฉัน</h2>

      {loading ? (
        <div className="text-gray-500">กำลังโหลด...</div>
      ) : books.length === 0 ? (
        <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
          (ยังไม่มีหนังสือในลิสต์ของคุณ)
        </div>
      ) : (
        <>
          {/* Reading section */}
          {readingBooks.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-blue-600">
                กำลังอ่าน ({readingBooks.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {readingBooks.map((book) => (
                  <BookCard key={book.bookId} book={book} />
                ))}
              </div>
            </div>
          )}

          {/* Unread books section */}
          {unreadBooks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                ยังไม่ได้อ่าน ({unreadBooks.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {unreadBooks.map((book) => (
                  <BookCard key={book.bookId} book={book} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyListPage;
