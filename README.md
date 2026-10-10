=========================================================================
                              WALKIES
           Aplicacion movil para agendar y gestionar paseos de mascotas
=========================================================================

1. DESCRIPCION GENERAL
----------------------
Walkies es una aplicacion movil para conectar propietarios de mascotas con paseadores. El propietario registra sus mascotas, elige un paseador, define el punto de recogida y agenda el servicio. El paseador recibe la solicitud, la confirma, la inicia y la marca como completada.

El rol se elige al crear la cuenta y no cambia despues: propietario (owner) o paseador (walker). Cada rol ve una interfaz distinta. El pago no se cobra dentro de la aplicacion: el valor se acuerda en efectivo al entregar la mascota. La tarifa que muestra la app es una referencia calculada con la tarifa por hora del paseador y la duracion del paseo.

La aplicacion es el cliente. Supabase es el backend: autenticacion, base de datos PostgreSQL, politicas de acceso (RLS) y almacenamiento de fotos. No hay un servidor propio ni una API escrita en este repositorio.


2. ARQUITECTURA Y ESTRUCTURA DE CARPETAS
-----------------------------------------
La app usa una arquitectura basada en componentes (React Native). Las
pantallas dibujan la interfaz, guardan su estado y consultan Supabase de
forma directa. La sesion vive en un contexto y el perfil en un hook. No
hay capa MVC: no existen controladores, modelos ni repositorios separados.

A nivel de sistema es cliente-servidor:

   [App Expo / React Native]  -->  [Supabase]
        pantallas, mapas              Auth + PostgreSQL + Storage
        estado local                  politicas RLS

walkies/
|
|-- assets/                              # Logos, icono y splash
|-- components/                          # Piezas reutilizables de interfaz
|   |-- LoginAnimatedBackground.tsx      # Fondo animado del acceso
|   |-- NotificationsBell.tsx            # Campana de notificaciones in-app
|   |-- OwnerHomeHero.tsx                # Encabezado del inicio del propietario
|   |-- WalkerHomeHero.tsx               # Encabezado del inicio del paseador
|   |-- WalkingMascot.tsx                # Mascota animada de la marca
|   |-- StarRating.tsx                   # Valoracion de 1 a 5 estrellas
|   |-- WalkChatModal.tsx                # Chat del paseo
|   |-- WalkTrackingScreen.tsx           # Seguimiento: mapa, tiempo y distancia
|   |-- WalkersMapView.tsx               # Mapa de paseadores (base)
|   |-- WalkersMapView.android.tsx       # Mapa de paseadores en Android
|   |-- TrackingMap.tsx                  # Mapa de seguimiento (base)
|   |-- TrackingMap.android.tsx          # Seguimiento nativo en Android
|   |-- TrackingMap.web.tsx              # Seguimiento en navegador
|   |-- PickupMapPickerModal.tsx         # Selector del punto de recogida
|   |-- PickupMapPickerModal.android.tsx
|   |-- PickupMapPreview.tsx             # Vista previa del punto de recogida
|   |-- PickupMapPreview.android.tsx
|
|-- contexts/
|   |-- AuthContext.tsx                  # Sesion: registro, login y cierre
|
|-- hooks/
|   |-- useProfile.ts                    # Carga el perfil y asegura la fila walker
|
|-- lib/                                 # Cliente Supabase y utilidades
|   |-- supabase.ts                      # Cliente con sesion en AsyncStorage
|   |-- authMessages.ts                  # Mensajes de error de autenticacion
|   |-- notify.ts                        # Avisos in-app
|   |-- addresses.ts                     # Direcciones del usuario
|   |-- defaultPickup.ts                 # Ultimo punto de recogida
|   |-- deviceLocation.ts                # Permiso y lectura del GPS
|   |-- geo.ts                           # Distancia entre coordenadas
|   |-- googleMapsConfig.ts              # Clave de mapas en Android
|   |-- leafletTrackingHtml.ts           # Mapa web del seguimiento
|   |-- phone.ts                         # Llamada al telefono de contacto
|   |-- uploadPetPhoto.ts                # Subida de fotos al bucket pet-photos
|   |-- uploadAvatar.ts                  # Foto de perfil
|   |-- walkDisplay.ts                   # Textos y datos visibles del paseo
|
|-- screens/
|   |-- SplashScreen.tsx                 # Pantalla de arranque
|   |-- AuthScreen.tsx                   # Bienvenida, login y registro
|   |-- MascotasScreen.tsx               # Alta, edicion y baja de mascotas
|   |-- AgendarScreen.tsx                # Agenda e historial del propietario
|   |-- WalkerHomeScreen.tsx             # Solicitudes y estados del paseador
|   |-- PerfilScreen.tsx                 # Perfil, foto, telefono y tarifa
|
|-- supabase/                            # Scripts SQL del backend
|   |-- schema.sql                       # Tablas base, RLS y trigger de perfil
|   |-- trigger_profile_role.sql         # Guarda el rol al registrarse
|   |-- trigger_walker_on_profile.sql    # Crea la fila en walkers
|   |-- profile_insert_policy.sql        # Permite insertar el propio perfil
|   |-- walks_walker_update_policy.sql   # El paseador actualiza el paseo
|   |-- pickup_and_walker_location.sql   # Recogida y ubicacion del paseador
|   |-- add_photo_url.sql                # Columna photo_url en mascotas
|   |-- storage_pet_photos_policies.sql  # Politicas del bucket de fotos
|   |-- mvp_features.sql                 # Valoraciones, chat y notificaciones
|   |-- realtime_walker_location.sql     # Ubicacion del paseador en tiempo real
|   |-- SETUP.md                         # Orden de ejecucion y pruebas de RLS
|
|-- App.tsx                              # Navegacion por estado y vistas por rol
|-- app.config.js                        # Carga .env y la clave de Google Maps
|-- app.json                             # Nombre, icono, splash y paquete Android
|-- index.ts                             # Punto de entrada de Expo
|-- styles.ts                            # Estilos compartidos
|-- theme.ts                             # Paleta de colores
|-- package.json                         # Dependencias y scripts
|-- tsconfig.json                        # Configuracion de TypeScript


