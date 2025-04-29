import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import BookList from '../components/BookList';
import { useSearch } from '../context/SearchContext';

const Search = () => {
	const location = useLocation();
	const queryParams = new URLSearchParams(location.search);
	const query = queryParams.get('q') || '';

	const {
		books,
		isLoading,
		error,
		totalResults,
		search,
		currentQuery,
		currentPage,
		setCurrentPage,
	} = useSearch();

	const resultsPerPage = 20;

	useEffect(() => {
		if (query && query !== currentQuery) {
			setCurrentPage(1);
			search(query, 0);
		} else if (query && books.length === 0) {
			search(query, (currentPage - 1) * resultsPerPage);
		}
	}, [query, search, currentQuery, books.length, currentPage, setCurrentPage]);

	const handleNextPage = () => {
		if (currentPage * resultsPerPage < totalResults) {
			const nextPage = currentPage + 1;
			setCurrentPage(nextPage);
			search(currentQuery, (nextPage - 1) * resultsPerPage);
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
			search(currentQuery, (prevPage - 1) * resultsPerPage);

			window.scrollTo({
				top: 0,
				behavior: 'smooth',
			});
		}
	};

	const displayQuery = currentQuery || query;

	return (
		<div className='container py-4'>
			<div className='d-flex justify-content-between align-items-center mb-4'>
				<h3>
					Wyniki wyszukiwania dla:{' '}
					<span className='text-primary'>"{displayQuery}"</span>
				</h3>
			</div>

			{error && (
				<div className='alert alert-warning mb-4' role='alert'>
					<i className='fas fa-exclamation-triangle me-2'></i>
					{error}
				</div>
			)}

			<BookList
				books={books}
				isLoading={isLoading}
				emptyMessage={`Brak wyników dla "${displayQuery}". Spróbuj innego zapytania.`}
			/>

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
