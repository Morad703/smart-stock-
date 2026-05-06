# Guide d'intégration Frontend - Authentification JWT

Ce guide explique comment intégrer l'API d'authentification JWT dans votre application frontend.

## Configuration Backend

Le backend est déjà configuré avec CORS pour accepter les requêtes depuis :
- `http://localhost:3000` (React)
- `http://localhost:4200` (Angular)
- `http://localhost:5173` (Vite)
- `http://localhost:8080` (Vue.js)

Si votre frontend utilise un autre port, modifiez `CorsConfig.java` pour ajouter votre URL.

## URL de l'API

Base URL : `http://localhost:9090`

## Endpoints disponibles

### 1. Register (Inscription)
```
POST /auth/register
Content-Type: application/json

Body:
{
  "username": "admin",
  "password": "password123"
}
```

### 2. Login (Connexion)
```
POST /auth/login
Content-Type: application/json

Body:
{
  "username": "admin",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "username": "admin",
  "role": "ADMIN"
}
```

### 3. Get Current User (Utilisateur connecté)
```
GET /auth/me
Authorization: Bearer <token>
```

### 4. Validate Token
```
GET /auth/validate
Authorization: Bearer <token>
```

## Exemples de code Frontend

### JavaScript / Fetch API

```javascript
const API_URL = 'http://localhost:9090';

// Fonction pour stocker le token
const saveToken = (token) => {
  localStorage.setItem('token', token);
};

// Fonction pour récupérer le token
const getToken = () => {
  return localStorage.getItem('token');
};

// Fonction pour supprimer le token
const removeToken = () => {
  localStorage.removeItem('token');
};

// Register
async function register(username, password) {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log('Inscription réussie:', data);
      return data;
    } else {
      console.error('Erreur:', data.error);
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    throw error;
  }
}

// Login
async function login(username, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    if (response.ok) {
      saveToken(data.token);
      console.log('Connexion réussie:', data);
      return data;
    } else {
      console.error('Erreur:', data.error);
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    throw error;
  }
}

// Get current user
async function getCurrentUser() {
  const token = getToken();
  if (!token) {
    throw new Error('Aucun token trouvé');
  }
  
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    if (response.ok) {
      return data;
    } else {
      if (response.status === 401) {
        removeToken();
        throw new Error('Token invalide ou expiré');
      }
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    throw error;
  }
}

// Logout
function logout() {
  removeToken();
  console.log('Déconnexion réussie');
}

// Utilisation
async function example() {
  try {
    // Inscription
    await register('admin', 'password123');
    
    // Connexion
    const loginData = await login('admin', 'password123');
    console.log('Token:', loginData.token);
    
    // Récupérer les infos utilisateur
    const user = await getCurrentUser();
    console.log('Utilisateur:', user);
    
    // Déconnexion
    logout();
  } catch (error) {
    console.error('Erreur:', error);
  }
}
```

### React avec Hooks

```jsx
import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:9090';

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sauvegarder le token
  const saveToken = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  // Supprimer le token
  const removeToken = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Register
  const register = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      saveToken(data.token);
      setUser({ username: data.username, role: data.role });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get current user
  const fetchUser = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) removeToken();
        throw new Error(data.error);
      }
      setUser(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    removeToken();
  };

  // Charger l'utilisateur au montage
  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token]);

  return {
    token,
    user,
    loading,
    error,
    register,
    login,
    logout,
    fetchUser,
  };
}

// Composant Login
function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      alert('Connexion réussie!');
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}
```

### Axios (Alternative)

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:9090';

// Créer une instance axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Fonctions API
export const authService = {
  register: (username, password) =>
    api.post('/auth/register', { username, password }),
  
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', response.data.token);
    return response.data;
  },
  
  getCurrentUser: () => api.get('/auth/me'),
  
  validateToken: () => api.get('/auth/validate'),
  
  logout: () => {
    localStorage.removeItem('token');
  },
};
```

## Gestion des erreurs

Toujours gérer les cas d'erreur :
- **400 Bad Request** : Données invalides
- **401 Unauthorized** : Token invalide ou expiré (rediriger vers login)
- **500 Internal Server Error** : Erreur serveur

## Sécurité

1. **Stockage du token** : Utilisez `localStorage` ou `sessionStorage`
2. **Expiration** : Le token expire après 24h (configurable)
3. **HTTPS** : En production, utilisez HTTPS
4. **Validation** : Validez toujours le token avant de faire des requêtes

## Test rapide

Vous pouvez tester avec curl :

```bash
# Register
curl -X POST http://localhost:9090/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Login
curl -X POST http://localhost:9090/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Get user (remplacez TOKEN par le token reçu)
curl -X GET http://localhost:9090/auth/me \
  -H "Authorization: Bearer TOKEN"
```