3. TECNOLOGIAS UTILIZADAS
--------------------------

Cliente:
  - Expo ~54.0.0                    -> Toolchain y ejecucion movil
  - React Native 0.81.5             -> Interfaz nativa
  - React 19.1.0                    -> Componentes y estado
  - TypeScript ~5.9.2               -> Tipado del proyecto
  - React Native Web ^0.21.0        -> Misma app en navegador

Datos y sesion:
  - Supabase JS ^2.98.0             -> Auth, PostgreSQL y Storage
  - AsyncStorage 2.2.0              -> Sesion persistida en el dispositivo

Mapas, ubicacion y medios:
  - react-native-maps 1.20.1        -> Mapas nativos en Android
  - expo-location ~19.0.8           -> GPS del dispositivo
  - expo-image-picker ~17.0.10      -> Foto de perfil y de mascota
  - Google Maps SDK (Android)       -> Mapa de paseadores y de recogida

Interfaz:
  - @expo/vector-icons ^15.0.2      -> Iconos
  - react-native-safe-area-context  -> Margenes seguros de la pantalla
  - @react-native-community/datetimepicker 8.4.4 -> Fecha y hora del paseo

Herramientas:
  - dotenv ^17.3.1                  -> Variables de entorno en app.config.js
  - Node.js 18 o superior           -> Entorno de ejecucion
  - npm                             -> Instalacion de dependencias


