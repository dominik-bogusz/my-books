import { useState } from 'react';
import supabase from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface UseStorageReturn {
	uploadAvatar: (
		file: File
	) => Promise<{ url: string | null; error: string | null }>;
	isUploading: boolean;
}

const useStorage = (): UseStorageReturn => {
	const { user } = useAuth();
	const [isUploading, setIsUploading] = useState(false);

	/**
	 * Uploads an avatar image to Supabase Storage
	 */
	const uploadAvatar = async (
		file: File
	): Promise<{ url: string | null; error: string | null }> => {
		if (!user) {
			return { url: null, error: 'Użytkownik nie jest zalogowany' };
		}

		try {
			setIsUploading(true);

			// Sprawdzamy, czy to plik obrazu
			if (!file.type.startsWith('image/')) {
				return {
					url: null,
					error: 'Proszę wybrać plik obrazu (JPG, PNG, GIF)',
				};
			}

			// Sprawdzamy rozmiar pliku (max 2MB)
			if (file.size > 2 * 1024 * 1024) {
				return {
					url: null,
					error: 'Plik jest zbyt duży. Maksymalny rozmiar to 2MB',
				};
			}

			// Generujemy unikalną nazwę pliku
			const fileExt = file.name.split('.').pop();
			const fileName = `${user.id}-${Math.random()
				.toString(36)
				.substring(2)}.${fileExt}`;
			const filePath = `avatars/${fileName}`;

			// Najpierw sprawdzamy, czy bucket 'avatars' istnieje
			const { data: buckets } = await supabase.storage.listBuckets();

			// Jeśli bucket 'avatars' nie istnieje, tworzymy go
			if (!buckets?.find((bucket) => bucket.name === 'avatars')) {
				const { error: bucketError } = await supabase.storage.createBucket(
					'avatars',
					{
						public: true, // Ustaw jako publiczny, aby mieć dostęp do URL obrazów
					}
				);

				if (bucketError) {
					console.error('Błąd podczas tworzenia bucketu:', bucketError);
					return {
						url: null,
						error: 'Błąd podczas przygotowania przechowywania plików',
					};
				}
			}

			// Uploadujemy plik do Supabase Storage
			const { error: uploadError } = await supabase.storage
				.from('avatars')
				.upload(filePath, file, {
					cacheControl: '3600',
					upsert: true,
				});

			if (uploadError) {
				console.error('Błąd uploadu:', uploadError);
				return { url: null, error: 'Wystąpił błąd podczas przesyłania pliku' };
			}

			// Pobieramy publiczny URL pliku
			const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

			return { url: data.publicUrl, error: null };
		} catch (error) {
			console.error('Nieoczekiwany błąd podczas uploadu:', error);
			return {
				url: null,
				error:
					error instanceof Error
						? error.message
						: 'Wystąpił nieznany błąd podczas przesyłania pliku',
			};
		} finally {
			setIsUploading(false);
		}
	};

	return {
		uploadAvatar,
		isUploading,
	};
};

export default useStorage;
