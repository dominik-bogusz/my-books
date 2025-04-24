import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { Book } from '../types/book';
import BookList from '../components/BookList';

interface ProfileData {
	username: string;
	avatar_url: string | null;
}

const Profile: React.FC = () => {
	const {
		user,
		isAuthenticated,
		logout,
		updateProfile,
		isLoading: authLoading,
	} = useAuth();
	const [isLoading, setIsLoading] = useState(true);
	const [favoriteBooks, setFavoriteBooks] = useState<Book[]>([]);
	const [readingListBooks, setReadingListBooks] = useState<Book[]>([]);
	const [profileData, setProfileData] = useState<ProfileData>({
		username: '',
		avatar_url: null,
	});
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const navigate = useNavigate();

	// Fetch profile data and user's books
	useEffect(() => {
		if (!isAuthenticated || !user) {
			navigate('/login');
			return;
		}

		const fetchData = async () => {
			setIsLoading(true);
			try {
				// Fetch profile data
				const { data: profileData, error: profileError } = await supabase
					.from('profiles')
					.select('*')
					.eq('id', user.id)
					.single();

				if (profileError) {
					throw profileError;
				}

				if (profileData) {
					setProfileData({
						username: profileData.username || '',
						avatar_url: profileData.avatar_url,
					});
				}

				// Fetch favorite books
				const { data: favoritesData, error: favoritesError } = await supabase
					.from('favorites')
					.select('book_id, book_data')
					.eq('user_id', user.id);

				if (favoritesError) {
					throw favoritesError;
				}

				if (favoritesData) {
					const books = favoritesData.map((item) => JSON.parse(item.book_data));
					setFavoriteBooks(books);
				}

				// Fetch reading list
				const { data: readingListData, error: readingListError } =
					await supabase
						.from('reading_list')
						.select('book_id, book_data')
						.eq('user_id', user.id);

				if (readingListError) {
					throw readingListError;
				}

				if (readingListData) {
					const books = readingListData.map((item) =>
						JSON.parse(item.book_data)
					);
					setReadingListBooks(books);
				}
			} catch (error) {
				console.error('Error fetching profile data:', error);
				setError('Wystąpił błąd podczas pobierania danych profilu.');
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, [user, isAuthenticated, navigate]);

	const handleSaveProfile = async () => {
		if (!user) return;

		setIsSaving(true);
		setError(null);
		setSuccessMessage(null);

		try {
			const { success, error } = await updateProfile({
				username: profileData.username,
				avatar_url: profileData.avatar_url || undefined,
			});

			if (success) {
				setSuccessMessage('Profil został zaktualizowany');
				setIsEditing(false);
			} else {
				setError(error || 'Wystąpił błąd podczas aktualizacji profilu');
			}
		} catch (err) {
			setError('Nieoczekiwany błąd. Spróbuj ponownie później.');
		} finally {
			setIsSaving(false);
		}
	};

	const handleLogout = async () => {
		await logout();
		navigate('/');
	};

	if (authLoading || isLoading) {
		return (
			<div className='container py-5 text-center'>
				<div className='spinner-border text-primary' role='status'>
					<span className='visually-hidden'>Ładowanie...</span>
				</div>
				<p className='mt-3'>Ładowanie profilu...</p>
			</div>
		);
	}

	if (!isAuthenticated) {
		return null; // Will redirect via useEffect
	}

	return (
		<div className='container py-5'>
			<div className='row'>
				<div className='col-lg-4 mb-4'>
					<div className='card shadow-sm'>
						<div className='card-body text-center'>
							{/* Profile Avatar */}
							<div className='mb-3'>
								{profileData.avatar_url ? (
									<img
										src={profileData.avatar_url}
										alt='Avatar'
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

							{isEditing ? (
								/* Edit Profile Form */
								<div>
									<div className='mb-3'>
										<label htmlFor='username' className='form-label'>
											Nazwa użytkownika
										</label>
										<input
											type='text'
											className='form-control'
											id='username'
											value={profileData.username}
											onChange={(e) =>
												setProfileData({
													...profileData,
													username: e.target.value,
												})
											}
										/>
									</div>

									<div className='mb-3'>
										<label htmlFor='avatar' className='form-label'>
											URL Avatara
										</label>
										<input
											type='text'
											className='form-control'
											id='avatar'
											value={profileData.avatar_url || ''}
											onChange={(e) =>
												setProfileData({
													...profileData,
													avatar_url: e.target.value,
												})
											}
											placeholder='https://example.com/avatar.jpg'
										/>
									</div>

									<div className='d-flex gap-2 mt-4'>
										<button
											className='btn btn-primary flex-grow-1'
											onClick={handleSaveProfile}
											disabled={isSaving}
										>
											{isSaving ? (
												<>
													<span
														className='spinner-border spinner-border-sm me-2'
														role='status'
														aria-hidden='true'
													></span>
													Zapisywanie...
												</>
											) : (
												'Zapisz'
											)}
										</button>
										<button
											className='btn btn-outline-secondary'
											onClick={() => setIsEditing(false)}
											disabled={isSaving}
										>
											Anuluj
										</button>
									</div>
								</div>
							) : (
								/* Profile Display */
								<div>
									<h3 className='card-title mb-0'>{profileData.username}</h3>
									<p className='text-muted'>{user?.email}</p>

									<div className='d-grid gap-2 mt-4'>
										<button
											className='btn btn-outline-primary'
											onClick={() => setIsEditing(true)}
										>
											Edytuj profil
										</button>
										<button
											className='btn btn-outline-danger'
											onClick={handleLogout}
										>
											Wyloguj się
										</button>
									</div>
								</div>
							)}

							{error && (
								<div className='alert alert-danger mt-3' role='alert'>
									{error}
								</div>
							)}

							{successMessage && (
								<div className='alert alert-success mt-3' role='alert'>
									{successMessage}
								</div>
							)}
						</div>
					</div>
				</div>

				<div className='col-lg-8'>
					{/* Favorite Books Section */}
					<div className='mb-5'>
						<h2 className='mb-4'>Ulubione książki</h2>
						<BookList
							books={favoriteBooks}
							emptyMessage='Nie masz jeszcze ulubionych książek. Dodaj je podczas przeglądania książek.'
						/>
					</div>

					{/* Reading List Section */}
					<div>
						<h2 className='mb-4'>Do przeczytania</h2>
						<BookList
							books={readingListBooks}
							emptyMessage='Twoja lista do przeczytania jest pusta. Dodaj książki, które chcesz przeczytać.'
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Profile;