4. FLUJO DE FUNCIONAMIENTO
---------------------------

   [Apertura de la app]
      |
      v
   Splash (unos 2 segundos)
      |
      v
   ¿Hay sesion guardada?
      |-- no  -->  AuthScreen
      |              |-- Iniciar sesion
      |              |-- Crear cuenta (elige Propietario o Paseador)
      |
      |-- si, rol walker  -->  WalkerApp
      |-- si, rol owner   -->  MainApp

   Propietario:
   Inicio
      |-- Ve paseadores, filtro y ficha
      |-- Puede abrir el mapa de paseadores (Android)
      v
   Mascotas --> crea, edita o elimina una mascota (con foto opcional)
      |
      v
   Agendar --> elige mascota, fecha, duracion, direccion y paseador
      |        El paseo queda en estado pending
      v
   Historial --> sigue el estado, abre chat, llama, cancela o valora
      |
      v
   Cuando el paseo pasa a in_progress, el propietario puede ver
   el seguimiento en el mapa.

   Paseador:
   Inicio (solicitudes asignadas)
      |-- Completa bio y tarifa si aun no las tiene
      |-- Activa el GPS para aparecer cerca y calcular distancias
      v
   pending --> Confirmar paseo --> confirmed
      |
      v
   confirmed --> Iniciar paseo --> in_progress
      |           (el propietario ya puede seguir el recorrido)
      v
   in_progress --> Marcar completado --> completed
      |
      v
   El propietario valora el servicio. El promedio se guarda en walkers.

   Cancelacion:
   El propietario o el paseador pueden cancelar un paseo pending o
   confirmed. El estado pasa a cancelled y la otra persona recibe
   una notificacion.


5. SISTEMA DE PANTALLAS
------------------------
La navegacion no usa un enrutador. App.tsx cambia de pantalla con un
estado local.

Antes de iniciar sesion:
  SplashScreen     Arranque de la marca
  AuthScreen       Bienvenida, inicio de sesion y registro

Propietario (MainApp). Barra inferior:
  inicio           Listado de paseadores, filtros y acceso al mapa
  mascotas         MascotasScreen
  agendar          AgendarScreen (agendar e historial)
  perfil           PerfilScreen

Paseador (WalkerApp). Barra inferior:
  inicio           WalkerHomeScreen (solicitudes y cambio de estado)
  perfil           PerfilScreen

Pantallas y modales que se abren encima:
  WalkChatModal            Chat de un paseo
  WalkTrackingScreen       Mapa, tiempo y distancia del servicio
  PickupMapPickerModal     Elegir el punto de recogida
  NotificationsBell        Avisos de la cuenta

Comportamiento:
  - Sin sesion solo se muestra AuthScreen.
  - El rol sale de profiles.role. walker entra a WalkerApp; el resto, a MainApp.
  - Cerrar sesion vuelve a AuthScreen.
  - El rol no se puede cambiar: el otro perfil exige otra cuenta y otro correo.


6. MODELO DE DATOS
-------------------
Las tablas viven en el esquema public de Supabase. El acceso esta limitado
con Row Level Security: cada persona lee y escribe lo que le corresponde.
Los paseadores se pueden listar; el chat y las valoraciones solo los ven
quienes participan en ese paseo.

   profiles
     id            uuid  (el mismo de auth.users)
     full_name     text
     avatar_url    text
     phone         text
     role          text  owner | walker

   pets
     id, owner_id, name, breed, age_years
     size          small | medium | large
     notes, photo_url

   walkers
     id, user_id, bio, hourly_rate
     rating_avg
     last_lat, last_lng, last_location_at

   addresses
     id, user_id, label, street, city, lat, lng

   walks
     id, pet_id, walker_id
     scheduled_at, duration_minutes, price, notes
     status        pending | confirmed | in_progress | completed | cancelled
     pickup_address, pickup_lat, pickup_lng
     started_at, completed_at

   reviews          una valoracion por paseo completado (1 a 5)
     id, walk_id, owner_id, walker_id, rating, comment

   walk_messages    chat del paseo
     id, walk_id, sender_id, body, created_at

   notifications    avisos in-app
     id, user_id, title, body, walk_id, read_at

