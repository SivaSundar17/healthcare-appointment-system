import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const API_URL = 'http://localhost:8001'; // Auth Service (local)

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [token, setToken] = useState(null);

  // Load cached user on mount
  useEffect(() => {
    const cachedUser = localStorage.getItem('auth_user');
    const cachedRole = localStorage.getItem('auth_role');
    const cachedToken = localStorage.getItem('auth_token');
    
    if (cachedUser && cachedToken) {
      try {
        const parsedUser = JSON.parse(cachedUser);
        setUser(parsedUser);
        setUserRole(cachedRole);
        setToken(cachedToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${cachedToken}`;
      } catch (e) {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_role');
        localStorage.removeItem('auth_token');
      }
    }
    setLoading(false);
  }, []);

  // Register with email/password
  const register = async (email, password, displayName, role = 'patient') => {
    try {
      const firstName = displayName.split(' ')[0] || displayName;
      const lastName = displayName.split(' ').slice(1).join(' ') || 'User';
      
      const response = await axios.post(`${API_URL}/signup`, {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role
      });
      
      const { uid, token: accessToken, role: userRole, first_name, last_name } = response.data;
      
      const userObj = {
        uid,
        email,
        displayName: `${first_name} ${last_name}`,
        role: userRole
      };
      
      setUser(userObj);
      setUserRole(userRole);
      setToken(accessToken);
      
      localStorage.setItem('auth_user', JSON.stringify(userObj));
      localStorage.setItem('auth_role', userRole);
      localStorage.setItem('auth_token', accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      toast.success('Registration successful!');
      return { ...userObj, role: userRole };
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.detail || 'Registration failed');
      throw error;
    }
  };

  // Login with email/password
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password
      });
      
      const { uid, token: accessToken, role, first_name, last_name } = response.data;
      
      const userObj = {
        uid,
        email,
        displayName: `${first_name} ${last_name}`,
        role
      };
      
      setUser(userObj);
      setUserRole(role);
      setToken(accessToken);
      
      localStorage.setItem('auth_user', JSON.stringify(userObj));
      localStorage.setItem('auth_role', role);
      localStorage.setItem('auth_token', accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      toast.success('Login successful!');
      return { ...userObj, role };
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Login failed');
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_role');
    localStorage.removeItem('auth_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
    setUserRole(null);
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    userRole,
    loading,
    token,
    register,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export { AuthProvider };
export default AuthProvider;
