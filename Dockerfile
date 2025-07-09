# Dockerfile para PRODUCCIÓN
# Utiliza este archivo para construir una imagen optimizada y lista para desplegar en servidores.
# Para desarrollo local con hot reload, usa Dockerfile.dev y docker-compose.yml

# Etapa 1: Build del frontend
FROM node:20 AS frontend-build
WORKDIR /app/fronted
COPY fronted/package*.json ./
RUN npm install
COPY fronted/ ./
RUN npm run build

# Etapa 2: Build del backend
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app
COPY backendgrupo4/ ./backendgrupo4/
WORKDIR /app/backendgrupo4/ExtraHours.API
RUN dotnet publish -c Release -o /app/publish

# Etapa 3: Imagen final
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish ./
COPY --from=frontend-build /app/fronted/dist ./wwwroot
ENV ASPNETCORE_URLS=http://+:5023
EXPOSE 5023
ENTRYPOINT ["dotnet", "ExtraHours.API.dll"]

# NOTA:
# - Para desarrollo, usa Dockerfile.dev y docker-compose.yml
# - Para producción, usa este Dockerfile con: docker build -t extrahours-app .
