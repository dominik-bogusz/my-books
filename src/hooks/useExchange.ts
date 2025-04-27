// src/hooks/useExchange.ts
import { useState, useEffect, useCallback } from 'react';
import {
	ExchangeOffer,
	ExchangeMessage,
	ExchangeTransaction,
	Book,
	BookCondition,
	ExchangeType,
	TransactionStatus,
} from '../types/book';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';

interface UseExchangeReturn {
	// Oferty wymiany
	exchangeOffers: ExchangeOffer[];
	userOffers: ExchangeOffer[];
	bookOffers: ExchangeOffer[];
	selectedOffer: ExchangeOffer | null;
	isLoadingOffers: boolean;
	offersError: string | null;

	// Wiadomości
	exchangeMessages: ExchangeMessage[];
	unreadMessagesCount: number;
	isLoadingMessages: boolean;
	messagesError: string | null;

	// Transakcje
	userTransactions: ExchangeTransaction[];
	activeTransactions: ExchangeTransaction[];
	isLoadingTransactions: boolean;
	transactionsError: string | null;

	// Akcje dla ofert
	createOffer: (
		book: Book,
		condition: BookCondition,
		exchangeType: ExchangeType,
		description?: string,
		location?: string
	) => Promise<boolean>;
	updateOffer: (
		offerId: string,
		updates: Partial<ExchangeOffer>
	) => Promise<boolean>;
	deleteOffer: (offerId: string) => Promise<boolean>;
	setOfferActive: (offerId: string, active: boolean) => Promise<boolean>;

	// Akcje dla wiadomości
	sendMessage: (
		offerId: string,
		recipientId: string,
		message: string
	) => Promise<boolean>;
	markMessageAsRead: (messageId: string) => Promise<boolean>;

	// Akcje dla transakcji
	requestExchange: (offerId: string, ownerId: string) => Promise<boolean>;
	updateTransactionStatus: (
		transactionId: string,
		status: TransactionStatus
	) => Promise<boolean>;

	// Funkcje pobierające dane
	fetchOffersByBook: (bookId: string) => Promise<void>;
	fetchUserOffers: () => Promise<void>;
	fetchOfferDetails: (offerId: string) => Promise<ExchangeOffer | null>;
	fetchOfferMessages: (offerId: string) => Promise<void>;
	fetchUserTransactions: () => Promise<void>;

	// Czyszczenie
	clearSelectedOffer: () => void;
}

