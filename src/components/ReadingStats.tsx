// src/components/ReadingStats.tsx
import React, { useEffect } from 'react';
import { ReadingStats as ReadingStatsType } from '../types/reading';
import useReadingProgress from '../hooks/useReadingProgress';

interface ReadingStatsProps {
	stats: ReadingStatsType | null;
	isLoading: boolean;
	error: string | null;
}

const ReadingStats: React.FC<ReadingStatsProps> = ({
	stats,
	isLoading,
	error,
}) => {
	// Dodajemy bezpośredni hook do pobierania danych - to rozwiąże problem w niezależnym widoku
	const {
		readingStats: localStats,
		isLoadingStats: localLoading,
		statsError: localError,
		fetchUserReadingStats,
	} = useReadingProgress();

	useEffect(() => {
		// Pobieramy dane gdy komponent jest inicjalizowany samodzielnie
		if (!stats && !isLoading) {
			fetchUserReadingStats();
		}
	}, [stats, isLoading, fetchUserReadingStats]);

	// Używamy przekazanych props lub danych lokalnych jeśli props są puste
	const displayStats = stats || localStats;
	const displayLoading = isLoading || localLoading;
	const displayError = error || localError;

	if (displayLoading) {
		return (
			<div className='text-center py-4'>
				<div className='spinner-border text-primary' role='status'>
					<span className='visually-hidden'>Ładowanie statystyk...</span>
				</div>
				<p className='mt-3'>Ładowanie statystyk czytelniczych...</p>
			</div>
		);
	}

	if (displayError) {
		return (
			<div className='alert alert-warning' role='alert'>
				<i className='fas fa-exclamation-triangle me-2'></i>
				{displayError}
			</div>
		);
	}

	if (!displayStats) {
		return (
			<div className='text-center py-4 bg-light rounded'>
				<i className='fas fa-chart-bar fa-3x text-muted mb-3'></i>
				<p className='text-muted'>Brak statystyk czytelniczych.</p>
			</div>
		);
	}

	// Formatowanie daty dla wykresu miesięcznego
	const formatMonthName = (monthStr: string) => {
		const [year, month] = monthStr.split('-');
		const date = new Date(parseInt(year), parseInt(month) - 1, 1);
		return date.toLocaleDateString('pl-PL', {
			month: 'short',
			year: 'numeric',
		});
	};

	// Obliczanie procentowego ukończenia celu rocznego
	const currentYear = new Date().getFullYear();
	const daysInYear =
		new Date(currentYear, 11, 31).getDate() +
		365 -
		new Date(currentYear, 11, 31).getDay();
	const dayOfYear =
		Math.floor(
			(new Date().getTime() - new Date(currentYear, 0, 1).getTime()) /
				(24 * 60 * 60 * 1000)
		) + 1;
	const yearProgress = (dayOfYear / daysInYear) * 100;

	return (
		<div className='reading-stats'>
			{/* Statystyki ogólne */}
			<div className='row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4 mb-4'>
				<div className='col'>
					<div className='card h-100'>
						<div className='card-body text-center'>
							<h5 className='card-title'>Przeczytane książki</h5>
							<p className='display-4'>{displayStats.total_books_read}</p>
						</div>
					</div>
				</div>
				<div className='col'>
					<div className='card h-100'>
						<div className='card-body text-center'>
							<h5 className='card-title'>Przeczytane strony</h5>
							<p className='display-4'>{displayStats.total_pages_read}</p>
						</div>
					</div>
				</div>
				<div className='col'>
					<div className='card h-100'>
						<div className='card-body text-center'>
							<h5 className='card-title'>W trakcie czytania</h5>
							<p className='display-4'>{displayStats.books_in_progress}</p>
						</div>
					</div>
				</div>
				<div className='col'>
					<div className='card h-100'>
						<div className='card-body text-center'>
							<h5 className='card-title'>Seria dni</h5>
							<p className='display-4'>{displayStats.current_streak_days}</p>
							<p className='text-muted'>
								Najdłuższa: {displayStats.longest_streak_days} dni
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Średni czas ukończenia książki */}
			<div className='card mb-4'>
				<div className='card-header'>
					<h5 className='mb-0'>Średni czas ukończenia książki</h5>
				</div>
				<div className='card-body'>
					<div className='d-flex align-items-center'>
						<div className='me-3'>
							<i className='fas fa-hourglass-half fa-3x text-primary'></i>
						</div>
						<div>
							<h2 className='mb-0'>
								{displayStats.average_completion_days} dni
							</h2>
							<p className='text-muted'>
								Średni czas potrzebny na przeczytanie książki
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Ulubione gatunki */}
			<div className='card mb-4'>
				<div className='card-header'>
					<h5 className='mb-0'>Ulubione gatunki</h5>
				</div>
				<div className='card-body'>
					{displayStats.favorite_genres.length > 0 ? (
						<div className='row'>
							<div className='col-md-8'>
								{displayStats.favorite_genres
									.slice(0, 5)
									.map((genre, index) => (
										<div key={index} className='mb-3'>
											<div className='d-flex justify-content-between mb-1'>
												<span>{genre.genre}</span>
												<span>{genre.count} książek</span>
											</div>
											<div className='progress' style={{ height: '10px' }}>
												<div
													className='progress-bar'
													role='progressbar'
													style={{
														width: `${
															(genre.count /
																displayStats.favorite_genres[0].count) *
															100
														}%`,
														background:
															'linear-gradient(90deg, #DA831C 0%, #FFD028 100%)',
													}}
													aria-valuenow={
														(genre.count /
															displayStats.favorite_genres[0].count) *
														100
													}
													aria-valuemin={0}
													aria-valuemax={100}
												></div>
											</div>
										</div>
									))}
							</div>
							<div className='col-md-4'>
								<div className='d-flex justify-content-center align-items-center h-100'>
									<div className='text-center'>
										<i
											className='fas fa-book-open fa-3x mb-3'
											style={{ color: '#DA831C' }}
										></i>
										<p className='mb-0'>
											Twój ulubiony gatunek to <br />
											<strong>
												{displayStats.favorite_genres[0]?.genre ||
													'Brak danych'}
											</strong>
										</p>
									</div>
								</div>
							</div>
						</div>
					) : (
						<p className='text-center text-muted'>
							Brak danych o ulubionych gatunkach.
						</p>
					)}
				</div>
			</div>

			{/* Aktywność czytelnicza w miesiącach */}
			<div className='card mb-4'>
				<div className='card-header'>
					<h5 className='mb-0'>Aktywność czytelnicza</h5>
				</div>
				<div className='card-body'>
					{displayStats.reading_by_month.length > 0 ? (
						<div className='chart-container' style={{ height: '300px' }}>
							{/* Wizualizacja danych aktywności czytelniczej */}
							<div className='d-flex align-items-end justify-content-between h-100'>
								{displayStats.reading_by_month
									.slice(-12)
									.map((month, index) => (
										<div
											key={index}
											className='d-flex flex-column align-items-center'
											style={{
												width: `${
													100 /
													Math.min(displayStats.reading_by_month.length, 12)
												}%`,
											}}
										>
											<div
												className='w-75'
												style={{
													height: `${
														(month.count /
															Math.max(
																...displayStats.reading_by_month.map(
																	(m) => m.count
																)
															)) *
														200
													}px`,
													background:
														'linear-gradient(180deg, #DA831C 0%, #FFD028 100%)',
													borderRadius: '4px 4px 0 0',
												}}
											></div>
											<div
												className='text-center mt-2'
												style={{ fontSize: '0.8rem' }}
											>
												<div>{month.count}</div>
												<div className='text-muted'>
													{formatMonthName(month.month)}
												</div>
											</div>
										</div>
									))}
							</div>
						</div>
					) : (
						<p className='text-center text-muted'>
							Brak danych o aktywności czytelniczej.
						</p>
					)}
				</div>
			</div>

			{/* Ostatnio ukończone książki */}
			<div className='card'>
				<div className='card-header'>
					<h5 className='mb-0'>Ostatnio ukończone książki</h5>
				</div>
				<div className='card-body'>
					{displayStats.last_completed_books &&
					displayStats.last_completed_books.length > 0 ? (
						<div className='list-group'>
							{displayStats.last_completed_books.map((book, index) => (
								<div
									key={index}
									className='list-group-item list-group-item-action d-flex align-items-center'
								>
									<div className='me-3'>
										{book.book_data.imageLinks?.thumbnail ? (
											<img
												src={book.book_data.imageLinks.thumbnail}
												alt={book.book_data.title}
												className='img-thumbnail'
												style={{
													width: '60px',
													height: '80px',
													objectFit: 'cover',
												}}
											/>
										) : (
											<div
												className='bg-light d-flex align-items-center justify-content-center'
												style={{ width: '60px', height: '80px' }}
											>
												<i className='fas fa-book text-muted'></i>
											</div>
										)}
									</div>
									<div className='flex-grow-1'>
										<h6 className='mb-1'>{book.book_data.title}</h6>
										<p className='text-muted small mb-0'>
											{book.book_data.authors
												? book.book_data.authors.join(', ')
												: 'Nieznany autor'}
										</p>
										<small className='text-success'>
											<i className='fas fa-check-circle me-1'></i>
											Ukończono:{' '}
											{new Date(book.end_date || '').toLocaleDateString(
												'pl-PL'
											)}
										</small>
									</div>
								</div>
							))}
						</div>
					) : (
						<p className='text-center text-muted'>
							Nie masz jeszcze ukończonych książek.
						</p>
					)}
				</div>
			</div>
		</div>
	);
};

export default ReadingStats;
