// src/components/Navbar.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import NotificationsDropdown from './NotificationsDropdown';

const Navbar = () => {
	const [searchQuery, setSearchQuery] = useState('');
	const navigate = useNavigate();
	const { isAuthenticated, user, logout } = useAuth();
	const { clearSearch } = useSearch();

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			// Clear previous search results when performing a new search
			clearSearch();
			navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
		}
	};

	const handleLogout = async () => {
		await logout();
		navigate('/');
	};

	const handleHomeClick = () => {
		// Clear search when navigating to home
		clearSearch();
	};

	return (
		<nav className='navbar navbar-expand-lg navbar-light bg-white shadow-sm py-4'>
			<div className='container'>
				<Link
					to='/'
					className='navbar-brand d-flex align-items-center fw-bold'
					onClick={handleHomeClick}
				>
					<img
						src='/book-logo.svg'
						alt='Logo'
						width='40'
						height='40'
						className='me-2'
					/>
					<span style={{ letterSpacing: '0.05em' }}>MyBooks</span>
				</Link>

				<button
					className='navbar-toggler'
					type='button'
					data-bs-toggle='collapse'
					data-bs-target='#navbarContent'
					aria-controls='navbarContent'
					aria-expanded='false'
					aria-label='Toggle navigation'
				>
					<span className='navbar-toggler-icon'></span>
				</button>

				<div className='collapse navbar-collapse' id='navbarContent'>
					<form
						className='d-flex py-2 mx-auto'
						role='search'
						onSubmit={handleSearch}
					>
						<input
							className='form-control me-2'
							type='search'
							placeholder='Wyszukaj książki...'
							aria-label='Search'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
						<button
							className='btn text-white fw-semi-bold'
							style={{
								background: 'linear-gradient(90deg, #DA831C 0%, #FFD028 100%)',
								border: 'none',
							}}
							type='submit'
						>
							Szukaj
						</button>
					</form>

					<div className='ms-auto d-flex align-items-center'>
						{isAuthenticated ? (
							<div className='d-flex align-items-center'>
								{/* Powiadomienia */}
								<div className='me-3'>
									<NotificationsDropdown />
								</div>

								<div className='dropdown'>
									<button
										className='btn btn-link text-dark dropdown-toggle text-decoration-none d-flex align-items-center'
										type='button'
										id='userDropdown'
										data-bs-toggle='dropdown'
										aria-expanded='false'
									>
										{user && (
											<div
												className='me-2 rounded-circle overflow-hidden'
												style={{ width: '32px', height: '32px' }}
											>
												{user.user_metadata?.avatar_url ? (
													<img
														src={user.user_metadata.avatar_url}
														alt='Avatar'
														className='img-fluid'
														width='32'
														height='32'
													/>
												) : (
													<div className='bg-light d-flex align-items-center justify-content-center h-100'>
														<span>
															{user?.user_metadata?.username?.[0]?.toUpperCase() ||
																user?.email?.[0]?.toUpperCase() ||
																'U'}
														</span>
													</div>
												)}
											</div>
										)}
										<span className='d-none d-sm-inline'>
											{user?.user_metadata?.username ||
												user?.email?.split('@')[0]}
										</span>
									</button>
									<ul
										className='dropdown-menu dropdown-menu-end'
										aria-labelledby='userDropdown'
									>
										<li>
											<Link className='dropdown-item' to='/profile'>
												<i className='fas fa-user me-2'></i>
												Mój profil
											</Link>
										</li>
										<li>
											<Link className='dropdown-item' to='/reading-stats'>
												<i className='fas fa-chart-bar me-2'></i>
												Statystyki czytelnicze
											</Link>
										</li>
										<li>
											<Link className='dropdown-item' to={`/user/${user?.id}`}>
												<i className='fas fa-users me-2'></i>
												Społeczność
											</Link>
										</li>
										<li>
											<hr className='dropdown-divider' />
										</li>
										<li>
											<button className='dropdown-item' onClick={handleLogout}>
												<i className='fas fa-sign-out-alt me-2'></i>
												Wyloguj się
											</button>
										</li>
									</ul>
								</div>
							</div>
						) : (
							<div className='d-flex'>
								<Link to='/login' className='btn btn-outline-primary me-2'>
									Zaloguj się
								</Link>
								<Link
									to='/register'
									className='btn text-white'
									style={{
										background:
											'linear-gradient(90deg, #DA831C 0%, #FFD028 100%)',
										border: 'none',
									}}
								>
									Zarejestruj się
								</Link>
							</div>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
