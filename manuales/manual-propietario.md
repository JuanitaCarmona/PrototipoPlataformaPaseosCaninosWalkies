# Manual de usuario del sistema Walkies

**Rol:** Propietario de mascotas  
**Tipo de documento:** Manual de usuario  
**Sistema:** Walkies — gestión de paseos de mascotas  
**Institución:** Universidad Libre

---

## 1. Introducción

El presente manual describe el uso del sistema Walkies desde la perspectiva del propietario de mascotas. Walkies es una aplicación móvil orientada a la solicitud, el seguimiento y la valoración de paseos caninos, y distingue dos perfiles de usuario: el propietario, quien solicita el servicio, y el paseador, quien lo presta.

Este documento se limita a las funciones que el propietario observa y ejecuta en la interfaz. No incluye aspectos de implementación, configuración técnica ni administración de la base de datos. Su finalidad es servir como material de apoyo del proyecto de grado, de modo que un usuario sin conocimiento previo del sistema pueda completar las tareas propias de su rol.

## 2. Objetivo

Orientar al propietario en el uso de Walkies para registrar sus mascotas, localizar paseadores, agendar un paseo, comunicarse con el paseador asignado, consultar el seguimiento durante el servicio y registrar una valoración al finalizar.

## 3. Alcance

El manual cubre las funciones disponibles para el rol de propietario:

- Acceso al sistema y creación de cuenta.
- Consulta de paseadores cercanos, en lista y en mapa.
- Registro, edición y eliminación de mascotas.
- Agendamiento de paseos, con punto de recogida, fecha, hora y duración.
- Consulta del historial y de los estados del servicio.
- Seguimiento del paseo en curso, mensajería y llamada.
- Valoración del servicio concluido.
- Administración del perfil y recepción de notificaciones.

Quedan fuera de este documento las funciones exclusivas del paseador, el cobro electrónico —el sistema no procesa pagos— y la configuración del entorno de desarrollo.

## 4. Convenciones

- Los nombres de botones, pestañas y campos se presentan en **negrita**, tal como aparecen en la interfaz.
- Los mensajes que muestra el sistema se citan en cursiva.
- Cada apartado que corresponde a una pantalla incluye un espacio destinado a la figura. La figura debe insertarse en ese espacio; el texto entre corchetes indica el contenido que se espera en la captura.
- Las acciones se describen en el orden en que el usuario las encuentra en la pantalla.

## 5. Descripción general

Walkies permite al propietario solicitar paseos para sus mascotas a paseadores registrados en el sistema. Desde la aplicación es posible:

- Crear una cuenta y conservar los datos de contacto.
- Registrar cada mascota, incluida su fotografía y la información relevante para el paseo.
- Consultar paseadores por nombre, ciudad, tarifa, calificación o cercanía.
- Programar un paseo con fecha, hora, duración y punto de recogida.
- Comunicarse con el paseador mediante el chat del servicio o una llamada telefónica.
- Visualizar el recorrido mientras el paseo se encuentra en curso.
- Calificar el servicio una vez finalizado.
- Recibir notificaciones asociadas a los cambios de estado.

El pago no se realiza dentro de la aplicación. El valor del servicio se cancela en efectivo al momento de la entrega de la mascota. La tarifa que muestra el sistema constituye una referencia calculada a partir de la tarifa por hora del paseador y de la duración seleccionada.

## 6. Acceso al sistema

### 6.1. Pantalla de inicio de la aplicación

Al abrir Walkies se presenta una pantalla de carga con el identificador visual del sistema, la denominación **Walkies!** y el lema *Paseos felices, perros más sanos*. Transcurridos unos segundos, el sistema avanza de forma automática a la pantalla de bienvenida. No se requiere ninguna acción del usuario en esta etapa.

> **Figura 1.** Pantalla de inicio de la aplicación.  
> *[Espacio para la figura. Insertar la captura de la pantalla de carga: fondo del color institucional, logotipo, denominación «Walkies!» y el lema del sistema.]*

### 6.2. Pantalla de bienvenida

La pantalla de bienvenida permite ingresar a una cuenta existente o iniciar el registro. Se presentan los siguientes elementos:

