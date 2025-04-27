// src/components/ExchangeOfferForm.tsx
import React, { useState } from 'react';
import { Book, BookCondition, ExchangeType } from '../types/book';
import useExchange from '../hooks/useExchange';

interface ExchangeOfferFormProps {
	book: Book;
	onSuccess?: () => void;
	onCancel?: () => void;
}

const ExchangeOfferForm: React.FC<ExchangeOfferFormProps> = ({
	book,
	onSuccess,
	onCancel,
}) => {
	const [condition, setCondition] = useState<BookCondition>('dobry');
	const [exchangeType, setExchangeType] = useState<ExchangeType>('wymiana');
	const [description, setDescription] = useState('');
	const [location, setLocation] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { createOffer } = useExchange();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);

		try {
			const success = await createOffer(
				book,
				condition,
				exchangeType,
				description,
				location
			);

			if (success) {
				if (onSuccess) onSuccess();
			} else {
				setError('Nie udało się utworzyć oferty. Spróbuj ponownie.');
			}
		} catch (err) {
			console.error('Error creating exchange offer:', err);
			setError('Wystąpił błąd podczas tworzenia oferty wymiany.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className='card'>
			<div className='card-header'>
				<h5 className='mb-0'>Utwórz ofertę wymiany</h5>
			</div>
			<div className='card-body'>
				{error && (
					<div className='alert alert-danger' role='alert'>
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit}>
					<div className='mb-3'>
						<label htmlFor='exchangeType' className='form-label'>
							Typ oferty
						</label>
						<select
							id='exchangeType'
							className='form-select'
							value={exchangeType}
							onChange={(e) => setExchangeType(e.target.value as ExchangeType)}
							required
						>
							<option value='wymiana'>Wymiana na inną książkę</option>
							<option value='wypożyczenie'>Wypożyczenie</option>
							<option value='oddanie'>Oddanie za darmo</option>
						</select>
					</div>

					<div className='mb-3'>
						<label htmlFor='condition' className='form-label'>
							Stan książki
						</label>
						<select
							id='condition'
							className='form-select'
							value={condition}
							onChange={(e) => setCondition(e.target.value as BookCondition)}
							required
						>
							<option value='nowa'>Nowa</option>
							<option value='bardzo dobry'>Bardzo dobry</option>
							<option value='dobry'>Dobry</option>
							<option value='średni'>Średni</option>
							<option value='wymaga naprawy'>Wymaga naprawy</option>
						</select>
					</div>

					<div className='mb-3'>
						<label htmlFor='location' className='form-label'>
							Lokalizacja (miasto)
						</label>
						<input
							type='text'
							className='form-control'
							id='location'
							value={location}
							onChange={(e) => setLocation(e.target.value)}
							placeholder='np. Warszawa'
						/>
					</div>

					<div className='mb-3'>
						<label htmlFor='description' className='form-label'>
							Dodatkowy opis (opcjonalnie)
						</label>
						<textarea
							className='form-control'
							id='description'
							rows={3}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder='Dodaj informacje o książce, preferencje dotyczące wymiany itp.'
						></textarea>
					</div>

					<div className='d-flex justify-content-end gap-2'>
						{onCancel && (
							<button
								type='button'
								className='btn btn-outline-secondary'
								onClick={onCancel}
								disabled={isSubmitting}
							>
								Anuluj
							</button>
						)}
						<button
							type='submit'
							className='btn btn-primary'
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<>
									<span
										className='spinner-border spinner-border-sm me-2'
										role='status'
										aria-hidden='true'
									></span>
									Tworzenie oferty...
								</>
							) : (
								'Utwórz ofertę'
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default ExchangeOfferForm;
