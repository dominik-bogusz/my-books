// src/components/BookReviewSystem.tsx
import React, { useState } from 'react';
import { Book } from '../types/book';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import useReviews from '../hooks/useReviews';

interface BookReviewSystemProps {
	book: Book;
}

const BookReviewSystem: React.FC<BookReviewSystemProps> = ({ book }) => {
	const { isAuthenticated, user } = useAuth();
	const navigate = useNavigate();
	const {
		bookReviews,
		userReview,
		ratingSummary,
		isLoadingReviews,
		reviewsError,
		submitReview,
		updateReview,
		deleteReview,
	} = useReviews(book.id);

	const [rating, setRating] = useState<number>(userReview?.rating || 5);
	const [reviewText, setReviewText] = useState<string>(
		userReview?.review_text || ''
	);
	const [isEditing, setIsEditing] = useState<boolean>(false);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const handleRatingChange = (newRating: number) => {
		setRating(newRating);
	};

	const handleSubmitReview = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!isAuthenticated) {
			navigate('/login', { state: { from: { pathname: `/book/${book.id}` } } });
			return;
		}

		setIsSubmitting(true);

		try {
			if (userReview) {
				await updateReview(userReview.id, rating, reviewText);
			} else {
				await submitReview(book.id, book, rating, reviewText);
			}
			setIsEditing(false);
		} catch (error) {
			console.error('Error submitting review:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteReview = async () => {
		if (!userReview) return;

		if (confirm('Czy na pewno chcesz usunąć swoją recenzję?')) {
			setIsSubmitting(true);
			try {
				await deleteReview(userReview.id);
				setRating(5);
				setReviewText('');
				setIsEditing(false);
			} catch (error) {
				console.error('Error deleting review:', error);
			} finally {
				setIsSubmitting(false);
			}
		}
	};

	// Render rating stars
	const renderStars = (
		currentRating: number,
		interactive: boolean = false,
		onSelect?: (rating: number) => void
	) => {
		return (
			<div className='star-rating'>
				{[1, 2, 3, 4, 5].map((star) => (
					<i
						key={star}
						className={`${star <= currentRating ? 'fas' : 'far'} fa-star${
							interactive ? ' interactive' : ''
						}`}
						style={{
							color: star <= currentRating ? '#FFD700' : '#ccc',
							cursor: interactive ? 'pointer' : 'default',
							fontSize: '1.2rem',
							marginRight: '0.2rem',
						}}
						onClick={() => {
							if (interactive && onSelect) onSelect(star);
						}}
						onMouseEnter={(e) => {
							if (interactive) {
								// Highlight stars on hover
								const stars = e.currentTarget.parentElement?.children;
								if (stars) {
									for (let i = 0; i < stars.length; i++) {
										if (i < star) {
											(stars[i] as HTMLElement).style.color = '#FFD700';
											stars[i].className = 'fas fa-star interactive';
										} else {
											(stars[i] as HTMLElement).style.color = '#ccc';
											stars[i].className = 'far fa-star interactive';
										}
									}
								}
							}
						}}
						onMouseLeave={(e) => {
							if (interactive) {
								// Reset to actual rating when not hovering
								const stars = e.currentTarget.parentElement?.children;
								if (stars) {
									for (let i = 0; i < stars.length; i++) {
										if (i < rating) {
											(stars[i] as HTMLElement).style.color = '#FFD700';
											stars[i].className = 'fas fa-star interactive';
										} else {
											(stars[i] as HTMLElement).style.color = '#ccc';
											stars[i].className = 'far fa-star interactive';
										}
									}
								}
							}
						}}
					/>
				))}
			</div>
		);
	};

	// Rating distribution bar
	const RatingDistributionBar = () => {
		if (!ratingSummary || ratingSummary.totalReviews === 0) return null;

		return (
			<div className='rating-distribution mb-4'>
				{[5, 4, 3, 2, 1].map((num) => {
					const count =
						ratingSummary.ratingDistribution[num as 1 | 2 | 3 | 4 | 5];
					const percentage = (count / ratingSummary.totalReviews) * 100;

					return (
						<div key={num} className='d-flex align-items-center mb-1'>
							<div className='me-2' style={{ width: '60px' }}>
								{num} <i className='fas fa-star text-warning'></i>
							</div>
							<div className='progress flex-grow-1' style={{ height: '8px' }}>
								<div
									className='progress-bar bg-warning'
									role='progressbar'
									style={{ width: `${percentage}%` }}
									aria-valuenow={percentage}
									aria-valuemin={0}
									aria-valuemax={100}
								></div>
							</div>
							<div className='ms-2' style={{ width: '40px' }}>
								{count}
							</div>
						</div>
					);
				})}
			</div>
		);
	};

	return (
		<div className='card mb-4'>
			<div className='card-header bg-white'>
				<h3 className='mb-0'>Recenzje książki</h3>
			</div>
			<div className='card-body'>
				{/* Rating Summary */}
				{ratingSummary && (
					<div className='row mb-4'>
						<div className='col-md-4 text-center'>
							<div className='display-4 fw-bold'>
								{ratingSummary.averageRating.toFixed(1)}
							</div>
							<div className='mb-1'>
								{renderStars(Math.round(ratingSummary.averageRating))}
							</div>
							<p className='text-muted'>
								{ratingSummary.totalReviews}{' '}
								{ratingSummary.totalReviews === 1
									? 'recenzja'
									: ratingSummary.totalReviews > 1 &&
									  ratingSummary.totalReviews < 5
									? 'recenzje'
									: 'recenzji'}
							</p>
						</div>
						<div className='col-md-8'>
							<RatingDistributionBar />
						</div>
					</div>
				)}

				{reviewsError && (
					<div className='alert alert-danger' role='alert'>
						<i className='fas fa-exclamation-circle me-2'></i>
						{reviewsError}
					</div>
				)}

				{/* User Review Form */}
				{isAuthenticated ? (
					userReview && !isEditing ? (
						<div className='card mb-4 bg-light'>
							<div className='card-body'>
								<div className='d-flex justify-content-between align-items-start'>
									<div>
										<h5>Twoja recenzja</h5>
										<div className='mb-2'>{renderStars(userReview.rating)}</div>
										<p>{userReview.review_text}</p>
										<small className='text-muted'>
											Dodano:{' '}
											{new Date(userReview.created_at).toLocaleDateString()}
											{userReview.updated_at !== userReview.created_at &&
												` (edytowano: ${new Date(
													userReview.updated_at
												).toLocaleDateString()})`}
										</small>
									</div>
									<div>
										<button
											className='btn btn-sm btn-outline-primary me-2'
											onClick={() => {
												setRating(userReview.rating);
												setReviewText(userReview.review_text || '');
												setIsEditing(true);
											}}
										>
											<i className='fas fa-edit me-1'></i>
											Edytuj
										</button>
										<button
											className='btn btn-sm btn-outline-danger'
											onClick={handleDeleteReview}
											disabled={isSubmitting}
										>
											<i className='fas fa-trash me-1'></i>
											Usuń
										</button>
									</div>
								</div>
							</div>
						</div>
					) : (
						<div className='card mb-4'>
							<div className='card-body'>
								<h5>
									{userReview ? 'Edytuj swoją recenzję' : 'Dodaj recenzję'}
								</h5>
								<form onSubmit={handleSubmitReview}>
									<div className='mb-3'>
										<label className='form-label'>Twoja ocena</label>
										<div>{renderStars(rating, true, handleRatingChange)}</div>
									</div>
									<div className='mb-3'>
										<label htmlFor='reviewText' className='form-label'>
											Twoja recenzja (opcjonalnie)
										</label>
										<textarea
											className='form-control'
											id='reviewText'
											rows={4}
											value={reviewText}
											onChange={(e) => setReviewText(e.target.value)}
											placeholder='Napisz swoją opinię o tej książce...'
										></textarea>
									</div>
									<div className='d-flex justify-content-end gap-2'>
										{isEditing && (
											<button
												type='button'
												className='btn btn-outline-secondary'
												onClick={() => setIsEditing(false)}
												disabled={isSubmitting}
											>
												Anuluj
											</button>
										)}
										<button
											type='submit'
											className='btn btn-primary'
											disabled={isSubmitting}
										>
											{isSubmitting ? (
												<>
													<span
														className='spinner-border spinner-border-sm me-2'
														role='status'
														aria-hidden='true'
													></span>
													{userReview ? 'Aktualizowanie...' : 'Dodawanie...'}
												</>
											) : (
												<>{userReview ? 'Zapisz zmiany' : 'Dodaj recenzję'}</>
											)}
										</button>
									</div>
								</form>
							</div>
						</div>
					)
				) : (
					<div className='alert alert-info mb-4'>
						<i className='fas fa-info-circle me-2'></i>
						<span className='me-2'>Zaloguj się, aby dodać recenzję.</span>
						<button
							className='btn btn-sm btn-primary'
							onClick={() =>
								navigate('/login', {
									state: { from: { pathname: `/book/${book.id}` } },
								})
							}
						>
							Zaloguj się
						</button>
					</div>
				)}

				{/* Other Users' Reviews */}
				<h4 className='mb-3'>Wszystkie recenzje</h4>

				{isLoadingReviews ? (
					<div className='text-center py-4'>
						<div className='spinner-border text-primary' role='status'>
							<span className='visually-hidden'>Ładowanie recenzji...</span>
						</div>
						<p className='mt-2'>Ładowanie recenzji...</p>
					</div>
				) : bookReviews.length === 0 ? (
					<div className='text-center py-4 bg-light rounded'>
						<i className='fas fa-comment-slash fa-3x text-muted mb-3'></i>
						<p className='lead text-muted'>
							Brak recenzji dla tej książki. Bądź pierwszy!
						</p>
					</div>
				) : (
					<div className='review-list'>
						{bookReviews
							// Don't show user's own review twice
							.filter((review) => !user || review.user_id !== user.id)
							.map((review) => (
								<div key={review.id} className='card mb-3'>
									<div className='card-body'>
										<div className='d-flex align-items-center mb-2'>
											{review.user_details && (
												<>
													{review.user_details.avatar_url ? (
														<img
															src={review.user_details.avatar_url}
															alt='Avatar'
															className='rounded-circle me-2'
															width='40'
															height='40'
														/>
													) : (
														<div
															className='rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2'
															style={{ width: '40px', height: '40px' }}
														>
															{review.user_details.username[0].toUpperCase()}
														</div>
													)}
													<h6 className='mb-0 me-2'>
														{review.user_details.username}
													</h6>
												</>
											)}
											<small className='text-muted'>
												{new Date(review.created_at).toLocaleDateString()}
											</small>
										</div>
										<div className='mb-2'>{renderStars(review.rating)}</div>
										{review.review_text && <p>{review.review_text}</p>}
									</div>
								</div>
							))}
					</div>
				)}
			</div>
		</div>
	);
};

export default BookReviewSystem;