- **Iniciar sesión.** Dirige al formulario de acceso para usuarios ya registrados.
- **Crear cuenta.** Dirige al formulario de registro.
- Acceso con **Google** y **Apple.** Estas opciones muestran el aviso *Próximamente*. En la versión documentada no se encuentran habilitadas.
- Selección del tipo de cuenta, mediante dos tarjetas:
  - **Propietario.** Leyenda: *Encuentra paseadores cerca.* Corresponde al rol descrito en este manual.
  - **Paseador.** Leyenda: *Ofrece paseos y gana.* Corresponde al otro rol del sistema y no debe seleccionarse si la finalidad es solicitar paseos.

El rol se define en el momento del registro y no puede modificarse con posterioridad. Quien requiera el otro perfil debe crear una cuenta distinta, asociada a otro correo electrónico.

> **Figura 2.** Pantalla de bienvenida.  
> *[Espacio para la figura. Insertar la captura en la que se observen el logotipo, los botones Iniciar sesión y Crear cuenta, y las tarjetas Propietario y Paseador.]*

### 6.3. Creación de la cuenta

Para registrarse como propietario se procede de la siguiente manera:

1. En la pantalla de bienvenida se selecciona la tarjeta **Propietario**.
2. Se presiona **Crear cuenta**.
3. Se diligencian los campos del formulario:
   - **Nombre completo.** Nombre con el que el usuario será identificado ante los paseadores.
   - **Tipo de cuenta.** Debe permanecer en **Propietario**.
   - **Correo electrónico.** Dirección válida, que se utilizará en los accesos posteriores.
   - **Contraseña.** Debe contener al menos seis caracteres. El icono del ojo permite mostrar u ocultar el texto ingresado.
4. Se presiona **Crear cuenta**.

Si el correo ya se encuentra registrado, el sistema informa que debe iniciarse sesión con esa cuenta. Si la confirmación del correo es necesaria, se presenta un mensaje que indica revisar la bandeja de entrada antes de ingresar.

En la parte inferior del formulario, el enlace **¿Ya tienes cuenta? Ingresar** conduce al acceso. La opción **Volver** regresa a la pantalla de bienvenida.

> **Figura 3.** Formulario de registro del propietario.  
> *[Espacio para la figura. Insertar la captura del formulario con el tipo de cuenta en Propietario, y los campos de nombre, correo y contraseña.]*

### 6.4. Inicio de sesión

1. Se presiona **Iniciar sesión**.
2. Se ingresan el **correo electrónico** y la **contraseña**.
3. Se presiona **Iniciar sesión**.

Cuando los datos son incorrectos, están incompletos o el correo no tiene un formato válido, el sistema muestra el motivo en color rojo, debajo del formulario. Si las credenciales son correctas, se presenta la pantalla de inicio del propietario.

> **Figura 4.** Formulario de inicio de sesión.  
> *[Espacio para la figura. Insertar la captura de los campos de correo y contraseña, junto con el botón Iniciar sesión.]*

## 7. Estructura de la interfaz

Una vez autenticado, el propietario dispone de una barra de navegación inferior con cuatro secciones:

| Sección | Función |
|---|---|
| **Inicio** | Presenta el resumen de la cuenta, el acceso directo para solicitar un paseo y el directorio de paseadores. |
| **Mascotas** | Permite registrar, consultar, editar y eliminar las mascotas. |
| **Paseos** | Permite agendar un servicio y consultar su historial. |
| **Perfil** | Permite consultar y actualizar los datos personales, y cerrar la sesión. |

La sección activa se distingue mediante el color institucional. En la esquina superior derecha se encuentra el icono de notificaciones, disponible en todas las secciones.

> **Figura 5.** Barra de navegación del propietario.  
> *[Espacio para la figura. Insertar la captura de la barra inferior con las secciones Inicio, Mascotas, Paseos y Perfil, e indicar cuál se encuentra activa.]*

## 8. Notificaciones

El icono de la campana abre el listado de avisos del usuario. Cuando existen notificaciones sin leer, se muestra un indicador numérico. Si la cantidad supera nueve, el indicador presenta el texto **9+**.

El propietario recibe, entre otros, avisos cuando el paseador confirma, inicia, finaliza o cancela un paseo. Al abrir el panel, las notificaciones pendientes quedan marcadas como leídas. Si no existe ningún aviso, se presenta el mensaje *No tienes notificaciones todavía.* El icono de cierre oculta el panel y devuelve a la sección en la que se encontraba el usuario.

