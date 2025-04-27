// src/hooks/useReviews.ts
import { useState, useEffect, useCallback } from 'react';
import { BookReview, Book, BookRatingSummary } from '../types/book';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';

interface UseReviewsReturn {
	// Pobieranie recenzji
	bookReviews: BookReview[];
	userReview: BookReview | null;
	isLoadingReviews: boolean;
	reviewsError: string | null;

	// Statystyki recenzji
	ratingSummary: BookRatingSummary | null;

	// Akcje
	submitReview: (
		bookId: string,
		book: Book,
		rating: number,
		reviewText: string
	) => Promise<boolean>;
	updateReview: (
		reviewId: string,
		rating: number,
		reviewText: string
	) => Promise<boolean>;
	deleteReview: (reviewId: string) => Promise<boolean>;

	// Odświeżanie danych
	refreshReviews: (bookId: string) => Promise<void>;
}

const DEFAULT_RATING_SUMMARY: BookRatingSummary = {
	averageRating: 0,
	totalReviews: 0,
	ratingDistribution: {
		1: 0,
		2: 0,
		3: 0,
		4: 0,
		5: 0,
	},
};

export const useReviews = (bookId?: string): UseReviewsReturn => {
	const { user, isAuthenticated } = useAuth();
	const [bookReviews, setBookReviews] = useState<BookReview[]>([]);
	const [userReview, setUserReview] = useState<BookReview | null>(null);
	const [ratingSummary, setRatingSummary] = useState<BookRatingSummary | null>(
		null
	);
	const [isLoadingReviews, setIsLoadingReviews] = useState(false);
	const [reviewsError, setReviewsError] = useState<string | null>(null);

	// Funkcja pobierająca recenzje dla danej książki
	const fetchReviews = useCallback(
		async (bookId: string) => {
			if (!bookId) return;

			setIsLoadingReviews(true);
			setReviewsError(null);

			try {
				// Pobieramy recenzje wraz z danymi użytkownika
				const { data: reviewsData, error: reviewsError } = await supabase
					.from('book_reviews')
					.select(
						`
          *,
          user_details:profiles(username, avatar_url)
        `
					)
					.eq('book_id', bookId)
					.order('created_at', { ascending: false });

				if (reviewsError) {
					throw reviewsError;
				}

				if (reviewsData) {
					// Konwertujemy dane na właściwy format
					const reviews = reviewsData.map((review) => ({
						...review,
						book_data:
							typeof review.book_data === 'string'
								? JSON.parse(review.book_data)
								: review.book_data,
					})) as BookReview[];

					setBookReviews(reviews);

					// Sprawdzamy, czy użytkownik ma już recenzję tej książki
					if (isAuthenticated && user) {
						const userExistingReview = reviews.find(
							(review) => review.user_id === user.id
						);
						setUserReview(userExistingReview || null);
					}

					// Obliczamy statystyki recenzji
					calculateRatingSummary(reviews);
				}
			} catch (error) {
				console.error('Błąd podczas pobierania recenzji:', error);
				setReviewsError(
					'Nie udało się pobrać recenzji. Spróbuj ponownie później.'
				);
			} finally {
				setIsLoadingReviews(false);
			}
		},
		[isAuthenticated, user]
	);

	// Obliczanie statystyk recenzji
	const calculateRatingSummary = (reviews: BookReview[]) => {
		if (!reviews || reviews.length === 0) {
			setRatingSummary(DEFAULT_RATING_SUMMARY);
			return;
		}

		const distribution = {
			1: 0,
			2: 0,
			3: 0,
			4: 0,
			5: 0,
		};

		let sum = 0;

		reviews.forEach((review) => {
			sum += review.rating;
			// Zwiększamy licznik dla danej oceny
			distribution[review.rating as 1 | 2 | 3 | 4 | 5]++;
		});

		setRatingSummary({
			averageRating: Number((sum / reviews.length).toFixed(1)),
			totalReviews: reviews.length,
			ratingDistribution: distribution,
		});
	};

	// Dodawanie nowej recenzji
	const submitReview = async (
		bookId: string,
		book: Book,
		rating: number,
		reviewText: string
	): Promise<boolean> => {
		if (!isAuthenticated || !user) {
			setReviewsError('Musisz być zalogowany, aby dodać recenzję.');
			return false;
		}

		if (!bookId || !book) {
			setReviewsError('Brak danych książki.');
			return false;
		}

		if (rating < 1 || rating > 5) {
			setReviewsError('Ocena musi być w zakresie od 1 do 5.');
			return false;
		}

		setIsLoadingReviews(true);
		setReviewsError(null);

		try {
			// Sprawdzamy, czy użytkownik już recenzował tę książkę
			if (userReview) {
				return await updateReview(userReview.id, rating, reviewText);
			}

			// Zapisujemy dane książki jako JSON
			const bookData = JSON.stringify(book);

			// Dodajemy nową recenzję
			const { data, error } = await supabase
				.from('book_reviews')
				.insert({
					user_id: user.id,
					book_id: bookId,
					rating,
					review_text: reviewText || null,
					book_data: book,
				})
				.select(
					`
          *,
          user_details:profiles(username, avatar_url)
        `
				)
				.single();

			if (error) {
				throw error;
			}

			if (data) {
				// Dodajemy nową recenzję do listy
				const newReview: BookReview = {
					...data,
					book_data:
						typeof data.book_data === 'string'
							? JSON.parse(data.book_data)
							: data.book_data,
				};

				setBookReviews((prev) => [newReview, ...prev]);
				setUserReview(newReview);

				// Aktualizujemy statystyki
				calculateRatingSummary([...bookReviews, newReview]);

				return true;
			}

			return false;
		} catch (error) {
			console.error('Błąd podczas dodawania recenzji:', error);
			setReviewsError(
				'Nie udało się dodać recenzji. Spróbuj ponownie później.'
			);
			return false;
		} finally {
			setIsLoadingReviews(false);
		}
	};

	// Aktualizacja istniejącej recenzji
	const updateReview = async (
		reviewId: string,
		rating: number,
		reviewText: string
	): Promise<boolean> => {
		if (!isAuthenticated || !user) {
			setReviewsError('Musisz być zalogowany, aby zaktualizować recenzję.');
			return false;
		}

		if (!reviewId) {
			setReviewsError('Brak ID recenzji.');
			return false;
		}

		setIsLoadingReviews(true);
		setReviewsError(null);

		try {
			const { data, error } = await supabase
				.from('book_reviews')
				.update({
					rating,
					review_text: reviewText || null,
					updated_at: new Date().toISOString(),
				})
				.eq('id', reviewId)
				.eq('user_id', user.id) // Upewniamy się, że użytkownik jest właścicielem recenzji
				.select(
					`
          *,
          user_details:profiles(username, avatar_url)
        `
				)
				.single();

			if (error) {
				throw error;
			}

			if (data) {
				// Aktualizujemy recenzję w stanie
				const updatedReview: BookReview = {
					...data,
					book_data:
						typeof data.book_data === 'string'
							? JSON.parse(data.book_data)
							: data.book_data,
				};

				setBookReviews((prev) =>
					prev.map((review) =>
						review.id === reviewId ? updatedReview : review
					)
				);
				setUserReview(updatedReview);

				// Aktualizujemy statystyki
				calculateRatingSummary(
					bookReviews.map((review) =>
						review.id === reviewId ? updatedReview : review
					)
				);

				return true;
			}

			return false;
		} catch (error) {
			console.error('Błąd podczas aktualizacji recenzji:', error);
			setReviewsError(
				'Nie udało się zaktualizować recenzji. Spróbuj ponownie później.'
			);
			return false;
		} finally {
			setIsLoadingReviews(false);
		}
	};

	// Usuwanie recenzji
	const deleteReview = async (reviewId: string): Promise<boolean> => {
		if (!isAuthenticated || !user) {
			setReviewsError('Musisz być zalogowany, aby usunąć recenzję.');
			return false;
		}

		if (!reviewId) {
			setReviewsError('Brak ID recenzji.');
			return false;
		}

		setIsLoadingReviews(true);
		setReviewsError(null);

		try {
			const { error } = await supabase
				.from('book_reviews')
				.delete()
				.eq('id', reviewId)
				.eq('user_id', user.id); // Upewniamy się, że użytkownik jest właścicielem recenzji

			if (error) {
				throw error;
			}

			// Aktualizujemy stan
			setBookReviews((prev) => prev.filter((review) => review.id !== reviewId));
			setUserReview(null);

			// Aktualizujemy statystyki
			calculateRatingSummary(
				bookReviews.filter((review) => review.id !== reviewId)
			);

			return true;
		} catch (error) {
			console.error('Błąd podczas usuwania recenzji:', error);
			setReviewsError(
				'Nie udało się usunąć recenzji. Spróbuj ponownie później.'
			);
			return false;
		} finally {
			setIsLoadingReviews(false);
		}
	};

	// Funkcja do odświeżania recenzji
	const refreshReviews = async (bookId: string) => {
		await fetchReviews(bookId);
	};

	// Pobieramy recenzje na starcie, jeśli mamy ID książki
	useEffect(() => {
		if (bookId) {
			fetchReviews(bookId);
		} else {
			// Resetujemy stan, jeśli nie ma ID książki
			setBookReviews([]);
			setUserReview(null);
			setRatingSummary(DEFAULT_RATING_SUMMARY);
		}
	}, [bookId, fetchReviews]);

	return {
		bookReviews,
		userReview,
		isLoadingReviews,
		reviewsError,
		ratingSummary,
		submitReview,
		updateReview,
		deleteReview,
		refreshReviews,
	};
};

export default useReviews;
