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
	book_data?: string;
	related_id?: string;
	created_at: string;
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
	related_id?: string;
	message: string;
	read: boolean;
	created_at: string;
	sender_details?: UserProfile;
}