> **Figura 6.** Panel de notificaciones.  
> *[Espacio para la figura. Insertar la captura de la campana con el indicador y de la pantalla titulada Notificaciones.]*

## 9. Pantalla de inicio

La pantalla de inicio saluda al usuario con su nombre y presenta la tarjeta **Bienvenido a Walkies**.

### 9.1. Solicitud de un paseo

El botón **Solicitar un paseo** conduce a la sección de agendamiento, con el formulario listo para programar un servicio.

### 9.2. Referencia de ubicación

Bajo la tarjeta de bienvenida se muestra el último punto de recogida utilizado o, en su defecto, la ciudad registrada. Si el usuario aún no ha agendado un paseo, el sistema indica que el punto de recogida se define al programar el servicio. Esta referencia se emplea para estimar la cercanía de los paseadores.

### 9.3. Servicios destacados

Tres indicadores resumen las capacidades principales ofrecidas al propietario: **Paseadores cerca**, **Seguimiento** y **Valoraciones**.

### 9.4. Accesos directos

- **Mis mascotas**, con la leyenda *Perfil y fotos*, abre la sección de mascotas.
- **Mis paseos**, con la leyenda *Agenda e historial*, abre la sección de paseos.

### 9.5. Próximo paseo

Cuando existe un paseo en estado pendiente, confirmado o en curso, se presenta una tarjeta con el nombre de la mascota y la fecha y hora programadas. Al seleccionarla, el sistema abre la sección **Paseos**.

### 9.6. Recomendación del día

El sistema muestra una recomendación breve de cuidado animal, que se renueva cada día. Los contenidos abordan, entre otros aspectos, la hidratación en clima cálido, la duración habitual del paseo y el cuidado de las extremidades.

> **Figura 7.** Parte superior de la pantalla de inicio.  
> *[Espacio para la figura. Insertar la captura del saludo, la tarjeta de bienvenida, el botón Solicitar un paseo, la referencia de ubicación, los accesos directos, el próximo paseo y la recomendación del día.]*

## 10. Consulta de paseadores

En la misma pantalla de inicio, la sección **Paseadores cercanos** presenta a las personas habilitadas para prestar el servicio.

### 10.1. Búsqueda

El campo *Buscar por nombre, ciudad o bio* filtra el listado a medida que se escribe. La búsqueda considera el nombre del paseador, su ciudad y el texto de su presentación.

### 10.2. Ordenamiento

El botón de filtros ofrece las siguientes opciones:

- **Sin filtro.** Conserva el orden predeterminado.
- **Precio: menor a mayor.**
- **Precio: mayor a menor.**
- **Mejor calificación.**
- **Más cercanos.** Utiliza el punto de recogida del propietario. Si dicho punto aún no ha sido definido, la distancia puede no mostrarse.

Al seleccionar una opción, el menú se cierra y el listado se reorganiza.

### 10.3. Vista de lista y vista de mapa

La sección dispone de dos presentaciones:

- **Lista.** Muestra una tarjeta por cada paseador.
- **Mapa.** Ubica en el mapa a los paseadores que han compartido su posición y, debajo, mantiene las tarjetas correspondientes.

Si no existen paseadores registrados, se presenta el mensaje *Sin paseadores registrados*. Si el criterio de búsqueda no produce coincidencias, se presenta *Sin resultados*; en ese caso, el usuario puede modificar el texto o el filtro aplicado.

> **Figura 8.** Búsqueda, filtros y cambio entre lista y mapa.  
> *[Espacio para la figura. Insertar la captura del campo de búsqueda, el botón de filtros y las pestañas Lista y Mapa.]*

> **Figura 9.** Mapa de paseadores.  
> *[Espacio para la figura. Insertar la captura de la vista Mapa, con la ubicación de los paseadores disponibles.]*

### 10.4. Tarjeta del paseador

Cada tarjeta presenta la siguiente información:

- Fotografía del paseador o, en su ausencia, un icono genérico de persona.
- Nombre.
- Tarifa por hora, por ejemplo `$25.000/h`, o el texto **A convenir** cuando no se ha publicado un valor.
- Calificación con estrellas o la leyenda **Nuevo**, si el paseador aún no ha sido valorado.
- Distancia en kilómetros, cuando existe un punto de recogida y el paseador ha compartido su ubicación.
- Ciudad.
- Extracto de la presentación.
- La etiqueta **Disponible hoy**, cuando la ubicación del paseador se encuentra activa.

