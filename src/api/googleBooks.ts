import axios from 'axios';
import { GoogleBookResponse } from '../types/book';

const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

// Properly access environment variable
const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || '';

export const searchBooks = async (
	query: string,
	maxResults: number = 20,
	startIndex: number = 0,
	language: string = ''
): Promise<GoogleBookResponse> => {
	try {
		let url = `${BASE_URL}?q=${encodeURIComponent(
			query
		)}&maxResults=${maxResults}&startIndex=${startIndex}`;

		if (language) {
			url += `&langRestrict=${language}`;
		}

		// Only add API key if it exists
		if (API_KEY) {
			url += `&key=${API_KEY}`;
		} else {
			console.warn('API key not found. Some features may be limited.');
		}

		const response = await axios.get(url);

		if (!response.data.items) {
			console.log('No results from API');
			return { items: [], totalItems: 0 };
		}

		return {
			items: response.data.items || [],
			totalItems: response.data.totalItems || 0,
		};
	} catch (error) {
		console.error('Error searching books:', error);
		return { items: [], totalItems: 0 };
	}
};

export const getBookById = async (bookId: string) => {
	try {
		let url = `${BASE_URL}/${bookId}`;

		// Only add API key if it exists
		if (API_KEY) {
			url += `?key=${API_KEY}`;
		} else {
			console.warn('API key not found. Some features may be limited.');
		}

		const response = await axios.get(url);
		return response.data;
	} catch (error) {
		console.error('Error fetching book details:', error);
		throw new Error('Could not fetch book details');
	}
};