export const useExchange = (bookId?: string): UseExchangeReturn => {
	const { user, isAuthenticated } = useAuth();

	// Stan dla ofert wymiany
	const [exchangeOffers, setExchangeOffers] = useState<ExchangeOffer[]>([]);
	const [userOffers, setUserOffers] = useState<ExchangeOffer[]>([]);
	const [bookOffers, setBookOffers] = useState<ExchangeOffer[]>([]);
	const [selectedOffer, setSelectedOffer] = useState<ExchangeOffer | null>(
		null
	);
	const [isLoadingOffers, setIsLoadingOffers] = useState(false);
	const [offersError, setOffersError] = useState<string | null>(null);

	// Stan dla wiadomości
	const [exchangeMessages, setExchangeMessages] = useState<ExchangeMessage[]>(
		[]
	);
	const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
	const [isLoadingMessages, setIsLoadingMessages] = useState(false);
	const [messagesError, setMessagesError] = useState<string | null>(null);

	// Stan dla transakcji
	const [userTransactions, setUserTransactions] = useState<
		ExchangeTransaction[]
	>([]);
	const [activeTransactions, setActiveTransactions] = useState<
		ExchangeTransaction[]
	>([]);
	const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
	const [transactionsError, setTransactionsError] = useState<string | null>(
		null
	);

	// Pobieranie ofert dla konkretnej książki
	const fetchOffersByBook = useCallback(async (bookId: string) => {
		if (!bookId) return;

		setIsLoadingOffers(true);
		setOffersError(null);

		try {
			const { data, error } = await supabase
				.from('exchange_offers')
				.select(
					`
          *,
          user_details:profiles(username, avatar_url)
        `
				)
				.eq('book_id', bookId)
				.eq('active', true)
				.order('created_at', { ascending: false });

			if (error) throw error;

			if (data) {
				const offers = data.map((offer) => ({
					...offer,
					book_data:
						typeof offer.book_data === 'string'
							? JSON.parse(offer.book_data)
							: offer.book_data,
				})) as ExchangeOffer[];

				setBookOffers(offers);
				setExchangeOffers(offers);
			}
		} catch (error) {
			console.error('Błąd podczas pobierania ofert wymiany:', error);
			setOffersError(
				'Nie udało się pobrać ofert wymiany. Spróbuj ponownie później.'
			);
		} finally {
			setIsLoadingOffers(false);
		}
	}, []);

	// Pobieranie ofert użytkownika
	const fetchUserOffers = useCallback(async () => {
		if (!isAuthenticated || !user) {
			setUserOffers([]);
			return;
		}

		setIsLoadingOffers(true);
		setOffersError(null);

		try {
			const { data, error } = await supabase
				.from('exchange_offers')
				.select(
					`
			  *,
			  user_details:profiles(username, avatar_url)
			`
				)
				.eq('user_id', user.id)
				.order('created_at', { ascending: false });

			if (error) throw error;

			if (data) {
				const offers = data.map((offer) => ({
					...offer,
					book_data:
						typeof offer.book_data === 'string'
							? JSON.parse(offer.book_data)
							: offer.book_data,
				})) as ExchangeOffer[];

				setUserOffers(offers);
			}
		} catch (error) {
			console.error('Błąd podczas pobierania ofert użytkownika:', error);
			setOffersError(
				'Nie udało się pobrać Twoich ofert. Spróbuj ponownie później.'
			);
		} finally {
			setIsLoadingOffers(false);
		}
	}, [isAuthenticated, user]);

	// Pobieranie szczegółów oferty
	const fetchOfferDetails = useCallback(
		async (offerId: string): Promise<ExchangeOffer | null> => {
			if (!offerId) return null;

			setIsLoadingOffers(true);
			setOffersError(null);

			try {
				const { data, error } = await supabase
					.from('exchange_offers')
					.select(
						`
          *,
          user_details:profiles(username, avatar_url)
        `
					)
					.eq('id', offerId)
					.single();

				if (error) throw error;

				if (data) {
					const offer = {
						...data,
						book_data:
							typeof data.book_data === 'string'
								? JSON.parse(data.book_data)
								: data.book_data,
					} as ExchangeOffer;

					setSelectedOffer(offer);
					return offer;
				}

				return null;
			} catch (error) {
				console.error('Błąd podczas pobierania szczegółów oferty:', error);
				setOffersError(
					'Nie udało się pobrać szczegółów oferty. Spróbuj ponownie później.'
				);
				return null;
			} finally {
				setIsLoadingOffers(false);
			}
		},
		[]
	);

	// Tworzenie nowej oferty wymiany
	const createOffer = async (
		book: Book,
		condition: BookCondition,
		exchangeType: ExchangeType,
		description?: string,
		location?: string
	): Promise<boolean> => {
		if (!isAuthenticated || !user) {
			setOffersError('Musisz być zalogowany, aby dodać ofertę wymiany.');
			return false;
		}

		if (!book) {
			setOffersError('Brak danych książki.');
			return false;
		}

		setIsLoadingOffers(true);
		setOffersError(null);

		try {
			const { data, error } = await supabase
				.from('exchange_offers')
				.insert({
					user_id: user.id,
					book_id: book.id,
					book_data: JSON.stringify(book),
					condition,
					description: description || null,
					exchange_type: exchangeType,
					location: location || null,
					active: true,
				})
				.select()
				.single();

			if (error) throw error;

			if (data) {
				const newOffer = {
					...data,
					book_data:
						typeof data.book_data === 'string'
							? JSON.parse(data.book_data)
							: data.book_data,
				} as ExchangeOffer;

				// Aktualizujemy stan
				setUserOffers((prev) => [newOffer, ...prev]);

				if (book.id === bookId) {
					setBookOffers((prev) => [newOffer, ...prev]);
					setExchangeOffers((prev) => [newOffer, ...prev]);
				}

				return true;
			}

			return false;
		} catch (error) {
			console.error('Błąd podczas dodawania oferty wymiany:', error);
			setOffersError(
				'Nie udało się dodać oferty wymiany. Spróbuj ponownie później.'
			);
			return false;
		} finally {
			setIsLoadingOffers(false);
		}
	};

	// Aktualizacja oferty
	const updateOffer = async (
		offerId: string,
		updates: Partial<ExchangeOffer>
	): Promise<boolean> => {
		if (!isAuthenticated || !user) {
			setOffersError(
				'Musisz być zalogowany, aby zaktualizować ofertę wymiany.'
			);
			return false;
		}

		if (!offerId) {
			setOffersError('Brak ID oferty.');
			return false;
		}

		setIsLoadingOffers(true);
		setOffersError(null);

		

	const deleteOffer = async (offerId: string): Promise<boolean> => {
		if (!isAuthenticated || !user) {
			setOffersError('Musisz być zalogowany, aby usunąć ofertę wymiany.');
			return false;
		}

		if (!offerId) {
			setOffersError('Brak ID oferty.');
			return false;
		}

		setIsLoadingOffers(true);
		setOffersError(null);

		try {
			const { error } = await supabase
				.from('exchange_offers')
				.delete()
				.eq('id', offerId)
				.eq('user_id', user.id);

			if (error) throw error;

			setUserOffers((prev) => prev.filter((offer) => offer.id !== offerId));
			setBookOffers((prev) => prev.filter((offer) => offer.id !== offerId));
			setExchangeOffers((prev) => prev.filter((offer) => offer.id !== offerId));

			if (selectedOffer && selectedOffer.id === offerId) {
				setSelectedOffer(null);
			}

			return true;
		} catch (error) {
			console.error('Błąd podczas usuwania oferty wymiany:', error);
			setOffersError(
				'Nie udało się usunąć oferty wymiany. Spróbuj ponownie później.'
			);
			return false;
		} finally {
			setIsLoadingOffers(false);
		}
	};

	const setOfferActive = async (
		offerId: string,
		active: boolean
	): Promise<boolean> => {
		return await updateOffer(offerId, { active });
	};

	const clearSelectedOffer = () => {
		setSelectedOffer(null);
	};

	const fetchOfferMessages = useCallback(
		async (offerId: string) => {
			if (!isAuthenticated || !user || !offerId) return;

			setIsLoadingMessages(true);
			setMessagesError(null);

			try {
				const { data, error } = await supabase
					.from('exchange_messages')
					.select(
						`
          *,
          sender_details:profiles!sender_id(username, avatar_url)
        `
					)
					.eq('exchange_offer_id', offerId)
					.order('created_at', { ascending: true });

				if (error) throw error;

				if (data) {
					setExchangeMessages(data as ExchangeMessage[]);
				}
			} catch (error) {
				console.error('Błąd podczas pobierania wiadomości:', error);
				setMessagesError(
					'Nie udało się pobrać wiadomości. Spróbuj ponownie później.'
				);
			} finally {
				setIsLoadingMessages(false);
			}
		},
		[isAuthenticated, user]
	);

	const sendMessage = async (
		offerId: string,
		recipientId: string,
		message: string
	): Promise<boolean> => {
		if (!isAuthenticated || !user) {
			setMessagesError('Musisz być zalogowany, aby wysłać wiadomość.');
			return false;
		}

		if (!offerId || !recipientId || !message.trim()) {
			setMessagesError('Brak wymaganych danych do wysłania wiadomości.');
			return false;
		}

		setIsLoadingMessages(true);
		setMessagesError(null);

		try {
			const { data, error } = await supabase
				.from('exchange_messages')
				.insert({
					exchange_offer_id: offerId,
					sender_id: user.id,
					recipient_id: recipientId,
					message: message.trim(),
					read: false,
				})
				.select(
					`
          *,
          sender_details:profiles!sender_id(username, avatar_url)
        `
				)
				.single();

			if (error) throw error;

			if (data) {
				setExchangeMessages((prev) => [...prev, data as ExchangeMessage]);
				return true;
			}

			return false;
		} catch (error) {
			console.error('Błąd podczas wysyłania wiadomości:', error);
			setMessagesError(
				'Nie udało się wysłać wiadomości. Spróbuj ponownie później.'
			);
			return false;
		} finally {
			setIsLoadingMessages(false);
		}
	};

	const markMessageAsRead = async (messageId: string): Promise<boolean> => {
		if (!isAuthenticated || !user) {
			setMessagesError(
				'Musisz być zalogowany, aby oznaczyć wiadomość jako przeczytaną.'
			);
			return false;
		}

		if (!messageId) {
			setMessagesError('Brak ID wiadomości.');
			return false;
		}

		try {
			const { error } = await supabase
				.from('exchange_messages')
				.update({ read: true })
				.eq('id', messageId)
				.eq('recipient_id', user.id);

			if (error) throw error;

			setExchangeMessages((prev) =>
				prev.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg))
			);

			// Aktualizujemy licznik nieprzeczytanych wiadomości
			fetchUnreadMessagesCount();

			return true;
		} catch (error) {
			console.error(
				'Błąd podczas oznaczania wiadomości jako przeczytanej:',
				error
			);
			return false;
		}
	};

	// Pobieranie liczby nieprzeczytanych wiadomości
	const fetchUnreadMessagesCount = useCallback(async () => {
		if (!isAuthenticated || !user) return;

		try {
			const { data, error, count } = await supabase
				.from('exchange_messages')
				.select('id', { count: 'exact', head: true })
				.eq('recipient_id', user.id)
				.eq('read', false);

			if (error) throw error;

			if (count !== null) {
				setUnreadMessagesCount(count);
			}
		} catch (error) {
			console.error(
				'Błąd podczas pobierania liczby nieprzeczytanych wiadomości:',
				error
			);
		}
	}, [isAuthenticated, user]);

	// Pobieranie transakcji użytkownika
	const fetchUserTransactions = useCallback(async () => {
		if (!isAuthenticated || !user) return;

		setIsLoadingTransactions(true);
		setTransactionsError(null);

		try {
			const { data, error } = await supabase
				.from('exchange_transactions')
				.select(
					`
          *,
          offer_details:exchange_offers(*),
          requester_details:profiles!requester_id(username, avatar_url),
          owner_details:profiles!owner_id(username, avatar_url)
        `
				)
				.or(`requester_id.eq.${user.id},owner_id.eq.${user.id}`)
				.order('created_at', { ascending: false });

			if (error) throw error;

			if (data) {
				// Przetwarzamy dane, aby mieć prawidłowy format book_data w offer_details
				const transactions = data.map((transaction) => {
					if (
						transaction.offer_details &&
						transaction.offer_details.book_data
					) {
						return {
							...transaction,
							offer_details: {
								...transaction.offer_details,
								book_data:
									typeof transaction.offer_details.book_data === 'string'
										? JSON.parse(transaction.offer_details.book_data)
										: transaction.offer_details.book_data,
							},
						};
					}
					return transaction;
				}) as ExchangeTransaction[];

				setUserTransactions(transactions);

				// Filtrujemy aktywne transakcje (oczekujące lub zaakceptowane)
				const active = transactions.filter(
					(t) => t.status === 'oczekująca' || t.status === 'zaakceptowana'
				);
				setActiveTransactions(active);
			}
		} catch (error) {
			console.error('Błąd podczas pobierania transakcji:', error);
			setTransactionsError(
				'Nie udało się pobrać transakcji. Spróbuj ponownie później.'
			);
		} finally {
			setIsLoadingTransactions(false);
		}
	}, [isAuthenticated, user]);

	// Żądanie wymiany książki
	const requestExchange = async (
		offerId: string,
		ownerId: string
	): Promise<boolean> => {
		if (!isAuthenticated || !user) {
			setTransactionsError(
				'Musisz być zalogowany, aby złożyć prośbę o wymianę.'
			);
			return false;
		}

		if (!offerId || !ownerId) {
			setTransactionsError(
				'Brak wymaganych danych do złożenia prośby o wymianę.'
			);
			return false;
		}

		// Sprawdzenie, czy użytkownik nie próbuje wymienić książki z samym sobą
		if (user.id === ownerId) {
			setTransactionsError('Nie możesz wymienić książki sam ze sobą.');
			return false;
		}

		setIsLoadingTransactions(true);
		setTransactionsError(null);

		try {
			// Najpierw sprawdzamy, czy istnieje już transakcja dla tej oferty od tego użytkownika
			const { data: existingTransaction, error: checkError } = await supabase
				.from('exchange_transactions')
				.select('*')
				.eq('exchange_offer_id', offerId)
				.eq('requester_id', user.id)
				.not('status', 'in', '("odrzucona","zakończona","anulowana")')
				.maybeSingle();

			if (checkError) throw checkError;

			// Jeśli istnieje aktywna transakcja, zwracamy błąd
			if (existingTransaction) {
				setTransactionsError(
					'Już złożyłeś prośbę o wymianę tej książki. Poczekaj na odpowiedź właściciela.'
				);
				return false;
			}

			// Pobieramy szczegóły oferty
			const { data: offerData, error: offerError } = await supabase
				.from('exchange_offers')
				.select('exchange_type')
				.eq('id', offerId)
				.single();

			if (offerError) throw offerError;

			if (!offerData) {
				setTransactionsError('Nie znaleziono oferty wymiany.');
				return false;
			}

			// Tworzymy nową transakcję
			const { data, error } = await supabase
				.from('exchange_transactions')
				.insert({
					exchange_offer_id: offerId,
					requester_id: user.id,
					owner_id: ownerId,
					status: 'oczekująca',
					transaction_type: offerData.exchange_type,
				})
				.select(
					`
          *,
          offer_details:exchange_offers(*),
          requester_details:profiles!requester_id(username, avatar_url),
          owner_details:profiles!owner_id(username, avatar_url)
        `
				)
				.single();

			if (error) throw error;

			if (data) {
				// Przetwarzamy dane, aby mieć prawidłowy format book_data w offer_details
				const newTransaction = {
					...data,
					offer_details: data.offer_details && {
						...data.offer_details,
						book_data:
							typeof data.offer_details.book_data === 'string'
								? JSON.parse(data.offer_details.book_data)
								: data.offer_details.book_data,
					},
				} as ExchangeTransaction;

				// Aktualizujemy stan
				setUserTransactions((prev) => [newTransaction, ...prev]);
				setActiveTransactions((prev) => [newTransaction, ...prev]);

				return true;
			}

			return false;
		} catch (error) {
			console.error('Błąd podczas składania prośby o wymianę:', error);
			setTransactionsError(
				'Nie udało się złożyć prośby o wymianę. Spróbuj ponownie później.'
			);
			return false;
		} finally {
			setIsLoadingTransactions(false);
		}
	};

	// Aktualizacja statusu transakcji
	const updateTransactionStatus = async (
		transactionId: string,
		status: TransactionStatus
	): Promise<boolean> => {
		if (!isAuthenticated || !user) {
			setTransactionsError(
				'Musisz być zalogowany, aby zaktualizować status transakcji.'
			);
			return false;
		}

		if (!transactionId) {
			setTransactionsError('Brak ID transakcji.');
			return false;
		}

		setIsLoadingTransactions(true);
		setTransactionsError(null);

		try {
			const updateData: any = {
				status,
				updated_at: new Date().toISOString(),
			};

			// Jeśli status to "zakończona", dodajemy datę zakończenia
			if (status === 'zakończona') {
				updateData.completed_at = new Date().toISOString();
			}

			const { data, error } = await supabase
				.from('exchange_transactions')
				.update(updateData)
				.eq('id', transactionId)
				.or(`requester_id.eq.${user.id},owner_id.eq.${user.id}`) // Tylko właściciel lub proszący może aktualizować
				.select(
					`
          *,
          offer_details:exchange_offers(*),
          requester_details:profiles!requester_id(username, avatar_url),
          owner_details:profiles!owner_id(username, avatar_url)
        `
				)
				.single();

			if (error) throw error;

			if (data) {
				// Przetwarzamy dane, aby mieć prawidłowy format book_data w offer_details
				const updatedTransaction = {
					...data,
					offer_details: data.offer_details && {
						...data.offer_details,
						book_data:
							typeof data.offer_details.book_data === 'string'
								? JSON.parse(data.offer_details.book_data)
								: data.offer_details.book_data,
					},
				} as ExchangeTransaction;

				// Aktualizujemy stan
				setUserTransactions((prev) =>
					prev.map((tr) => (tr.id === transactionId ? updatedTransaction : tr))
				);

				// Jeśli transakcja jest zakończona, odrzucona lub anulowana, usuwamy ją z aktywnych
				if (
					status === 'zakończona' ||
					status === 'odrzucona' ||
					status === 'anulowana'
				) {
					setActiveTransactions((prev) =>
						prev.filter((tr) => tr.id !== transactionId)
					);
				} else {
					setActiveTransactions((prev) =>
						prev.map((tr) =>
							tr.id === transactionId ? updatedTransaction : tr
						)
					);
				}

				// Jeśli transakcja jest zakończona, dezaktywujemy ofertę
				if (status === 'zakończona' && updatedTransaction.offer_details) {
					await setOfferActive(updatedTransaction.offer_details.id, false);
				}

				return true;
			}

			return false;
		} catch (error) {
			console.error('Błąd podczas aktualizacji statusu transakcji:', error);
			setTransactionsError(
				'Nie udało się zaktualizować statusu transakcji. Spróbuj ponownie później.'
			);
			return false;
		} finally {
			setIsLoadingTransactions(false);
		}
	};

	// Efekty dla ładowania początkowego
	useEffect(() => {
		if (bookId) {
			fetchOffersByBook(bookId);
		}

		if (isAuthenticated && user) {
			fetchUserOffers();
			fetchUserTransactions();
			fetchUnreadMessagesCount();
		}
	}, [
		bookId,
		isAuthenticated,
		user,
		fetchOffersByBook,
		fetchUserOffers,
		fetchUserTransactions,
		fetchUnreadMessagesCount,
	]);

	return {
		// Oferty wymiany
		exchangeOffers,
		userOffers,
		bookOffers,
		selectedOffer,
		isLoadingOffers,
		offersError,

		// Wiadomości
		exchangeMessages,
		unreadMessagesCount,
		isLoadingMessages,
		messagesError,

		// Transakcje
		userTransactions,
		activeTransactions,
		isLoadingTransactions,
		transactionsError,

		// Akcje dla ofert
		createOffer,
		updateOffer,
		deleteOffer,
		setOfferActive,

		// Akcje dla wiadomości
		sendMessage,
		markMessageAsRead,

		// Akcje dla transakcji
		requestExchange,
		updateTransactionStatus,

		// Funkcje
		fetchOffersByBook,
		fetchUserOffers,
		fetchOfferDetails,
		fetchOfferMessages,
		fetchUserTransactions,

		// Czyszczenie
		clearSelectedOffer,
	};
};

export default useExchange;