Al seleccionar la tarjeta se abre la ficha detallada.

> **Figura 10.** Tarjeta de paseador en el listado.  
> *[Espacio para la figura. Insertar la captura de una tarjeta con fotografía, nombre, tarifa, calificación, distancia y la etiqueta Disponible hoy.]*

### 10.5. Ficha del paseador

La ficha reúne:

- Fotografía ampliada y nombre.
- Calificación o la leyenda *Nuevo en Walkies*.
- Tarifa, distancia, ciudad y, cuando aplica, la etiqueta **Disponible hoy**.
- La sección **Sobre mí**, con la presentación redactada por el paseador.
- La sección **Reseñas**, con hasta cinco valoraciones recientes. Si no existen, se indica *Aún no tiene valoraciones.*
- El botón **Solicitar este paseador**, que abre el agendamiento con ese paseador ya seleccionado.
- La opción **Cerrar**, que regresa al listado.

> **Figura 11.** Ficha del paseador.  
> *[Espacio para la figura. Insertar la captura de la ficha, con la presentación, las reseñas y el botón Solicitar este paseador.]*

## 11. Gestión de mascotas

La sección **Mascotas**, accesible desde la barra inferior, se titula **Mis mascotas** y presenta el subtítulo *Tu bienestar, nuestra prioridad*.

### 11.1. Registro de una mascota

Mediante **Añadir mascota** se abre el formulario de registro, con los siguientes campos:

- **Foto.** La opción **Elegir foto** abre la galería del dispositivo. El sistema solicita permiso de acceso a las imágenes y permite recortar la fotografía.
- **Nombre.** Campo obligatorio.
- **Raza.** Campo opcional.
- **Edad (años).** Valor numérico entre 0 y 40. Puede omitirse.
- **Tamaño.** Las opciones disponibles son Pequeño, Mediano y Grande.
- **Notas.** Espacio para alergias, conducta, manejo de la correa, indicaciones de acceso al domicilio y cualquier dato que el paseador deba conocer.

**Guardar** crea el registro. **Cancelar**, o **Cerrar** en el encabezado, descarta el formulario. El registro exitoso se confirma con el mensaje *Mascota guardada correctamente.*

> **Figura 12.** Formulario de registro de mascota.  
> *[Espacio para la figura. Insertar la captura del formulario con fotografía, nombre, raza, edad, tamaño y notas.]*

### 11.2. Consulta y edición

Cada mascota se presenta en una tarjeta con fotografía, nombre, raza, edad y tamaño. Al seleccionar la tarjeta se abre el mismo formulario en modo de edición. **Actualizar** conserva los cambios y muestra el mensaje *Mascota actualizada correctamente.*

### 11.3. Solicitud de paseo desde la ficha

El botón **Solicitar paseo**, ubicado en la tarjeta, abre el agendamiento con esa mascota ya seleccionada.

### 11.4. Eliminación

**Eliminar** solicita la confirmación mediante la pregunta *¿Eliminar a [nombre]?* Si el usuario confirma, la mascota deja de mostrarse en el listado. Cuando la mascota tiene paseos asociados, el sistema impide la eliminación e indica que dichos paseos deben cancelarse o concluir antes de retirar el registro.

### 11.5. Ausencia de registros

Si el propietario no ha registrado mascotas, se presenta el título **Sin mascotas** y la indicación para añadir la primera.

### 11.6. Próximos paseos

Al final del listado, la sección **Próximos paseos** muestra hasta cinco servicios en estado pendiente, confirmado o en curso, con el nombre de la mascota, el día, la hora y la duración. Si no existen servicios programados, se presenta el mensaje *Aún no tienes paseos agendados.*

> **Figura 13.** Listado de mascotas y próximos paseos.  
> *[Espacio para la figura. Insertar la captura de una tarjeta de mascota, con los botones Solicitar paseo y Eliminar, y la sección Próximos paseos.]*

## 12. Sección de paseos

La sección **Paseos** organiza el trabajo del propietario en dos pestañas:

- **Agendar.** Destinada a programar un servicio nuevo. El subtítulo de la pantalla es *Programa un paseo*.
- **Historial.** Destinada a consultar los servicios registrados y las valoraciones. El subtítulo es *Historial y valoraciones*.

> **Figura 14.** Pestañas de la sección Paseos.  
> *[Espacio para la figura. Insertar la captura del título Paseos y de las pestañas Agendar e Historial.]*

## 13. Agendamiento de un paseo

El formulario se diligencia en el orden en que se presenta en la pantalla.

### 13.1. Selección de la mascota

Se selecciona el nombre de la mascota que recibirá el servicio. Si no existe ningún registro, el sistema remite a **Mis mascotas**. Cuando el usuario llega desde **Solicitar paseo** o desde **Solicitar este paseador**, la mascota o el paseador correspondientes pueden aparecer ya seleccionados.

### 13.2. Punto de recogida

Este campo indica el lugar en el que el paseador debe recibir a la mascota. Se recomienda una dirección completa, con barrio y ciudad. El texto de ayuda del formulario es: *Escribe una dirección clara (barrio, ciudad). Nosotros ubicamos el punto en el mapa.*

En el dispositivo móvil, el punto puede fijarse de tres maneras:

- **Buscar ubicación.** El sistema localiza la dirección escrita. Si existen varias coincidencias, se presenta el cuadro *Elige la dirección correcta* para que el usuario seleccione la adecuada.
- **Estoy ahí (GPS).** Utiliza la posición actual del dispositivo. El sistema solicita el permiso de ubicación.
- **Elegir en el mapa.** Abre un mapa en el que el usuario marca el punto.

Cuando la ubicación queda definida, se muestra una vista previa del mapa y la confirmación de que el punto está listo para el cálculo de distancias. Si se modifica el texto de la dirección, es necesario volver a localizarla.

La opción **Opciones avanzadas (lat/lng manual)** permite ingresar latitud y longitud de forma directa. Esta alternativa está prevista para casos excepcionales; el procedimiento habitual es la dirección escrita, el GPS o la selección en el mapa.

El agendamiento no puede completarse sin un punto de recogida ubicado, dado que de ese punto depende el cálculo de la distancia respecto del paseador.

> **Figura 15.** Definición del punto de recogida.  
> *[Espacio para la figura. Insertar la captura del campo de dirección, los botones Buscar ubicación, Estoy ahí (GPS) y Elegir en el mapa, y la vista previa.]*

> **Figura 16.** Selección del punto en el mapa.  
> *[Espacio para la figura. Insertar la captura del mapa utilizado para marcar el lugar de recogida.]*

### 13.3. Fecha y hora

Los campos **Fecha** y **Hora** abren el selector del dispositivo. El servicio debe programarse en un momento futuro. El sistema rechaza una fecha u hora ya transcurridas, con el mensaje *El paseo debe programarse en una fecha y hora futura.*

### 13.4. Duración

Las duraciones disponibles son **30 min**, **45 min** y **60 min**.

### 13.5. Notas para el paseador

Campo de texto libre destinado a indicaciones de acceso, conducta de la mascota, elementos que deben llevarse y cualquier otra observación pertinente.

### 13.6. Selección del paseador

Los paseadores disponibles se presentan con nombre, calificación, tarifa por hora y distancia al punto de recogida. Se selecciona uno de ellos.

Bajo el listado, el recuadro **Paseador seleccionado** muestra la presentación y la tarifa de referencia. Si el paseador no ha publicado un valor, se indica *Tarifa sujeta a confirmación con el paseador.* Cuando sí existe tarifa, el sistema estima el valor del servicio según la duración elegida: treinta minutos corresponden a la mitad de la tarifa por hora, y sesenta minutos al valor completo. Dicho valor es informativo. El cobro se realiza en efectivo al entregar la mascota.

### 13.7. Confirmación del agendamiento

El botón **Agendar paseo** envía la solicitud. Si falta la mascota, el paseador, la dirección o el punto en el mapa, el sistema señala la omisión. Cuando el registro es exitoso, se presenta el mensaje *Tu paseo quedó agendado correctamente.*

El paseo queda en estado **Pendiente** hasta que el paseador lo confirme. El paseador recibe, a su vez, la notificación de la nueva solicitud.

