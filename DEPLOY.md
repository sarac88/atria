# Despliegue en AWS (EC2 única)

Todo corre en una sola instancia con `docker compose`: Caddy (TLS y proxy),
Next.js, NestJS y Postgres. Sin RDS ni ElastiCache — para un proyecto de
demostración multiplican el coste sin aportar nada.

Coste aproximado: **11-14 $/mes**, o 0 € mientras duren los créditos de la
cuenta nueva.

---

## 1. Cuenta AWS

1. Crear la cuenta y activar **MFA en el usuario root**.
2. Crear un usuario IAM con acceso administrativo y dejar de usar el root.
3. **Crear un presupuesto (AWS Budgets) con alerta a 5 €.** Es el paso que
   evita sustos; hazlo antes de lanzar nada.

## 2. Lanzar la instancia

En EC2 → *Launch instance*:

| Campo | Valor |
|---|---|
| AMI | Ubuntu Server 24.04 LTS (ARM) |
| Tipo | `t4g.small` (2 GB de RAM) |
| Disco | 30 GB gp3 |
| Par de claves | crear uno nuevo y guardar el `.pem` |

**Por qué `t4g.small` y no `t3.micro`:** con 1 GB de RAM el build de Next.js
se queda sin memoria. Aun con 2 GB conviene añadir swap (paso 4).

**Por qué 30 GB y no 20:** las dos imágenes pesan ~1,1 GB cada una y la caché
de build de Docker crece con cada redespliegue. Con 20 GB se puede vivir, pero
hay que podar a menudo; la diferencia de precio es de menos de 1 $/mes.

**Grupo de seguridad** — sólo estas tres reglas de entrada:

- `80/tcp` desde `0.0.0.0/0`
- `443/tcp` desde `0.0.0.0/0`
- `22/tcp` **sólo desde tu IP**

Después, en *Elastic IPs*, asigna una IP elástica y asóciala a la instancia.
Es gratis mientras esté asociada; si la dejas suelta, se factura.

## 3. Dominio

Caddy pide el certificado TLS solo, pero necesita un nombre que apunte a la IP.

- **Con dominio propio:** un registro `A` hacia la IP elástica. Si usas
  Route 53, la zona alojada cuesta 0,50 $/mes.
