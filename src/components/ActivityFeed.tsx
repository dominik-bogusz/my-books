// src/components/ActivityFeed.tsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ActivityItem } from '../types/social';
import useSocial from '../hooks/useSocial';

interface ActivityFeedProps {
	userId?: string; // Jeśli podane, pokazuje aktywność konkretnego użytkownika
	limit?: number;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ userId, limit = 10 }) => {
	const {
		userActivity,
		followingActivity,
		isLoadingActivity,
		activityError,
		fetchUserActivity,
		fetchFollowingActivity,
	} = useSocial();

	useEffect(() => {
		if (userId) {
			// Jeśli podano userId, pobieramy aktywność tego użytkownika
			fetchUserActivity(userId);
		} else {
			// W przeciwnym razie pobieramy aktywność obserwowanych
			fetchFollowingActivity();
		}
	}, [userId, fetchUserActivity, fetchFollowingActivity]);

	// Wybieramy odpowiednie dane do wyświetlenia
	const activitiesToShow = userId ? userActivity : followingActivity;

	// Ograniczamy liczbę wyświetlanych elementów
	const limitedActivities = activitiesToShow.slice(0, limit);

	// Formatowanie daty
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();

		// Różnica w minutach
		const diffMins = Math.floor(diffMs / (1000 * 60));

		if (diffMins < 1) return 'przed chwilą';
		if (diffMins < 60) return `${diffMins} min temu`;

		// Różnica w godzinach
		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `${diffHours} godz. temu`;

		// Różnica w dniach
		const diffDays = Math.floor(diffHours / 24);
		if (diffDays < 7) return `${diffDays} dni temu`;

		// Formatuj datę dla starszych wpisów
		return date.toLocaleDateString('pl-PL');
	};

	// Renderowanie ikony odpowiednio do typu aktywności
	const renderActivityIcon = (activityType: string) => {
		switch (activityType) {
			case 'review':
				return <i className='fas fa-star text-warning'></i>;
			case 'favorite':
				return <i className='fas fa-heart text-danger'></i>;
			case 'reading_list':
				return <i className='fas fa-book-reader text-primary'></i>;
			case 'exchange_offer':
				return <i className='fas fa-exchange-alt text-success'></i>;
			case 'follow':
				return <i className='fas fa-user-plus text-info'></i>;
			default:
				return <i className='fas fa-circle text-secondary'></i>;
		}
	};

	// Renderowanie treści aktywności
	const renderActivityContent = (activity: ActivityItem) => {
		const username = activity.user_details?.username || 'Użytkownik';

		switch (activity.activity_type) {
			case 'review':
				return (
					<>
						<span className='fw-bold'>{username}</span> dodał(a) recenzję
						książki{' '}
						{activity.book_data ? (
							<Link to={`/book/${activity.book_id}`}>
								{activity.book_data.title}
							</Link>
						) : (
							<span>Książka usunięta</span>
						)}
					</>
				);

			case 'favorite':
				return (
					<>
						<span className='fw-bold'>{username}</span> dodał(a) książkę do
						ulubionych{' '}
						{activity.book_data ? (
							<Link to={`/book/${activity.book_id}`}>
								{activity.book_data.title}
							</Link>
						) : (
							<span>Książka usunięta</span>
						)}
					</>
				);

			case 'reading_list':
				return (
					<>
						<span className='fw-bold'>{username}</span> dodał(a) książkę do
						listy "do przeczytania"{' '}
						{activity.book_data ? (
							<Link to={`/book/${activity.book_id}`}>
								{activity.book_data.title}
							</Link>
						) : (
							<span>Książka usunięta</span>
						)}
					</>
				);

			case 'exchange_offer':
				return (
					<>
						<span className='fw-bold'>{username}</span> dodał(a) ofertę wymiany
						książki{' '}
						{activity.book_data ? (
							<Link to={`/book/${activity.book_id}`}>
								{activity.book_data.title}
							</Link>
						) : (
							<span>Książka usunięta</span>
						)}
					</>
				);

			case 'follow':
				return (
					<>
						<span className='fw-bold'>{username}</span> zaczął(ęła) obserwować{' '}
						<Link to={`/user/${activity.related_id}`}>innego użytkownika</Link>
					</>
				);

			default:
				return <span className='fw-bold'>{username}</span>;
		}
	};

	if (isLoadingActivity) {
		return (
			<div className='text-center py-4'>
				<div className='spinner-border text-primary' role='status'>
					<span className='visually-hidden'>Ładowanie aktywności...</span>
				</div>
				<p className='mt-3'>Ładowanie aktywności...</p>
			</div>
		);
	}

	if (activityError) {
		return (
			<div className='alert alert-warning' role='alert'>
				<i className='fas fa-exclamation-triangle me-2'></i>
				{activityError}
			</div>
		);
	}

	if (limitedActivities.length === 0) {
		return (
			<div className='text-center py-4 bg-light rounded'>
				<i className='fas fa-rss fa-3x text-muted mb-3'></i>
				<p className='text-muted'>
					{userId
						? 'Ten użytkownik nie ma jeszcze żadnej aktywności.'
						: 'Brak aktywności. Zacznij obserwować innych użytkowników, aby zobaczyć ich aktywności.'}
				</p>
			</div>
		);
	}

	return (
		<div className='activity-feed'>
			<ul className='list-group'>
				{limitedActivities.map((activity) => (
					<li
						key={activity.id}
						className='list-group-item border-start-0 border-end-0'
					>
						<div className='d-flex align-items-start'>
							{/* Avatar użytkownika */}
							<div className='me-3'>
								{activity.user_details?.avatar_url ? (
									<img
										src={activity.user_details.avatar_url}
										alt={activity.user_details.username}
										className='rounded-circle'
										width='40'
										height='40'
									/>
								) : (
									<div
										className='rounded-circle bg-light d-flex align-items-center justify-content-center'
										style={{ width: '40px', height: '40px' }}
									>
										<span>
											{activity.user_details?.username?.[0]?.toUpperCase() ||
												'U'}
										</span>
									</div>
								)}
							</div>

							{/* Treść aktywności */}
							<div className='flex-grow-1'>
								<div className='mb-1 d-flex'>
									<div className='me-2'>
										{renderActivityIcon(activity.activity_type)}
									</div>
									<div>{renderActivityContent(activity)}</div>
								</div>
								<small className='text-muted'>
									{formatDate(activity.created_at)}
								</small>
							</div>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
};

export default ActivityFeed;
