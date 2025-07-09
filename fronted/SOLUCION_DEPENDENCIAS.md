# Limpieza y solución de errores comunes en frontend (Vite/React)

Si tienes errores como `vite: not found` o problemas de dependencias nativas:

1. Borra en tu máquina local:

   - La carpeta `node_modules` dentro de `fronted`
   - El archivo `package-lock.json` dentro de `fronted`

   Puedes hacerlo con:

   ```bash
   rm -rf ./fronted/node_modules ./fronted/package-lock.json
   ```

   O borrando manualmente desde el explorador de archivos.

2. Reconstruye el contenedor frontend:
   ```bash
   docker-compose build --no-cache frontend
   docker-compose up
   ```

Esto instalará correctamente las dependencias dentro del contenedor Linux.

---

## Otros errores frecuentes y soluciones

### 1. El frontend no detecta cambios (no hay hot reload)

- Asegúrate de que el volumen esté así en `docker-compose.yml`:
  ```yaml
  volumes:
    - ./fronted:/app
    - /app/node_modules
  ```
- No debe existir la carpeta `node_modules` en tu máquina local dentro de `fronted`.

### 2. Error de puertos ocupados ("Ports are not available")

- Cambia el puerto mapeado en `docker-compose.yml` por uno libre, por ejemplo:
  ```yaml
  ports:
    - "3308:3306" # Para MySQL
    - "5023:5023" # Para backend
    - "5173:5173" # Para frontend
  ```
- Verifica que no tengas otro servicio usando ese puerto.

### 3. El backend no responde o el frontend muestra "Ocurrió un error inesperado"

- Revisa los logs del backend:
  ```bash
  docker-compose logs backend
  ```
- Verifica que el backend esté corriendo y el puerto esté correctamente mapeado.
- Asegúrate de que la base de datos esté inicializada y las migraciones aplicadas.

### 4. Error de CORS o conexión entre frontend y backend

- Verifica que el backend acepte peticiones desde el origen del frontend (http://localhost:5173).
- Si usas variables de entorno, revisa que estén bien configuradas.

### 5. Ver los datos de la base de datos MySQL

- Usa un cliente como DBeaver, MySQL Workbench o TablePlus:
  - Host: localhost
  - Puerto: 3307 (o el que esté en tu docker-compose.yml)
  - Usuario: root
  - Contraseña: 1234
  - Base de datos: extrahoursdb
- O accede por terminal:
  ```bash
  docker-compose exec mysql mysql -u root -p
  # Contraseña: 1234
  USE extrahoursdb;
  SHOW TABLES;
  SELECT * FROM Users;
  ```

---

Si tienes otro error, revisa los logs de los contenedores y asegúrate de que no existan carpetas/archivos generados fuera de Docker que puedan interferir.
