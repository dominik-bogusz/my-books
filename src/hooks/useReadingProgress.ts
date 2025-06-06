import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';
import { Book } from '../types/book';
import {
	ReadingProgress,
	ReadingGoal,
	ReadingStats,
	ReadingStatus,
} from '../types/reading';

interface UseReadingProgressReturn {
	readingProgress: ReadingProgress[];
	readingGoal: ReadingGoal | null;
	readingStats: ReadingStats | null;
	isLoadingProgress: boolean;
	isLoadingGoal: boolean;
	isLoadingStats: boolean;
	progressError: string | null;
	goalError: string | null;
	statsError: string | null;

	addBookToProgress: (book: Book, status: ReadingStatus) => Promise<boolean>;
	updateBookProgress: (
		progressId: string,
		updates: Partial<ReadingProgress>
	) => Promise<boolean>;
	removeBookFromProgress: (progressId: string) => Promise<boolean>;
	getBookReadingStatus: (bookId: string) => ReadingStatus | null;

	setReadingGoal: (
		year: number,
		goalBooks: number,
		goalPages?: number
	) => Promise<boolean>;
	updateReadingGoal: (
		goalId: string,
		goalBooks: number,
		goalPages?: number
	) => Promise<boolean>;

	fetchUserReadingProgress: (userId?: string) => Promise<void>;
	fetchUserReadingGoal: (userId?: string, year?: number) => Promise<void>;
	fetchUserReadingStats: (userId?: string) => Promise<void>;
}

