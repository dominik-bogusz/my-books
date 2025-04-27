// src/components/ExchangeMessageSystem.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ExchangeOffer, ExchangeMessage } from '../types/book';
import { useAuth } from '../context/AuthContext';
import useExchange from '../hooks/useExchange';

interface ExchangeMessageSystemProps {
	offer: ExchangeOffer;
	onRequestExchange?: () => void;
}

const ExchangeMessageSystem: React.FC<ExchangeMessageSystemProps> = ({
	offer,
	onRequestExchange,
}) => {
	const { user } = useAuth();
	const {
		exchangeMessages,
		isLoadingMessages,
		messagesError,
		sendMessage,
		markMessageAsRead,
		requestExchange,
		fetchOfferMessages,
	} = useExchange(offer.book_id);

	const [newMessage, setNewMessage] = useState('');
	const [sending, setSending] = useState(false);
	const [exchangeRequested, setExchangeRequested] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Fetch messages when component mounts
	useEffect(() => {
		if (offer && offer.id) {
			fetchOfferMessages(offer.id);
		}
	}, [offer, fetchOfferMessages]);

	// Scroll to bottom when messages change
	useEffect(() => {
		scrollToBottom();
	}, [exchangeMessages]);

	// Mark messages as read when they appear
	useEffect(() => {
		if (user && exchangeMessages.length > 0) {
			exchangeMessages.forEach((message) => {
				if (message.recipient_id === user.id && !message.read) {
					markMessageAsRead(message.id);
				}
			});
		}
	}, [exchangeMessages, user, markMessageAsRead]);

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user || !newMessage.trim()) return;

		setSending(true);
		try {
			const success = await sendMessage(
				offer.id,
				offer.user_id === user.id ? getOtherUserId() : offer.user_id,
				newMessage.trim()
			);

			if (success) {
				setNewMessage('');
				// Messages will be updated automatically via state
			}
		} catch (error) {
			console.error('Error sending message:', error);
		} finally {
			setSending(false);
		}
	};

	const handleRequestExchange = async () => {
		if (!user) return;

		try {
			const success = await requestExchange(offer.id, offer.user_id);
			if (success) {
				setExchangeRequested(true);
				if (onRequestExchange) onRequestExchange();
			}
		} catch (error) {
			console.error('Error requesting exchange:', error);
		}
	};

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	// Helper to get the ID of the other user in the conversation
	const getOtherUserId = (): string => {
		// Find a message with a recipient that isn't the current user
		const otherUserMessage = exchangeMessages.find(
			(m) => m.recipient_id !== user?.id
		);
		return otherUserMessage ? otherUserMessage.recipient_id : '';
	};

	// Check if the current user is the owner of the offer
	const isOwner = user?.id === offer.user_id;

	if (!user) {
		return (
			<div className='alert alert-info'>
				Zaloguj się, aby kontaktować się z oferującym.
			</div>
		);
	}

	if (isLoadingMessages) {
		return (
			<div className='text-center py-3'>
				<div className='spinner-border text-primary' role='status'>
					<span className='visually-hidden'>Ładowanie wiadomości...</span>
				</div>
			</div>
		);
	}

	if (messagesError) {
		return (
			<div className='alert alert-danger'>
				<i className='fas fa-exclamation-circle me-2'></i>
				{messagesError}
			</div>
		);
	}

	return (
		<div className='card'>
			<div className='card-header d-flex justify-content-between align-items-center'>
				<h5 className='mb-0'>
					{isOwner
						? 'Wiadomości dotyczące oferty'
						: `Wiadomości z ${
								offer.user_details ? offer.user_details.username : 'oferującym'
						  }`}
				</h5>
				{!isOwner && !exchangeRequested && (
					<button
						className='btn btn-success btn-sm'
						onClick={handleRequestExchange}
					>
						<i className='fas fa-handshake me-1'></i>
						Poproś o wymianę
					</button>
				)}
				{exchangeRequested && (
					<span className='badge bg-success'>
						<i className='fas fa-check me-1'></i>
						Prośba wysłana
					</span>
				)}
			</div>
			<div
				className='card-body'
				style={{ maxHeight: '400px', overflowY: 'auto' }}
			>
				{exchangeMessages.length === 0 ? (
					<div className='text-center text-muted p-4'>
						<i className='fas fa-comments fa-2x mb-3'></i>
						<p>
							{isOwner
								? 'Nikt jeszcze nie napisał wiadomości do tej oferty.'
								: 'Rozpocznij konwersację z oferującym.'}
						</p>
					</div>
				) : (
					<div className='message-list'>
						{exchangeMessages.map((message) => {
							const isCurrentUser = user.id === message.sender_id;
							return (
								<div
									key={message.id}
									className={`mb-3 d-flex ${
										isCurrentUser
											? 'justify-content-end'
											: 'justify-content-start'
									}`}
								>
									<div
										className={`message p-3 rounded ${
											isCurrentUser
												? 'bg-primary text-white'
												: 'bg-light text-dark'
										}`}
										style={{ maxWidth: '75%' }}
									>
										<div className='message-content'>{message.message}</div>
										<div
											className={`message-time mt-1 text-end small ${
												isCurrentUser ? 'text-white-50' : 'text-muted'
											}`}
										>
											{new Date(message.created_at).toLocaleTimeString(
												'pl-PL',
												{
													hour: '2-digit',
													minute: '2-digit',
												}
											)}{' '}
											|{' '}
											{new Date(message.created_at).toLocaleDateString(
												'pl-PL',
												{
													day: 'numeric',
													month: 'short',
												}
											)}
										</div>
									</div>
								</div>
							);
						})}
						<div ref={messagesEndRef}></div>
					</div>
				)}
			</div>
			<div className='card-footer'>
				<form onSubmit={handleSendMessage}>
					<div className='input-group'>
						<input
							type='text'
							className='form-control'
							placeholder='Napisz wiadomość...'
							value={newMessage}
							onChange={(e) => setNewMessage(e.target.value)}
							disabled={sending}
						/>
						<button
							type='submit'
							className='btn btn-primary'
							disabled={!newMessage.trim() || sending}
						>
							{sending ? (
								<span
									className='spinner-border spinner-border-sm'
									role='status'
									aria-hidden='true'
								></span>
							) : (
								<i className='fas fa-paper-plane'></i>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default ExchangeMessageSystem;
