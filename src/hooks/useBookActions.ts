import { useState, useCallback, useEffect } from 'react';
import { Book } from '../types/book';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';

export enum BookListType {
	FAVORITES = 'favorites',
	READING_LIST = 'reading_list',
}

interface UseBookActionsReturn {
	// Favorites
	favoriteBooks: Book[];
	loadingFavorites: boolean;
	isFavorite: (bookId: string) => boolean;
	addToFavorites: (book: Book) => Promise<void>;
	removeFromFavorites: (bookId: string) => Promise<void>;

	// Reading List
	readingList: Book[];
	loadingReadingList: boolean;
	isInReadingList: (bookId: string) => boolean;
	addToReadingList: (book: Book) => Promise<void>;
	removeFromReadingList: (bookId: string) => Promise<void>;

	// Common actions
	error: string | null;
	refreshUserBooks: () => Promise<void>;
}

export const useBookActions = (): UseBookActionsReturn => {
	const { user, isAuthenticated } = useAuth();
	const [favoriteBooks, setFavoriteBooks] = useState<Book[]>([]);
	const [readingList, setReadingList] = useState<Book[]>([]);
	const [loadingFavorites, setLoadingFavorites] = useState(false);
	const [loadingReadingList, setLoadingReadingList] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Funkcja do pobierania książek użytkownika
	const fetchUserBooks = useCallback(async () => {
		if (!isAuthenticated || !user) {
			setFavoriteBooks([]);
			setReadingList([]);
			return;
		}

		setError(null);

		// Load favorites
		setLoadingFavorites(true);
		try {
			const { data: favoritesData, error: favError } = await supabase
				.from('favorites')
				.select('book_id, book_data')
				.eq('user_id', user.id);

			if (favError) {
				console.error('Error loading favorites:', favError);
				throw favError;
			}

			if (favoritesData) {
				const books = favoritesData
					.map((item) => {
						try {
							return JSON.parse(item.book_data);
						} catch (e) {
							console.error('Error parsing book data:', e, item.book_data);
							return null;
						}
					})
					.filter(Boolean) as Book[];

				setFavoriteBooks(books);
			} else {
				setFavoriteBooks([]);
			}
		} catch (err) {
			console.error('Error loading favorites:', err);
			setError('Nie udało się załadować ulubionych książek');
		} finally {
			setLoadingFavorites(false);
		}

		// Load reading list
		setLoadingReadingList(true);
		try {
			const { data: readingData, error: readError } = await supabase
				.from('reading_list')
				.select('book_id, book_data')
				.eq('user_id', user.id);

			if (readError) {
				console.error('Error loading reading list:', readError);
				throw readError;
			}

			if (readingData) {
				const books = readingData
					.map((item) => {
						try {
							return JSON.parse(item.book_data);
						} catch (e) {
							console.error('Error parsing book data:', e, item.book_data);
							return null;
						}
					})
					.filter(Boolean) as Book[];

				setReadingList(books);
			} else {
				setReadingList([]);
			}
		} catch (err) {
			console.error('Error loading reading list:', err);
			setError('Nie udało się załadować listy do przeczytania');
		} finally {
			setLoadingReadingList(false);
		}
	}, [user, isAuthenticated]);

	// Ekspozycja funkcji odświeżania książek
	const refreshUserBooks = useCallback(async () => {
		await fetchUserBooks();
	}, [fetchUserBooks]);

	// Load user's books when authenticated
	useEffect(() => {
		fetchUserBooks();
	}, [fetchUserBooks]);

	// Check if book is in favorites
	const isFavorite = useCallback(
		(bookId: string): boolean => {
			return favoriteBooks.some((book) => book.id === bookId);
		},
		[favoriteBooks]
	);

	// Check if book is in reading list
	const isInReadingList = useCallback(
		(bookId: string): boolean => {
			return readingList.some((book) => book.id === bookId);
		},
		[readingList]
	);

	// Add to favorites
	const addToFavorites = useCallback(
		async (book: Book): Promise<void> => {
			if (!isAuthenticated || !user) {
				setError('Musisz być zalogowany, aby dodawać ulubione książki');
				return;
			}

			setError(null);
			try {
				// Sprawdzamy, czy książka już istnieje w ulubionych
				if (isFavorite(book.id)) {
					return; // Jeśli tak, to nie robimy nic
				}

				const bookData = JSON.stringify(book);
				const { error: insertError } = await supabase.from('favorites').insert({
					user_id: user.id,
					book_id: book.id,
					book_data: bookData,
				});

				if (insertError) {
					console.error('Error inserting favorite:', insertError);
					throw insertError;
				}

				setFavoriteBooks((prev) => [...prev, book]);
			} catch (err) {
				console.error('Error adding to favorites:', err);
				setError('Nie udało się dodać książki do ulubionych');
			}
		},
		[isAuthenticated, user, isFavorite]
	);

	// Remove from favorites
	const removeFromFavorites = useCallback(
		async (bookId: string): Promise<void> => {
			if (!isAuthenticated || !user) {
				setError('Musisz być zalogowany, aby usuwać ulubione książki');
				return;
			}

			setError(null);
			try {
				const { error: deleteError } = await supabase
					.from('favorites')
					.delete()
					.eq('user_id', user.id)
					.eq('book_id', bookId);

				if (deleteError) {
					console.error('Error deleting favorite:', deleteError);
					throw deleteError;
				}

				setFavoriteBooks((prev) => prev.filter((book) => book.id !== bookId));
			} catch (err) {
				console.error('Error removing from favorites:', err);
				setError('Nie udało się usunąć książki z ulubionych');
			}
		},
		[isAuthenticated, user]
	);

	// Add to reading list
	const addToReadingList = useCallback(
		async (book: Book): Promise<void> => {
			if (!isAuthenticated || !user) {
				setError('Musisz być zalogowany, aby dodawać książki do przeczytania');
				return;
			}

			setError(null);
			try {
				// Sprawdzamy, czy książka już istnieje na liście do przeczytania
				if (isInReadingList(book.id)) {
					return; // Jeśli tak, to nie robimy nic
				}

				const bookData = JSON.stringify(book);
				const { error: insertError } = await supabase
					.from('reading_list')
					.insert({
						user_id: user.id,
						book_id: book.id,
						book_data: bookData,
					});

				if (insertError) {
					console.error('Error inserting to reading list:', insertError);
					throw insertError;
				}

				setReadingList((prev) => [...prev, book]);
			} catch (err) {
				console.error('Error adding to reading list:', err);
				setError('Nie udało się dodać książki do listy do przeczytania');
			}
		},
		[isAuthenticated, user, isInReadingList]
	);

	// Remove from reading list
	const removeFromReadingList = useCallback(
		async (bookId: string): Promise<void> => {
			if (!isAuthenticated || !user) {
				setError(
					'Musisz być zalogowany, aby usuwać książki z listy do przeczytania'
				);
				return;
			}

			setError(null);
			try {
				const { error: deleteError } = await supabase
					.from('reading_list')
					.delete()
					.eq('user_id', user.id)
					.eq('book_id', bookId);

				if (deleteError) {
					console.error('Error deleting from reading list:', deleteError);
					throw deleteError;
				}

				setReadingList((prev) => prev.filter((book) => book.id !== bookId));
			} catch (err) {
				console.error('Error removing from reading list:', err);
				setError('Nie udało się usunąć książki z listy do przeczytania');
			}
		},
		[isAuthenticated, user]
	);

	return {
		favoriteBooks,
		loadingFavorites,
		isFavorite,
		addToFavorites,
		removeFromFavorites,

		readingList,
		loadingReadingList,
		isInReadingList,
		addToReadingList,
		removeFromReadingList,

		error,
		refreshUserBooks,
	};
};

export default useBookActions;
