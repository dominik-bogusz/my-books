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
		// Check active sessions and sets the user
		supabase.auth.getSession().then(({ data: { session } }) => {
			setUser(session?.user ?? null);
			setIsLoading(false);
		});

		// Listen for auth changes
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
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error) {
				return { success: false, error: error.message };
			}

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : 'An unknown error occurred',
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

			// Sign up new user
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

			// Create a profile entry in the profiles table
			if (data.user) {
				const { error: profileError } = await supabase.from('profiles').insert({
					id: data.user.id,
					username: username || email.split('@')[0],
					email,
				});

				if (profileError) {
					// This is not a critical error - the user is still created
					console.error('Error creating profile:', profileError);
				}
			}

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : 'An unknown error occurred',
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
				return { success: false, error: 'Not authenticated' };
			}

			// Update auth metadata
			const { error: updateError } = await supabase.auth.updateUser({
				data,
			});

			if (updateError) {
				return { success: false, error: updateError.message };
			}

			// Create or update profiles table entry
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
				console.error('Error updating profile in database:', upsertError);
				return { success: false, error: upsertError.message };
			}

			return { success: true };
		} catch (error) {
			console.error('Unexpected error in updateProfile:', error);
			return {
				success: false,
				error:
					error instanceof Error ? error.message : 'An unknown error occurred',
			};
		}
	};

	const deleteAccount = async () => {
		try {
			if (!user) {
				return { success: false, error: 'Not authenticated' };
			}

			setIsLoading(true);

			// Delete user data from various tables
			// 1. Delete favorites
			const { error: favoritesError } = await supabase
				.from('favorites')
				.delete()
				.eq('user_id', user.id);

			if (favoritesError) {
				console.error('Error deleting favorites:', favoritesError);
				// Continue with deletion even if this fails
			}

			// 2. Delete reading list
			const { error: readingListError } = await supabase
				.from('reading_list')
				.delete()
				.eq('user_id', user.id);

			if (readingListError) {
				console.error('Error deleting reading list:', readingListError);
				// Continue with deletion even if this fails
			}

			// 3. Delete profile
			const { error: profileError } = await supabase
				.from('profiles')
				.delete()
				.eq('id', user.id);

			if (profileError) {
				console.error('Error deleting profile:', profileError);
				// Continue with deletion even if this fails
			}

			// 4. Delete user avatar from storage if exists
			try {
				// First check if avatar exists in metadata
				if (user.user_metadata?.avatar_url) {
					// Extract file path from URL
					const avatarUrl = user.user_metadata.avatar_url as string;
					const urlParts = avatarUrl.split('/');
					const fileName = urlParts[urlParts.length - 1];
					const filePath = `avatars/${fileName}`;

					// Delete the file
					const { error: storageError } = await supabase.storage
						.from('avatars')
						.remove([filePath]);

					if (storageError) {
						console.error('Error deleting avatar:', storageError);
					}
				}
			} catch (storageError) {
				console.error('Error handling avatar deletion:', storageError);
				// Continue with user deletion even if avatar deletion fails
			}

			// 5. Finally delete user account
			const { error: deleteError } = await supabase.auth.admin.deleteUser(
				user.id
			);

			// If admin API fails, try regular delete
			if (deleteError) {
				console.error(
					'Admin delete failed, trying regular delete:',
					deleteError
				);
				const { error: regularDeleteError } = await supabase.auth.updateUser({
					data: { deleted: true },
				});

				if (regularDeleteError) {
					return {
						success: false,
						error: `Nie udało się usunąć konta: ${regularDeleteError.message}`,
					};
				}
			}

			// Log out the user
			await supabase.auth.signOut();

			return { success: true };
		} catch (error) {
			console.error('Error in deleteAccount:', error);
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
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
