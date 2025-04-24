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
				// Wyszukiwanie książek o tematyce fantasy jako przykład popularnych książek
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
				} else {
					// Jeśli nie ma wyników, ustawiamy przykładowe dane
					console.log('Brak wyników z API, używam przykładowych danych');
					setBooks(getSampleBooks());
				}
			} catch (error) {
				console.error('Błąd podczas pobierania popularnych książek:', error);
				setError(
					'Nie udało się załadować książek. Wyświetlamy przykładowe dane.'
				);
				// W przypadku błędu, również wyświetlamy przykładowe dane
				setBooks(getSampleBooks());
			} finally {
				setIsLoading(false);
			}
		};

		fetchPopularBooks();
	}, []);

	// Funkcja zwracająca przykładowe dane książek na wypadek problemów z API
	const getSampleBooks = (): Book[] => {
		return [
			{
				id: 'sample1',
				title: 'Hobbit',
				authors: ['J.R.R. Tolkien'],
				description:
					'Opowieść o niespodziewanej podróży Bilbo Bagginsa. Hobbit to istota większa od liliputa, mniejsza jednak od karła. Hobbici nie noszą butów, bo ich stopy pokrywa gruba warstwa włosków, podobnych do tych, które rosną im na głowie, zawsze kędzierzawych.',
				publishedDate: '1937',
				imageLinks: {
					thumbnail: 'https://covers.openlibrary.org/b/id/8406786-M.jpg',
				},
			},
			{
				id: 'sample2',
				title: 'Harry Potter i Kamień Filozoficzny',
				authors: ['J.K. Rowling'],
				description:
					"Pierwszy tom przygód młodego czarodzieja Harry'ego Pottera. W dniu jedenastych urodzin Harry dowiaduje się, że jest czarodziejem i zostaje przyjęty do Szkoły Magii i Czarodziejstwa w Hogwarcie.",
				publishedDate: '1997',
				imageLinks: {
					thumbnail: 'https://covers.openlibrary.org/b/id/12000553-M.jpg',
				},
			},
			{
				id: 'sample3',
				title: 'Duma i uprzedzenie',
				authors: ['Jane Austen'],
				description:
					'Klasyczna powieść o miłości i społeczeństwie. Opowiada historię Elizabeth Bennet, która musi poradzić sobie z kwestiami moralności, wychowania, uprzedzeń i znaleźć miłość pomimo dumy.',
				publishedDate: '1813',
				imageLinks: {
					thumbnail: 'https://covers.openlibrary.org/b/id/12645114-M.jpg',
				},
			},
			{
				id: 'sample4',
				title: 'Zbrodnia i kara',
				authors: ['Fiodor Dostojewski'],
				description:
					'Powieść psychologiczna o zbrodni i jej konsekwencjach. Główny bohater, Rodion Raskolnikow, to były student prawa, który popełnia morderstwo, a następnie musi zmierzyć się z własnymi wyrzutami sumienia.',
				publishedDate: '1866',
				imageLinks: {
					thumbnail: 'https://covers.openlibrary.org/b/id/8406040-M.jpg',
				},
			},
		];
	};

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