> **Figura 17.** Fecha, duración, notas y selección del paseador.  
> *[Espacio para la figura. Insertar la captura de los campos de fecha y hora, la duración, las notas y el listado de paseadores.]*

> **Figura 18.** Confirmación del agendamiento.  
> *[Espacio para la figura. Insertar la captura del mensaje «Tu paseo quedó agendado correctamente».]*

## 14. Historial de paseos

Dentro de **Historial** se distinguen dos filtros:

- **Próximos.** Servicios pendientes, confirmados o en curso.
- **Completados.** Servicios finalizados y servicios cancelados.

Si el filtro no tiene registros, el sistema lo indica de forma expresa. Si el propietario nunca ha agendado un paseo, se presenta *Sin paseos agendados* y la orientación para utilizar la pestaña **Agendar**.

Cada registro muestra:

- Nombre de la mascota.
- Estado del servicio, diferenciado por color.
- Fecha, hora y duración.
- Valor estimado, cuando pudo calcularse.
- Nombre del paseador.
- Dirección de recogida.
- Notas registradas al agendar.

> **Figura 19.** Historial de paseos próximos.  
> *[Espacio para la figura. Insertar la captura de un paseo en la pestaña Próximos, con su estado, fecha y acciones disponibles.]*

> **Figura 20.** Historial de paseos completados.  
> *[Espacio para la figura. Insertar la captura de un paseo finalizado y del espacio destinado a la valoración.]*

### 14.1. Acciones disponibles

Las acciones de cada registro dependen del estado del paseo.

| Acción | Condición de aparición | Resultado |
|---|---|---|
| **Ver seguimiento** | El paseo se encuentra **En curso** | Abre el mapa del servicio en tiempo real. |
| **Chat** | El paseo no está cancelado | Abre la conversación con el paseador asignado. |
| **Llamar** | Disponible en el registro | Inicia una llamada al número del paseador. Si el paseador no ha registrado teléfono, se informa: *Este usuario aún no cargó un número de contacto.* |
| **Cancelar** | El paseo está **Pendiente** o **Confirmado** | Solicita confirmación. Al aceptarse, el estado pasa a **Cancelado** y el paseador recibe la notificación correspondiente. |

## 15. Seguimiento del paseo

La acción **Ver seguimiento** abre la pantalla **Paseo en curso**. En ella se presenta:

- Un mapa con el punto de recogida y, cuando el paseador tiene la ubicación activa, su posición.
- La leyenda *Ubicación del paseador en vivo (se actualiza cada 3 s)*, o *Esperando GPS del paseador…* si la posición aún no está disponible.
- El nombre de la mascota, el nombre del paseador y la dirección de recogida.
- **Tiempo.** Duración transcurrida desde que el paseador inició el servicio.
- **Distancia.** Separación, en kilómetros, entre el paseador y el punto de recogida.
- **Duración.** Minutos solicitados al agendar: 30, 45 o 60.
- Las acciones **Llamar** y **Chat**, para contactar al paseador sin abandonar el seguimiento.

La posición del paseador se actualiza únicamente si este mantiene la aplicación abierta, con el GPS activo y el paseo en estado **En curso**. El icono de cierre regresa al historial.

> **Figura 21.** Seguimiento del paseo en curso.  
> *[Espacio para la figura. Insertar la captura del mapa y de los indicadores de tiempo, distancia y duración, junto con las acciones Llamar y Chat.]*

## 16. Mensajería del paseo

La acción **Chat** abre la conversación asociada exclusivamente a ese servicio. El encabezado indica **Chat** y el nombre del interlocutor.

El mensaje se redacta en el campo *Escribe un mensaje* y se envía desde el mismo panel. Los mensajes de cada participante se distinguen visualmente. Si la conversación está vacía, se presenta el texto *Aún no hay mensajes. Di hola.*

Este canal está previsto para coordinar el acceso al domicilio, informar un retraso o precisar indicaciones del servicio sin recurrir a la llamada telefónica.

> **Figura 22.** Conversación con el paseador.  
> *[Espacio para la figura. Insertar la captura del chat, con mensajes de ambos participantes y el campo de redacción.]*

## 17. Valoración del servicio

Cuando el paseo se encuentra en estado **Completado**, el filtro **Completados** del historial habilita la sección **Valora el paseo**. El procedimiento es el siguiente:

