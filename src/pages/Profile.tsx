import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import BookList from '../components/BookList';
import useBookActions from '../hooks/useBookActions';
import useStorage from '../hooks/useStorage';

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
		deleteAccount,
		isLoading: authLoading,
	} = useAuth();

	// Używamy bezpośrednio hooka useBookActions do pobierania książek
	const {
		favoriteBooks,
		readingList,
		loadingFavorites,
		loadingReadingList,
		error: booksError,
	} = useBookActions();

	const [isLoading, setIsLoading] = useState(true);
	const [profileData, setProfileData] = useState<ProfileData>({
		username: '',
		avatar_url: null,
	});
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const navigate = useNavigate();
	const { uploadAvatar, isUploading } = useStorage();

	// Fetch profile data
	useEffect(() => {
		if (!isAuthenticated || !user) {
			navigate('/login');
			return;
		}

		const fetchProfile = async () => {
			setIsLoading(true);
			try {
				// Fetch profile data
				const { data: profileData, error: profileError } = await supabase
					.from('profiles')
					.select('*')
					.eq('id', user.id)
					.maybeSingle(); // Use maybeSingle() instead of single() to prevent errors when no record exists

				if (profileError && !profileError.message.includes('contains 0 rows')) {
					console.error('Error fetching profile:', profileError);
					// Log error but continue loading the interface
				}

				if (profileData) {
					setProfileData({
						username: profileData.username || user.email?.split('@')[0] || '',
						avatar_url: profileData.avatar_url,
					});
				} else {
					// If profile doesn't exist in database, use data from auth user metadata
					// and create a profile record
					const defaultUsername =
						user.user_metadata?.username || user.email?.split('@')[0] || '';
					setProfileData({
						username: defaultUsername,
						avatar_url: user.user_metadata?.avatar_url || null,
					});

					// Create profile record if it doesn't exist
					const { error: insertError } = await supabase
						.from('profiles')
						.insert({
							id: user.id,
							email: user.email,
							username: defaultUsername,
							avatar_url: user.user_metadata?.avatar_url || null,
						});

					if (insertError) {
						console.error('Error creating profile:', insertError);
					}
				}
			} catch (error) {
				console.error('Error in profile fetch:', error);
				// Don't block the interface loading
			} finally {
				setIsLoading(false);
			}
		};

		fetchProfile();
	}, [user, isAuthenticated, navigate]);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		const file = files[0];

		setError(null);
		setSuccessMessage(null);
		setIsSaving(true);

		try {
			// Używamy funkcji z hooka useStorage
			const { url, error: uploadError } = await uploadAvatar(file);

			if (uploadError) {
				setError(uploadError);
				return;
			}

			if (url) {
				// Aktualizujemy dane profilu
				setProfileData({
					...profileData,
					avatar_url: url,
				});

				// Zapisujemy zmiany w profilu
				const { success, error: updateError } = await updateProfile({
					username: profileData.username,
					avatar_url: url,
				});

				if (success) {
					setSuccessMessage('Zdjęcie zostało zaktualizowane i zapisane');
				} else if (updateError) {
					setError(
						`Zdjęcie zostało przesłane, ale nie udało się zaktualizować profilu: ${updateError}`
					);
				}
			}
		} catch (error) {
			console.error('Error handling file:', error);
			setError('Wystąpił nieoczekiwany błąd podczas przesyłania zdjęcia.');
		} finally {
			setIsSaving(false);
		}
	};

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

	const handleDeleteAccount = async () => {
		setIsDeleting(true);
		setError(null);

		try {
			const { success, error } = await deleteAccount();

			if (success) {
				navigate('/');
			} else {
				setError(error || 'Wystąpił błąd podczas usuwania konta');
				setShowDeleteConfirmation(false);
			}
		} catch (err) {
			setError('Nieoczekiwany błąd. Spróbuj ponownie później.');
			setShowDeleteConfirmation(false);
		} finally {
			setIsDeleting(false);
		}
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

								{/* Zawsze pokazujemy możliwość zmiany zdjęcia */}
								<div className='mt-2'>
									<input
										type='file'
										accept='image/*'
										ref={fileInputRef}
										onChange={handleFileChange}
										style={{ display: 'none' }}
									/>
									<button
										className='btn btn-sm btn-outline-secondary'
										onClick={() => fileInputRef.current?.click()}
										disabled={isSaving || isUploading}
									>
										{isSaving || isUploading
											? 'Przesyłanie...'
											: 'Zmień zdjęcie'}
									</button>
								</div>
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
										<button
											className='btn btn-danger'
											onClick={() => setShowDeleteConfirmation(true)}
										>
											Usuń konto
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
							isLoading={loadingFavorites}
							emptyMessage='Nie masz jeszcze ulubionych książek. Dodaj je podczas przeglądania książek.'
						/>
					</div>

					{/* Reading List Section */}
					<div>
						<h2 className='mb-4'>Do przeczytania</h2>
						<BookList
							books={readingList}
							isLoading={loadingReadingList}
							emptyMessage='Twoja lista do przeczytania jest pusta. Dodaj książki, które chcesz przeczytać.'
						/>
					</div>

					{booksError && (
						<div className='alert alert-warning mt-3' role='alert'>
							<i className='fas fa-exclamation-triangle me-2'></i>
							{booksError}
						</div>
					)}
				</div>
			</div>

			{/* Modal potwierdzenia usunięcia konta */}
			{showDeleteConfirmation && (
				<div
					className='modal fade show'
					style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
				>
					<div className='modal-dialog modal-dialog-centered'>
						<div className='modal-content'>
							<div className='modal-header'>
								<h5 className='modal-title'>Potwierdź usunięcie konta</h5>
								<button
									type='button'
									className='btn-close'
									onClick={() => setShowDeleteConfirmation(false)}
									disabled={isDeleting}
								></button>
							</div>
							<div className='modal-body'>
								<p>
									Czy na pewno chcesz usunąć swoje konto? Ta operacja jest{' '}
									<strong>nieodwracalna</strong>.
								</p>
								<p>
									Wszystkie Twoje dane, w tym ulubione książki i lista do
									przeczytania, zostaną trwale usunięte.
								</p>
							</div>
							<div className='modal-footer'>
								<button
									type='button'
									className='btn btn-secondary'
									onClick={() => setShowDeleteConfirmation(false)}
									disabled={isDeleting}
								>
									Anuluj
								</button>
								<button
									type='button'
									className='btn btn-danger'
									onClick={handleDeleteAccount}
									disabled={isDeleting}
								>
									{isDeleting ? (
										<>
											<span
												className='spinner-border spinner-border-sm me-2'
												role='status'
												aria-hidden='true'
											></span>
											Usuwanie...
										</>
									) : (
										'Tak, usuń moje konto'
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Profile;