- **Sin dominio:** [DuckDNS](https://duckdns.org) es gratis y funciona bien
  con Let's Encrypt.
- Evita `nip.io` / `sslip.io` para esto: al ser dominios compartidos por mucha
  gente es fácil toparse con los límites de emisión de Let's Encrypt.

Espera a que el DNS resuelva antes del paso 5, o Caddy fallará al validar.

## 4. Preparar la instancia

```bash
ssh -i clave.pem ubuntu@TU_IP_ELASTICA
```

```bash
# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
```

Cierra la sesión SSH y vuelve a entrar para que el grupo `docker` surta efecto.

```bash
# 2 GB de swap: el build de Next.js va justo con 2 GB de RAM
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 5. Desplegar

El repo es privado, así que la instancia necesita credenciales propias para
clonar. Se usa una **deploy key**: una clave SSH de sólo lectura y válida
sólo para este repo. No clones por HTTPS con usuario y token: funciona a
mano, pero el runner del paso 7 no puede escribir la contraseña y falla con
`could not read Username for 'https://github.com'`.

```bash
ssh-keygen -t ed25519 -f ~/.ssh/atria_deploy -N "" -C "atria-deploy@ec2"
cat ~/.ssh/atria_deploy.pub
```

Pega la clave pública en GitHub: *Settings → Deploy keys → Add deploy key*,
**sin** marcar "Allow write access". Después:

```bash
printf 'Host github.com\n  IdentityFile ~/.ssh/atria_deploy\n  IdentitiesOnly yes\n' >> ~/.ssh/config
chmod 600 ~/.ssh/config
ssh -T git@github.com   # responder "yes" la primera vez
```

```bash
git clone git@github.com:sarac88/atria.git atria && cd atria
cp .env.prod.example .env.prod
```

Rellena `.env.prod`. Ninguna variable puede quedarse vacía: compose trata la
cadena vacía igual que la ausencia de valor y aborta.

La contraseña de Postgres, en hexadecimal — va dentro de la URL de conexión y
los `/` y `+` de base64 la romperían:

```bash
openssl rand -hex 24
```

Los dos secretos JWT, uno distinto cada uno:

```bash
openssl rand -base64 32
```

Antes de desplegar, comprobar que no falta nada (no imprime los secretos):

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod config >/dev/null && echo "Config OK"
```

Luego:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

El primer build tarda un rato (compila `argon2` y el bundle de Next). Las
migraciones de Prisma se aplican solas al arrancar la API.

## 6. Comprobar

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f api
```

En el navegador: entra, crea una clase, sube un PDF y **abre el chat** para
confirmar que los mensajes llegan en tiempo real.

---

## 7. Despliegue automático (GitHub Actions)

Cada push a `main` actualiza el servidor (`.github/workflows/deploy.yml`).
El workflow corre en un **runner autoalojado** instalado en la instancia: es
ella la que consulta a GitHub, así que no se abre ningún puerto. Esto sólo es
seguro porque el repo es privado.

Instalación, una sola vez:

1. En GitHub: *Settings → Actions → Runners → New self-hosted runner*,
   con **Linux** y **ARM64**.
2. En la instancia, ejecuta los comandos que te muestra la página
   (descarga + `./config.sh`) dentro de `~/actions-runner`. Acepta los
   valores por defecto.
3. En lugar de `./run.sh`, instálalo como servicio para que sobreviva a los
   reinicios:

```bash
cd ~/actions-runner && sudo ./svc.sh install ubuntu && sudo ./svc.sh start
```

En *Settings → Actions → Runners* tiene que aparecer como **Idle**.

El despliegue usa el clon de `~/atria` (donde está `.env.prod`). No edites
ficheros versionados en el servidor: el `git pull --ff-only` fallaría a
propósito. Para redesplegar sin commit: pestaña *Actions → Deploy → Run
workflow*.

## 8. Acceso a la base de datos con TablePlus

Postgres sólo escucha en `127.0.0.1` de la instancia; se entra por túnel SSH.
**No abras el 5432 en el grupo de seguridad.**

Nueva conexión → PostgreSQL:

| Campo | Valor |
|---|---|
| Host / Port | `127.0.0.1` / `5432` |
| User | `atria` |
| Password | el `POSTGRES_PASSWORD` de `.env.prod` |
| Database | `atria` |
| Over SSH | activado: servidor `54.220.183.94`, puerto `22`, usuario `ubuntu`, clave: tu `.pem` |

Para ver la contraseña en la instancia: `grep POSTGRES_PASSWORD ~/atria/.env.prod`.

Son los datos de producción: cuidado al editar a mano.

## Notas

### Datos de ejemplo

La semilla la lanza cada noche el reset de la demo (ver abajo). Para
ejecutarla a mano:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec api \
  /app/node_modules/.bin/ts-node --transpile-only \
  -O '{"module":"commonjs","moduleResolution":"node"}' prisma/seed.ts
```

(`prisma db seed` no sirve dentro del contenedor: lanza `ts-node` por el PATH,
donde no está, y falla con `spawn ts-node ENOENT`. Y como el `tsconfig.json`
no está en la imagen, hay que pasarle a `ts-node` las opciones de compilación
con `-O`; sin ellas aplica unos valores por defecto que chocan con esta
versión de TypeScript y falla con `TS5109`.)

La semilla restaura la demo desde `apps/api/prisma/demo/`: `data.json` (la
foto de la base de datos) y `files/` (los ficheros subidos que usa). **Borra
todo antes de cargarla**, tanto las tablas como el contenido de `uploads/`, así
que relanzarla deja la demo como recién instalada. Las fechas se adelantan las
semanas completas transcurridas desde la exportación (así conservan el día de
la semana) y las invitaciones pendientes se
renuevan, para que la demo no envejezca.

Para cambiar la demo: edítala en local desde la interfaz y vuelve a hacer la
foto con `npm run db:export-demo --workspace @atria/api`.

Todas las cuentas de la semilla usan la contraseña `atria2025`, que está
escrita en el código. Con la app expuesta a internet, tenlo en cuenta.

### Reset de la demo

Cada noche el cron del servidor lanza `docker/reset-demo.sh`, que ejecuta la
semilla de arriba y deja la demo como recién instalada. Sólo funciona en el
servidor: sin `.env.prod` (en local no existe) se niega a ejecutarse. Si el
contenedor `api` no está en marcha, no hace nada y lo deja escrito en el log.

El reset cierra la sesión de quien esté dentro (los usuarios se recrean sin
sus sesiones), por eso va de madrugada. La instancia va en UTC: las 3:00 UTC
son las 4:00 en Madrid en invierno y las 5:00 en verano.

Activarlo, una sola vez, en la instancia:

```bash
crontab -e
```

y añadir al final:

```
0 3 * * * sh /home/ubuntu/atria/docker/reset-demo.sh >> /home/ubuntu/reset-demo.log 2>&1
```

El log va fuera del clon a propósito: el despliegue exige que `~/atria` no
tenga cambios. Para comprobarlo:

```bash
crontab -l                      # la línea está programada
sh ~/atria/docker/reset-demo.sh # lanzarlo a mano, ahora
tail ~/reset-demo.log           # última ejecución del cron
```

### Los ficheros subidos

Viven en el volumen `atria-uploads`, no en la imagen: sobreviven a los
redespliegues, pero **no** a un `docker compose down -v` ni a terminar la
instancia. `apps/api/uploads` está en `.gitignore`, así que el servidor
arranca con la carpeta vacía. Para llevar los ficheros locales:

```bash
rsync -av -e "ssh -i clave.pem" apps/api/uploads/ ubuntu@TU_IP:/tmp/uploads/
ssh -i clave.pem ubuntu@TU_IP \
  'docker cp /tmp/uploads/. atria-prod-api-1:/app/apps/api/uploads/'
```

Si esto llega a ser un problema de verdad, el siguiente paso es S3: está todo
aislado en `apps/api/src/common/uploads.ts`.

### Actualizar la app

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Si cambias `NEXT_PUBLIC_API_URL`, la imagen de web hay que reconstruirla
entera: esa variable se hornea en el bundle durante el build.

### Espacio en disco

Cada redespliegue deja imágenes viejas y caché de build. Si el disco se llena:

```bash
docker system prune -af --volumes=false
```

`--volumes=false` es importante: sin eso te llevarías por delante la base de
datos y los ficheros subidos.

### Tamaño de las imágenes

Las imágenes rondan 1,1 GB porque `node_modules` se copia sin podar. Es a
propósito: ahí viven el cliente de Prisma ya generado, el binario nativo de
`argon2` y el CLI de `prisma` que aplica las migraciones al arrancar, y
podarlos a mano es fácil de romper. Como efecto secundario, la imagen de la
API arrastra también las dependencias de web (npm instala todo el workspace).
Si algún día molesta, ahí está el margen de mejora.

### Copia de seguridad de la base de datos

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec postgres \
  pg_dump -U atria atria | gzip > atria-$(date +%F).sql.gz
```

### Redis

No se despliega. Sólo lo usaba el adaptador de Socket.IO para sincronizar
varias instancias de la API, y aquí hay una. Si algún día escalas a más de
una, basta con volver a levantarlo y definir `REDIS_URL`: el código lo
detecta y vuelve a usarlo.
