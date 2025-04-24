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

			// Update profiles table
			const { error: profileError } = await supabase
				.from('profiles')
				.update(data)
				.eq('id', user.id);

			if (profileError) {
				return { success: false, error: profileError.message };
			}

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : 'An unknown error occurred',
			};
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
