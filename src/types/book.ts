// src/types/book.ts
export interface Book {
	id: string;
	title: string;
	authors?: string[];
	description?: string;
	publishedDate?: string;
	pageCount?: number;
	categories?: string[];
	imageLinks?: {
		thumbnail?: string;
		smallThumbnail?: string;
	};
	language?: string;
	averageRating?: number;
	publisher?: string;
}

export interface GoogleBookResponse {
	items: {
		id: string;
		volumeInfo: {
			title: string;
			authors?: string[];
			description?: string;
			publishedDate?: string;
			pageCount?: number;
			categories?: string[];
			imageLinks?: {
				thumbnail?: string;
				smallThumbnail?: string;
			};
			language?: string;
			averageRating?: number;
			publisher?: string;
		};
	}[];
	totalItems: number;
}

// Nowe typy dla recenzji
export interface BookReview {
	id: string;
	user_id: string;
	book_id: string;
	rating: number;
	review_text: string | null;
	book_data: Book;
	created_at: string;
	updated_at: string;
	// Dodatkowe pola z relacji
	user_details?: {
		username: string;
		avatar_url: string | null;
	};
}

// Typ stanowiący agregację recenzji dla książki
export interface BookRatingSummary {
	averageRating: number;
	totalReviews: number;
	ratingDistribution: {
		1: number;
		2: number;
		3: number;
		4: number;
		5: number;
	};
}

// Typy dla systemu wymiany książek
export type BookCondition =
	| 'nowa'
	| 'bardzo dobry'
	| 'dobry'
	| 'średni'
	| 'wymaga naprawy';
export type ExchangeType = 'wymiana' | 'wypożyczenie' | 'oddanie';
export type TransactionStatus =
	| 'oczekująca'
	| 'zaakceptowana'
	| 'odrzucona'
	| 'zakończona'
	| 'anulowana';

export interface ExchangeOffer {
	id: string;
	user_id: string;
	book_id: string;
	book_data: Book;
	condition: BookCondition;
	description: string | null;
	exchange_type: ExchangeType;
	location: string | null;
	active: boolean;
	created_at: string;
	updated_at: string;
	// Dodatkowe pola z relacji
	user_details?: {
		username: string;
		avatar_url: string | null;
	};
}

export interface ExchangeMessage {
	id: string;
	exchange_offer_id: string;
	sender_id: string;
	recipient_id: string;
	message: string;
	read: boolean;
	created_at: string;
	// Dodatkowe pola z relacji
	sender_details?: {
		username: string;
		avatar_url: string | null;
	};
}

export interface ExchangeTransaction {
	id: string;
	exchange_offer_id: string;
	requester_id: string;
	owner_id: string;
	status: TransactionStatus;
	transaction_type: ExchangeType;
	created_at: string;
	updated_at: string;
	completed_at: string | null;
	// Dodatkowe pola z relacji
	offer_details?: ExchangeOffer;
	requester_details?: {
		username: string;
		avatar_url: string | null;
	};
	owner_details?: {
		username: string;
		avatar_url: string | null;
	};
}
