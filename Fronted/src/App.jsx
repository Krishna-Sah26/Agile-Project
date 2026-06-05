// import { BrowserRouter, Routes, Route } from "react-router-dom";

// import Register from "./pages/Register";
// import Dashboard from "./pages/Dashboard";

// function App() {

//   return (

//     <BrowserRouter>

//       <Routes>

//         <Route path="/" element={<Register />} />

//         <Route path="/dashboard" element={<Dashboard />} />

//       </Routes>

//     </BrowserRouter>

//   );

// }
// export default App;

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import StaffDashboard from "./pages/StaffDashboard";
import StaffLogin from "./pages/StaffLogin";
import JoinQueue from "./pages/JoinQueue"; // ADDED: Join Queue page
import QueueStatus from "./pages/QueueStatus"; // ADDED: Live queue status page

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/staff-login" element={<StaffLogin />} />
        
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/staff-dashboard" element={<StaffDashboard />} />
        <Route path="/join/:id" element={<JoinQueue />} /> {/* ADDED: QR join route */}
        <Route path="/status/:token" element={<QueueStatus />} /> {/* ADDED: status route */}
      </Routes>
    </BrowserRouter>
  );
}
export default App;
