$services = @{
    "ConfigServer" = "8888"
    "eurekaServer" = "8761"
    "Gateway" = "7777"
    "msauth" = "9090"
    "msProduit" = "8082"
    "msStock" = "8081"
    "msCommande" = "8085"
    "msFournisseur" = "8084"
    "msNotif" = "8083"
}

foreach ($srv in $services.GetEnumerator()) {
    $dir = "c:\Users\ADmiN\Downloads\vf\vf\$($srv.Key)"
    $port = $srv.Value
    $content = @"
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline -B || true
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre
RUN groupadd -r springgroup && useradd -r -g springgroup -d /app -s /sbin/nologin springuser
WORKDIR /app
COPY --from=builder --chown=springuser:springgroup /build/target/*.jar app.jar
USER springuser:springgroup

EXPOSE $port
ENTRYPOINT ["java", "-jar", "app.jar"]
"@
    Set-Content -Path "$dir\Dockerfile" -Value $content -Encoding UTF8
}

$frontendContent = @"
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html
RUN echo "server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files \`$uri \`$uri/ /index.html; } }" > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
"@
Set-Content -Path "c:\Users\ADmiN\Downloads\vf\vf\frontend\Dockerfile" -Value $frontendContent -Encoding UTF8
