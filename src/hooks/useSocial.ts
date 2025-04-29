import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';
import {
	UserProfile,
	ActivityItem,
	NotificationItem,
} from '../types/social';

interface UseSocialReturn {
	followers: UserProfile[];
	following: UserProfile[];
	isLoadingFollowers: boolean;
	isLoadingFollowing: boolean;
	followersError: string | null;
	followingError: string | null;

	userActivity: ActivityItem[];
	followingActivity: ActivityItem[];
	isLoadingActivity: boolean;
	activityError: string | null;

	notifications: NotificationItem[];
	unreadNotificationsCount: number;
	isLoadingNotifications: boolean;
	notificationsError: string | null;

	followUser: (userId: string) => Promise<boolean>;
	unfollowUser: (userId: string) => Promise<boolean>;
	isFollowing: (userId: string) => boolean;
	markNotificationAsRead: (notificationId: string) => Promise<boolean>;
	markAllNotificationsAsRead: () => Promise<boolean>;

	fetchUserProfile: (userId: string) => Promise<UserProfile | null>;
	fetchUserFollowers: (userId: string) => Promise<void>;
	fetchUserFollowing: (userId: string) => Promise<void>;
	fetchUserActivity: (userId: string) => Promise<void>;
	fetchFollowingActivity: () => Promise<void>;
}

