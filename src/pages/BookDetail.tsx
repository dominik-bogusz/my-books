import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getBookById } from '../api/googleBooks';
import { Book } from '../types/book';
import { useAuth } from '../context/AuthContext';
import { useBookActions } from '../hooks/useBookActions';
import { useSearch } from '../context/SearchContext';

const BookDetail = () => {
	const { id } = useParams<{ id: string }>();
	const [book, setBook] = useState<Book | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const { isAuthenticated } = useAuth();
	const {
		isFavorite,
		isInReadingList,
		addToFavorites,
		removeFromFavorites,
		addToReadingList,
		removeFromReadingList,
		refreshUserBooks,
	} = useBookActions();
	const navigate = useNavigate();
	const { currentQuery } = useSearch();

	useEffect(() => {
		const fetchBookDetails = async () => {
			if (!id) return;

			setIsLoading(true);
			setError(null);

			try {
				const data = await getBookById(id);

				if (data) {
					const bookData: Book = {
						id: data.id,
						title: data.volumeInfo.title,
						authors: data.volumeInfo.authors,
						description: data.volumeInfo.description,
						publishedDate: data.volumeInfo.publishedDate,
						pageCount: data.volumeInfo.pageCount,
						categories: data.volumeInfo.categories,
						imageLinks: data.volumeInfo.imageLinks,
						language: data.volumeInfo.language,
						averageRating: data.volumeInfo.averageRating,
						publisher: data.volumeInfo.publisher,
					};

					setBook(bookData);
				}
			} catch (err) {
				console.error('Error fetching book details:', err);
				setError(
					'Nie udało się załadować szczegółów książki. Spróbuj ponownie później.'
				);
			} finally {
				setIsLoading(false);
			}
		};

		fetchBookDetails();
	}, [id]);

	const handleToggleFavorite = async () => {
		if (!book) return;

		if (!isAuthenticated) {
			navigate('/login', { state: { from: { pathname: `/book/${id}` } } });
			return;
		}

		try {
			setIsProcessing(true);

			if (isFavorite(book.id)) {
				await removeFromFavorites(book.id);
			} else {
				await addToFavorites(book);
			}

			// Odświeżamy listę książek użytkownika
			await refreshUserBooks();
		} catch (error) {
			console.error('Error toggling favorite:', error);
		} finally {
			setIsProcessing(false);
		}
	};

	const handleToggleReadingList = async () => {
		if (!book) return;

		if (!isAuthenticated) {
			navigate('/login', { state: { from: { pathname: `/book/${id}` } } });
			return;
		}

		try {
			setIsProcessing(true);

			if (isInReadingList(book.id)) {
				await removeFromReadingList(book.id);
			} else {
				await addToReadingList(book);
			}

			// Odświeżamy listę książek użytkownika
			await refreshUserBooks();
		} catch (error) {
			console.error('Error toggling reading list:', error);
		} finally {
			setIsProcessing(false);
		}
	};

	// Determine where to go back to
	const getBackLink = () => {
		// If we have a current search query, link back to search results
		if (currentQuery) {
			return '/search';
		}
		// Otherwise, default to home page
		return '/';
	};

	const getBackLinkText = () => {
		if (currentQuery) {
			return (
				<>
					<i className='fas fa-arrow-left me-2'></i>
					Powrót do wyników
				</>
			);
		}
		return (
			<>
				<i className='fas fa-home me-2'></i>
				Strona główna
			</>
		);
	};

	if (isLoading) {
		return (
			<div
				className='container d-flex justify-content-center align-items-center py-5'
				style={{ minHeight: '400px' }}
			>
				<div className='text-center'>
					<div className='spinner-border text-primary mb-3' role='status'>
						<span className='visually-hidden'>Ładowanie...</span>
					</div>
					<p>Ładowanie szczegółów książki...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='container py-5'>
				<div className='card text-center p-5 bg-light'>
					<i className='fas fa-exclamation-triangle text-warning fa-4x mb-3'></i>
					<h3 className='mb-4'>{error}</h3>
					<Link to='/' className='btn btn-primary'>
						<i className='fas fa-home me-2'></i>
						Wróć do strony głównej
					</Link>
				</div>
			</div>
		);
	}

	if (!book) {
		return (
			<div className='container py-5'>
				<div className='card text-center p-5 bg-light'>
					<i className='fas fa-book-open text-muted fa-4x mb-3'></i>
					<h3 className='mb-4'>Książka nie została znaleziona</h3>
					<Link to='/' className='btn btn-primary'>
						<i className='fas fa-home me-2'></i>
						Wróć do strony głównej
					</Link>
				</div>
			</div>
		);
	}

	const defaultCover = 'https://placehold.co/128x192/e0e0e0/gray?text=No+Cover';
	const isBookmarked = isFavorite(book.id);
	const isInReading = isInReadingList(book.id);

	return (
		<div className='container py-4'>
			<div className='mb-4'>
				<Link to={getBackLink()} className='btn btn-outline-primary'>
					{getBackLinkText()}
				</Link>
			</div>

			<div className='row'>
				<div className='col-12 col-md-4 col-lg-3 mb-4'>
					<div className='d-flex flex-column'>
						<div className='position-relative mb-4'>
							<img
								src={book.imageLinks?.thumbnail || defaultCover}
								alt={book.title}
								className='img-fluid rounded shadow mx-auto'
								style={{ maxHeight: '400px', width: 'auto' }}
							/>

							<div className='mt-3'>
								<div className='d-grid gap-2'>
									{isAuthenticated ? (
										<>
											<button
												onClick={handleToggleFavorite}
												className={`btn ${
													isBookmarked ? 'btn-warning' : 'btn-outline-warning'
												}`}
												disabled={isProcessing}
											>
												{isProcessing && isBookmarked ? (
													<span
														className='spinner-border spinner-border-sm me-2'
														role='status'
														aria-hidden='true'
													></span>
												) : (
													<i className='fas fa-heart me-2'></i>
												)}
												{isBookmarked
													? 'Usuń z ulubionych'
													: 'Dodaj do ulubionych'}
											</button>

											<button
												onClick={handleToggleReadingList}
												className={`btn ${
													isInReading ? 'btn-info' : 'btn-outline-info'
												}`}
												disabled={isProcessing}
											>
												{isProcessing && isInReading ? (
													<span
														className='spinner-border spinner-border-sm me-2'
														role='status'
														aria-hidden='true'
													></span>
												) : (
													<i className='fas fa-book-reader me-2'></i>
												)}
												{isInReading
													? 'Usuń z listy do przeczytania'
													: 'Dodaj do przeczytania'}
											</button>
										</>
									) : (
										<>
											<button
												onClick={() =>
													navigate('/login', {
														state: { from: { pathname: `/book/${id}` } },
													})
												}
												className='btn btn-outline-warning'
											>
												<i className='fas fa-heart me-2'></i>
												Zaloguj się, aby dodać do ulubionych
											</button>

											<button
												onClick={() =>
													navigate('/login', {
														state: { from: { pathname: `/book/${id}` } },
													})
												}
												className='btn btn-outline-info'
											>
												<i className='fas fa-book-reader me-2'></i>
												Zaloguj się, aby dodać do przeczytania
											</button>
										</>
									)}
								</div>
							</div>
						</div>

						<div className='card p-3 bg-light mb-4'>
							<ul className='list-group list-group-flush'>
								{book.publisher && (
									<li className='list-group-item bg-light px-0'>
										<strong>Wydawca:</strong> {book.publisher}
									</li>
								)}

								{book.publishedDate && (
									<li className='list-group-item bg-light px-0'>
										<strong>Data publikacji:</strong> {book.publishedDate}
									</li>
								)}

								{book.pageCount && (
									<li className='list-group-item bg-light px-0'>
										<strong>Liczba stron:</strong> {book.pageCount}
									</li>
								)}

								{book.language && (
									<li className='list-group-item bg-light px-0'>
										<strong>Język:</strong> {book.language.toUpperCase()}
									</li>
								)}

								{book.averageRating && (
									<li className='list-group-item bg-light px-0'>
										<strong>Ocena:</strong>{' '}
										<span className='text-warning'>
											{'★'.repeat(Math.round(book.averageRating))}
											{'☆'.repeat(5 - Math.round(book.averageRating))}
										</span>
										<span className='ms-1'>({book.averageRating}/5)</span>
									</li>
								)}
							</ul>
						</div>
					</div>
				</div>

				<div className='col-12 col-md-8 col-lg-9'>
					<h1 className='mb-2'>{book.title}</h1>

					{book.authors && book.authors.length > 0 && (
						<h4 className='text-muted mb-3'>
							Autor: {book.authors.join(', ')}
						</h4>
					)}

					{book.categories && book.categories.length > 0 && (
						<div className='mb-4'>
							{book.categories.map((category, index) => (
								<span
									key={index}
									className='badge me-2 mb-2 px-4 py-2 fs-6'
									style={{
										background:
											'linear-gradient(90deg, #DA831C 0%, #FFD028 100%)',
										color: 'white',
										border: 'none',
									}}
								>
									{category}
								</span>
							))}
						</div>
					)}

					<hr className='my-4' />

					<div className='mb-4'>
						<h3 className='mb-3'>Opis</h3>
						{book.description ? (
							<div
								dangerouslySetInnerHTML={{ __html: book.description }}
								className='book-description'
							></div>
						) : (
							<p className='text-muted'>Brak opisu dla tej książki.</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default BookDetail;
