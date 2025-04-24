import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { login } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	// Get redirect path from location state or default to home
	const from = location.state?.from?.pathname || '/';

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!email.trim() || !password.trim()) {
			setError('Proszę wypełnić wszystkie pola');
			return;
		}

		try {
			setIsSubmitting(true);
			const { success, error } = await login(email, password);

			if (success) {
				navigate(from, { replace: true });
			} else {
				setError(error || 'Błąd logowania. Sprawdź email i hasło.');
			}
		} catch (err) {
			setError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.');
			console.error('Login error:', err);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className='container py-5'>
			<div className='row justify-content-center'>
				<div className='col-12 col-md-8 col-lg-6'>
					<div className='card shadow'>
						<div className='card-body p-5'>
							<h2 className='text-center mb-4'>Zaloguj się</h2>

							{error && (
								<div className='alert alert-danger' role='alert'>
									{error}
								</div>
							)}

							<form onSubmit={handleSubmit}>
								<div className='mb-3'>
									<label htmlFor='email' className='form-label'>
										Email
									</label>
									<input
										type='email'
										className='form-control'
										id='email'
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
									/>
								</div>

								<div className='mb-4'>
									<label htmlFor='password' className='form-label'>
										Hasło
									</label>
									<input
										type='password'
										className='form-control'
										id='password'
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
									/>
								</div>

								<button
									type='submit'
									className='btn w-100 text-white'
									style={{
										background:
											'linear-gradient(90deg, #DA831C 0%, #FFD028 100%)',
										border: 'none',
									}}
									disabled={isSubmitting}
								>
									{isSubmitting ? (
										<>
											<span
												className='spinner-border spinner-border-sm me-2'
												role='status'
												aria-hidden='true'
											></span>
											Logowanie...
										</>
									) : (
										'Zaloguj się'
									)}
								</button>
							</form>

							<div className='mt-4 text-center'>
								<p>
									Nie masz konta?{' '}
									<Link
										to='/register'
										className='text-decoration-none fw-bold'
										style={{ color: '#DA831C' }}
									>
										Zarejestruj się
									</Link>
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Login;
