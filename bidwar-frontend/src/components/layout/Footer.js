import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <p>© {new Date().getFullYear()} BidWar. Tous droits réservés.</p>
        <p>
          {/* <Link to="/terms">Termes et Conditions</Link> | <Link to="/faq">FAQ</Link> */}
          <a href="/terms">Termes et Conditions</a> | <a href="/faq">FAQ</a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;