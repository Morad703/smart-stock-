# Guide de dépannage - Authentification JWT

## Problèmes courants et solutions

### 1. Backend non démarré

**Symptômes :**
- Timeout après 10 secondes
- Erreur "Connection refused"
- Le bouton reste en chargement

**Solutions :**
1. Vérifier que le backend est démarré :
   ```bash
   # Vérifier si le port 9090 est utilisé
   netstat -ano | findstr :9090  # Windows
   lsof -i :9090                  # Linux/Mac
   ```

2. Démarrer le backend :
   ```bash
   mvn spring-boot:run
   # ou
   java -jar target/msauth-0.0.1-SNAPSHOT.jar
   ```

3. Vérifier les logs du backend pour voir s'il y a des erreurs

### 2. Erreurs CORS

**Symptômes :**
- Erreur dans la console : "Access to fetch at '...' from origin '...' has been blocked by CORS policy"
- Erreur "No 'Access-Control-Allow-Origin' header"

**Solutions :**

1. **Vérifier que le port du frontend est autorisé** :
   - Le backend autorise maintenant tous les ports localhost avec le pattern `http://localhost:*`
   - Si vous utilisez une autre URL, modifiez `CorsConfig.java`

2. **Vérifier la configuration CORS** :
   - Ouvrir `CorsConfig.java`
   - Vérifier que votre URL frontend est dans la liste `setAllowedOriginPatterns`

3. **Tester avec curl** pour isoler le problème :
   ```bash
   # Test de preflight OPTIONS
   curl -X OPTIONS http://localhost:9090/auth/register \
     -H "Origin: http://localhost:4200" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -v
   
   # Test de requête réelle
   curl -X POST http://localhost:9090/auth/register \
     -H "Origin: http://localhost:4200" \
     -H "Content-Type: application/json" \
     -d '{"username":"test","password":"test123"}' \
     -v
   ```

### 3. Timeout / Pas de réponse

**Symptômes :**
- Requête qui reste en chargement
- Timeout après 10 secondes
- Pas de réponse du serveur

**Solutions :**

1. **Vérifier que le backend répond** :
   ```bash
   # Test simple
   curl http://localhost:9090/auth/register
   ```

2. **Vérifier les logs du backend** :
   - Regarder la console où le backend tourne
   - Chercher des erreurs de connexion à la base de données
   - Vérifier les erreurs de démarrage

3. **Vérifier la base de données MySQL** :
   - S'assurer que MySQL est démarré
   - Vérifier les credentials dans `application.properties`
   - Tester la connexion :
     ```bash
     mysql -u root -p -e "SHOW DATABASES;"
     ```

4. **Vérifier le firewall** :
   - S'assurer que le port 9090 n'est pas bloqué

### 4. Erreur 401 Unauthorized

**Symptômes :**
- Erreur "Nom d'utilisateur ou mot de passe incorrect"
- Token invalide

**Solutions :**

1. **Vérifier les credentials** :
   - S'assurer que l'utilisateur existe
   - Vérifier que le mot de passe est correct

2. **Vérifier le token JWT** :
   - S'assurer que le token est bien envoyé dans le header `Authorization`
   - Format : `Authorization: Bearer <token>`
   - Vérifier que le token n'est pas expiré (24h par défaut)

### 5. Erreur 400 Bad Request

**Symptômes :**
- "Le nom d'utilisateur est requis"
- "Le mot de passe est requis"
- "Le nom d'utilisateur existe déjà"

**Solutions :**

1. **Vérifier le format de la requête** :
   ```json
   {
     "username": "admin",
     "password": "password123"
   }
   ```

2. **Vérifier Content-Type** :
   - Header doit être : `Content-Type: application/json`

3. **Vérifier que l'utilisateur n'existe pas déjà** (pour register)

### 6. Erreur 500 Internal Server Error

**Symptômes :**
- Erreur serveur
- Message d'erreur générique

**Solutions :**

1. **Vérifier les logs du backend** pour voir l'erreur exacte

2. **Vérifier la base de données** :
   - Tables créées correctement
   - Connexion fonctionnelle

3. **Vérifier les dépendances** :
   ```bash
   mvn clean install
   ```

## Tests de diagnostic

### Test 1 : Vérifier que le backend répond
```bash
curl http://localhost:9090/auth/register
```
Devrait retourner une erreur 400 (normal, pas de body), mais pas de timeout.

### Test 2 : Tester l'inscription
```bash
curl -X POST http://localhost:9090/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'
```

### Test 3 : Tester la connexion
```bash
curl -X POST http://localhost:9090/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'
```

### Test 4 : Tester avec CORS (depuis le frontend)
Ouvrir la console du navigateur (F12) et exécuter :
```javascript
fetch('http://localhost:9090/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'testuser',
    password: 'test123'
  })
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```

## Checklist de vérification

- [ ] Backend démarré sur le port 9090
- [ ] MySQL démarré et accessible
- [ ] Base de données `msauth_db` créée
- [ ] Port du frontend dans la liste CORS autorisée
- [ ] Headers corrects dans les requêtes frontend
- [ ] Format JSON correct dans le body
- [ ] Token JWT bien formaté (Bearer <token>)
- [ ] Pas d'erreurs dans les logs du backend
- [ ] Pas d'erreurs dans la console du navigateur

## Logs à vérifier

### Backend (console)
- Erreurs de démarrage
- Erreurs de connexion à la base de données
- Erreurs de validation JWT
- Erreurs CORS

### Frontend (console navigateur)
- Erreurs CORS
- Erreurs réseau
- Erreurs de parsing JSON
- Erreurs d'authentification

## Configuration recommandée pour le développement

Dans `CorsConfig.java`, pour le développement, vous pouvez utiliser :
```java
configuration.setAllowedOriginPatterns(Arrays.asList("http://localhost:*"));
```

Cela autorisera tous les ports localhost.

## Support

Si le problème persiste :
1. Vérifier tous les logs (backend + frontend)
2. Tester avec curl pour isoler le problème
3. Vérifier la version de Java (17 requis)
4. Vérifier la version de Spring Boot (4.0.0)

