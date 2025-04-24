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
import ProtectedRoute from './components/ProtectedRoute';

function App() {
	return (
		<AuthProvider>
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
					</Routes>
					<Footer />
				</div>
			</BrowserRouter>
		</AuthProvider>
	);
}

export default App;
