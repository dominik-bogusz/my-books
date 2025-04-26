import { useState } from 'react';
import { Book } from '../types/book';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import useBookActions from '../hooks/useBookActions';

interface BookActionsProps {
	book: Book;
	size?: 'sm' | 'md' | 'lg';
}

const BookActions: React.FC<BookActionsProps> = ({ book, size = 'md' }) => {
	const { isAuthenticated } = useAuth();
	const navigate = useNavigate();
	const {
		isFavorite,
		isInReadingList,
		addToFavorites,
		removeFromFavorites,
		addToReadingList,
		removeFromReadingList,
		refreshUserBooks, // Nowa funkcja, którą stworzyliśmy
	} = useBookActions();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);

	const toggleDropdown = () => {
		setIsDropdownOpen(!isDropdownOpen);
	};

	const handleFavoriteClick = async (e: React.MouseEvent) => {
		e.stopPropagation();
		e.preventDefault();

		if (!isAuthenticated) {
			navigate('/login', { state: { from: { pathname: `/book/${book.id}` } } });
			return;
		}

		try {
			setIsProcessing(true);

			if (isFavorite(book.id)) {
				await removeFromFavorites(book.id);
			} else {
				await addToFavorites(book);
			}

			// Odświeżamy listę książek użytkownika, żeby pojawiła się w profilu
			await refreshUserBooks();
		} catch (error) {
			console.error('Error managing favorites:', error);
		} finally {
			setIsProcessing(false);
			setIsDropdownOpen(false); // Zamykamy dropdown po akcji
		}
	};

	const handleReadingListClick = async (e: React.MouseEvent) => {
		e.stopPropagation();
		e.preventDefault();

		if (!isAuthenticated) {
			navigate('/login', { state: { from: { pathname: `/book/${book.id}` } } });
			return;
		}

		try {
			setIsProcessing(true);

			if (isInReadingList(book.id)) {
				await removeFromReadingList(book.id);
			} else {
				await addToReadingList(book);
			}

			// Odświeżamy listę książek użytkownika, żeby pojawiła się w profilu
			await refreshUserBooks();
		} catch (error) {
			console.error('Error managing reading list:', error);
		} finally {
			setIsProcessing(false);
			setIsDropdownOpen(false); // Zamykamy dropdown po akcji
		}
	};

	// Determine size classes
	const getIconSize = () => {
		switch (size) {
			case 'sm':
				return 'fa-sm';
			case 'lg':
				return 'fa-lg';
			default:
				return '';
		}
	};

	const getButtonSize = () => {
		switch (size) {
			case 'sm':
				return 'btn-sm';
			case 'lg':
				return 'btn-lg';
			default:
				return '';
		}
	};

	return (
		<div className='dropdown'>
			<button
				className={`btn btn-light ${getButtonSize()} rounded-circle shadow-sm`}
				type='button'
				onClick={toggleDropdown}
				aria-expanded={isDropdownOpen}
				disabled={isProcessing}
			>
				{isProcessing ? (
					<span
						className='spinner-border spinner-border-sm'
						role='status'
						aria-hidden='true'
					></span>
				) : (
					<i className={`fas fa-ellipsis-v ${getIconSize()}`}></i>
				)}
			</button>
			<ul
				className={`dropdown-menu dropdown-menu-end ${
					isDropdownOpen ? 'show' : ''
				}`}
			>
				{isAuthenticated ? (
					<>
						<li>
							<button
								className='dropdown-item d-flex align-items-center'
								onClick={handleFavoriteClick}
								disabled={isProcessing}
							>
								<i
									className={`${
										isFavorite(book.id) ? 'fas' : 'far'
									} fa-heart me-2 text-danger`}
								></i>
								{isFavorite(book.id)
									? 'Usuń z ulubionych'
									: 'Dodaj do ulubionych'}
							</button>
						</li>
						<li>
							<button
								className='dropdown-item d-flex align-items-center'
								onClick={handleReadingListClick}
								disabled={isProcessing}
							>
								<i
									className={`${
										isInReadingList(book.id) ? 'fas' : 'far'
									} fa-bookmark me-2 text-primary`}
								></i>
								{isInReadingList(book.id)
									? 'Usuń z listy do przeczytania'
									: 'Dodaj do przeczytania'}
							</button>
						</li>
					</>
				) : (
					<>
						<li>
							<button
								className='dropdown-item d-flex align-items-center'
								onClick={(e) => {
									e.stopPropagation();
									e.preventDefault();
									navigate('/login', {
										state: { from: { pathname: `/book/${book.id}` } },
									});
								}}
							>
								<i className='far fa-heart me-2 text-danger'></i>
								Zaloguj się, aby dodać do ulubionych
							</button>
						</li>
						<li>
							<button
								className='dropdown-item d-flex align-items-center'
								onClick={(e) => {
									e.stopPropagation();
									e.preventDefault();
									navigate('/login', {
										state: { from: { pathname: `/book/${book.id}` } },
									});
								}}
							>
								<i className='far fa-bookmark me-2 text-primary'></i>
								Zaloguj się, aby dodać do przeczytania
							</button>
						</li>
					</>
				)}
			</ul>
		</div>
	);
};

export default BookActions;
