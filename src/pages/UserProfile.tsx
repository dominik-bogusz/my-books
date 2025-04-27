// src/pages/UserProfile.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useSocial from '../hooks/useSocial';
import BookList from '../components/BookList';
import ActivityFeed from '../components/ActivityFeed';
import { Book } from '../types/book';
import supabase from '../lib/supabase';

const UserProfile: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const { user, isAuthenticated } = useAuth();
	const {
		followUser,
		unfollowUser,
		isFollowing,
		fetchUserProfile,
		followers,
		following,
		isLoadingFollowers,
		isLoadingFollowing,
		fetchUserFollowers,
		fetchUserFollowing,
	} = useSocial();

	const [profileData, setProfileData] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<
		'activity' | 'books' | 'followers' | 'following'
	>('activity');

	const [favoriteBooks, setFavoriteBooks] = useState<Book[]>([]);
	const [readingList, setReadingList] = useState<Book[]>([]);
	const [loadingBooks, setLoadingBooks] = useState(false);
	const [booksError, setBooksError] = useState<string | null>(null);

	// Pobieranie danych profilu
	useEffect(() => {
		const fetchProfile = async () => {
			if (!id) return;

			setIsLoading(true);
			setError(null);

			try {
				const profileData = await fetchUserProfile(id);

				if (profileData) {
					setProfileData(profileData);
					// Pobieranie obserwujących i obserwowanych
					fetchUserFollowers(id);
					fetchUserFollowing(id);
				} else {
					setError('Nie znaleziono użytkownika o podanym identyfikatorze.');
				}
			} catch (error) {
				console.error('Błąd podczas pobierania profilu:', error);
				setError('Wystąpił błąd podczas ładowania profilu użytkownika.');
			} finally {
				setIsLoading(false);
			}
		};

		fetchProfile();
	}, [id, fetchUserProfile, fetchUserFollowers, fetchUserFollowing]);

	// Pobieranie książek użytkownika
	useEffect(() => {
		const fetchUserBooks = async () => {
			if (!id) return;

			setLoadingBooks(true);
			setBooksError(null);

			try {
				// Pobieranie ulubionych książek
				const { data: favoritesData, error: favoritesError } = await supabase
					.from('favorites')
					.select('book_id, book_data')
					.eq('user_id', id);

				if (favoritesError) throw favoritesError;

				// Pobieranie listy do przeczytania
				const { data: readingData, error: readingError } = await supabase
					.from('reading_list')
					.select('book_id, book_data')
					.eq('user_id', id);

				if (readingError) throw readingError;

				// Przetwarzanie danych
				if (favoritesData) {
					const books = favoritesData
						.map((item) => {
							try {
								return JSON.parse(item.book_data);
							} catch (e) {
								return null;
							}
						})
						.filter(Boolean) as Book[];

					setFavoriteBooks(books);
				}

				if (readingData) {
					const books = readingData
						.map((item) => {
							try {
								return JSON.parse(item.book_data);
							} catch (e) {
								return null;
							}
						})
						.filter(Boolean) as Book[];

					setReadingList(books);
				}
			} catch (error) {
				console.error('Błąd podczas pobierania książek użytkownika:', error);
				setBooksError('Nie udało się pobrać książek tego użytkownika.');
			} finally {
				setLoadingBooks(false);
			}
		};

		if (activeTab === 'books') {
			fetchUserBooks();
		}
	}, [id, activeTab]);

	// Obsługa obserwowania/zaprzestania obserwowania
	const handleFollowToggle = async () => {
		if (!isAuthenticated || !id) return;

		try {
			if (isFollowing(id)) {
				await unfollowUser(id);
			} else {
				await followUser(id);
			}
		} catch (error) {
			console.error(
				'Błąd podczas obserwowania/przestania obserwowania:',
				error
			);
		}
	};

	// Obsługa błędów ładowania
	if (isLoading) {
		return (
			<div className='container py-5 text-center'>
				<div className='spinner-border text-primary' role='status'>
					<span className='visually-hidden'>Ładowanie...</span>
				</div>
				<p className='mt-3'>Ładowanie profilu użytkownika...</p>
			</div>
		);
	}

	if (error || !profileData) {
		return (
			<div className='container py-5'>
				<div className='alert alert-danger' role='alert'>
					<i className='fas fa-exclamation-circle me-2'></i>
					{error || 'Nie udało się załadować profilu użytkownika.'}
				</div>
				<Link to='/' className='btn btn-primary'>
					<i className='fas fa-home me-2'></i>
					Wróć do strony głównej
				</Link>
			</div>
		);
	}

	return (
		<div className='container py-5'>
			<div className='row'>
				{/* Sekcja boczna z informacjami o profilu */}
				<div className='col-lg-4 mb-4'>
					<div className='card shadow-sm'>
						<div className='card-body text-center'>
							{/* Avatar użytkownika */}
							<div className='mb-3'>
								{profileData.avatar_url ? (
									<img
										src={profileData.avatar_url}
										alt={profileData.username}
										className='rounded-circle img-thumbnail'
										style={{
											width: '150px',
											height: '150px',
											objectFit: 'cover',
										}}
									/>
								) : (
									<div
										className='rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto'
										style={{ width: '150px', height: '150px' }}
									>
										<span className='h1 text-muted'>
											{profileData.username
												? profileData.username[0].toUpperCase()
												: 'U'}
										</span>
									</div>
								)}
							</div>

							{/* Informacje o profilu */}
							<h3 className='card-title mb-1'>{profileData.username}</h3>
							{profileData.bio && (
								<p className='text-muted mb-3'>{profileData.bio}</p>
							)}

							{/* Statystyki */}
							<div className='d-flex justify-content-around mb-3 text-center'>
								<div className='px-3'>
									<h5 className='mb-0'>{profileData.followers_count || 0}</h5>
									<small className='text-muted'>Obserwujący</small>
								</div>
								<div className='px-3'>
									<h5 className='mb-0'>{profileData.following_count || 0}</h5>
									<small className='text-muted'>Obserwuje</small>
								</div>
							</div>

							{/* Przycisk obserwowania */}
							{isAuthenticated && user?.id !== id && (
								<div className='d-grid'>
									<button
										className={`btn ${
											isFollowing(id) ? 'btn-outline-primary' : 'btn-primary'
										}`}
										onClick={handleFollowToggle}
									>
										{isFollowing(id) ? (
											<>
												<i className='fas fa-user-minus me-2'></i>
												Przestań obserwować
											</>
										) : (
											<>
												<i className='fas fa-user-plus me-2'></i>
												Obserwuj
											</>
										)}
									</button>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Główna treść - aktywności, książki, obserwujący, obserwowani */}
				<div className='col-lg-8'>
					{/* Nawigacja zakładek */}
					<ul className='nav nav-tabs mb-4'>
						<li className='nav-item'>
							<button
								className={`nav-link ${
									activeTab === 'activity' ? 'active' : ''
								}`}
								onClick={() => setActiveTab('activity')}
							>
								<i className='fas fa-rss me-2'></i>
								Aktywność
							</button>
						</li>
						<li className='nav-item'>
							<button
								className={`nav-link ${activeTab === 'books' ? 'active' : ''}`}
								onClick={() => setActiveTab('books')}
							>
								<i className='fas fa-book me-2'></i>
								Książki
							</button>
						</li>
						<li className='nav-item'>
							<button
								className={`nav-link ${
									activeTab === 'followers' ? 'active' : ''
								}`}
								onClick={() => setActiveTab('followers')}
							>
								<i className='fas fa-users me-2'></i>
								Obserwujący
							</button>
						</li>
						<li className='nav-item'>
							<button
								className={`nav-link ${
									activeTab === 'following' ? 'active' : ''
								}`}
								onClick={() => setActiveTab('following')}
							>
								<i className='fas fa-user-friends me-2'></i>
								Obserwowani
							</button>
						</li>
					</ul>

					{/* Zawartość zakładek */}
					{activeTab === 'activity' && (
						<div className='activity-tab'>
							<h4 className='mb-3'>Aktywność użytkownika</h4>
							<ActivityFeed userId={id} limit={20} />
						</div>
					)}

					{activeTab === 'books' && (
						<div className='books-tab'>
							<div className='mb-5'>
								<h4 className='mb-3'>Ulubione książki</h4>
								<BookList
									books={favoriteBooks}
									isLoading={loadingBooks}
									emptyMessage='Ten użytkownik nie ma jeszcze ulubionych książek.'
								/>
							</div>

							<div>
								<h4 className='mb-3'>Lista do przeczytania</h4>
								<BookList
									books={readingList}
									isLoading={loadingBooks}
									emptyMessage='Ten użytkownik nie dodał jeszcze książek do przeczytania.'
								/>
							</div>

							{booksError && (
								<div className='alert alert-warning mt-3' role='alert'>
									<i className='fas fa-exclamation-triangle me-2'></i>
									{booksError}
								</div>
							)}
						</div>
					)}

					{activeTab === 'followers' && (
						<div className='followers-tab'>
							<h4 className='mb-3'>Obserwujący</h4>
							{isLoadingFollowers ? (
								<div className='text-center py-4'>
									<div className='spinner-border text-primary' role='status'>
										<span className='visually-hidden'>
											Ładowanie obserwujących...
										</span>
									</div>
								</div>
							) : followers.length === 0 ? (
								<div className='text-center py-4 bg-light rounded'>
									<i className='fas fa-users fa-3x text-muted mb-3'></i>
									<p className='text-muted'>
										Ten użytkownik nie ma jeszcze obserwujących.
									</p>
								</div>
							) : (
								<div className='row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3'>
									{followers.map((follower) => (
										<div key={follower.id} className='col'>
											<div className='card h-100'>
												<div className='card-body text-center'>
													{follower.avatar_url ? (
														<img
															src={follower.avatar_url}
															alt={follower.username}
															className='rounded-circle mb-2'
															width='64'
															height='64'
														/>
													) : (
														<div
															className='rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto mb-2'
															style={{ width: '64px', height: '64px' }}
														>
															<span>{follower.username[0].toUpperCase()}</span>
														</div>
													)}
													<h5 className='card-title'>{follower.username}</h5>
													<Link
														to={`/user/${follower.id}`}
														className='btn btn-sm btn-outline-primary'
													>
														Zobacz profil
													</Link>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{activeTab === 'following' && (
						<div className='following-tab'>
							<h4 className='mb-3'>Obserwowani</h4>
							{isLoadingFollowing ? (
								<div className='text-center py-4'>
									<div className='spinner-border text-primary' role='status'>
										<span className='visually-hidden'>
											Ładowanie obserwowanych...
										</span>
									</div>
								</div>
							) : following.length === 0 ? (
								<div className='text-center py-4 bg-light rounded'>
									<i className='fas fa-user-friends fa-3x text-muted mb-3'></i>
									<p className='text-muted'>
										Ten użytkownik nikogo jeszcze nie obserwuje.
									</p>
								</div>
							) : (
								<div className='row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3'>
									{following.map((followed) => (
										<div key={followed.id} className='col'>
											<div className='card h-100'>
												<div className='card-body text-center'>
													{followed.avatar_url ? (
														<img
															src={followed.avatar_url}
															alt={followed.username}
															className='rounded-circle mb-2'
															width='64'
															height='64'
														/>
													) : (
														<div
															className='rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto mb-2'
															style={{ width: '64px', height: '64px' }}
														>
															<span>{followed.username[0].toUpperCase()}</span>
														</div>
													)}
													<h5 className='card-title'>{followed.username}</h5>
													<Link
														to={`/user/${followed.id}`}
														className='btn btn-sm btn-outline-primary'
													>
														Zobacz profil
													</Link>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default UserProfile;
