import { Book } from '../types/book';
import BookCard from './BookCard';

interface BookListProps {
	books: Book[];
	isLoading?: boolean;
	emptyMessage?: string;
}

const BookList: React.FC<BookListProps> = ({
	books,
	isLoading = false,
	emptyMessage = 'Brak książek do wyświetlenia',
}) => {
	if (isLoading) {
		return (
			<div className='text-center py-5'>
				<div className='spinner-border text-primary' role='status'>
					<span className='visually-hidden'>Ładowanie...</span>
				</div>
				<p className='mt-3'>Ładowanie książek...</p>
			</div>
		);
	}

	if (books.length === 0) {
		return (
			<div className='card text-center bg-light p-5'>
				<i className='fas fa-book-open fa-3x text-muted'></i>
				<p className='h4 text-muted mt-4'>{emptyMessage}</p>
			</div>
		);
	}

	return (
		<div className='container'>
			<div className='row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4'>
				{books.map((book) => (
					<div key={book.id} className='col'>
						<BookCard book={book} />
					</div>
				))}
			</div>
		</div>
	);
};

export default BookList;
