# Guide de Diagnostic - Problèmes d'Authentification

## 🔍 Étapes de Diagnostic

### Étape 1 : Vérifier que le backend répond

**Test 1 : Ping simple**
```bash
curl http://localhost:9090/test/ping
```

**Résultat attendu :**
```json
{
  "status": "OK",
  "message": "Backend is running",
  "timestamp": "1234567890"
}
```

**Si ça ne marche pas :**
- ❌ Backend non démarré → Démarrer le backend
- ❌ Port 9090 occupé → Vérifier avec `netstat -ano | findstr :9090`
- ❌ Erreur de connexion → Vérifier les logs du backend

---

### Étape 2 : Tester l'endpoint register directement

**Test 2 : Register avec curl**
```bash
curl -X POST http://localhost:9090/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser\",\"password\":\"test123\"}"
```

**Résultats possibles :**

✅ **Succès (201)** :
```json
{
  "id": 1,
  "username": "testuser",
  "role": "ADMIN",
  "password": null
}
```

❌ **Erreur 400** :
```json
{
  "error": "Le nom d'utilisateur existe déjà"
}
```
→ L'utilisateur existe déjà, essayez un autre nom

❌ **Erreur 500** :
```json
{
  "error": "Erreur lors de l'inscription",
  "message": "..."
}
```
→ Vérifier les logs du backend (console)

---

### Étape 3 : Tester depuis le frontend (console navigateur)

**Test 3 : Test JavaScript dans la console**
```javascript
// Ouvrir la console du navigateur (F12) et exécuter :

// Test 1 : Ping
fetch('http://localhost:9090/test/ping')
  .then(r => r.json())
  .then(d => console.log('Ping:', d))
  .catch(e => console.error('Ping Error:', e));

// Test 2 : Register
fetch('http://localhost:9090/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'testuser2',
    password: 'test123'
  })
})
  .then(r => r.json())
  .then(d => console.log('Register:', d))
  .catch(e => console.error('Register Error:', e));
```

**Vérifier dans la console :**
- ✅ Pas d'erreur CORS
- ✅ Réponse reçue
- ✅ Status code correct

---

### Étape 4 : Vérifier les logs du backend

**Dans la console où le backend tourne, chercher :**

1. **Au démarrage :**
   ```
   Started MsauthApplication in X.XXX seconds
   ```

2. **Lors d'une requête register :**
   ```
   === REGISTER REQUEST ===
   Received admin: testuser
   Attempting to register user: testuser
   User registered successfully: 1
   ```

3. **Erreurs possibles :**
   ```
   ERROR: Username is empty
   RUNTIME ERROR: Le nom d'utilisateur existe déjà
   EXCEPTION: Could not open JDBC Connection
   ```

---

### Étape 5 : Vérifier la base de données

**Test de connexion MySQL :**
```bash
mysql -u root -p -e "SHOW DATABASES;"
```

**Vérifier que la base existe :**
```bash
mysql -u root -p -e "USE msauth_db; SHOW TABLES;"
```

**Vérifier les utilisateurs créés :**
```bash
mysql -u root -p -e "USE msauth_db; SELECT * FROM admin;"
```

---

## 🐛 Problèmes Courants et Solutions

### Problème 1 : "Connection refused" ou Timeout

**Causes :**
- Backend non démarré
- Port 9090 bloqué par firewall
- Mauvaise URL

**Solutions :**
1. Démarrer le backend : `mvn spring-boot:run`
2. Vérifier le port : `netstat -ano | findstr :9090`
3. Vérifier l'URL dans le frontend

---

### Problème 2 : Erreur CORS

**Symptôme :**
```
Access to fetch at 'http://localhost:9090/auth/register' from origin 'http://localhost:4200' 
has been blocked by CORS policy
```

**Solutions :**
1. Vérifier que le port frontend est dans `CorsConfig.java`
2. Le pattern `http://localhost:*` devrait couvrir tous les ports
3. Redémarrer le backend après modification

---

### Problème 3 : Erreur 500 - Base de données

**Symptôme :**
```
EXCEPTION: Could not open JDBC Connection
```

**Solutions :**
1. Vérifier que MySQL est démarré
2. Vérifier les credentials dans `application.properties`
3. Vérifier que la base `msauth_db` existe

---

### Problème 4 : "Le nom d'utilisateur existe déjà"

**Solution :**
- Utiliser un autre nom d'utilisateur
- Ou supprimer l'utilisateur de la base :
  ```sql
  DELETE FROM admin WHERE username = 'testuser';
  ```

---

### Problème 5 : Le bouton reste en chargement

**Causes possibles :**
- Backend ne répond pas
- Erreur CORS bloquée
- Timeout réseau

**Solutions :**
1. Vérifier les logs du backend
2. Vérifier la console du navigateur (F12)
3. Tester avec curl pour isoler le problème

---

## 📋 Checklist Complète

Avant de dire "ça ne marche pas", vérifiez :

- [ ] Backend démarré et visible sur le port 9090
- [ ] MySQL démarré et accessible
- [ ] Test `/test/ping` fonctionne
- [ ] Test register avec curl fonctionne
- [ ] Pas d'erreur CORS dans la console navigateur
- [ ] Headers corrects dans les requêtes frontend
- [ ] Format JSON correct
- [ ] Logs du backend consultés
- [ ] Console navigateur consultée (F12)

---

## 🧪 Tests à Exécuter

### Test Complet (copier-coller dans la console navigateur)

```javascript
async function testAuth() {
  console.log('=== TEST COMPLET ===');
  
  // Test 1: Ping
  try {
    const ping = await fetch('http://localhost:9090/test/ping');
    const pingData = await ping.json();
    console.log('✅ Ping:', pingData);
  } catch (e) {
    console.error('❌ Ping failed:', e);
    return;
  }
  
  // Test 2: Register
  try {
    const register = await fetch('http://localhost:9090/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test' + Date.now(), password: 'test123' })
    });
    const registerData = await register.json();
    console.log('✅ Register:', registerData);
    
    if (register.ok) {
      // Test 3: Login
      const login = await fetch('http://localhost:9090/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: registerData.username, password: 'test123' })
      });
      const loginData = await login.json();
      console.log('✅ Login:', loginData);
    }
  } catch (e) {
    console.error('❌ Register/Login failed:', e);
  }
}

testAuth();
```

---

## 📞 Informations à Fournir si Problème Persiste

Si le problème persiste, fournir :

1. **Résultat du test ping** : `curl http://localhost:9090/test/ping`
2. **Résultat du test register** : `curl -X POST http://localhost:9090/auth/register ...`
3. **Logs du backend** (dernières 20 lignes)
4. **Console navigateur** (screenshot ou copier les erreurs)
5. **Version Java** : `java -version`
6. **Version Spring Boot** : Vérifier dans `pom.xml`

