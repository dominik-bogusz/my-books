import { Link } from 'react-router-dom';
import { Book } from '../types/book';
import BookActions from './BookActions';

interface BookCardProps {
	book: Book;
}

const BookCard: React.FC<BookCardProps> = ({ book }) => {
	const defaultCover = 'https://placehold.co/128x192/e0e0e0/gray?text=No+Cover';

	const truncateDescription = (text?: string, length: number = 150) => {
		if (!text) return '';
		if (text.length <= length) return text;
		return text.substring(0, length) + '...';
	};

	return (
		<div className='card h-100 shadow-sm'>
			<div className='text-center pt-3 position-relative'>
				<img
					src={book.imageLinks?.thumbnail || defaultCover}
					alt={book.title}
					className='img-fluid rounded'
					style={{ height: '200px', objectFit: 'contain' }}
				/>
				<div className='position-absolute top-0 end-0 m-2'>
					<BookActions book={book} size='sm' />
				</div>
			</div>
			<div className='card-body d-flex flex-column text-center'>
				<h5 className='card-title text-truncate'>{book.title}</h5>
				<p className='card-subtitle mb-2 text-muted text-truncate'>
					{book.authors ? book.authors.join(', ') : 'Nieznany autor'}
				</p>

				{book.publishedDate && (
					<span className='badge bg-light text-dark mb-2'>
						{book.publishedDate.substring(0, 4)}
					</span>
				)}

				{book.description && (
					<p
						className='card-text flex-grow-1'
						style={{
							display: '-webkit-box',
							WebkitLineClamp: 3,
							WebkitBoxOrient: 'vertical',
							overflow: 'hidden',
						}}
					>
						{truncateDescription(book.description)}
					</p>
				)}

				<div className='mt-auto'>
					<Link
						to={`/book/${book.id}`}
						className='btn w-100'
						style={{ background: '#FCD7C1' }}
					>
						<span className='fw-semibold'>Szczegóły</span>
					</Link>
				</div>
			</div>
		</div>
	);
};

export default BookCard;
