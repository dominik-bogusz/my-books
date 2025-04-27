// src/components/ExchangeOfferList.tsx
import React from 'react';
import { ExchangeOffer } from '../types/book';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ExchangeOfferListProps {
	offers: ExchangeOffer[];
	isLoading: boolean;
	emptyMessage?: string;
	showControls?: boolean;
	onContactClick?: (offer: ExchangeOffer) => void;
	onDeleteClick?: (offerId: string) => void;
	onToggleActiveClick?: (offerId: string, active: boolean) => void;
}

const ExchangeOfferList: React.FC<ExchangeOfferListProps> = ({
	offers,
	isLoading,
	emptyMessage = 'Brak ofert wymiany dla tej książki.',
	showControls = false,
	onContactClick,
	onDeleteClick,
	onToggleActiveClick,
}) => {
	const { user } = useAuth();
	const navigate = useNavigate();

	const getConditionBadgeClass = (condition: string) => {
		switch (condition) {
			case 'nowa':
				return 'bg-success';
			case 'bardzo dobry':
				return 'bg-info';
			case 'dobry':
				return 'bg-primary';
			case 'średni':
				return 'bg-warning';
			case 'wymaga naprawy':
				return 'bg-danger';
			default:
				return 'bg-secondary';
		}
	};

	const getExchangeTypeLabel = (type: string) => {
		switch (type) {
			case 'wymiana':
				return 'Wymiana';
			case 'wypożyczenie':
				return 'Wypożyczenie';
			case 'oddanie':
				return 'Za darmo';
			default:
				return type;
		}
	};

	if (isLoading) {
		return (
			<div className='text-center py-4'>
				<div className='spinner-border text-primary' role='status'>
					<span className='visually-hidden'>Ładowanie...</span>
				</div>
				<p className='mt-3'>Ładowanie ofert wymiany...</p>
			</div>
		);
	}

	if (offers.length === 0) {
		return (
			<div className='card text-center bg-light p-4'>
				<i className='fas fa-exchange-alt fa-3x text-muted mb-3'></i>
				<p className='h5 text-muted'>{emptyMessage}</p>
			</div>
		);
	}

	return (
		<div className='list-group'>
			{offers.map((offer) => (
				<div key={offer.id} className='list-group-item list-group-item-action'>
					<div className='d-flex w-100 justify-content-between align-items-center'>
						<div>
							<div className='d-flex align-items-center mb-2'>
								{offer.user_details && (
									<div className='me-2'>
										{offer.user_details.avatar_url ? (
											<img
												src={offer.user_details.avatar_url}
												alt='Avatar'
												className='rounded-circle'
												width='32'
												height='32'
											/>
										) : (
											<div
												className='rounded-circle bg-light d-flex align-items-center justify-content-center'
												style={{ width: '32px', height: '32px' }}
											>
												<span>
													{offer.user_details.username[0].toUpperCase()}
												</span>
											</div>
										)}
									</div>
								)}
								<h5 className='mb-0'>
									{offer.user_details
										? offer.user_details.username
										: 'Użytkownik'}
								</h5>
							</div>

							<div className='mb-2'>
								<span
									className={`badge ${getConditionBadgeClass(
										offer.condition
									)} me-2`}
								>
									Stan: {offer.condition}
								</span>
								<span className='badge bg-secondary me-2'>
									{getExchangeTypeLabel(offer.exchange_type)}
								</span>
								{offer.location && (
									<span className='badge bg-light text-dark'>
										<i className='fas fa-map-marker-alt me-1'></i>
										{offer.location}
									</span>
								)}
							</div>

							{offer.description && <p className='mb-1'>{offer.description}</p>}

							<small className='text-muted'>
								Dodano:{' '}
								{new Date(offer.created_at).toLocaleDateString('pl-PL', {
									year: 'numeric',
									month: 'short',
									day: 'numeric',
								})}
							</small>
						</div>

						<div>
							{/* Kontrolki dla właściciela oferty */}
							{showControls && user && offer.user_id === user.id ? (
								<div className='btn-group'>
									<button
										className={`btn btn-sm ${
											offer.active
												? 'btn-outline-success'
												: 'btn-outline-warning'
										}`}
										onClick={() =>
											onToggleActiveClick &&
											onToggleActiveClick(offer.id, !offer.active)
										}
									>
										{offer.active ? 'Aktywna' : 'Nieaktywna'}
									</button>
									<button
										className='btn btn-sm btn-outline-danger'
										onClick={() => onDeleteClick && onDeleteClick(offer.id)}
									>
										<i className='fas fa-trash'></i>
									</button>
								</div>
							) : /* Przycisk kontaktu dla innych użytkowników */
							user && offer.user_id !== user.id && offer.active ? (
								<button
									className='btn btn-primary'
									onClick={() => onContactClick && onContactClick(offer)}
								>
									<i className='fas fa-exchange-alt me-2'></i>
									Wymień się
								</button>
							) : !user ? (
								<button
									className='btn btn-outline-primary'
									onClick={() => navigate('/login')}
								>
									Zaloguj się, aby się wymienić
								</button>
							) : !offer.active ? (
								<span className='badge bg-secondary'>Oferta nieaktywna</span>
							) : null}
						</div>
					</div>
				</div>
			))}
		</div>
	);
};

export default ExchangeOfferList;
