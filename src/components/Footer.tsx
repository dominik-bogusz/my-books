import { Link } from 'react-router-dom';

const Footer = () => {
	return (
		<footer className='bg-light py-4 mt-auto'>
			<div className='container'>
				<hr className='my-4' />
				<div className='text-center'>
					<p className='mb-2'>
						&copy; {new Date().getFullYear()} My Books - Aplikacja do
						zarządzania książkami
					</p>
					<div className='footer-links'>
						<Link to='/' className='text-decoration-none me-3'>
							Strona główna
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
