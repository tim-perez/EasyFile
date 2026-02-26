import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import Cases from './components/Cases';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="cases" element={<Cases />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

// import { useContext } from 'react';
// import { AuthProvider } from './context/AuthProvider';
// import { AuthContext } from './context/AuthContext';
// import Login from './components/Login';
// import UploadForm from './components/UploadForm'; 

// function AppContent() {
//   // Pull the token and logout function from our AuthContext
//   const { token, logout } = useContext(AuthContext);

//   return (
//     <div className="App">
//       {token ? (
//         <>
//           <button onClick={logout} style={{ float: 'right', padding: '5px 10px' }}>
//             Logout
//           </button>
//           <UploadForm />
//         </>
//       ) : (
//         <Login />
//       )}
//     </div>
//   );
// }

// function App() {
//   return (
//     <AuthProvider>
//       <AppContent />
//     </AuthProvider>
//   );
// }

// export default App;