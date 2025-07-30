import React, { useEffect, useState } from 'react';
import { IoMdArrowRoundBack, IoMdBook } from 'react-icons/io';
import bookService, { Book } from '../services/bookService';

interface BookDetailPageProps {
  book: Book;
  onBack: () => void;
  onRead: () => void;
}

const BookDetailPage: React.FC<BookDetailPageProps> = ({
  book,
  onBack,
  onRead,
}) => {
  const [description, setDescription] = useState<string>(
    book.description ?? '',
  );
  const [loadingDesc, setLoadingDesc] = useState<boolean>(false);

  useEffect(() => {
    const fetchDescription = async () => {
      try {
        setLoadingDesc(true);
        const res = await bookService.getBookDescription(book.bookId);
        if (res.success && res.data) {
          // API may return { description: string } or plain string
          const desc =
            typeof res.data === 'string'
              ? res.data
              : (res.data.description ?? '');
          if (desc) setDescription(desc);
        }
      } catch (err) {
        console.error('Failed to fetch book description', err);
      } finally {
        setLoadingDesc(false);
      }
    };

    // only fetch if not already present
    if (!book.description) {
      fetchDescription();
    }
  }, [book.bookId]);
  return (
    <div className="flex-1 ">
      <div className="bg-gradient-to-r from-blue-400 to-blue-600  p-6 flex flex-col md:flex-row items-center justify-between mb-8">
        <button className="text-white text-2xl" onClick={onBack}>
          <IoMdArrowRoundBack />
        </button>
        <div className="text-white text-xl font-bold">{book.bookName}</div>
      </div>
      <div className="flex flex-col items-center p-4">
        <img
          src={
            book.imageUrl && book.imageUrl.trim() !== ''
              ? book.imageUrl
              : 'https://placehold.co/200x300?text=book'
          }
          alt={book.bookName}
          className="w-48 h-64 object-cover rounded mb-4 shadow"
        />
        <div className="text-2xl font-bold mt-2 mb-1">{book.bookName}</div>
        <div className="text-lg text-gray-700 mb-4">{book.artist}</div>
        <button
          className="bg-blue-500 text-white px-8 py-2 rounded shadow hover:bg-blue-600 mb-6 flex flex-row items-center gap-2"
          onClick={onRead}
        >
          <IoMdBook />
          Read
        </button>
        <div className="w-full max-w-2xl text-left">
          <div className="text-blue-600 font-semibold mb-1">
            Books Description
          </div>
          <div className="text-gray-700 text-sm whitespace-pre-line">
            {loadingDesc ? 'กำลังโหลด...' : description || 'ไม่มีคำอธิบาย'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailPage;