1. Se selecciona una calificación de una a cinco estrellas.
2. De manera opcional, se redacta un comentario en el campo *Comentario (opcional)*.
3. Se presiona **Enviar valoración**.

Una vez enviada, la tarjeta muestra **Tu valoración**, con las estrellas y el comentario registrados. Esa reseña queda visible para otros propietarios en la ficha del paseador, quien recibe a su vez la notificación de la calificación.

No es posible valorar un paseo que no se encuentre completado, ni enviar la valoración sin haber seleccionado las estrellas.

> **Figura 23.** Registro de la valoración.  
> *[Espacio para la figura. Insertar la captura de las estrellas, el campo de comentario y el botón Enviar valoración.]*

## 18. Perfil del propietario

La sección **Perfil** presenta la fotografía del usuario —o la inicial de su nombre, si no ha cargado una imagen—, el nombre, el correo electrónico y la etiqueta **Dueño de mascotas**.

**Cambiar foto** abre la galería. Durante la carga, el rótulo cambia a *Subiendo...*

La tarjeta de información muestra el nombre, el teléfono y la dirección. **Editar perfil** habilita la modificación de:

- **Nombre.**
- **Teléfono.** Número que el paseador utiliza mediante la acción **Llamar**. Se recomienda registrarlo de forma completa.
- **Calle y número.**
- **Ciudad.**
- **Usar ubicación actual.** Completa la dirección con la posición del dispositivo, previo permiso de ubicación.

**Guardar** confirma los cambios. **Cancelar** los descarta y restituye la vista de consulta.

**Cerrar sesión** devuelve a la pantalla de bienvenida. Las mascotas y los paseos permanecen asociados a la cuenta para el siguiente ingreso.

> **Figura 24.** Perfil del propietario.  
> *[Espacio para la figura. Insertar la captura de la fotografía, el nombre, los datos de contacto y el botón Editar perfil.]*

> **Figura 25.** Edición del perfil.  
> *[Espacio para la figura. Insertar la captura del formulario de nombre, teléfono y dirección, con el botón Guardar.]*

## 19. Estados del paseo

El estado informa la situación del servicio y determina las acciones habilitadas.

| Estado | Significado para el propietario |
|---|---|
| **Pendiente** | La solicitud fue enviada y el paseador aún no la ha aceptado. Es posible cancelarla o escribir por el chat. |
| **Confirmado** | El paseador aceptó el servicio para la fecha y hora indicadas. La cancelación sigue disponible. |
| **En curso** | El paseador inició el recorrido con la mascota. Se habilita **Ver seguimiento**. |
| **Completado** | El servicio finalizó. Se habilita el registro de la valoración. |
| **Cancelado** | El propietario o el paseador canceló el servicio. No se ofrece chat ni seguimiento. |

Los cambios relevantes de estado se notifican, además, en el panel de la campana.

## 20. Permisos del dispositivo

El sistema puede solicitar los siguientes permisos:

- **Fotografías.** Requerido para la imagen de perfil y para la fotografía de la mascota.
- **Ubicación.** Requerido para **Estoy ahí (GPS)**, **Elegir en el mapa** y **Usar ubicación actual** en el perfil.

Si el permiso se deniega, la acción correspondiente no se completa y el sistema informa que el acceso es necesario. El permiso puede habilitarse posteriormente desde la configuración del dispositivo.

## 21. Secuencia de uso

El flujo habitual del propietario comprende las siguientes actividades:

1. Crear la cuenta con el rol **Propietario** e iniciar sesión.
2. Registrar el teléfono y la dirección en **Perfil**.
3. Registrar la mascota en **Mascotas**, con fotografía y observaciones.
4. Consultar los paseadores en **Inicio**, abrir la ficha y seleccionar **Solicitar este paseador**.
5. En **Paseos**, definir el punto de recogida, la fecha, la hora y la duración, y confirmar con **Agendar paseo**.
6. Esperar a que el estado pase a **Confirmado**.
7. Durante el servicio, cuando el estado sea **En curso**, consultar **Ver seguimiento** o el **Chat**.
8. Una vez el estado sea **Completado**, registrar la valoración.
9. Cancelar el valor del servicio en efectivo al recibir la mascota, de acuerdo con la tarifa de referencia.
