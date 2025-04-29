import PopularBooks from '../components/PopularBooks';

const Home = () => {
	return (
		<>
			<div
				className=' text-white text-center py-5'
				style={{
					backgroundColor: '#354045',
				}}
			>
				<div className='container py-4'>
					<h1 className='display-4 fw-bold'>
						Odkryj swoją następną ulubioną książkę
					</h1>
					<p className='lead mb-4'>
						Przeszukuj miliony książek, znajdź nową inspirację i odkryj
						wspaniałe historie.
					</p>
				</div>
			</div>

			<div className='py-5'>
				<div className='container'>
					<h2 className='text-center mb-3'>Odkrywaj, śledź i poznawaj</h2>
					<hr className='mb-5 w-50 mx-auto' />

					<div className='row g-4 text-center'>
						<div className='col-md-4'>
							<div className='card h-100 border-0 shadow-sm'>
								<div className='card-body p-4'>
									<div className='mb-3'></div>
									<h4
										style={{
											background:
												'linear-gradient(90deg, #DA831C 0%, #FFD028 100%)',
											WebkitBackgroundClip: 'text',
											WebkitTextFillColor: 'transparent',
											backgroundClip: 'text',
											fontWeight: 'bold',
										}}
									>
										Wyszukaj
									</h4>
									<p>Przeszukuj obszerną bazę książek z Google Books API</p>
								</div>
							</div>
						</div>
						<div className='col-md-4'>
							<div className='card h-100 border-0 shadow-sm'>
								<div className='card-body p-4'>
									<div className='mb-3'></div>
									<h4
										style={{
											background:
												'linear-gradient(90deg, #DA831C 0%, #FFD028 100%)',
											WebkitBackgroundClip: 'text',
											WebkitTextFillColor: 'transparent',
											backgroundClip: 'text',

											fontWeight: 'bold',
										}}
									>
										Odkrywaj
									</h4>
									<p>
										Znajdź nowe tytuły i autorów, które mogą Cię zainteresować
									</p>
								</div>
							</div>
						</div>
						<div className='col-md-4'>
							<div className='card h-100 border-0 shadow-sm'>
								<div className='card-body p-4'>
									<div className='mb-3'></div>
									<h4
										style={{
											background:
												'linear-gradient(90deg, #DA831C 0%, #FFD028 100%)',
											WebkitBackgroundClip: 'text',
											WebkitTextFillColor: 'transparent',
											backgroundClip: 'text',
											fontWeight: 'bold',
										}}
									>
										Poznawaj
									</h4>
									<p>
										Zobacz szczegółowe informacje o książkach, recenzje i oceny
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<section className='py-5 bg-light'>
				<PopularBooks />
			</section>
		</>
	);
};

export default Home;
