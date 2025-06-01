import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const MainLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1, paddingTop: 'calc(var(--navbar-height) + 1rem)', paddingBottom: 'calc(var(--footer-height) + 1rem)'}}>
        {children}
      </main>
      <Footer />
    </>
  );
};

export default MainLayout;