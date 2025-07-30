import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Book } from '../services/bookService';
import { bookService } from '../services';
import nocloud from '../assets/nocloud.png';

const MyCloudPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch books helper so we can reuse after mutations
  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await bookService.getBooksOnCloud();
      if (res.success && res.data) {
        setBooks(res.data);
      }
    } catch (error) {
      console.error('Failed to load books from cloud', error);
    } finally {
      setLoading(false);
    }
  };

  const removeBook = async (bookId: number) => {
    try {
      await bookService.deleteBookFromCloud(bookId);
      toast.success('ลบไฟล์จากคลาวด์แล้ว');
      setBooks((prev) => prev.filter((b) => b.bookId !== bookId));
    } catch (error) {
      toast.error('ไม่สามารถลบไฟล์ได้');
      console.error('Failed to remove book from cloud', error);
    }
  };

  const restoreBook = async (bookId: number) => {
    try {
      await bookService.restoreBook(bookId);
      toast.success('กู้คืนไฟล์แล้ว');
      setBooks((prev) => prev.filter((b) => b.bookId !== bookId));
    } catch (error) {
      toast.error('ไม่สามารถกู้คืนได้');
      console.error('Failed to restore book', error);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  return (
    <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">มายคลาวด์</h2>

      {loading ? (
        <div className="text-gray-500 text-center py-8">กำลังโหลด...</div>
      ) : books.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center">
          <img
            src={nocloud}
            alt="No books in cloud"
            className="object-contain mb-4"
          />
        </div>
      ) : (
        <>
          <div className="text-blue-600 font-medium mb-6">
            ทั้งหมดในมายคลาวด์ ({books.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map((book) => (
              <div
                key={book.bookId}
                className="bg-white rounded-xl shadow-md p-2 flex flex-col hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={book.imageUrl}
                    alt={book.bookName}
                    className="w-24 h-32 object-cover rounded-lg flex-shrink-0 shadow-sm"
                  />
                  <div className="flex-1 min-w-0 p-2">
                    <h3 className="text-md font-semibold text-gray-800">
                      {book.bookName.length > 60
                        ? `${book.bookName.substring(0, 40)}...`
                        : book.bookName}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {book.artist || 'ไม่ระบุ'}
                    </p>
                    {book.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {book.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-row justify-end mt-2">
                  <div className="flex flex-row gap-2">
                    <button
                      className="bg-white text-blue-500 border border-blue-600 px-4 py-2 rounded-lg hover:bg-blue-200 text-sm font-medium transition-colors duration-200"
                      onClick={() => removeBook(book.bookId)}
                    >
                      ลบ
                    </button>
                    <button
                      className="bg-blue-500 text-white border border-blue-600 px-4 py-2 rounded-lg hover:bg-blue-200 text-sm font-medium transition-colors duration-200"
                      onClick={() => restoreBook(book.bookId)}
                    >
                      รีสโตร์
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MyCloudPage;
