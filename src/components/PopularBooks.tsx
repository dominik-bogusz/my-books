import { useEffect, useState } from 'react';
import { searchBooks } from '../api/googleBooks';
import { Book } from '../types/book';
import BookList from './BookList';

const PopularBooks: React.FC = () => {
	const [books, setBooks] = useState<Book[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchPopularBooks = async () => {
			setIsLoading(true);
			setError(null);
			try {
				const response = await searchBooks('fantasy', 8);

				if (response.items && response.items.length > 0) {
					const formattedBooks: Book[] = response.items.map((item) => ({
						id: item.id,
						title: item.volumeInfo.title,
						authors: item.volumeInfo.authors,
						description: item.volumeInfo.description,
						publishedDate: item.volumeInfo.publishedDate,
						imageLinks: item.volumeInfo.imageLinks,
						publisher: item.volumeInfo.publisher,
					}));
					setBooks(formattedBooks);
				}
			} catch (error) {
				console.error('Błąd podczas pobierania książek:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchPopularBooks();
	}, []);

	return (
		<div className='container'>
			<div className='text-center mb-5'>
				<h2 className='mb-3'>Odkryj popularne książki</h2>
				<hr className='w-50 mx-auto mb-4' />
			</div>

			{error && (
				<div className='alert alert-warning text-center mb-4' role='alert'>
					<i className='fas fa-exclamation-triangle me-2'></i>
					{error}
				</div>
			)}

			<BookList
				books={books}
				isLoading={isLoading}
				emptyMessage='Nie można załadować popularnych książek.'
			/>
		</div>
	);
};

export default PopularBooks;
