$baseDir = "c:\Users\ADmiN\Downloads\vf\vf\k8s"
$dirs = @("mysql", "rabbitmq", "microservices", "frontend")
foreach ($d in $dirs) {
    New-Item -ItemType Directory -Force -Path "$baseDir\$d" | Out-Null
}

function Write-Yaml($path, $content) {
    Set-Content -Path "$baseDir\$path" -Value $content.Trim() -Encoding UTF8
}

Write-Yaml "namespace.yaml" @"
apiVersion: v1
kind: Namespace
metadata:
  name: microservices-namespace
"@

Write-Yaml "secrets.yaml" @"
apiVersion: v1
kind: Secret
metadata:
  name: ms-secrets
  namespace: microservices-namespace
type: Opaque
data:
  MYSQL_ROOT_PASSWORD: TXlTdHJvbmdSb290UGFzc3dvcmQxMjMh
  RABBITMQ_DEFAULT_USER: YWRtaW5fcm1x
  RABBITMQ_DEFAULT_PASS: U3VwZXJSYWJiaXRQYXNzMSE=
  JWT_SECRET: UHJvZHVjdGlvblN1cGVyU2VjcmV0S2V5RGV2U2VjT3BzMjAyNCE=
"@

Write-Yaml "configmaps.yaml" @"
apiVersion: v1
kind: ConfigMap
metadata:
  name: ms-config
  namespace: microservices-namespace
data:
  EUREKA_URL: "http://eureka-server:8761/eureka/"
  CONFIG_SERVER_URL: "optional:configserver:http://config-server:8888"
  MYSQL_HOST: "mysql-server"
  RABBITMQ_HOST: "rabbitmq"
"@

Write-Yaml "mysql\mysql-pv.yaml" @"
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-pvc
  namespace: microservices-namespace
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 2Gi
"@

Write-Yaml "mysql\mysql-deployment.yaml" @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql-server
  namespace: microservices-namespace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mysql-server
  template:
    metadata:
      labels:
        app: mysql-server
    spec:
      containers:
      - name: mysql-server
        image: HARBOR_IP/smartstock/mysql-server:1.0
        env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ms-secrets
              key: MYSQL_ROOT_PASSWORD
        ports:
        - containerPort: 3306
        volumeMounts:
        - name: mysql-data
          mountPath: /var/lib/mysql
      volumes:
      - name: mysql-data
        persistentVolumeClaim:
          claimName: mysql-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: mysql-server
  namespace: microservices-namespace
spec:
  selector:
    app: mysql-server
  ports:
  - port: 3306
    targetPort: 3306
  clusterIP: None
"@

Write-Yaml "rabbitmq\rabbitmq-deployment.yaml" @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rabbitmq
  namespace: microservices-namespace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: rabbitmq
  template:
    metadata:
      labels:
        app: rabbitmq
    spec:
      containers:
      - name: rabbitmq
        image: HARBOR_IP/smartstock/rabbitmq:1.0
        env:
        - name: RABBITMQ_DEFAULT_USER
          valueFrom:
            secretKeyRef:
              name: ms-secrets
              key: RABBITMQ_DEFAULT_USER
        - name: RABBITMQ_DEFAULT_PASS
          valueFrom:
            secretKeyRef:
              name: ms-secrets
              key: RABBITMQ_DEFAULT_PASS
        ports:
        - containerPort: 5672
        - containerPort: 15672
---
apiVersion: v1
kind: Service
metadata:
  name: rabbitmq
  namespace: microservices-namespace
spec:
  selector:
    app: rabbitmq
  ports:
  - name: amqp
    port: 5672
    targetPort: 5672
  - name: management
    port: 15672
    targetPort: 15672
"@

Write-Yaml "microservices\config-server-deployment.yaml" @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: config-server
  namespace: microservices-namespace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: config-server
  template:
    metadata:
      labels:
        app: config-server
    spec:
      containers:
      - name: config-server
        image: HARBOR_IP/smartstock/config-server:1.0
        ports:
        - containerPort: 8888
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 8888
          initialDelaySeconds: 15
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: config-server
  namespace: microservices-namespace
