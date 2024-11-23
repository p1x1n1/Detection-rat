import './App.css';
import NavBar from './components/Navbar';
import AppRouter from './pages/AppRouter';
import Footer from './components/Footer';

function App() {
  return (
   <>
      <div className="App">
           <NavBar/>
           <AppRouter/>
           <Footer/>
      </div>
   </>
  );
}

export default App;
