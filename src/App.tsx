import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import './index.css';
import Home from './pages/Home';
import Search from './pages/Search';
import BookDetail from './pages/BookDetail';
import Footer from './components/Footer';

function App() {
	return (
		<BrowserRouter>
			<div className='d-flex flex-column min-vh-100'>
				<Navbar />
				<Routes>
					<Route path='/' element={<Home />} />
					<Route path='/search' element={<Search />} />
					<Route path='/book/:id' element={<BookDetail />} />
				</Routes>
				<Footer />
			</div>
		</BrowserRouter>
	);
}

export default App;
