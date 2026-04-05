import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FarmProvider } from './context/FarmContext';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Payroll from './pages/Payroll';
import Lots from './pages/Lots';

export default function App() {
  return (
    <BrowserRouter>
      <FarmProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/lots" element={<Lots />} />
          </Routes>
        </Layout>
      </FarmProvider>
    </BrowserRouter>
  );
}