Al registrarse, un trigger crea la fila en profiles con el rol elegido.
Si el rol es walker, otro trigger crea la fila en walkers. Una valoracion
nueva recalcula rating_avg del paseador.

Storage:
  Bucket publico pet-photos. Cada usuario sube archivos solo en su carpeta.


7. INSTRUCCIONES DE INSTALACION Y EJECUCION
---------------------------------------------

Requisitos:
  - Node.js 18 o superior
  - npm
  - Un proyecto en Supabase
  - Expo Go en el celular, o un emulador Android
  - Para mapas nativos en Android: una clave de Google Maps restringida
    al paquete com.walkies.app

Paso 1: Clonar el repositorio
  git clone <url-del-repo>
  cd walkies

Paso 2: Instalar dependencias
  npm install

Paso 3: Configurar variables de entorno
  Copia el ejemplo y completa los valores. No subas el archivo .env.

  Windows PowerShell:
    Copy-Item .env.example .env

  macOS o Linux:
    cp .env.example .env

  Contenido de .env:

    EXPO_PUBLIC_SUPABASE_URL=
    EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon
    GOOGLE_MAPS_ANDROID_API_KEY=

  La URL y la clave anonima estan en Supabase:
  Project Settings -> API.
  app.config.js carga este archivo con dotenv. Las variables
  EXPO_PUBLIC_* quedan disponibles en el cliente.

Paso 4: Preparar la base de datos
  En Supabase: SQL Editor -> New query -> pegar -> Run.
  Ejecuta los scripts de supabase/ en este orden:

    1. schema.sql
    2. trigger_profile_role.sql
    3. trigger_walker_on_profile.sql
    4. profile_insert_policy.sql
    5. walks_walker_update_policy.sql
    6. pickup_and_walker_location.sql
    7. add_photo_url.sql
    8. storage_pet_photos_policies.sql
    9. mvp_features.sql
   10. realtime_walker_location.sql

  Despues crea el bucket pet-photos en Storage y dejalo publico.
  El detalle de cada script esta en supabase/SETUP.md.

  Para pruebas locales, en Authentication -> Providers -> Email se puede
  desactivar "Confirm email". Si queda activo, hay que confirmar el
  correo antes de entrar.

Paso 5: Ejecutar en desarrollo
  npm run start

  Atajos:
    npm run android    abre en Android
    npm run ios        abre en iOS (requiere entorno Apple)
    npm run web        abre en el navegador

Paso 6: Probar con dos cuentas
  Usa dos correos distintos.
  1. Registra un paseador, completa bio y tarifa, y cierra sesion.
  2. Registra un propietario, crea una mascota y agenda un paseo
     con ese paseador.
  3. Entra como paseador y pasa el paseo por confirmar, iniciar
     y completar.
  4. Entra como propietario y revisa el historial.


8. DEPENDENCIAS PRINCIPALES
-----------------------------

Produccion (package.json):
  expo ~54.0.0, react 19.1.0, react-native 0.81.5,
  @supabase/supabase-js ^2.98.0,
  @react-native-async-storage/async-storage 2.2.0,
  react-native-maps 1.20.1, expo-location ~19.0.8,
  expo-image-picker ~17.0.10,
  @react-native-community/datetimepicker 8.4.4,
  @expo/vector-icons ^15.0.2,
  react-native-safe-area-context ^5.7.0,
  react-native-web ^0.21.0, react-dom 19.1.0

Desarrollo:
  typescript ~5.9.2, dotenv ^17.3.1, @types/react ~19.2.2


