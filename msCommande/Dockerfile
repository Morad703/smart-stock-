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

EXPOSE 8085
ENTRYPOINT ["java", "-jar", "app.jar"]
