import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import './index.css';
import Home from './pages/Home';
import Search from './pages/Search';
import BookDetail from './pages/BookDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Footer from './components/Footer';
import { AuthProvider } from './context/AuthContext';
import { SearchProvider } from './context/SearchContext';
import ProtectedRoute from './components/ProtectedRoute';
import UserProfile from './pages/UserProfile';
import ReadingStats from './components/ReadingStats';

function App() {
	return (
		<AuthProvider>
			<SearchProvider>
				<BrowserRouter>
					<div className='d-flex flex-column min-vh-100'>
						<Navbar />
						<Routes>
							<Route path='/' element={<Home />} />
							<Route path='/search' element={<Search />} />
							<Route path='/book/:id' element={<BookDetail />} />
							<Route path='/login' element={<Login />} />
							<Route path='/register' element={<Register />} />
							<Route
								path='/profile'
								element={
									<ProtectedRoute>
										<Profile />
									</ProtectedRoute>
								}
							/>
							<Route path='/user/:id' element={<UserProfile />} />
							<Route
								path='/reading-stats'
								element={
									<ProtectedRoute>
										<div className='container py-5'>
											<h2 className='mb-4'>Twoje statystyki czytelnicze</h2>
											<ReadingStats
												stats={null}
												isLoading={false}
												error={null}
											/>
										</div>
									</ProtectedRoute>
								}
							/>
						</Routes>
						<Footer />
					</div>
				</BrowserRouter>
			</SearchProvider>
		</AuthProvider>
	);
}

export default App;
