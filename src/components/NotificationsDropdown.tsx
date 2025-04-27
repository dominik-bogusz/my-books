import React, { useState, useEffect, useRef } from 'react';
import useSocial from '../hooks/useSocial';
import { NotificationItem } from '../types/social';

const NotificationsDropdown: React.FC = () => {
	const {
		notifications,
		unreadNotificationsCount,
		isLoadingNotifications,
		notificationsError,
		markNotificationAsRead,
		markAllNotificationsAsRead,
	} = useSocial();

	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Zamykanie dropdowna po kliknięciu poza nim
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

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

	// Renderowanie ikony odpowiednio do typu powiadomienia
	const renderNotificationIcon = (notificationType: string) => {
		switch (notificationType) {
			case 'follow':
				return <i className='fas fa-user-plus text-info'></i>;
			case 'like':
				return <i className='fas fa-heart text-danger'></i>;
			case 'comment':
				return <i className='fas fa-comment text-primary'></i>;
			case 'exchange_request':
				return <i className='fas fa-exchange-alt text-success'></i>;
			case 'exchange_status':
				return <i className='fas fa-handshake text-warning'></i>;
			default:
				return <i className='fas fa-bell text-secondary'></i>;
		}
	};

	// Funkcja do oznaczania powiadomienia jako przeczytane
	const handleNotificationClick = async (notification: NotificationItem) => {
		if (!notification.read) {
			await markNotificationAsRead(notification.id);
		}
	};

	// Funkcja do oznaczania wszystkich powiadomień jako przeczytane
	const handleMarkAllAsRead = async () => {
		await markAllNotificationsAsRead();
	};

	return (
		<div className='dropdown' ref={dropdownRef}>
			<button
				className='btn btn-link position-relative'
				onClick={() => setIsOpen(!isOpen)}
				aria-expanded={isOpen}
			>
				<i className='fas fa-bell fs-5'></i>
				{unreadNotificationsCount > 0 && (
					<span className='position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger'>
						{unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
						<span className='visually-hidden'>
							nieprzeczytane powiadomienia
						</span>
					</span>
				)}
			</button>

			<div
				className={`dropdown-menu dropdown-menu-end p-0 ${
					isOpen ? 'show' : ''
				}`}
				style={{ width: '350px', maxHeight: '500px', overflow: 'auto' }}
			>
				<div className='p-3 border-bottom d-flex justify-content-between align-items-center'>
					<h6 className='mb-0'>Powiadomienia</h6>
					{unreadNotificationsCount > 0 && (
						<button
							className='btn btn-sm btn-link text-decoration-none'
							onClick={handleMarkAllAsRead}
						>
							Oznacz wszystkie jako przeczytane
						</button>
					)}
				</div>

				{isLoadingNotifications ? (
					<div className='text-center py-4'>
						<div
							className='spinner-border spinner-border-sm text-primary'
							role='status'
						>
							<span className='visually-hidden'>Ładowanie powiadomień...</span>
						</div>
					</div>
				) : notificationsError ? (
					<div className='p-3 text-danger small'>
						<i className='fas fa-exclamation-circle me-2'></i>
						{notificationsError}
					</div>
				) : notifications.length === 0 ? (
					<div className='p-4 text-center text-muted'>
						<i className='fas fa-bell-slash fa-2x mb-3'></i>
						<p>Brak powiadomień</p>
					</div>
				) : (
					<ul className='list-group list-group-flush'>
						{notifications.map((notification) => (
							<li
								key={notification.id}
								className={`list-group-item list-group-item-action ${
									!notification.read ? 'bg-light' : ''
								}`}
								onClick={() => handleNotificationClick(notification)}
							>
								<div className='d-flex'>
									<div className='me-3'>
										{notification.sender_details?.avatar_url ? (
											<img
												src={notification.sender_details.avatar_url}
												alt={notification.sender_details.username || 'User'}
												className='rounded-circle'
												width='40'
												height='40'
											/>
										) : (
											<div
												className='rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center'
												style={{ width: '40px', height: '40px' }}
											>
												<span>
													{notification.sender_details?.username?.[0]?.toUpperCase() ||
														'U'}
												</span>
											</div>
										)}
									</div>
									<div className='flex-grow-1'>
										<div className='d-flex align-items-start mb-1'>
											<div className='me-2'>
												{renderNotificationIcon(notification.notification_type)}
											</div>
											<div>
												<span className='fw-bold'>
													{notification.sender_details?.username ||
														'Użytkownik'}
												</span>{' '}
												<span>{notification.message}</span>
											</div>
										</div>
										<small className='text-muted'>
											{formatDate(notification.created_at)}
										</small>
									</div>
									{!notification.read && (
										<div className='ms-2'>
											<span className='badge rounded-pill bg-primary'>
												Nowe
											</span>
										</div>
									)}
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
};

export default NotificationsDropdown;
