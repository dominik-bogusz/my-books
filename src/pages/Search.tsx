import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import useSearch from '../hooks/useSearch';
import BookList from '../components/BookList';

const Search = () => {
	const location = useLocation();
	const queryParams = new URLSearchParams(location.search);
	const query = queryParams.get('q') || '';

	const [searchTerm, setSearchTerm] = useState(query);
	const [currentPage, setCurrentPage] = useState(1);
	const [resultsPerPage] = useState(20);

	const { books, isLoading, error, totalResults, search } = useSearch();

	useEffect(() => {
		if (query) {
			// Reset to page 1 when query changes
			setCurrentPage(1);
			setSearchTerm(query);
			search(query, 0);
		}
	}, [query, search]);

	// Pagination handlers
	const handleNextPage = () => {
		if (currentPage * resultsPerPage < totalResults) {
			const nextPage = currentPage + 1;
			setCurrentPage(nextPage);
			search(searchTerm, (nextPage - 1) * resultsPerPage);

			// Scroll to top of results
			window.scrollTo({
				top: 0,
				behavior: 'smooth',
			});
		}
	};

	const handlePrevPage = () => {
		if (currentPage > 1) {
			const prevPage = currentPage - 1;
			setCurrentPage(prevPage);
			search(searchTerm, (prevPage - 1) * resultsPerPage);

			// Scroll to top of results
			window.scrollTo({
				top: 0,
				behavior: 'smooth',
			});
		}
	};

	return (
		<div className='container py-4'>
			<div className='d-flex justify-content-between align-items-center mb-4'>
				<h2>
					Wyniki wyszukiwania dla:{' '}
					<span className='text-primary'>"{searchTerm}"</span>
				</h2>

				{!error && books.length > 0 && (
					<span className='badge bg-primary fs-6'>
						<i className='fas fa-book me-1'></i>
						Znaleziono {totalResults} wyników
					</span>
				)}
			</div>

			{error && (
				<div className='alert alert-warning mb-4' role='alert'>
					<i className='fas fa-exclamation-triangle me-2'></i>
					{error}
				</div>
			)}

			{!error && books.length > 0 && !isLoading && (
				<p className='text-center text-muted mb-4'>
					Strona {currentPage} z {Math.ceil(totalResults / resultsPerPage)}
				</p>
			)}

			<BookList
				books={books}
				isLoading={isLoading}
				emptyMessage={`Brak wyników dla "${searchTerm}". Spróbuj innego zapytania.`}
			/>

			{/* Pagination */}
			{books.length > 0 && !isLoading && (
				<div className='d-flex justify-content-center mt-4 mb-3'>
					<div className='btn-group'>
						<button
							className='btn btn-outline-primary'
							onClick={handlePrevPage}
							disabled={currentPage === 1}
						>
							<i className='fas fa-chevron-left me-1'></i>
							Poprzednia
						</button>

						<button
							className='btn btn-outline-primary'
							onClick={handleNextPage}
							disabled={currentPage * resultsPerPage >= totalResults}
						>
							Następna
							<i className='fas fa-chevron-right ms-1'></i>
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default Search;
