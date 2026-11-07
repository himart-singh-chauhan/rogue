import { createContext, useState, useEffect, useContext } from 'react';
import { apiCall } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let userInfo = null;
    try {
      userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
    } catch {
      localStorage.removeItem('userInfo');
    }
    if (userInfo) {
      setUser(userInfo);
    }
    setLoading(false);

    // Re-validate the stored session in the background: drop it if the account no longer
    // exists, is banned/suspended, or the token expired; otherwise refresh the profile fields.
    if (userInfo?.token) {
      apiCall('/auth/profile', 'GET', null, userInfo.token)
        .then((fresh) => {
          const merged = { ...userInfo, ...fresh, token: userInfo.token };
          setUser(merged);
          localStorage.setItem('userInfo', JSON.stringify(merged));
        })
        .catch((err) => {
          if (/not authorized|token failed|banned|suspended|user not found/i.test(err.message || '')) {
            setUser(null);
            localStorage.removeItem('userInfo');
          }
          // Network / server errors keep the session (e.g. API cold start).
        });
    }
  }, []);

  const login = async (email, password) => {
    const data = await apiCall('/auth/login', 'POST', { email, password });
    setUser(data);
    localStorage.setItem('userInfo', JSON.stringify(data));
    return data;
  };

  const signup = async (signupData) => {
    const data = await apiCall('/auth/register', 'POST', signupData);
    setUser(data);
    localStorage.setItem('userInfo', JSON.stringify(data));
    return data;
  };

  const updateProfile = async (profileData) => {
    const data = await apiCall('/auth/profile', 'PUT', profileData, user.token);
    setUser(data);
    localStorage.setItem('userInfo', JSON.stringify(data));
    return data;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userInfo');
    localStorage.setItem('awr_logout_message', 'You have successfully logged out.');
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

