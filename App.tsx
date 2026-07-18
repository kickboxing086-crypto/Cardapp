import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerView from './pages/CustomerView';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import PixPayment from './pages/PixPayment';
import PublicOrderTicket from './pages/PublicOrderTicket';
import TermsAndPrivacy from './pages/TermsAndPrivacy';
import LandingPage from './pages/LandingPage';

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/s/:storeId" element={<CustomerView />} />
        <Route path="/cardapp/:storeId" element={<CustomerView />} />
        <Route path="/digimenu/:storeId" element={<CustomerView />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/pix-payment" element={<PixPayment />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/:storeId/order/:orderId/ticket" element={<PublicOrderTicket />} />
        <Route path="/termos-e-privacidade" element={<TermsAndPrivacy />} />
        <Route path="/:storeId" element={<CustomerView />} />
      </Routes>
    </div>
  );
}