9. SCRIPTS SQL
---------------
No hay endpoints propios. La app consulta las tablas con el cliente de
Supabase y las politicas RLS deciden quien puede leer o escribir.

  schema.sql
    Crea profiles, pets, walkers, addresses y walks.
    Activa RLS y el trigger que crea el perfil al registrarse.

  trigger_profile_role.sql
    Guarda el rol owner o walker que el usuario eligio en el registro.

  trigger_walker_on_profile.sql
    Si el rol es walker, inserta la fila correspondiente en walkers.

  profile_insert_policy.sql
    Permite que la cuenta inserte su propio perfil.

  walks_walker_update_policy.sql
    Permite al paseador asignado cambiar el estado del paseo.

  pickup_and_walker_location.sql
    Columnas de direccion de recogida y de ultima ubicacion del paseador.

  add_photo_url.sql
    Agrega photo_url a pets si la tabla ya existia sin esa columna.

  storage_pet_photos_policies.sql
    Subida autenticada en la carpeta del usuario y lectura publica
    del bucket pet-photos.

  mvp_features.sql
    Lectura de perfiles para listar paseadores.
    started_at y completed_at en walks.
    Tablas reviews, walk_messages y notifications, con sus politicas.
    Trigger que recalcula rating_avg.

  realtime_walker_location.sql
    Prepara la ubicacion del paseador para actualizarse en vivo.


10. ESTADOS DEL PASEO
----------------------

  pending        El propietario lo agendo. El paseador aun no responde.
                 Accion del paseador: Confirmar. Cualquiera puede cancelar.

  confirmed      El paseador acepto. Falta la hora acordada.
                 Accion del paseador: Iniciar paseo. Se puede cancelar.

  in_progress    El recorrido ya empezo. Hay seguimiento y tiempo.
                 Accion del paseador: Marcar completado.

  completed      La mascota fue entregada. El propietario puede valorar.
                 El cobro en efectivo corresponde a este momento.

  cancelled      El propietario o el paseador cancelo antes de iniciar.
                 La solicitud queda cerrada.

Filtros del listado de paseadores (propietario):
  Sin filtro, precio menor a mayor, precio mayor a menor,
  mejor calificacion y mas cercanos.


11. PRUEBAS MANUALES
---------------------
  1. Inicia sesion como propietario y crea o edita una mascota.
  2. Agenda un paseo en una fecha futura y confirma el mensaje de exito.
  3. Revisa que el paseo aparezca con la mascota correcta.
  4. Inicia sesion como el paseador asignado y cambia el estado:
     confirmar, iniciar y completar.
  5. Como propietario, valora el paseo completado.
  6. Abre el chat del paseo desde cualquiera de las dos cuentas.
  7. Cancela un paseo que siga en pending o confirmed y comprueba
     que la otra cuenta recibe la notificacion.
  8. En Android, con la clave de mapas y el GPS activos, comprueba
     el mapa de paseadores, la distancia a la recogida y el seguimiento.


12. NOTAS DE MANTENIMIENTO
---------------------------
  - Las pantallas consultan Supabase directamente. Un cambio de tabla
    o de columnas se refleja en la pantalla que la usa y en el SQL.

  - walker_id en walks apunta a walkers.id, no al id de auth.users.

  - El archivo .env no se versiona. .gitignore ya lo excluye, igual
    que node_modules, .expo y las carpetas nativas android e ios.

  - La clave de Google Maps solo se usa en Android y debe restringirse
    al paquete com.walkies.app. Sin esa clave, el mapa nativo no carga.

  - Los archivos *.android.tsx y *.web.tsx son variantes de plataforma.
    El mapa nativo esta en Android; la web usa la variante web.

  - Las fotos se guardan en el bucket pet-photos, dentro de una carpeta
    con el id del usuario. El bucket tiene que existir y ser publico
    para que la imagen se vea en el listado.

  - Si el registro no entra a la app, revisa la confirmacion de correo
    en Supabase y que trigger_profile_role.sql ya se haya ejecutado.

  - Para produccion: restringe la clave anonima con RLS (ya activa),
    no desactives la confirmacion de correo y limita la clave de mapas
    al paquete de la aplicacion firmada.


=========================================================================
  Desarrollado como proyecto de grado - 2026
  Stack: Expo 54 + React Native + TypeScript + Supabase
=========================================================================
