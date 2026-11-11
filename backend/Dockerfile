# syntax=docker/dockerfile:1
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml ./
COPY src ./src
RUN --mount=type=secret,id=maven_settings,target=/root/.m2/settings.xml \
    --mount=type=secret,id=proxy_ca \
    set -eu; \
    if [ -f /run/secrets/proxy_ca ]; then keytool -importcert -noprompt -alias cloud-proxy -file /run/secrets/proxy_ca -cacerts -storepass changeit; fi; \
    mvn -B -DskipTests package
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN mkdir -p /app/uploads && chown 10001:10001 /app/uploads
COPY --from=build /app/target/edumy-backend-0.0.1-SNAPSHOT.jar app.jar
USER 10001
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
