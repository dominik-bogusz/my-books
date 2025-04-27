// src/components/ReadingProgressTracker.tsx
import React, { useState, useEffect } from 'react';
import { Book } from '../types/book';
import { ReadingStatus } from '../types/reading';
import useReadingProgress from '../hooks/useReadingProgress';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ReadingProgressTrackerProps {
	book: Book;
}

const ReadingProgressTracker: React.FC<ReadingProgressTrackerProps> = ({
	book,
}) => {
	const { isAuthenticated } = useAuth();
	const navigate = useNavigate();
	const {
		readingProgress,
		isLoadingProgress,
		progressError,
		addBookToProgress,
		updateBookProgress,
		removeBookFromProgress,
		getBookReadingStatus,
	} = useReadingProgress();

	const [status, setStatus] = useState<ReadingStatus | null>(null);
	const [progress, setProgress] = useState<number>(0);
	const [currentPage, setCurrentPage] = useState<number>(0);
	const [showUpdateForm, setShowUpdateForm] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [progressId, setProgressId] = useState<string | null>(null);

	// Pobieranie aktualnego statusu książki po załadowaniu
	useEffect(() => {
		if (book && readingProgress.length > 0) {
			const bookProgress = readingProgress.find((p) => p.book_id === book.id);
			if (bookProgress) {
				setStatus(bookProgress.status);
				setProgress(bookProgress.progress_percentage || 0);
				setCurrentPage(bookProgress.current_page || 0);
				setProgressId(bookProgress.id);
			} else {
				setStatus(null);
				setProgress(0);
				setCurrentPage(0);
				setProgressId(null);
			}
		}
	}, [book, readingProgress]);

	// Dodawanie książki do śledzenia
	const handleAddToTracking = async (newStatus: ReadingStatus) => {
		if (!isAuthenticated) {
			navigate('/login', { state: { from: { pathname: `/book/${book.id}` } } });
			return;
		}

		setIsProcessing(true);
		try {
			const success = await addBookToProgress(book, newStatus);
			if (success) {
				setStatus(newStatus);
				if (newStatus === 'completed') {
					setProgress(100);
				}
			}
		} catch (error) {
			console.error('Błąd podczas dodawania do śledzenia:', error);
		} finally {
			setIsProcessing(false);
		}
	};

	// Aktualizacja postępu
	const handleUpdateProgress = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isAuthenticated || !progressId) return;

		setIsProcessing(true);
		try {
			// Określamy nowy status na podstawie postępu
			let newStatus: ReadingStatus = status as ReadingStatus;
			if (progress === 100) {
				newStatus = 'completed';
			} else if (progress > 0 && status === 'not_started') {
				newStatus = 'in_progress';
			}

			const success = await updateBookProgress(progressId, {
				progress_percentage: progress,
				current_page: currentPage,
				status: newStatus,
			});

			if (success) {
				setStatus(newStatus);
				setShowUpdateForm(false);
			}
		} catch (error) {
			console.error('Błąd podczas aktualizacji postępu:', error);
		} finally {
			setIsProcessing(false);
		}
	};

	// Usunięcie książki ze śledzenia
	const handleRemoveFromTracking = async () => {
		if (!isAuthenticated || !progressId) return;

		if (
			confirm(
				'Czy na pewno chcesz usunąć tę książkę z śledzenia postępu czytania?'
			)
		) {
			setIsProcessing(true);
			try {
				const success = await removeBookFromProgress(progressId);
				if (success) {
					setStatus(null);
					setProgress(0);
					setCurrentPage(0);
					setProgressId(null);
				}
			} catch (error) {
				console.error('Błąd podczas usuwania z śledzenia:', error);
			} finally {
				setIsProcessing(false);
			}
		}
	};

	// Renderowanie statusu książki
	const renderStatusBadge = (status: ReadingStatus | null) => {
		if (!status) return null;

		let badgeClass = '';
		let badgeText = '';

		switch (status) {
			case 'not_started':
				badgeClass = 'bg-secondary';
				badgeText = 'Planuję przeczytać';
				break;
			case 'in_progress':
				badgeClass = 'bg-primary';
				badgeText = 'W trakcie czytania';
				break;
			case 'completed':
				badgeClass = 'bg-success';
				badgeText = 'Przeczytana';
				break;
			case 'abandoned':
				badgeClass = 'bg-danger';
				badgeText = 'Porzucona';
				break;
		}

		return (
			<span className={`badge ${badgeClass} fs-6`}>
				<i className={getStatusIcon(status)} className='me-1'></i>
				{badgeText}
			</span>
		);
	};

	// Ikona statusu
	const getStatusIcon = (status: ReadingStatus | null) => {
		switch (status) {
			case 'not_started':
				return 'fas fa-bookmark';
			case 'in_progress':
				return 'fas fa-book-reader';
			case 'completed':
				return 'fas fa-check-circle';
			case 'abandoned':
				return 'fas fa-times-circle';
			default:
				return 'fas fa-book';
		}
	};

	// Konwersja procentu ukończenia na strony
	const percentToPages = (percent: number) => {
		if (!book.pageCount) return 0;
		return Math.round((percent / 100) * book.pageCount);
	};

	// Konwersja strony na procent ukończenia
	const pageToPercent = (page: number) => {
		if (!book.pageCount || page > book.pageCount) return 100;
		return Math.round((page / book.pageCount) * 100);
	};

	if (isLoadingProgress) {
		return (
			<div className='text-center py-3'>
				<div
					className='spinner-border spinner-border-sm text-primary'
					role='status'
				>
					<span className='visually-hidden'>Ładowanie...</span>
				</div>
				<span className='ms-2'>Ładowanie statusu czytania...</span>
			</div>
		);
	}

	if (progressError) {
		return (
			<div className='alert alert-warning' role='alert'>
				<i className='fas fa-exclamation-triangle me-2'></i>
				{progressError}
			</div>
		);
	}

	return (
		<div className='reading-progress-tracker card'>
			<div className='card-header'>
				<h5 className='mb-0'>
					<i className='fas fa-book-reader me-2'></i>
					Status czytania
				</h5>
			</div>
			<div className='card-body'>
				{status ? (
					<div>
						<div className='d-flex justify-content-between align-items-center mb-3'>
							<div>{renderStatusBadge(status)}</div>
							<div>
								<button
									className='btn btn-sm btn-outline-primary me-2'
									onClick={() => setShowUpdateForm(!showUpdateForm)}
									disabled={isProcessing}
								>
									<i className='fas fa-edit me-1'></i>
									{showUpdateForm ? 'Anuluj' : 'Aktualizuj'}
								</button>
								<button
									className='btn btn-sm btn-outline-danger'
									onClick={handleRemoveFromTracking}
									disabled={isProcessing}
								>
									<i className='fas fa-trash me-1'></i>
									Usuń
								</button>
							</div>
						</div>

						{/* Progress bar */}
						<div className='mb-3'>
							<div className='d-flex justify-content-between align-items-center mb-1'>
								<small>Postęp: {progress}%</small>
								{book.pageCount && (
									<small>
										Strona {currentPage || percentToPages(progress)}/
										{book.pageCount}
									</small>
								)}
							</div>
							<div className='progress' style={{ height: '10px' }}>
								<div
									className='progress-bar'
									role='progressbar'
									style={{
										width: `${progress}%`,
										background:
											'linear-gradient(90deg, #DA831C 0%, #FFD028 100%)',
									}}
									aria-valuenow={progress}
									aria-valuemin={0}
									aria-valuemax={100}
								></div>
							</div>
						</div>

						{showUpdateForm && (
							<form onSubmit={handleUpdateProgress} className='mt-3'>
								<div className='mb-3'>
									<label htmlFor='readingStatus' className='form-label'>
										Status
									</label>
									<select
										id='readingStatus'
										className='form-select'
										value={status}
										onChange={(e) => setStatus(e.target.value as ReadingStatus)}
										disabled={isProcessing}
									>
										<option value='not_started'>Planuję przeczytać</option>
										<option value='in_progress'>W trakcie czytania</option>
										<option value='completed'>Przeczytana</option>
										<option value='abandoned'>Porzucona</option>
									</select>
								</div>

								{book.pageCount ? (
									<div className='mb-3'>
										<label htmlFor='currentPage' className='form-label'>
											Aktualna strona (0-{book.pageCount})
										</label>
										<input
											type='number'
											className='form-control'
											id='currentPage'
											min={0}
											max={book.pageCount}
											value={currentPage}
											onChange={(e) => {
												const page = Math.min(
													parseInt(e.target.value) || 0,
													book.pageCount
												);
												setCurrentPage(page);
												setProgress(pageToPercent(page));
											}}
											disabled={isProcessing}
										/>
									</div>
								) : (
									<div className='mb-3'>
										<label htmlFor='progressPercentage' className='form-label'>
											Postęp (0-100%)
										</label>
										<input
											type='number'
											className='form-control'
											id='progressPercentage'
											min={0}
											max={100}
											value={progress}
											onChange={(e) =>
												setProgress(
													Math.min(parseInt(e.target.value) || 0, 100)
												)
											}
											disabled={isProcessing}
										/>
									</div>
								)}

								<button
									type='submit'
									className='btn btn-primary'
									disabled={isProcessing}
								>
									{isProcessing ? (
										<>
											<span
												className='spinner-border spinner-border-sm me-2'
												role='status'
												aria-hidden='true'
											></span>
											Aktualizowanie...
										</>
									) : (
										'Zapisz zmiany'
									)}
								</button>
							</form>
						)}
					</div>
				) : (
					<div className='text-center py-3'>
						<p className='mb-4'>
							Dodaj książkę do swojej biblioteki i śledź postęp czytania!
						</p>
						<div className='d-grid gap-2'>
							{isAuthenticated ? (
								<>
									<button
										className='btn btn-primary'
										onClick={() => handleAddToTracking('not_started')}
										disabled={isProcessing}
									>
										<i className='fas fa-bookmark me-2'></i>
										Chcę przeczytać
									</button>
									<button
										className='btn btn-success'
										onClick={() => handleAddToTracking('in_progress')}
										disabled={isProcessing}
									>
										<i className='fas fa-book-reader me-2'></i>
										Czytam teraz
									</button>
									<button
										className='btn btn-info text-white'
										onClick={() => handleAddToTracking('completed')}
										disabled={isProcessing}
									>
										<i className='fas fa-check-circle me-2'></i>
										Już przeczytałem
									</button>
								</>
							) : (
								<button
									className='btn btn-primary'
									onClick={() =>
										navigate('/login', {
											state: { from: { pathname: `/book/${book.id}` } },
										})
									}
								>
									<i className='fas fa-sign-in-alt me-2'></i>
									Zaloguj się, aby śledzić czytanie
								</button>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default ReadingProgressTracker;
