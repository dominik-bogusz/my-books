import { useState, useCallback } from 'react';
import { searchBooks } from '../api/googleBooks';
import { Book, GoogleBookResponse } from '../types/book';

interface UseSearchReturn {
	books: Book[];
	isLoading: boolean;
	error: string | null;
	totalResults: number;
	search: (
		query: string,
		startIndex: number,
		category?: string
	) => Promise<void>;
}

const RESULTS_PER_PAGE = 20;

/**
 * Hook for searching books through the Google Books API
 */
const useSearch = (): UseSearchReturn => {
	const [books, setBooks] = useState<Book[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [totalResults, setTotalResults] = useState(0);

	const search = useCallback(
		async (
			query: string,
			startIndex: number = 0,
			category?: string
		): Promise<void> => {
			if (!query.trim()) return;

			setIsLoading(true);
			setError(null);

			try {
				const fullQuery = category ? `${query}+subject:${category}` : query;
				const response: GoogleBookResponse = await searchBooks(
					fullQuery,
					RESULTS_PER_PAGE,
					startIndex
				);

				if (response.totalItems === 0 || !response.items) {
					setTotalResults(0);
					setBooks([]);
					setIsLoading(false);
					return;
				}

				setTotalResults(response.totalItems);

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

				// Sort books so those with thumbnails appear first
				const sortedBooks = formattedBooks.sort((a, b) => {
					if (a.imageLinks?.thumbnail && !b.imageLinks?.thumbnail) return -1;
					if (!a.imageLinks?.thumbnail && b.imageLinks?.thumbnail) return 1;
					return 0;
				});

				setBooks(sortedBooks);

				// Handle cases where the API returns fewer items than expected
				if (
					response.items.length < RESULTS_PER_PAGE &&
					startIndex + RESULTS_PER_PAGE >= response.totalItems
				) {
					const adjustedTotal = startIndex + response.items.length;
					if (adjustedTotal < response.totalItems) {
						setTotalResults(adjustedTotal);
					}
				}
			} catch (err) {
				console.error('Error searching books:', err);
				setError(
					'Wystąpił błąd podczas wyszukiwania książek. Spróbuj ponownie.'
				);
				setBooks([]);
			} finally {
				setIsLoading(false);
			}
		},
		[]
	);

	return {
		books,
		isLoading,
		error,
		totalResults,
		search,
	};
};

export default useSearch;
