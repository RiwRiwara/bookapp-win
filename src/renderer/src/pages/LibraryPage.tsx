import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import BookDetailPage from './BookDetailPage';
import ReaderPage from './ReaderPage';
import { bookService } from '../services';
import { Book } from '../services/bookService';
import { useUser } from '../context/UserContext';
// categories can be derived later
const categories = ['ทั้งหมด'];

const LibraryPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [_, setFavoriteBooks] = useState<Book[]>([]);
  // Placeholder remove; underscore to avoid unused param lint
  const { user } = useUser();

  useEffect(() => {
    const fetchData = async () => {
      // Fetch library books
      const booksRes = await bookService.getBooksInLibrary();
      if (booksRes.success && booksRes.data) {
        // Fetch favorite books
        const favoritesRes = await bookService.getFavoriteBooks();
        const favoriteBookIds = favoritesRes.success && favoritesRes.data 
          ? favoritesRes.data.map(book => book.bookId) 
          : [];
        
        // Mark books as favorite
        const booksWithFavorites = booksRes.data.map((book: Book) => ({
          ...book,
          isFavorite: favoriteBookIds.includes(book.bookId)
        }));
        
        setBooks(booksWithFavorites);
        if (favoritesRes.success && favoritesRes.data) {
          setFavoriteBooks(favoritesRes.data);
        }
      }
    };
    fetchData();
  }, []);

  // Toggle favorite status for a book
  const toggleFavorite = async (book: Book, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    
    try {
      if (book.isFavorite) {
        // Remove from favorites
        const res = await bookService.removeFavoriteBook(book.bookId);
        if (res.success) {
          // Update local state
          setBooks(prevBooks => 
            prevBooks.map(b => 
              b.bookId === book.bookId ? { ...b, isFavorite: false } : b
            )
          );
          setFavoriteBooks(prevFavorites => 
            prevFavorites.filter(b => b.bookId !== book.bookId)
          );
        }
      } else {
        // Add to favorites
        const res = await bookService.addFavoriteBooks([book.bookId]);
        if (res.success) {
          // Update local state
          setBooks(prevBooks => 
            prevBooks.map(b => 
              b.bookId === book.bookId ? { ...b, isFavorite: true } : b
            )
          );
          setFavoriteBooks(prevFavorites => [...prevFavorites, book]);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (readingBook) {
    return (
      <ReaderPage book={readingBook} onBack={() => setReadingBook(null)} />
    );
  }

  if (selectedBook) {
    return (
      <BookDetailPage
        book={selectedBook}
        onBack={() => setSelectedBook(null)}
        onRead={() => setReadingBook(selectedBook)}
      />
    );
  }

  // Apply search & category filters first
  const visibleBooks = books.filter((book) => {
    const matchSearch =
      book.bookName.toLowerCase().includes(search.toLowerCase()) ||
      book.artist.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  // Section books by status (guard against undefined fields)
  // Determine reading status based on readPercent (API) or page fields as fallback
  const unreadBooks = visibleBooks.filter(
    (b) => (b.readPercent ?? 0) === 0 && (b.currentPage ?? 0) === 0,
  );
  const readingBooks = visibleBooks.filter((b) => {
    const pct = b.readPercent;
    if (pct !== undefined) return pct > 0 && pct < 100;
    if (b.totalPages)
      return (b.currentPage ?? 0) > 0 && (b.currentPage ?? 0) < b.totalPages;
    return false;
  });
  const finishedBooks = visibleBooks.filter((b) => {
    const pct = b.readPercent;
    if (pct !== undefined) return pct >= 100;
    if (b.totalPages) return (b.currentPage ?? 0) >= b.totalPages;
    return false;
  });

  // Reusable book card component
  function BookCard({ book }: { book: Book }) {
    return (
      <div
        onClick={() => setSelectedBook(book)}
        className="relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
      >
        {/* Heart icon in top-right corner */}
        <div className="absolute top-2 right-2 z-10">
          <FaHeart 
            onClick={(e) => toggleFavorite(book, e)}
            className={`cursor-pointer transition-colors duration-200 hover:scale-110 transform ${
              book.isFavorite ? 'text-red-500' : 'text-gray-300 hover:text-red-400'
            }`}
          />
        </div>
        {/* Book cover */}
        <div
          className="relative pb-[140%]"
          onClick={() => setSelectedBook(book)}
        >
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
        {/* Progress bar */}
        {book.readPercent !== undefined && book.readPercent > 0 && (
          <div className="w-full bg-gray-200 h-1">
            <div
              className="bg-blue-500 h-1"
              style={{ width: `${book.readPercent}%` }}
            />
          </div>
        )}
        {/* Info */}
        <div className="p-3 bg-white">
          <h3 className="font-medium text-base truncate">{book.bookName}</h3>
          <p className="text-xs text-gray-600 truncate">{book.artist}</p>
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
    <div className="flex-1 p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
        <div>
          <h2 className="text-2xl font-bold mb-2 md:mb-0 text-[#017BD9]">
            Hi, {user?.name}
          </h2>
          <p className="text-[#017BD9]">Let's read a book today </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Search for book, e-library, author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
          <button className="ml-2 p-2 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100">
            <FiFilter size={20} />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`px-4 py-1 rounded-full border text-sm transition-colors ${selectedCategory === cat ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-blue-100 hover:text-blue-500'}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <h2 className="text-2xl font-bold md:mb-0 text-[#017BD9] mb-4">
        ชั้นหนังสือ{' '}
      </h2>
      <hr className="my-4 border-gray-200" />
      {/* Unread Section */}
      {unreadBooks.length > 0 && (
        <div className="mb-8 mt-4">
          <div className="text-lg font-semibold text-blue-500 mb-3">
            หนังสือที่ยังไม่ได้อ่าน
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {unreadBooks.map((book) => (
              <BookCard key={book.bookId} book={book} />
            ))}
          </div>
        </div>
      )}
      {/* Reading Section */}
      {readingBooks.length > 0 && (
        <div className="mb-8">
          <div className="text-lg font-semibold text-blue-500 mb-3">
            หนังสือที่กำลังอ่าน
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {readingBooks.map((book) => (
              <BookCard key={book.bookId} book={book} />
            ))}
          </div>
        </div>
      )}
      {/* Finished Section */}
      {finishedBooks.length > 0 && (
        <div className="mb-8">
          <div className="text-lg font-semibold text-blue-500 mb-3">
            Finished Books
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {finishedBooks.map((book) => (
              <BookCard key={book.bookId} book={book} />
            ))}
          </div>
        </div>
      )}
      {/* No books found */}
      {unreadBooks.length === 0 &&
        readingBooks.length === 0 &&
        finishedBooks.length === 0 && (
          <div className="col-span-full text-center text-gray-400">
            No books found
          </div>
        )}
    </div>
  );
};

export default LibraryPage;
