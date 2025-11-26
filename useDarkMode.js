import { useEffect, useState } from 'react';

function useDarkMode() {
  // Get the theme from localStorage or default to 'light'
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // This effect runs whenever the theme changes
  useEffect(() => {
    const body = document.body;
    // Set the data-bs-theme attribute on the body
    body.setAttribute('data-bs-theme', theme);
    // Save the user's choice in localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

 
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return [theme, toggleTheme];
}

export default useDarkMode;