// src/types/social.ts
import { User } from '@supabase/supabase-js';

export interface UserProfile {
	id: string;
	username: string;
	email: string;
	avatar_url: string | null;
	bio: string | null;
	created_at: string;
	updated_at: string;
	followers_count: number;
	following_count: number;
}

export interface FollowRelation {
	id: string;
	follower_id: string;
	following_id: string;
	created_at: string;
	// Relacje
	follower_details?: UserProfile;
	following_details?: UserProfile;
}

export interface ActivityItem {
	id: string;
	user_id: string;
	activity_type:
		| 'review'
		| 'favorite'
		| 'reading_list'
		| 'exchange_offer'
		| 'follow';
	book_id?: string;
	book_data?: any;
	related_id?: string; // ID powiązanych danych (np. ID recenzji)
	created_at: string;
	// Relacje
	user_details?: UserProfile;
}

export interface NotificationItem {
	id: string;
	user_id: string;
	sender_id: string;
	notification_type:
		| 'follow'
		| 'like'
		| 'comment'
		| 'exchange_request'
		| 'exchange_status';
	related_id?: string; // ID powiązanych danych
	message: string;
	read: boolean;
	created_at: string;
	// Relacje
	sender_details?: UserProfile;
}