spec:
  selector:
    app: config-server
  ports:
  - port: 8888
    targetPort: 8888
"@

Write-Yaml "microservices\eureka-deployment.yaml" @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: eureka-server
  namespace: microservices-namespace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: eureka-server
  template:
    metadata:
      labels:
        app: eureka-server
    spec:
      containers:
      - name: eureka-server
        image: HARBOR_IP/smartstock/eureka-server:1.0
        ports:
        - containerPort: 8761
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 8761
          initialDelaySeconds: 15
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: eureka-server
  namespace: microservices-namespace
spec:
  selector:
    app: eureka-server
  ports:
  - port: 8761
    targetPort: 8761
"@

Write-Yaml "microservices\gateway-deployment.yaml" @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: microservices-namespace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: HARBOR_IP/smartstock/api-gateway:1.0
        env:
        - name: EUREKA_CLIENT_SERVICEURL_DEFAULTZONE
          valueFrom:
            configMapKeyRef:
              name: ms-config
              key: EUREKA_URL
        - name: SPRING_CONFIG_IMPORT
          valueFrom:
            configMapKeyRef:
              name: ms-config
              key: CONFIG_SERVER_URL
        ports:
        - containerPort: 7777
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 7777
          initialDelaySeconds: 20
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  namespace: microservices-namespace
spec:
  selector:
    app: api-gateway
  ports:
  - port: 7777
    targetPort: 7777
  type: NodePort
"@

$business_services = @{
    "auth" = 9090
    "produit" = 8082
    "stock" = 8081
    "commande" = 8085
    "fournisseur" = 8084
    "notif" = 8083
}

foreach ($srv in $business_services.GetEnumerator()) {
    $name = $srv.Key
    $port = $srv.Value
    $dbName = if ($name -eq "auth") { "msauth_db" } else { "`$($name)_db" }
    
    $rmqEnv = if ($name -eq "notif") {
@"
        - name: SPRING_RABBITMQ_HOST
          valueFrom:
            configMapKeyRef:
              name: ms-config
              key: RABBITMQ_HOST
        - name: SPRING_RABBITMQ_USERNAME
          valueFrom:
            secretKeyRef:
              name: ms-secrets
              key: RABBITMQ_DEFAULT_USER
        - name: SPRING_RABBITMQ_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ms-secrets
              key: RABBITMQ_DEFAULT_PASS
"@
    } else { "" }

    $jwtEnv = if ($name -eq "auth") {
@"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: ms-secrets
              key: JWT_SECRET
"@
    } else { "" }

    $yaml = @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ms-${name}
  namespace: microservices-namespace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ms-${name}
  template:
    metadata:
      labels:
        app: ms-${name}
    spec:
      containers:
      - name: ms-${name}
        image: HARBOR_IP/smartstock/ms-${name}:1.0
        env:
        - name: MYSQL_HOST
          valueFrom:
            configMapKeyRef:
              name: ms-config
              key: MYSQL_HOST
        - name: SPRING_DATASOURCE_URL
          value: "jdbc:mysql://`$(MYSQL_HOST):3306/${dbName}?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC"
        - name: SPRING_DATASOURCE_USERNAME
          value: "root"
        - name: SPRING_DATASOURCE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ms-secrets
              key: MYSQL_ROOT_PASSWORD
        - name: EUREKA_CLIENT_SERVICEURL_DEFAULTZONE
          valueFrom:
            configMapKeyRef:
              name: ms-config
              key: EUREKA_URL
        - name: SPRING_CONFIG_IMPORT
          valueFrom:
            configMapKeyRef:
              name: ms-config
              key: CONFIG_SERVER_URL
${jwtEnv}${rmqEnv}
        ports:
        - containerPort: ${port}
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: ${port}
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: ms-${name}
  namespace: microservices-namespace
spec:
  selector:
    app: ms-${name}
  ports:
  - port: ${port}
    targetPort: ${port}
"@
    Write-Yaml "microservices\ms-${name}-deployment.yaml" $yaml
}

Write-Yaml "frontend\frontend-deployment.yaml" @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: microservices-namespace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: HARBOR_IP/smartstock/frontend:1.0
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: microservices-namespace
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 80
  type: NodePort
"@
