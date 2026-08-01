
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './Component/Home';
import Login from './Component/Login';
import AdminDashboard from './Component/AdminDashboard';
import Addcenter from './Component/Addcenter';

export const baseUrl = "http://192.168.1.22:80/API/trashAPI.php";

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />}></Route>
          <Route path='/Login' element={<Login />}></Route>
          <Route path='AdminDashboard' element={<AdminDashboard />}>
            <Route path='Addcenter' element={<Addcenter />}></Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
