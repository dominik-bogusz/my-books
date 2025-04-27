// src/types/reading.ts
import { Book } from './book';

export type ReadingStatus =
	| 'not_started'
	| 'in_progress'
	| 'completed'
	| 'abandoned';

export interface ReadingProgress {
	id: string;
	user_id: string;
	book_id: string;
	book_data: Book;
	status: ReadingStatus;
	progress_percentage: number; // 0-100
	current_page?: number;
	start_date?: string;
	end_date?: string;
	time_spent_minutes?: number;
	created_at: string;
	updated_at: string;
	notes?: string;
}

export interface ReadingGoal {
	id: string;
	user_id: string;
	year: number;
	goal_books: number;
	goal_pages?: number;
	books_read: number;
	pages_read: number;
	created_at: string;
	updated_at: string;
}

export interface ReadingStats {
	total_books_read: number;
	total_pages_read: number;
	total_books_abandoned: number;
	books_in_progress: number;
	average_completion_days: number;
	current_streak_days: number;
	longest_streak_days: number;
	favorite_genres: Array<{ genre: string; count: number }>;
	reading_by_month: Array<{ month: string; count: number }>;
	last_completed_books: ReadingProgress[];
}