export const useReadingProgress = (): UseReadingProgressReturn => {
	const { user, isAuthenticated } = useAuth();

	const [readingProgress, setReadingProgress] = useState<ReadingProgress[]>([]);
	const [isLoadingProgress, setIsLoadingProgress] = useState(false);
	const [progressError, setProgressError] = useState<string | null>(null);

	const [readingGoal, setReadingGoal] = useState<ReadingGoal | null>(null);
	const [isLoadingGoal, setIsLoadingGoal] = useState(false);
	const [goalError, setGoalError] = useState<string | null>(null);

	const [readingStats, setReadingStats] = useState<ReadingStats | null>(null);
	const [isLoadingStats, setIsLoadingStats] = useState(false);
	const [statsError, setStatsError] = useState<string | null>(null);

	const fetchUserReadingProgress = useCallback(
		async (userId?: string) => {
			const targetUserId = userId || (user ? user.id : null);
			if (!targetUserId) return;

			setIsLoadingProgress(true);
			setProgressError(null);

			try {
				const { data, error } = await supabase
					.from('reading_progress')
					.select('*')
					.eq('user_id', targetUserId)
					.order('updated_at', { ascending: false });

				if (error) throw error;

				if (data) {
					const formattedProgress = data.map((item) => ({
						...item,
						book_data:
							typeof item.book_data === 'string'
								? JSON.parse(item.book_data)
								: item.book_data,
					})) as ReadingProgress[];

					setReadingProgress(formattedProgress);
				}
			} catch (error) {
				console.error('Błąd podczas pobierania postępu czytania:', error);
				setProgressError('Nie udało się pobrać postępu czytania.');
			} finally {
				setIsLoadingProgress(false);
			}
		},
		[user]
	);

	const fetchUserReadingGoal = useCallback(
		async (userId?: string, year?: number) => {
			const targetUserId = userId || (user ? user.id : null);
			if (!targetUserId) return;

			const targetYear = year || new Date().getFullYear();

			setIsLoadingGoal(true);
			setGoalError(null);

			try {
				const { data, error } = await supabase
					.from('reading_goals')
					.select('*')
					.eq('user_id', targetUserId)
					.eq('year', targetYear)
					.maybeSingle();

				if (error) throw error;

				setReadingGoal(data as ReadingGoal);
			} catch (error) {
				console.error('Błąd podczas pobierania celu czytelniczego:', error);
				setGoalError('Nie udało się pobrać celu czytelniczego.');
			} finally {
				setIsLoadingGoal(false);
			}
		},
		[user]
	);

	const fetchUserReadingStats = useCallback(
		async (userId?: string) => {
			const targetUserId = userId || (user ? user.id : null);
			if (!targetUserId) return;

			setIsLoadingStats(true);
			setStatsError(null);

			try {
				const { data: progressData, error: progressError } = await supabase
					.from('reading_progress')
					.select('*')
					.eq('user_id', targetUserId);

				if (progressError) throw progressError;

				const { data: completedBooks, error: completedError } = await supabase
					.from('reading_progress')
					.select('*')
					.eq('user_id', targetUserId)
					.eq('status', 'completed')
					.order('end_date', { ascending: false });

				if (completedError) throw completedError;

				let totalBooksRead = 0;
				let totalPagesRead = 0;
				let booksInProgress = 0;
				let totalCompletionDays = 0;
				let totalBooksWithDates = 0;

				const genreMap = new Map();

				const monthlyMap = new Map();

				let currentStreak = 0;
				let longestStreak = 0;
				let lastCompletionDate: Date | null = null;

				if (progressData) {
					progressData.forEach((item) => {
						const bookData =
							typeof item.book_data === 'string'
								? JSON.parse(item.book_data)
								: item.book_data;

						if (item.status === 'completed') {
							totalBooksRead++;
							totalPagesRead += bookData.pageCount || 0;

							if (item.start_date && item.end_date) {
								const startDate = new Date(item.start_date);
								const endDate = new Date(item.end_date);
								const daysToComplete = Math.ceil(
									(endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
								);

								if (daysToComplete >= 0) {
									totalCompletionDays += daysToComplete;
									totalBooksWithDates++;
								}
							}

							if (item.end_date) {
								const completionDate = new Date(item.end_date);
								const formattedDate = completionDate
									.toISOString()
									.split('T')[0];

								const yearMonth = formattedDate.substring(0, 7);
								const monthCount = monthlyMap.get(yearMonth) || 0;
								monthlyMap.set(yearMonth, monthCount + 1);

								if (lastCompletionDate) {
									const dayDiff = Math.ceil(
										(completionDate.getTime() - lastCompletionDate.getTime()) /
											(1000 * 3600 * 24)
									);

									if (dayDiff === 1) {
										currentStreak++;
									} else if (dayDiff !== 0) {
										currentStreak = 1;
									}
								} else {
									currentStreak = 1;
								}

								longestStreak = Math.max(longestStreak, currentStreak);
								lastCompletionDate = completionDate;
							}

							if (bookData.categories && bookData.categories.length > 0) {
								bookData.categories.forEach((category: string) => {
									const count = genreMap.get(category) || 0;
									genreMap.set(category, count + 1);
								});
							}
						} else if (item.status === 'in_progress') {
							booksInProgress++;
						}
					});
				}

				let finalCurrentStreak = 0;
				if (lastCompletionDate) {
					const today = new Date();
					const daysSinceLastCompletion = Math.ceil(
						(today.getTime() - lastCompletionDate.getTime()) /
							(1000 * 3600 * 24)
					);

					if (daysSinceLastCompletion <= 1) {
						finalCurrentStreak = currentStreak;
					}
				}

				const favoriteGenres = Array.from(genreMap.entries())
					.map(([genre, count]) => ({ genre, count: count as number }))
					.sort((a, b) => b.count - a.count);

				const monthlyData = Array.from(monthlyMap.entries())
					.map(([month, count]) => ({ month, count: count as number }))
					.sort((a, b) => a.month.localeCompare(b.month));

				const formattedCompletedBooks = completedBooks
					? (completedBooks.map((item) => ({
							...item,
							book_data:
								typeof item.book_data === 'string'
									? JSON.parse(item.book_data)
									: item.book_data,
					  })) as ReadingProgress[])
					: [];

				const averageCompletionDays =
					totalBooksWithDates > 0
						? Math.round(totalCompletionDays / totalBooksWithDates)
						: 0;

				const formattedStats: ReadingStats = {
					total_books_read: totalBooksRead,
					total_pages_read: totalPagesRead,
					total_books_abandoned: progressData.filter(
						(item) => item.status === 'abandoned'
					).length,
					books_in_progress: booksInProgress,
					average_completion_days: averageCompletionDays,
					current_streak_days: finalCurrentStreak,
					longest_streak_days: longestStreak,
					favorite_genres: favoriteGenres,
					reading_by_month: monthlyData,
					last_completed_books: formattedCompletedBooks,
				};

				setReadingStats(formattedStats);
			} catch (error) {
				console.error('Błąd podczas pobierania statystyk czytania:', error);
				setStatsError('Nie udało się pobrać statystyk czytania.');
			} finally {
				setIsLoadingStats(false);
			}
		},
		[user]
	);

	const getBookReadingStatus = useCallback(
		(bookId: string): ReadingStatus | null => {
			const progress = readingProgress.find((p) => p.book_id === bookId);
			return progress ? progress.status : null;
		},
		[readingProgress]
	);

	const updateBookProgress = useCallback(
		async (
			progressId: string,
			updates: Partial<ReadingProgress>
		): Promise<boolean> => {
			if (!isAuthenticated || !user) {
				setProgressError(
					'Musisz być zalogowany, aby aktualizować postęp czytania.'
				);
				return false;
			}

			setProgressError(null);

			try {
				const currentProgress = readingProgress.find(
					(p) => p.id === progressId
				);
				if (!currentProgress) {
					setProgressError(
						'Nie znaleziono odpowiedniego wpisu postępu czytania.'
					);
					return false;
				}

				const updateData: Partial<ReadingProgress> = { ...updates };

				if (updates.status) {
					if (updates.status === 'in_progress' && !currentProgress.start_date) {
						updateData.start_date = new Date().toISOString();
					}

					if (updates.status === 'completed' && !updates.end_date) {
						updateData.end_date = new Date().toISOString();
						updateData.progress_percentage = 100;
					}
				}

				const { data, error } = await supabase
					.from('reading_progress')
					.update(updateData)
					.eq('id', progressId)
					.eq('user_id', user.id)
					.select()
					.single();

				if (error) throw error;

				if (data) {
					const formattedProgress = {
						...data,
						book_data:
							typeof data.book_data === 'string'
								? JSON.parse(data.book_data)
								: data.book_data,
					} as ReadingProgress;

					setReadingProgress((prev) =>
						prev.map((p) => (p.id === progressId ? formattedProgress : p))
					);

					if (
						updates.status === 'completed' &&
						currentProgress.status !== 'completed' &&
						readingGoal
					) {
						const pages = currentProgress.book_data.pageCount || 0;
						await supabase.rpc('update_reading_goal_progress', {
							goal_id_param: readingGoal.id,
							pages_param: pages,
						});

						fetchUserReadingGoal();
					}

					return true;
				}

				return false;
			} catch (error) {
				console.error('Błąd podczas aktualizacji postępu czytania:', error);
				setProgressError('Nie udało się zaktualizować postępu czytania.');
				return false;
			}
		},
		[isAuthenticated, user, readingProgress, readingGoal, fetchUserReadingGoal]
	);

	const addBookToProgress = useCallback(
		async (book: Book, status: ReadingStatus): Promise<boolean> => {
			if (!isAuthenticated || !user) {
				setProgressError('Musisz być zalogowany, aby śledzić postęp czytania.');
				return false;
			}

			setProgressError(null);

			try {
				const existingProgress = readingProgress.find(
					(p) => p.book_id === book.id
				);
				if (existingProgress) {
					return await updateBookProgress(existingProgress.id, { status });
				}

				const newProgress: Partial<ReadingProgress> = {
					user_id: user.id,
					book_id: book.id,
					book_data: book,
					status,
					progress_percentage: status === 'completed' ? 100 : 0,
					start_date:
						status !== 'not_started' ? new Date().toISOString() : undefined,
					end_date:
						status === 'completed' ? new Date().toISOString() : undefined,
				};

				const { data, error } = await supabase
					.from('reading_progress')
					.insert(newProgress)
					.select()
					.single();

				if (error) throw error;

				if (data) {
					const formattedProgress = {
						...data,
						book_data:
							typeof data.book_data === 'string'
								? JSON.parse(data.book_data)
								: data.book_data,
					} as ReadingProgress;

					setReadingProgress((prev) => [formattedProgress, ...prev]);

					if (status === 'completed' && readingGoal) {
						const pages = book.pageCount || 0;
						await supabase.rpc('update_reading_goal_progress', {
							goal_id_param: readingGoal.id,
							pages_param: pages,
						});

						fetchUserReadingGoal();
					}

					return true;
				}

				return false;
			} catch (error) {
				console.error(
					'Błąd podczas dodawania książki do postępu czytania:',
					error
				);
				setProgressError('Nie udało się dodać książki do postępu czytania.');
				return false;
			}
		},
		[
			isAuthenticated,
			user,
			readingProgress,
			readingGoal,
			fetchUserReadingGoal,
			updateBookProgress,
		]
	);

	const removeBookFromProgress = useCallback(
		async (progressId: string): Promise<boolean> => {
			if (!isAuthenticated || !user) {
				setProgressError('Musisz być zalogowany, aby usunąć postęp czytania.');
				return false;
			}

			setProgressError(null);

			try {
				const { error } = await supabase
					.from('reading_progress')
					.delete()
					.eq('id', progressId)
					.eq('user_id', user.id);

				if (error) throw error;

				setReadingProgress((prev) => prev.filter((p) => p.id !== progressId));

				return true;
			} catch (error) {
				console.error('Błąd podczas usuwania postępu czytania:', error);
				setProgressError('Nie udało się usunąć postępu czytania.');
				return false;
			}
		},
		[isAuthenticated, user]
	);

	const updateReadingGoal = useCallback(
		async (
			goalId: string,
			goalBooks: number,
			goalPages?: number
		): Promise<boolean> => {
			if (!isAuthenticated || !user) {
				setGoalError(
					'Musisz być zalogowany, aby zaktualizować cel czytelniczy.'
				);
				return false;
			}

			setGoalError(null);

			try {
				const { data, error } = await supabase
					.from('reading_goals')
					.update({
						goal_books: goalBooks,
						goal_pages: goalPages || 0,
						updated_at: new Date().toISOString(),
					})
					.eq('id', goalId)
					.eq('user_id', user.id)
					.select()
					.single();

				if (error) throw error;

				if (data) {
					setReadingGoal(data as ReadingGoal);
					return true;
				}

				return false;
			} catch (error) {
				console.error('Błąd podczas aktualizacji celu czytelniczego:', error);
				setGoalError('Nie udało się zaktualizować celu czytelniczego.');
				return false;
			}
		},
		[isAuthenticated, user]
	);

	const createReadingGoal = useCallback(
		async (
			year: number,
			goalBooks: number,
			goalPages?: number
		): Promise<boolean> => {
			if (!isAuthenticated || !user) {
				setGoalError('Musisz być zalogowany, aby ustawić cel czytelniczy.');
				return false;
			}

			setGoalError(null);

			try {
				const { data: existingGoal, error: checkError } = await supabase
					.from('reading_goals')
					.select('id')
					.eq('user_id', user.id)
					.eq('year', year)
					.maybeSingle();

				if (checkError) throw checkError;

				if (existingGoal) {
					return await updateReadingGoal(existingGoal.id, goalBooks, goalPages);
				}

				const newGoal = {
					user_id: user.id,
					year,
					goal_books: goalBooks,
					goal_pages: goalPages || 0,
					books_read: 0,
					pages_read: 0,
				};

				const { data, error } = await supabase
					.from('reading_goals')
					.insert(newGoal)
					.select()
					.single();

				if (error) throw error;

				if (data) {
					setReadingGoal(data as ReadingGoal);
					return true;
				}

				return false;
			} catch (error) {
				console.error('Błąd podczas ustawiania celu czytelniczego:', error);
				setGoalError('Nie udało się ustawić celu czytelniczego.');
				return false;
			}
		},
		[isAuthenticated, user, updateReadingGoal]
	);

	useEffect(() => {
		if (isAuthenticated && user) {
			fetchUserReadingProgress();
			fetchUserReadingGoal();
			fetchUserReadingStats();
		}
	}, [
		isAuthenticated,
		user,
		fetchUserReadingProgress,
		fetchUserReadingGoal,
		fetchUserReadingStats,
	]);

	return {
		readingProgress,
		readingGoal,
		readingStats,
		isLoadingProgress,
		isLoadingGoal,
		isLoadingStats,
		progressError,
		goalError,
		statsError,

		addBookToProgress,
		updateBookProgress,
		removeBookFromProgress,
		getBookReadingStatus,

		setReadingGoal: createReadingGoal,
		updateReadingGoal,

		fetchUserReadingProgress,
		fetchUserReadingGoal,
		fetchUserReadingStats,
	};
};

export default useReadingProgress;
