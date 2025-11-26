import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

function MainLayout() {
  return (
    <div>
      <Navbar />
      <main>
        <Outlet /> {/* Your dashboard components will render here */}
      </main>
    </div>
  );
}

export default MainLayout;