import React, { createContext, useState, useContext, useEffect } from 'react';
import { Book } from '../types/book';
import { searchBooks } from '../api/googleBooks';

interface SearchContextType {
  books: Book[];
  isLoading: boolean;
  error: string | null;
  totalResults: number;
  currentQuery: string;
  currentPage: number;
  search: (query: string, startIndex?: number, category?: string) => Promise<void>;
  setCurrentPage: (page: number) => void;
  clearSearch: () => void;
}

const RESULTS_PER_PAGE = 20;

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [currentQuery, setCurrentQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const savedSearch = localStorage.getItem('savedSearch');
    if (savedSearch) {
      try {
        const { books, totalResults, currentQuery, currentPage } = JSON.parse(savedSearch);
        setBooks(books);
        setTotalResults(totalResults);
        setCurrentQuery(currentQuery);
        setCurrentPage(currentPage);
      } catch {
        localStorage.removeItem('savedSearch');
      }
    }
  }, []);

  useEffect(() => {
    if (books.length > 0) {
      const searchState = {
        books,
        totalResults,
        currentQuery,
        currentPage,
      };
      localStorage.setItem('savedSearch', JSON.stringify(searchState));
    }
  }, [books, totalResults, currentQuery, currentPage]);

  const search = async (
    query: string,
    startIndex: number = 0,
    category?: string
  ): Promise<void> => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const fullQuery = category ? `${query}+subject:${category}` : query;
      const response = await searchBooks(
        fullQuery,
        RESULTS_PER_PAGE,
        startIndex
      );

      if (response.totalItems === 0 || !response.items) {
        setTotalResults(0);
        setBooks([]);
        setCurrentQuery(query);
        setIsLoading(false);
        return;
      }

      setTotalResults(response.totalItems);
      setCurrentQuery(query);

      const formattedBooks: Book[] = response.items.map((item) => ({
        id: item.id,
        title: item.volumeInfo.title,
        authors: item.volumeInfo.authors,
        description: item.volumeInfo.description,
        publishedDate: item.volumeInfo.publishedDate,
        pageCount: item.volumeInfo.pageCount,
        categories: item.volumeInfo.categories,
        imageLinks: item.volumeInfo.imageLinks,
        language: item.volumeInfo.language,
        averageRating: item.volumeInfo.averageRating,
        publisher: item.volumeInfo.publisher,
      }));

      const sortedBooks = formattedBooks.sort((a, b) => {
        if (a.imageLinks?.thumbnail && !b.imageLinks?.thumbnail) return -1;
        if (!a.imageLinks?.thumbnail && b.imageLinks?.thumbnail) return 1;
        return 0;
      });

      setBooks(sortedBooks);

      if (
        response.items.length < RESULTS_PER_PAGE &&
        startIndex + RESULTS_PER_PAGE >= response.totalItems
      ) {
        const adjustedTotal = startIndex + response.items.length;
        if (adjustedTotal < response.totalItems) {
          setTotalResults(adjustedTotal);
        }
      }
    } catch {
      setError(
        'Wystąpił błąd podczas wyszukiwania książek. Spróbuj ponownie.'
      );
      setBooks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setBooks([]);
    setTotalResults(0);
    setCurrentQuery('');
    setCurrentPage(1);
    localStorage.removeItem('savedSearch');
  };

  const value = {
    books,
    isLoading,
    error,
    totalResults,
    currentQuery,
    currentPage,
    search,
    setCurrentPage,
    clearSearch,
  };

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error();
  }
  return context;
};

export default useSearch;