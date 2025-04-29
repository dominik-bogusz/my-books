import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
	const [email, setEmail] = useState('');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { register } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
			setError('Proszę wypełnić wszystkie wymagane pola');
			return;
		}

		if (password !== confirmPassword) {
			setError('Hasła nie są identyczne');
			return;
		}

		if (password.length < 6) {
			setError('Hasło musi zawierać co najmniej 6 znaków');
			return;
		}

		try {
			setIsSubmitting(true);
			const { success, error } = await register(email, password, username);

			if (success) {
				navigate('/profile', { replace: true });
			} else {
				setError(error || 'Błąd rejestracji. Spróbuj ponownie.');
			}
		} catch (err) {
			setError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.');
			console.error('Błąd rejestracji:', err);
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
							<h2 className='text-center mb-4'>Zarejestruj się</h2>

							{error && (
								<div className='alert alert-danger' role='alert'>
									{error}
								</div>
							)}

							<form onSubmit={handleSubmit}>
								<div className='mb-3'>
									<label htmlFor='email' className='form-label'>
										Email *
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

								<div className='mb-3'>
									<label htmlFor='username' className='form-label'>
										Nazwa użytkownika
									</label>
									<input
										type='text'
										className='form-control'
										id='username'
										value={username}
										onChange={(e) => setUsername(e.target.value)}
									/>
									<div className='form-text'>
										Opcjonalne. Jeśli nie podasz, użyjemy części adresu email.
									</div>
								</div>

								<div className='mb-3'>
									<label htmlFor='password' className='form-label'>
										Hasło *
									</label>
									<input
										type='password'
										className='form-control'
										id='password'
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
										minLength={6}
									/>
									<div className='form-text'>Minimum 6 znaków.</div>
								</div>

								<div className='mb-4'>
									<label htmlFor='confirmPassword' className='form-label'>
										Potwierdź hasło *
									</label>
									<input
										type='password'
										className='form-control'
										id='confirmPassword'
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
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
											Rejestracja...
										</>
									) : (
										'Zarejestruj się'
									)}
								</button>
							</form>

							<div className='mt-4 text-center'>
								<p>
									Masz już konto?{' '}
									<Link
										to='/login'
										className='text-decoration-none fw-bold'
										style={{ color: '#DA831C' }}
									>
										Zaloguj się
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

export default Register;
