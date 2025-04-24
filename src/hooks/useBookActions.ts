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
}

export const useBookActions = (): UseBookActionsReturn => {
	const { user, isAuthenticated } = useAuth();
	const [favoriteBooks, setFavoriteBooks] = useState<Book[]>([]);
	const [readingList, setReadingList] = useState<Book[]>([]);
	const [loadingFavorites, setLoadingFavorites] = useState(false);
	const [loadingReadingList, setLoadingReadingList] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Load user's books when authenticated
	useEffect(() => {
		if (!isAuthenticated || !user) {
			setFavoriteBooks([]);
			setReadingList([]);
			return;
		}

		const fetchUserBooks = async () => {
			setError(null);

			// Load favorites
			setLoadingFavorites(true);
			try {
				const { data: favoritesData, error: favError } = await supabase
					.from('favorites')
					.select('book_id, book_data')
					.eq('user_id', user.id);

				if (favError) throw favError;

				if (favoritesData) {
					setFavoriteBooks(
						favoritesData.map((item) => JSON.parse(item.book_data))
					);
				}
			} catch (err) {
				console.error('Error loading favorites:', err);
				setError('Failed to load favorite books');
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

				if (readError) throw readError;

				if (readingData) {
					setReadingList(readingData.map((item) => JSON.parse(item.book_data)));
				}
			} catch (err) {
				console.error('Error loading reading list:', err);
				setError('Failed to load reading list');
			} finally {
				setLoadingReadingList(false);
			}
		};

		fetchUserBooks();
	}, [user, isAuthenticated]);

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
				setError('You must be logged in to add favorites');
				return;
			}

			try {
				const { error: insertError } = await supabase.from('favorites').insert({
					user_id: user.id,
					book_id: book.id,
					book_data: JSON.stringify(book),
				});

				if (insertError) throw insertError;

				setFavoriteBooks((prev) => [...prev, book]);
			} catch (err) {
				console.error('Error adding to favorites:', err);
				setError('Failed to add book to favorites');
			}
		},
		[isAuthenticated, user]
	);

	// Remove from favorites
	const removeFromFavorites = useCallback(
		async (bookId: string): Promise<void> => {
			if (!isAuthenticated || !user) {
				setError('You must be logged in to remove favorites');
				return;
			}

			try {
				const { error: deleteError } = await supabase
					.from('favorites')
					.delete()
					.eq('user_id', user.id)
					.eq('book_id', bookId);

				if (deleteError) throw deleteError;

				setFavoriteBooks((prev) => prev.filter((book) => book.id !== bookId));
			} catch (err) {
				console.error('Error removing from favorites:', err);
				setError('Failed to remove book from favorites');
			}
		},
		[isAuthenticated, user]
	);

	// Add to reading list
	const addToReadingList = useCallback(
		async (book: Book): Promise<void> => {
			if (!isAuthenticated || !user) {
				setError('You must be logged in to add to reading list');
				return;
			}

			try {
				const { error: insertError } = await supabase
					.from('reading_list')
					.insert({
						user_id: user.id,
						book_id: book.id,
						book_data: JSON.stringify(book),
					});

				if (insertError) throw insertError;

				setReadingList((prev) => [...prev, book]);
			} catch (err) {
				console.error('Error adding to reading list:', err);
				setError('Failed to add book to reading list');
			}
		},
		[isAuthenticated, user]
	);

	// Remove from reading list
	const removeFromReadingList = useCallback(
		async (bookId: string): Promise<void> => {
			if (!isAuthenticated || !user) {
				setError('You must be logged in to remove from reading list');
				return;
			}

			try {
				const { error: deleteError } = await supabase
					.from('reading_list')
					.delete()
					.eq('user_id', user.id)
					.eq('book_id', bookId);

				if (deleteError) throw deleteError;

				setReadingList((prev) => prev.filter((book) => book.id !== bookId));
			} catch (err) {
				console.error('Error removing from reading list:', err);
				setError('Failed to remove book from reading list');
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
	};
};

export default useBookActions;
