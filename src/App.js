import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Route, Router, Routes } from 'react-router-dom';
import Home from './pages/Home';

function App() {
  return (
    <div className='w-screen min-h-screen bg-richblack-900 flex flex-col  font-inter ' >
    <BrowserRouter>
    <Routes>
        <Route path='/' element={<Home/>} />
      </Routes>
    </BrowserRouter>
    </div>
  );
}

export default App;
