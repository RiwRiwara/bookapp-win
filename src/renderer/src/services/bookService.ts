import apiClient from './api';

export interface Book {
  bookId: number;
  bookName: string;
  artist: string;
  imageUrl?: string;

  // Image fields coming from different endpoints/legacy code
  cover?: string;

  // Additional metadata
  category?: string;
  description?: string;
  content?: string[]; // for ReaderPage

  // Reading progress
  totalPages?: number;
  currentPage?: number;
  readPercent?: number;

  // Favorite status
  isFavorite?: boolean;
}

export interface BookFilter {
  Filter: string;
}

export interface BookIdRequest {
  BookId: number;
}

export interface ReadPercentRequest {
  BookId: number;
  ReadPage: number;
}

export interface FavoriteBookRequest {
  bookIdLists: {
    bookId: number;
  }[];
}

// --- API response models ---
// Raw structure returned by `book-in-library-by-user`
export interface LibraryApiBook {
  bookId: number;
  bookName: string;
  artist: string;
  imageUrl: string;
  readPercent: number;
}

// Book service for managing books
const bookService = {
  /**
   * Get books in user's library
   */
  getBooksInLibrary: async (filter?: string) => {
    const body: BookFilter = { Filter: filter ?? '' };
    const res = await apiClient.post<LibraryApiBook[]>(
      'book-in-library-by-user',
      body,
    );

    if (res.success && res.data) {
      const mapped: Book[] = res.data.map((raw) => ({
        bookId: raw.bookId,
        bookName: raw.bookName,
        artist: raw.artist,
        imageUrl: raw.imageUrl,
        readPercent: raw.readPercent,
      }));
      return { ...res, data: mapped } as typeof res & { data: Book[] };
    }
    return res as any;
  },

  /**
   * Get books on cloud for the user
   */
  getBooksOnCloud: async () => {
    const res = await apiClient.get<Book[]>('book-on-cloud-by-user');
    if (res.success && res.data) {
      const mapped: Book[] = res.data.map((raw) => ({
        bookId: raw.bookId,
        bookName: raw.bookName,
        artist: raw.artist,
        imageUrl: raw.imageUrl,
      }));
      return { ...res, data: mapped } as typeof res & { data: Book[] };
    }
    return res as any;
  },

  /**
   * Delete book from cloud
   */
  deleteBookFromCloud: async (bookId: number) => {
    const request: BookIdRequest = { BookId: bookId };
    return apiClient.delete<void>('book-on-cloud-by-user', request);
  },

  /**
   * Restore book for user
   */
  restoreBook: async (bookId: number) => {
    const request: BookIdRequest = { BookId: bookId };
    return apiClient.put<void>('restore-book-by-user', request);
  },

  /**
   * Add books to favorites
   */
  addFavoriteBooks: async (bookIds: number[]) => {
    const request: FavoriteBookRequest = {
      bookIdLists: bookIds.map((bookId) => ({ bookId })),
    };
    return apiClient.post<void>('add-favorite-book', request);
  },

  /**
   * Get user's favorite books
   */
  getFavoriteBooks: async () => {
    return apiClient.get<Book[]>('favorite-book-by-user');
  },

  /**
   * Remove a book from favorites
   */
  removeFavoriteBook: async (bookId: number) => {
    const request: BookIdRequest = { BookId: bookId };
    return apiClient.put<void>('remove-favorite-book-by-bookId', request);
  },

  /**
   * Get book description
   */
  getBookDescription: async (bookId: number) => {
    return apiClient.get<any>(`book-description/${bookId}`);
  },

  /**
   * Get book details
   */
  getBookDetails: async (bookId: number) => {
    return apiClient.get<any>(`book-detail/${bookId}`);
  },

  /**
   * Update reading progress
   */
  updateReadPercent: async (bookId: number, readPage: number) => {
    const request: ReadPercentRequest = {
      BookId: bookId,
      ReadPage: readPage,
    };
    return apiClient.put<void>('read-percent', request);
  },
};

export default bookService;