export const useSocial = (): UseSocialReturn => {
	const { user, isAuthenticated } = useAuth();

	const [followers, setFollowers] = useState<UserProfile[]>([]);
	const [following, setFollowing] = useState<UserProfile[]>([]);
	const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
	const [isLoadingFollowing, setIsLoadingFollowing] = useState(false);
	const [followersError, setFollowersError] = useState<string | null>(null);
	const [followingError, setFollowingError] = useState<string | null>(null);
	const [userActivity, setUserActivity] = useState<ActivityItem[]>([]);
	const [followingActivity, setFollowingActivity] = useState<ActivityItem[]>(
		[]
	);
	const [isLoadingActivity, setIsLoadingActivity] = useState(false);
	const [activityError, setActivityError] = useState<string | null>(null);
	const [notifications, setNotifications] = useState<NotificationItem[]>([]);
	const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
	const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
	const [notificationsError, setNotificationsError] = useState<string | null>(
		null
	);

	const fetchUserProfile = useCallback(
		async (userId: string): Promise<UserProfile | null> => {
			try {
				const { data, error } = await supabase
					.from('profiles')
					.select('*')
					.eq('id', userId)
					.single();

				if (error) throw error;

				if (data) {
					const profileData: UserProfile = {
						id: data.id,
						username: data.username,
						email: data.email,
						avatar_url: data.avatar_url,
						bio: data.bio || null,
						created_at: data.created_at,
						updated_at: data.updated_at,
						followers_count: data.followers_count || 0,
						following_count: data.following_count || 0,
					};

					return profileData;
				}

				return null;
			} catch (error) {
				console.error('Błąd podczas pobierania profilu użytkownika:', error);
				return null;
			}
		},
		[]
	);

	const fetchUserFollowers = useCallback(async (userId: string) => {
		if (!userId) return;

		setIsLoadingFollowers(true);
		setFollowersError(null);

		try {
			const { data, error } = await supabase
				.from('follows')
				.select(
					`
          *,
          follower_details:profiles!follower_id(*)
        `
				)
				.eq('following_id', userId);

			if (error) throw error;

			if (data) {
				const followersList = data.map(
					(item) => item.follower_details
				) as UserProfile[];
				setFollowers(followersList);
			}
		} catch (error) {
			console.error('Błąd podczas pobierania obserwujących:', error);
			setFollowersError('Nie udało się pobrać listy obserwujących.');
		} finally {
			setIsLoadingFollowers(false);
		}
	}, []);

	const fetchUserFollowing = useCallback(async (userId: string) => {
		if (!userId) return;

		setIsLoadingFollowing(true);
		setFollowingError(null);

		try {
			const { data, error } = await supabase
				.from('follows')
				.select(
					`
          *,
          following_details:profiles!following_id(*)
        `
				)
				.eq('follower_id', userId);

			if (error) throw error;

			if (data) {
				const followingList = data.map(
					(item) => item.following_details
				) as UserProfile[];
				setFollowing(followingList);
			}
		} catch (error) {
			console.error('Błąd podczas pobierania obserwowanych:', error);
			setFollowingError('Nie udało się pobrać listy obserwowanych.');
		} finally {
			setIsLoadingFollowing(false);
		}
	}, []);

	const isFollowing = useCallback(
		(userId: string): boolean => {
			return following.some((profile) => profile.id === userId);
		},
		[following]
	);

	const followUser = useCallback(
		async (userId: string): Promise<boolean> => {
			if (!isAuthenticated || !user) {
				setFollowingError(
					'Musisz być zalogowany, aby obserwować użytkowników.'
				);
				return false;
			}

			if (user.id === userId) {
				setFollowingError('Nie możesz obserwować samego siebie.');
				return false;
			}

			if (isFollowing(userId)) {
				return true;
			}

			try {
				const { error } = await supabase.from('follows').insert({
					follower_id: user.id,
					following_id: userId,
				});

				if (error) throw error;

				await supabase.rpc('increment_followers_count', { user_id: userId });
				await supabase.rpc('increment_following_count', { user_id: user.id });

				await supabase.from('notifications').insert({
					user_id: userId,
					sender_id: user.id,
					notification_type: 'follow',
					message: 'zaczął Cię obserwować',
					read: false,
				});

				await supabase.from('activities').insert({
					user_id: user.id,
					activity_type: 'follow',
					related_id: userId,
				});

				const userProfile = await fetchUserProfile(userId);
				if (userProfile) {
					setFollowing((prev) => [...prev, userProfile]);
				}

				return true;
			} catch (error) {
				console.error('Błąd podczas obserwowania użytkownika:', error);
				setFollowingError('Nie udało się obserwować użytkownika.');
				return false;
			}
		},
		[isAuthenticated, user, isFollowing, fetchUserProfile]
	);

	const unfollowUser = useCallback(
		async (userId: string): Promise<boolean> => {
			if (!isAuthenticated || !user) {
				setFollowingError(
					'Musisz być zalogowany, aby przestać obserwować użytkowników.'
				);
				return false;
			}

			try {
				const { error } = await supabase
					.from('follows')
					.delete()
					.match({ follower_id: user.id, following_id: userId });

				if (error) throw error;

				await supabase.rpc('decrement_followers_count', { user_id: userId });
				await supabase.rpc('decrement_following_count', { user_id: user.id });

				setFollowing((prev) => prev.filter((profile) => profile.id !== userId));

				return true;
			} catch (error) {
				console.error(
					'Błąd podczas zaprzestawania obserwowania użytkownika:',
					error
				);
				setFollowingError('Nie udało się przestać obserwować użytkownika.');
				return false;
			}
		},
		[isAuthenticated, user]
	);

	const fetchUserActivity = useCallback(async (userId: string) => {
		if (!userId) return;

		setIsLoadingActivity(true);
		setActivityError(null);

		try {
			const { data, error } = await supabase
				.from('activities')
				.select(
					`
          *,
          user_details:profiles(*)
        `
				)
				.eq('user_id', userId)
				.order('created_at', { ascending: false })
				.limit(20);

			if (error) throw error;

			if (data) {
				setUserActivity(data as ActivityItem[]);
			}
		} catch (error) {
			console.error('Błąd podczas pobierania aktywności użytkownika:', error);
			setActivityError('Nie udało się pobrać aktywności użytkownika.');
		} finally {
			setIsLoadingActivity(false);
		}
	}, []);

	const fetchFollowingActivity = useCallback(async () => {
		if (!isAuthenticated || !user) return;

		setIsLoadingActivity(true);
		setActivityError(null);

		try {
			const { data: followingData, error: followingError } = await supabase
				.from('follows')
				.select('following_id')
				.eq('follower_id', user.id);

			if (followingError) throw followingError;

			if (followingData && followingData.length > 0) {
				const followingIds = followingData.map((f) => f.following_id);

				const { data, error } = await supabase
					.from('activities')
					.select(
						`
            *,
            user_details:profiles(*)
          `
					)
					.in('user_id', followingIds)
					.order('created_at', { ascending: false })
					.limit(50);

				if (error) throw error;

				if (data) {
					setFollowingActivity(data as ActivityItem[]);
				}
			} else {
				setFollowingActivity([]);
			}
		} catch (error) {
			console.error('Błąd podczas pobierania aktywności obserwowanych:', error);
			setActivityError(
				'Nie udało się pobrać aktywności obserwowanych użytkowników.'
			);
		} finally {
			setIsLoadingActivity(false);
		}
	}, [isAuthenticated, user]);

	const fetchNotifications = useCallback(async () => {
		if (!isAuthenticated || !user) return;

		setIsLoadingNotifications(true);
		setNotificationsError(null);

		try {
			const { data, error } = await supabase
				.from('notifications')
				.select(
					`
          *,
          sender_details:profiles!sender_id(*)
        `
				)
				.eq('user_id', user.id)
				.order('created_at', { ascending: false });

			if (error) throw error;

			if (data) {
				setNotifications(data as NotificationItem[]);

				setUnreadNotificationsCount(data.filter((n) => !n.read).length);
			}
		} catch (error) {
			console.error('Błąd podczas pobierania powiadomień:', error);
			setNotificationsError('Nie udało się pobrać powiadomień.');
		} finally {
			setIsLoadingNotifications(false);
		}
	}, [isAuthenticated, user]);

	const markNotificationAsRead = useCallback(
		async (notificationId: string): Promise<boolean> => {
			if (!isAuthenticated || !user) {
				setNotificationsError(
					'Musisz być zalogowany, aby zarządzać powiadomieniami.'
				);
				return false;
			}

			try {
				const { error } = await supabase
					.from('notifications')
					.update({ read: true })
					.eq('id', notificationId)
					.eq('user_id', user.id);

				if (error) throw error;

				setNotifications((prev) =>
					prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
				);

				setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));

				return true;
			} catch (error) {
				console.error(
					'Błąd podczas oznaczania powiadomienia jako przeczytane:',
					error
				);
				return false;
			}
		},
		[isAuthenticated, user]
	);

	const markAllNotificationsAsRead = useCallback(async (): Promise<boolean> => {
		if (!isAuthenticated || !user) {
			setNotificationsError(
				'Musisz być zalogowany, aby zarządzać powiadomieniami.'
			);
			return false;
		}

		try {
			const { error } = await supabase
				.from('notifications')
				.update({ read: true })
				.eq('user_id', user.id)
				.eq('read', false);

			if (error) throw error;

			setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
			setUnreadNotificationsCount(0);

			return true;
		} catch (error) {
			console.error(
				'Błąd podczas oznaczania wszystkich powiadomień jako przeczytane:',
				error
			);
			return false;
		}
	}, [isAuthenticated, user]);

	useEffect(() => {
		if (isAuthenticated && user) {
			fetchUserFollowers(user.id);
			fetchUserFollowing(user.id);
			fetchNotifications();
		}
	}, [
		isAuthenticated,
		user,
		fetchUserFollowers,
		fetchUserFollowing,
		fetchNotifications,
	]);

	return {
		followers,
		following,
		isLoadingFollowers,
		isLoadingFollowing,
		followersError,
		followingError,
		userActivity,
		followingActivity,
		isLoadingActivity,
		activityError,
		notifications,
		unreadNotificationsCount,
		isLoadingNotifications,
		notificationsError,
		followUser,
		unfollowUser,
		isFollowing,
		markNotificationAsRead,
		markAllNotificationsAsRead,
		fetchUserProfile,
		fetchUserFollowers,
		fetchUserFollowing,
		fetchUserActivity,
		fetchFollowingActivity,
	};
};

export default useSocial;
