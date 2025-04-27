// src/components/ExchangeTransactionList.tsx
import React, { useState } from 'react';
import { ExchangeTransaction, TransactionStatus } from '../types/book';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface ExchangeTransactionListProps {
	transactions: ExchangeTransaction[];
	isLoading: boolean;
	onStatusChange?: (
		transactionId: string,
		status: TransactionStatus
	) => Promise<boolean>;
}

const ExchangeTransactionList: React.FC<ExchangeTransactionListProps> = ({
	transactions,
	isLoading,
	onStatusChange,
}) => {
	const { user } = useAuth();
	const [updatingId, setUpdatingId] = useState<string | null>(null);

	if (isLoading) {
		return (
			<div className='text-center py-4'>
				<div className='spinner-border text-primary' role='status'>
					<span className='visually-hidden'>Ładowanie...</span>
				</div>
				<p className='mt-3'>Ładowanie wymiany...</p>
			</div>
		);
	}

	if (transactions.length === 0) {
		return (
			<div className='card text-center bg-light p-4'>
				<i className='fas fa-handshake fa-3x text-muted mb-3'></i>
				<p className='h5 text-muted'>Brak aktywnych wymian.</p>
			</div>
		);
	}

	const getStatusBadgeClass = (status: TransactionStatus) => {
		switch (status) {
			case 'oczekująca':
				return 'bg-warning';
			case 'zaakceptowana':
				return 'bg-success';
			case 'odrzucona':
				return 'bg-danger';
			case 'zakończona':
				return 'bg-primary';
			case 'anulowana':
				return 'bg-secondary';
			default:
				return 'bg-light text-dark';
		}
	};

	const getTransactionTypeLabel = (type: string) => {
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

	const handleStatusChange = async (
		transactionId: string,
		status: TransactionStatus
	) => {
		if (!onStatusChange) return;

		setUpdatingId(transactionId);
		try {
			await onStatusChange(transactionId, status);
		} finally {
			setUpdatingId(null);
		}
	};

	return (
		<div className='list-group'>
			{transactions.map((transaction) => {
				const isOwner = user?.id === transaction.owner_id;
				const isRequester = user?.id === transaction.requester_id;

				// Safety check - skip if no offer details
				if (!transaction.offer_details) return null;

				return (
					<div key={transaction.id} className='list-group-item'>
						<div className='d-flex justify-content-between align-items-start mb-2'>
							<div>
								<h5 className='mb-1'>
									{transaction.offer_details.book_data.title}
								</h5>
								<p className='mb-1'>
									<span className='badge bg-info me-2'>
										{getTransactionTypeLabel(transaction.transaction_type)}
									</span>
									<span
										className={`badge ${getStatusBadgeClass(
											transaction.status
										)}`}
									>
										{transaction.status}
									</span>
								</p>
							</div>
							<Link
								to={`/book/${transaction.offer_details.book_id}`}
								className='btn btn-sm btn-outline-secondary'
							>
								Zobacz książkę
							</Link>
						</div>

						<div className='d-flex justify-content-between mb-3'>
							<div>
								<small className='d-block text-muted'>
									<strong>Oferujący:</strong>{' '}
									{transaction.owner_details
										? transaction.owner_details.username
										: 'Nieznany'}
								</small>
								<small className='d-block text-muted'>
									<strong>Wymieniający:</strong>{' '}
									{transaction.requester_details
										? transaction.requester_details.username
										: 'Nieznany'}
								</small>
							</div>
							<div>
								<small className='d-block text-muted'>
									<strong>Data utworzenia:</strong>{' '}
									{new Date(transaction.created_at).toLocaleDateString('pl-PL')}
								</small>
								{transaction.completed_at && (
									<small className='d-block text-muted'>
										<strong>Data zakończenia:</strong>{' '}
										{new Date(transaction.completed_at).toLocaleDateString(
											'pl-PL'
										)}
									</small>
								)}
							</div>
						</div>

						{/* Akcje dla właściciela oferty */}
						{isOwner && transaction.status === 'oczekująca' && (
							<div className='d-flex justify-content-end gap-2'>
								<button
									className='btn btn-success'
									onClick={() =>
										handleStatusChange(transaction.id, 'zaakceptowana')
									}
									disabled={updatingId === transaction.id}
								>
									{updatingId === transaction.id ? (
										<span
											className='spinner-border spinner-border-sm me-1'
											role='status'
											aria-hidden='true'
										></span>
									) : (
										<i className='fas fa-check me-1'></i>
									)}
									Akceptuj
								</button>
								<button
									className='btn btn-danger'
									onClick={() =>
										handleStatusChange(transaction.id, 'odrzucona')
									}
									disabled={updatingId === transaction.id}
								>
									{updatingId === transaction.id ? (
										<span
											className='spinner-border spinner-border-sm me-1'
											role='status'
											aria-hidden='true'
										></span>
									) : (
										<i className='fas fa-times me-1'></i>
									)}
									Odrzuć
								</button>
							</div>
						)}

						{/* Akcje dla osoby zamieniającej się */}
						{isRequester && transaction.status === 'oczekująca' && (
							<div className='d-flex justify-content-end'>
								<button
									className='btn btn-outline-secondary'
									onClick={() =>
										handleStatusChange(transaction.id, 'anulowana')
									}
									disabled={updatingId === transaction.id}
								>
									{updatingId === transaction.id ? (
										<span
											className='spinner-border spinner-border-sm me-1'
											role='status'
											aria-hidden='true'
										></span>
									) : (
										<i className='fas fa-ban me-1'></i>
									)}
									Anuluj
								</button>
							</div>
						)}

						{/* Przycisk zakończenia wymiany dla obu stron */}
						{(isOwner || isRequester) &&
							transaction.status === 'zaakceptowana' && (
								<div className='d-flex justify-content-end'>
									<button
										className='btn btn-primary'
										onClick={() =>
											handleStatusChange(transaction.id, 'zakończona')
										}
										disabled={updatingId === transaction.id}
									>
										{updatingId === transaction.id ? (
											<span
												className='spinner-border spinner-border-sm me-1'
												role='status'
												aria-hidden='true'
											></span>
										) : (
											<i className='fas fa-check-circle me-1'></i>
										)}
										Zakończ wymianę
									</button>
								</div>
							)}
					</div>
				);
			})}
		</div>
	);
};

export default ExchangeTransactionList;
