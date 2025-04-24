import axios from 'axios';
import { GoogleBookResponse } from '../types/book';

const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || '';

export const searchBooks = async (
	query: string,
	maxResults: number = 20,
	startIndex: number = 0,
	language: string = ''
): Promise<GoogleBookResponse> => {
	try {
		if (!query.trim()) {
			return { items: [], totalItems: 0 };
		}

		let url = `${BASE_URL}?q=${encodeURIComponent(
			query
		)}&maxResults=${maxResults}&startIndex=${startIndex}`;

		if (language) {
			url += `&langRestrict=${language}`;
		}

		if (API_KEY) url += `&key=${API_KEY}`;

		const response = await axios.get(url);

		if (!response.data.items) {
			console.log('Brak wyników z API dla zapytania:', query);
			return { items: [], totalItems: 0 };
		}

		return {
			items: response.data.items || [],
			totalItems: response.data.totalItems || 0,
		};
	} catch (error) {
		console.error('Błąd podczas wyszukiwania książek:', error);

		throw new Error(
			'Wystąpił błąd podczas wyszukiwania książek. Spróbuj ponownie później.'
		);
	}
};

export const getBookById = async (bookId: string) => {
	try {
		if (!bookId.trim()) {
			throw new Error('Nie podano identyfikatora książki');
		}

		let url = `${BASE_URL}/${bookId}`;

		if (API_KEY) {
			url += `?key=${API_KEY}`;
		} else {
			console.warn(
				'Nie znaleziono klucza API. Niektóre funkcje mogą być ograniczone.'
			);
		}

		const response = await axios.get(url);
		return response.data;
	} catch (error) {
		console.error('Błąd podczas pobierania szczegółów książki:', error);

		if (axios.isAxiosError(error)) {
			if (error.response?.status === 404) {
				throw new Error('Nie znaleziono książki o podanym identyfikatorze.');
			} else if (error.response?.status === 429) {
				throw new Error(
					'Przekroczono limit zapytań do API. Spróbuj ponownie później.'
				);
			} else if (error.code === 'ECONNABORTED') {
				throw new Error(
					'Upłynął limit czasu zapytania. Sprawdź swoje połączenie z internetem.'
				);
			}
		}

		throw new Error(
			'Nie udało się pobrać szczegółów książki. Spróbuj ponownie później.'
		);
	}
};
