
// import axios from 'axios';

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5023/api';

// const authService = {
//   login: async (usernameOrEmail, password, rememberMe = false) => {
//     try {
//       const response = await axios.post(`${API_BASE_URL}/Auth/login`, {
//         usernameOrEmail,
//         password,
//         rememberMe,
//       });

//       if (response.data.token) {

//         localStorage.setItem('user', JSON.stringify(response.data)); 
//         return response.data;
//       }
//       return null;
//     } catch (error) {
//       console.error("Error en el login:", error.response?.data || error.message);
//       throw error; 
//     }
//   },

//   logout: () => {
//     localStorage.removeItem('user');
//   },

//   getCurrentUser: () => {
//     const user = localStorage.getItem('user');
//     return user ? JSON.parse(user) : null; 
//   },

//   getToken: () => {
//     const user = authService.getCurrentUser();
//     return user ? user.token : null;
//   }
// };

// export default authService;

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5023/api';
const STORAGE_KEY = 'user';

const authService = {
  login: async (usernameOrEmail, password, rememberMe = false) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/Auth/login`, {
        usernameOrEmail,
        password,
        rememberMe,
      });

      const user = response.data;

      if (user?.token) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        return user;
      }

      return null;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Error al iniciar sesión. Intenta nuevamente.";
      const enrichedError = new Error(message);
      enrichedError.response = error.response;
      throw enrichedError;
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
  },

  getCurrentUser: () => {
    const user = localStorage.getItem(STORAGE_KEY);
    return user ? JSON.parse(user) : null;
  },

  getToken: () => {
    return authService.getCurrentUser()?.token || null;
  }
};

export const authHeader = () => ({
  Authorization: `Bearer ${authService.getToken()}`
});

export default authService;
