import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
	const [searchQuery, setSearchQuery] = useState('');
	const navigate = useNavigate();

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
		}
	};

	return (
		<nav className='navbar navbar-expand-lg navbar-light bg-white shadow-sm py-4'>
			<div className='container'>
				<Link to='/' className='navbar-brand d-flex align-items-center fw-bold'>
					<img
						src='/book-logo.svg'
						alt='Logo'
						width='40'
						height='40'
						className='me-2'
					/>
					<span style={{ letterSpacing: '0.05em' }}>MyBooks</span>
				</Link>
				<form className='d-flex py-2' role='search' onSubmit={handleSearch}>
					<input
						className='form-control me-2'
						type='search'
						placeholder='Wyszukaj książki...'
						aria-label='Search'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					<button
						className='btn text-white fw-semi-bold btn-lg w-50'
						style={{
							background: 'linear-gradient(90deg, #DA831C 0%, #FFD028 100%)',
							border: 'none',
						}}
						type='submit'
					>
						Szukaj
					</button>
				</form>
			</div>
		</nav>
	);
};

export default Navbar;
