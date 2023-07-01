import logo from './logo.svg';
import './App.css';
import Navbar from './components/Navbar/Navbar.jsx';
import Mainpage from './containers/Mainpage/Mainpage';

function App() {
  return (
    <div className="App">
      <div> <Navbar /> </div>
      <div> <Mainpage /></div>
    </div>
  );
}

export default App;
