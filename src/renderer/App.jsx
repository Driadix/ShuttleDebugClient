import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import ShuttleDetails from './components/ShuttleDetails';
import './index.css'; // Ensure global styles are imported

// A simple hash-based router
const useHash = () => {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return hash;
};

// This component will now decide which "page" to show
// based on the URL hash, which main.js sets when opening a new window.
const App = () => {
  const hash = useHash();

  if (hash.startsWith('#/shuttle/')) {
    // This is the route for the Shuttle Details window
    return <ShuttleDetails />;
  }
  
  // The default view is the main Dashboard
  return <Dashboard />;
};

export default App;