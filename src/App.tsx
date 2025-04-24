import { BrowserRouter} from 'react-router-dom';
import Navbar from './components/Navbar';
import './index.css';
import Home from './pages/Home';
import Footer from './components/Footer';

function App() {
	return (
		<BrowserRouter>
			<div className='d-flex flex-column min-vh-100'>
				<Navbar />
				<Home />
				<Footer />
			</div>
		</BrowserRouter>
	);
}

export default App;
