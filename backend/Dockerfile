# ==========================================
# STAGE 1: Build the application
# ==========================================
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Copy the Gradle wrapper files
COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./

# Make the wrapper executable (fixes permission issues on some OS)
RUN chmod +x ./gradlew

# Download dependencies (caches them so future builds are much faster)
RUN ./gradlew dependencies --no-daemon

# Copy the actual source code
COPY src src

# Build the real application jar file (skips tests for a faster build)
RUN ./gradlew bootJar -x test --no-daemon


# ==========================================
# STAGE 2: Run the application
# ==========================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Expose the port your Spring Boot app runs on (default is 8080)
EXPOSE 8080

# Here is the magic: We copy the REAL app jar from the build stage's build/libs/ folder
COPY --from=build /app/build/libs/*.jar app.jar

# Run the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]