import { useState, useCallback, useEffect } from 'react';
import { Book } from '../types/book';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';

export enum BookListType {
	FAVORITES = 'favorites',
	READING_LIST = 'reading_list',
}

interface UseBookActionsReturn {
	favoriteBooks: Book[];
	loadingFavorites: boolean;
	isFavorite: (bookId: string) => boolean;
	addToFavorites: (book: Book) => Promise<void>;
	removeFromFavorites: (bookId: string) => Promise<void>;

	readingList: Book[];
	loadingReadingList: boolean;
	isInReadingList: (bookId: string) => boolean;
	addToReadingList: (book: Book) => Promise<void>;
	removeFromReadingList: (bookId: string) => Promise<void>;
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

	const fetchUserBooks = useCallback(async () => {
		if (!isAuthenticated || !user) {
			setFavoriteBooks([]);
			setReadingList([]);
			return;
		}

		setError(null);

		setLoadingFavorites(true);
		try {
			const { data: favoritesData, error: favError } = await supabase
				.from('favorites')
				.select('book_id, book_data')
				.eq('user_id', user.id);

			if (favError) {
				throw favError;
			}

			if (favoritesData) {
				const books = favoritesData
					.map((item) => {
						try {
							return JSON.parse(item.book_data);
						} catch {
							return null;
						}
					})
					.filter(Boolean) as Book[];

				setFavoriteBooks(books);
			} else {
				setFavoriteBooks([]);
			}
		} catch {
			setError('Nie udało się załadować ulubionych książek');
		} finally {
			setLoadingFavorites(false);
		}

		setLoadingReadingList(true);
		try {
			const { data: readingData, error: readError } = await supabase
				.from('reading_list')
				.select('book_id, book_data')
				.eq('user_id', user.id);

			if (readError) {
				throw readError;
			}

			if (readingData) {
				const books = readingData
					.map((item) => {
						try {
							return JSON.parse(item.book_data);
						} catch  {
							return null;
						}
					})
					.filter(Boolean) as Book[];

				setReadingList(books);
			} else {
				setReadingList([]);
			}
		} catch {
			setError('Nie udało się załadować listy do przeczytania');
		} finally {
			setLoadingReadingList(false);
		}
	}, [user, isAuthenticated]);

	const refreshUserBooks = useCallback(async () => {
		await fetchUserBooks();
	}, [fetchUserBooks]);

	useEffect(() => {
		fetchUserBooks();
	}, [fetchUserBooks]);

	const isFavorite = useCallback(
		(bookId: string): boolean => {
			return favoriteBooks.some((book) => book.id === bookId);
		},
		[favoriteBooks]
	);

	const isInReadingList = useCallback(
		(bookId: string): boolean => {
			return readingList.some((book) => book.id === bookId);
		},
		[readingList]
	);

	const addToFavorites = useCallback(
		async (book: Book): Promise<void> => {
			if (!isAuthenticated || !user) {
				setError('Musisz być zalogowany, aby dodawać ulubione książki');
				return;
			}

			setError(null);
			try {
				if (isFavorite(book.id)) {
					return;
				}

				const bookData = JSON.stringify(book);
				const { error: insertError } = await supabase.from('favorites').insert({
					user_id: user.id,
					book_id: book.id,
					book_data: bookData,
				});

				if (insertError) {
					throw insertError;
				}

				setFavoriteBooks((prev) => [...prev, book]);
			} catch {
				setError('Nie udało się dodać książki do ulubionych');
			}
		},
		[isAuthenticated, user, isFavorite]
	);

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
					throw deleteError;
				}

				setFavoriteBooks((prev) => prev.filter((book) => book.id !== bookId));
			} catch {
				setError('Nie udało się usunąć książki z ulubionych');
			}
		},
		[isAuthenticated, user]
	);

	const addToReadingList = useCallback(
		async (book: Book): Promise<void> => {
			if (!isAuthenticated || !user) {
				setError('Musisz być zalogowany, aby dodawać książki do przeczytania');
				return;
			}

			setError(null);
			try {
				if (isInReadingList(book.id)) {
					return;
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
					throw insertError;
				}

				setReadingList((prev) => [...prev, book]);
			} catch {
				setError('Nie udało się dodać książki do listy do przeczytania');
			}
		},
		[isAuthenticated, user, isInReadingList]
	);

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
					throw deleteError;
				}

				setReadingList((prev) => prev.filter((book) => book.id !== bookId));
			} catch {
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
