import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import supabase from '../lib/supabase';

interface AuthContextType {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (
		email: string,
		password: string
	) => Promise<{
		success: boolean;
		error?: string;
	}>;
	register: (
		email: string,
		password: string,
		username?: string
	) => Promise<{
		success: boolean;
		error?: string;
	}>;
	logout: () => Promise<void>;
	updateProfile: (data: { username?: string; avatar_url?: string }) => Promise<{
		success: boolean;
		error?: string;
	}>;
	deleteAccount: () => Promise<{
		success: boolean;
		error?: string;
	}>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setUser(session?.user ?? null);
			setIsLoading(false);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
			setIsLoading(false);
		});

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	const login = async (email: string, password: string) => {
		try {
			setIsLoading(true);
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error) {
				return { success: false, error: error.message };
			}

			if (
				data.user &&
				data.user.user_metadata &&
				data.user.user_metadata.account_status === 'deleted'
			) {
				await supabase.auth.signOut();
				return {
					success: false,
					error:
						'To konto zostało usunięte. Jeśli chcesz utworzyć nowe konto, użyj funkcji rejestracji.',
				};
			}

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : 'Wystąpił nieznany błąd',
			};
		} finally {
			setIsLoading(false);
		}
	};

	const register = async (
		email: string,
		password: string,
		username?: string
	) => {
		try {
			setIsLoading(true);

			const { error: signUpError, data } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: {
						username: username || email.split('@')[0],
					},
				},
			});

			if (signUpError) {
				return { success: false, error: signUpError.message };
			}

			if (data.user) {
				const { error: profileError } = await supabase.from('profiles').insert({
					id: data.user.id,
					username: username || email.split('@')[0],
					email,
				});

				if (profileError) {
					console.error('Błąd przy tworzeniu konta:', profileError);
				}
			}

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : 'Wystąpił nieznany błąd',
			};
		} finally {
			setIsLoading(false);
		}
	};

	const logout = async () => {
		try {
			setIsLoading(true);
			await supabase.auth.signOut();
		} finally {
			setIsLoading(false);
		}
	};

	const updateProfile = async (data: {
		username?: string;
		avatar_url?: string;
	}) => {
		try {
			if (!user) {
				return { success: false, error: 'Nie zautoryzowano' };
			}

			const { error: updateError } = await supabase.auth.updateUser({
				data,
			});

			if (updateError) {
				return { success: false, error: updateError.message };
			}

			const { error: upsertError } = await supabase.from('profiles').upsert(
				{
					id: user.id,
					email: user.email,
					username:
						data.username ||
						user.user_metadata?.username ||
						user.email?.split('@')[0],
					avatar_url: data.avatar_url,
					updated_at: new Date().toISOString(),
				},
				{ onConflict: 'id' }
			);

			if (upsertError) {
				return { success: false, error: upsertError.message };
			}

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : 'Wystąpił nieznany błąd',
			};
		}
	};

	const deleteAccount = async () => {
		try {
			if (!user) {
				return { success: false, error: 'Nie zautoryzowano' };
			}

			setIsLoading(true);

			const { error: favoritesError } = await supabase
				.from('favorites')
				.delete()
				.eq('user_id', user.id);

			if (favoritesError) {
				console.error(favoritesError);
			}

			const { error: readingListError } = await supabase
				.from('reading_list')
				.delete()
				.eq('user_id', user.id);

			if (readingListError) {
				console.error(readingListError);
			}

			const { error: profileError } = await supabase
				.from('profiles')
				.delete()
				.eq('id', user.id);

			if (profileError) {
				console.error();
			}

			try {
				if (user.user_metadata?.avatar_url) {
					const avatarUrl = user.user_metadata.avatar_url as string;
					const urlParts = avatarUrl.split('/');
					const fileName = urlParts[urlParts.length - 1];
					const filePath = `avatars/${fileName}`;

					const { error: storageError } = await supabase.storage
						.from('avatars')
						.remove([filePath]);

					if (storageError) {
						console.error();
					}
				}
			} catch {
				console.error();
			}

			const { error: updateError } = await supabase.auth.updateUser({
				data: {
					account_status: 'deleted',
					deleted_at: new Date().toISOString(),
				},
			});

			if (updateError) {
				return {
					success: false,
					error: `Nie udało się usunąć konta: ${updateError.message}`,
				};
			}

			const randomPassword =
				Math.random().toString(36).slice(2) +
				Math.random().toString(36).slice(2) +
				Math.random().toString(36).slice(2);

			const { error: passwordUpdateError } = await supabase.auth.updateUser({
				password: randomPassword,
			});

			if (passwordUpdateError) {
				console.error(
					passwordUpdateError
				);
			}

			await supabase.auth.signOut();

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: 'Wystąpił nieznany błąd podczas usuwania konta',
			};
		} finally {
			setIsLoading(false);
		}
	};

	const value = {
		user,
		isAuthenticated: !!user,
		isLoading,
		login,
		register,
		logout,
		updateProfile,
		deleteAccount,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error;
	}
	return context;
};
