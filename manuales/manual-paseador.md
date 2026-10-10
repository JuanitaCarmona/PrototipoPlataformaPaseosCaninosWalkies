# Manual de usuario del sistema Walkies

**Rol:** Paseador  
**Tipo de documento:** Manual de usuario  
**Sistema:** Walkies — gestión de paseos de mascotas  
**Institución:** Universidad Libre

---

## 1. Introducción

El presente manual describe el uso del sistema Walkies desde la perspectiva del paseador. Walkies es una aplicación móvil orientada a la solicitud, el seguimiento y la valoración de paseos caninos, y distingue dos perfiles de usuario: el propietario, quien solicita el servicio, y el paseador, quien lo presta.

Este documento se limita a las funciones que el paseador observa y ejecuta en la interfaz. No incluye aspectos de implementación, configuración técnica ni administración de la base de datos. Su finalidad es servir como material de apoyo del proyecto de grado, de modo que un usuario sin conocimiento previo del sistema pueda atender una solicitud desde su recepción hasta la entrega de la mascota.

## 2. Objetivo

Orientar al paseador en el uso de Walkies para completar su perfil profesional, compartir su ubicación, recibir y confirmar solicitudes, conducir el servicio y comunicarse con el propietario durante el paseo.

## 3. Alcance

El manual cubre las funciones disponibles para el rol de paseador:

- Acceso al sistema y creación de cuenta.
- Diligenciamiento del perfil, incluida la presentación y la tarifa por hora.
- Activación de la ubicación.
- Consulta de las solicitudes asignadas.
- Confirmación, inicio, finalización y cancelación del servicio.
- Seguimiento del paseo, mensajería y llamada al propietario.
- Recepción de notificaciones y de valoraciones.

Quedan fuera de este documento las funciones exclusivas del propietario, entre ellas el registro de mascotas y la redacción de la valoración. El sistema no procesa pagos: el cobro se realiza en efectivo al entregar la mascota.

## 4. Convenciones

- Los nombres de botones, pestañas y campos se presentan en **negrita**, tal como aparecen en la interfaz.
- Los mensajes que muestra el sistema se citan en cursiva.
- Cada apartado que corresponde a una pantalla incluye un espacio destinado a la figura. La figura debe insertarse en ese espacio; el texto entre corchetes indica el contenido que se espera en la captura.
- Las acciones se describen en el orden en que el usuario las encuentra en la pantalla.

## 5. Descripción general

Walkies pone en contacto a los propietarios de mascotas con los paseadores registrados. Desde la aplicación, el paseador puede:

- Crear una cuenta con el rol correspondiente.
- Presentarse mediante una fotografía, una descripción y una tarifa por hora.
- Compartir su ubicación, de manera que los propietarios puedan identificar su cercanía y seguir el servicio en el mapa.
- Recibir solicitudes y avanzar su estado: confirmarlas, iniciarlas y marcarlas como finalizadas.
- Consultar la dirección de recogida y la distancia hasta ese punto.
- Comunicarse con el propietario mediante el chat del servicio o una llamada telefónica.
- Recibir notificaciones asociadas a nuevas solicitudes, cancelaciones y valoraciones.

En la pantalla principal, el sistema informa de manera expresa: *Pagos por ahora solo en efectivo.* El valor se cobra al entregar la mascota. No existe pasarela de pago dentro de la aplicación.

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
  - **Propietario.** Leyenda: *Encuentra paseadores cerca.* Corresponde al otro rol del sistema.
  - **Paseador.** Leyenda: *Ofrece paseos y gana.* Corresponde al rol descrito en este manual.

El rol se define en el momento del registro y no puede modificarse con posterioridad. Quien requiera el otro perfil debe crear una cuenta distinta, asociada a otro correo electrónico.

> **Figura 2.** Pantalla de bienvenida con el rol de paseador.  
> *[Espacio para la figura. Insertar la captura de la bienvenida con la tarjeta Paseador seleccionada.]*

### 6.3. Creación de la cuenta

Para registrarse como paseador se procede de la siguiente manera:

1. En la pantalla de bienvenida se selecciona la tarjeta **Paseador**.
2. Se presiona **Crear cuenta**.
3. El formulario indica: *Recibirás solicitudes de paseo. Después completa tu perfil de paseador.*
4. Se diligencian los campos:
   - **Nombre completo.** Nombre con el que el usuario será identificado ante los propietarios.
   - **Tipo de cuenta.** Debe permanecer en **Paseador**.
   - **Correo electrónico.** Dirección válida, que se utilizará en los accesos posteriores.
   - **Contraseña.** Debe contener al menos seis caracteres. El icono del ojo permite mostrar u ocultar el texto ingresado.
5. Se presiona **Crear cuenta**.

Si el correo ya se encuentra registrado, el sistema informa que debe iniciarse sesión con esa cuenta. Si la confirmación del correo es necesaria, se presenta un mensaje que indica revisar la bandeja de entrada antes de ingresar.

La opción **Volver** regresa a la pantalla de bienvenida. El enlace **¿Ya tienes cuenta? Ingresar** conduce al formulario de acceso.

> **Figura 3.** Formulario de registro del paseador.  
> *[Espacio para la figura. Insertar la captura del formulario con el tipo de cuenta en Paseador, y los campos de nombre, correo y contraseña.]*

### 6.4. Inicio de sesión

1. Se presiona **Iniciar sesión**.
2. Se ingresan el **correo electrónico** y la **contraseña**.
3. Se presiona **Iniciar sesión**.

Cuando los datos son incorrectos, el sistema muestra el motivo en color rojo. Si las credenciales son correctas, se presenta la pantalla de paseos del rol de paseador. La interfaz de este rol es distinta de la del propietario: no incluye las secciones de mascotas ni de agendamiento.

> **Figura 4.** Formulario de inicio de sesión.  
> *[Espacio para la figura. Insertar la captura de los campos de correo y contraseña, junto con el botón Iniciar sesión.]*

## 7. Estructura de la interfaz

Una vez autenticado, el paseador dispone de una barra de navegación inferior con dos secciones:

| Sección | Función |
|---|---|
| **Paseos** | Presenta las solicitudes asignadas, permite cambiar su estado y contactar al propietario. |
| **Perfil** | Permite administrar la fotografía, el teléfono, la dirección, la presentación, la tarifa y el cierre de sesión. |

La sección activa se distingue mediante el color institucional. En la esquina superior derecha se encuentra el icono de notificaciones.

> **Figura 5.** Barra de navegación del paseador.  
> *[Espacio para la figura. Insertar la captura de la barra inferior con las secciones Paseos y Perfil, e indicar cuál se encuentra activa.]*

## 8. Notificaciones

El icono de la campana abre el listado de avisos del usuario. Cuando existen notificaciones sin leer, se muestra un indicador numérico. Si la cantidad supera nueve, el indicador presenta el texto **9+**.

El paseador recibe, entre otros, los siguientes avisos:

- Una nueva solicitud de paseo, con la duración indicada por el propietario.
- La cancelación de un servicio por parte del propietario.
- El registro de una valoración, con el número de estrellas asignado.

Al abrir el panel, las notificaciones pendientes quedan marcadas como leídas. Si no existe ningún aviso, se presenta el mensaje *No tienes notificaciones todavía.* El icono de cierre oculta el panel.

Si una solicitud reciente no aparece en el listado, este puede actualizarse deslizando la pantalla hacia abajo.

> **Figura 6.** Notificación de una nueva solicitud.  
> *[Espacio para la figura. Insertar la captura de la campana y del aviso «Nueva solicitud de paseo».]*

## 9. Pantalla de paseos

Al ingresar, el sistema saluda al usuario con su nombre y presenta la tarjeta **Listo para pasear**, acompañada de la leyenda *Hoy el barrio se recorre con vos*.

El botón principal de esa tarjeta depende de la información pendiente:

1. Si la presentación o la tarifa no han sido diligenciadas, el botón indica **Completa tu perfil** y conduce a la sección **Perfil**. Esa información es la que los propietarios consultan al elegir un paseador.
2. Si el perfil está completo y la ubicación no se ha activado, el botón indica **Activar mi ubicación**.
3. Si la ubicación ya fue compartida, el botón se sustituye por la confirmación *Ubicación activa · los dueños pueden seguirte*.

> **Figura 7.** Tarjeta de bienvenida del paseador.  
> *[Espacio para la figura. Insertar la captura del saludo, la tarjeta Listo para pasear y el botón Completa tu perfil o Activar mi ubicación.]*

### 9.1. Resumen de la actividad

Tres indicadores sintetizan el estado de la jornada:

- **Por confirmar.** Cantidad de paseos en estado **Pendiente**.
- **En curso.** Cantidad de paseos iniciados que aún no se han marcado como finalizados.
- **GPS on** o **GPS off.** Cuando la ubicación está inactiva, el indicador se presenta en tono de advertencia.

### 9.2. Aviso de ubicación

Si el GPS se encuentra inactivo, una tarjeta de advertencia indica *Debes tener la ubicación prendida* y precisa que, sin esa información, el propietario no puede visualizar el paseo en el mapa. Al seleccionarla, el sistema solicita el permiso y registra la posición.

### 9.3. Modalidad de pago

Una tarjeta informativa recuerda: *Pagos por ahora solo en efectivo. Recuerda cobrar al entregar a la mascota. Aún no hay pagos en la app.*

### 9.4. Próximo paseo

Cuando existe un servicio pendiente, confirmado o en curso, se muestra el nombre de la mascota y la fecha y hora del paseo más próximo.

### 9.5. Recomendación del día

El sistema muestra una recomendación operativa que se renueva cada día. Los contenidos abordan la prontitud de la confirmación, el aviso de llegada, el porte de implementos básicos, la permanencia del GPS durante el recorrido y la comunicación oportuna ante una demora.

> **Figura 8.** Resumen de actividad y avisos de la pantalla principal.  
> *[Espacio para la figura. Insertar la captura de los tres indicadores, el aviso de GPS cuando corresponda, la tarjeta de pago en efectivo, el próximo paseo y la recomendación del día.]*

## 10. Activación de la ubicación

La ubicación se activa mediante **Activar mi ubicación** o mediante la tarjeta de advertencia descrita en el apartado anterior.

- Si el permiso se concede, el sistema registra la posición actual. Los propietarios pueden identificar al paseador como disponible y estimar la distancia. Durante un paseo **En curso**, la posición se actualiza de forma automática mientras la aplicación permanece abierta.
- Si el permiso se deniega, el sistema indica que el GPS debe habilitarse en los permisos de la aplicación, con el fin de que el propietario pueda seguir el servicio en el mapa.
- Si el GPS del dispositivo está apagado o la lectura no es posible, se presenta el mensaje *No se pudo leer el GPS. Revisa que esté encendido e inténtalo de nuevo.*

Sin ubicación activa, cada paseo muestra el texto *Activa ubicación para ver distancia real a la recogida*, en lugar de la distancia en kilómetros.

La etiqueta **Disponible hoy**, visible para los propietarios, se muestra cuando la ubicación del paseador se encuentra activa.

> **Figura 9.** Solicitud de permiso de ubicación.  
> *[Espacio para la figura. Insertar la captura del aviso del dispositivo en el que se solicita el acceso a la ubicación.]*

## 11. Listado de paseos asignados

Bajo el resumen, la sección **Tus paseos** presenta las solicitudes asignadas al paseador.

Cuando no existe ninguna, se informa: *Aún no tienes paseos. Cuando un dueño te agende, la solicitud aparece aquí para confirmarla.*

Cada tarjeta contiene:

- Nombre de la mascota.
- Nombre del propietario, precedido de la leyenda **Dueño:**, cuando este lo ha registrado en su perfil.
- Estado del servicio, diferenciado por color: Pendiente, Confirmado, En curso, Completado o Cancelado.
- Fecha, hora y duración en minutos.
- Dirección de recogida, precedida de la leyenda **Recogida:**.
- Distancia hasta el punto de recogida, en kilómetros, cuando la ubicación del paseador y las coordenadas de recogida están disponibles.

> **Figura 10.** Tarjeta de un paseo asignado.  
> *[Espacio para la figura. Insertar la captura de una tarjeta con la mascota, el propietario, el estado, la fecha, la recogida, la distancia y las acciones.]*

## 12. Actualización del estado del servicio

El botón principal de la tarjeta avanza el paseo un único paso. No es posible omitir estados intermedios.

| Estado actual | Acción | Estado resultante | Efecto para el propietario |
|---|---|---|---|
| **Pendiente** | **Confirmar paseo** | **Confirmado** | Recibe el aviso de que el servicio fue aceptado. |
| **Confirmado** | **Iniciar paseo** | **En curso**; comienza el conteo del tiempo | Puede abrir el seguimiento en el mapa. |
| **En curso** | **Marcar completado** | **Completado** | Puede registrar estrellas y un comentario. |

Mientras la actualización se procesa, el botón muestra un indicador de espera. Si la operación no se completa, se presenta el mensaje *No se pudo actualizar el estado del paseo.*

**Confirmar paseo** debe ejecutarse al aceptar la solicitud, dado que el propietario permanece a la espera de una respuesta. **Iniciar paseo** debe ejecutarse en el momento en que se inicia el recorrido con la mascota: a partir de esa acción el propietario puede consultar la ubicación y el tiempo comienza a contabilizarse. **Marcar completado** debe ejecutarse al entregar la mascota. En ese momento corresponde cobrar el servicio en efectivo.

> **Figura 11.** Confirmación de un paseo pendiente.  
> *[Espacio para la figura. Insertar la captura de un paseo en estado Pendiente, con el botón Confirmar paseo.]*

> **Figura 12.** Inicio y finalización del servicio.  
> *[Espacio para la figura. Insertar las capturas de un paseo Confirmado, con Iniciar paseo, y de un paseo En curso, con Marcar completado.]*

## 13. Acciones complementarias

Bajo el botón principal se presentan las siguientes acciones:

| Acción | Condición de aparición | Resultado |
|---|---|---|
| **Seguimiento** | El paseo se encuentra **En curso** | Abre el mapa del servicio, el tiempo transcurrido y la distancia al punto de recogida. |
| **Chat** | El paseo no está cancelado | Abre la conversación con el propietario. |
| **Llamar** | Disponible en el registro | Inicia una llamada al número del propietario. Si este no ha registrado teléfono, se informa: *Este usuario aún no cargó un número de contacto.* |
| **Cancelar** | El paseo está **Pendiente** o **Confirmado** | Solicita confirmación mediante la pregunta *¿Quieres cancelar este paseo?* Al elegir **Sí, cancelar**, el estado pasa a **Cancelado** y el propietario recibe la notificación. |

Un paseo en curso o ya completado no ofrece la acción de cancelación en esta fila de botones.

> **Figura 13.** Acciones complementarias del paseo.  
> *[Espacio para la figura. Insertar la captura de los botones Seguimiento, Chat, Llamar y Cancelar.]*

## 14. Seguimiento del paseo

La acción **Seguimiento** abre la pantalla **Paseo en curso**, que es la misma vista que el propietario utiliza para observar el servicio. En ella se presenta:

- Un mapa con el punto de recogida y la posición del paseador, cuando el GPS se encuentra activo.
- La leyenda *Ubicación del paseador en vivo (se actualiza cada 3 s)*, o *Esperando GPS del paseador…* si la posición aún no está disponible.
- El nombre de la mascota y la dirección de recogida.
- **Tiempo.** Duración transcurrida desde que se presionó **Iniciar paseo**.
- **Distancia.** Separación, en kilómetros, respecto del punto de recogida.
- **Duración.** Minutos solicitados por el propietario: 30, 45 o 60.
- Las acciones **Llamar** y **Chat**.

Para que el propietario observe el desplazamiento se requieren tres condiciones simultáneas: el paseo debe estar **En curso**, la aplicación debe permanecer abierta y el GPS del dispositivo debe estar encendido, con el permiso concedido. El icono de cierre regresa al listado de paseos.

> **Figura 14.** Seguimiento del paseo en curso.  
> *[Espacio para la figura. Insertar la captura del mapa y de los indicadores de tiempo y distancia, junto con las acciones Llamar y Chat.]*

## 15. Mensajería del paseo

La acción **Chat** abre la conversación asociada exclusivamente a ese servicio. El encabezado indica **Chat** y el nombre del propietario.

El mensaje se redacta en el campo *Escribe un mensaje* y se envía desde el mismo panel. Si la conversación está vacía, se presenta el texto *Aún no hay mensajes. Di hola.*

Este canal está previsto para anunciar la llegada, consultar el acceso al domicilio o informar una demora. La comunicación oportuna reduce la probabilidad de que el propietario cancele el servicio.

> **Figura 15.** Conversación con el propietario.  
> *[Espacio para la figura. Insertar la captura del chat, con mensajes y el campo de redacción.]*

## 16. Perfil del paseador

La sección **Perfil** presenta la fotografía del usuario —o la inicial de su nombre, si no ha cargado una imagen—, el nombre, el correo electrónico y la etiqueta **Paseador**.

**Cambiar foto** abre la galería. La imagen cargada es la que los propietarios observan en el listado y en la ficha. Durante la carga, el rótulo cambia a *Subiendo...*

Si la presentación o la tarifa permanecen vacías, se muestra el aviso: *Completa tu bio y tarifa por hora para que los dueños te encuentren al agendar.*

### 16.1. Información visible para los propietarios

Los propietarios consultan, a partir de este perfil:

- La **fotografía** y el **nombre**.
- La **presentación (bio)**: experiencia, tamaños de mascota atendidos, zona de trabajo y demás información que el paseador considere pertinente.
- La **tarifa por hora**, expresada en pesos colombianos. Un valor como `25000` se muestra como `$25.000/h`. Si el campo queda vacío, el propietario observa **A convenir** o la indicación de que la tarifa se confirma directamente.
- La **ciudad**, utilizada también como criterio de búsqueda.
- La **calificación**, calculada a partir de las estrellas que los propietarios registran al finalizar un paseo. Mientras no existan valoraciones, el paseador se presenta como **Nuevo**.

Las reseñas, compuestas por estrellas y comentario, se muestran en la ficha que el propietario abre desde su pantalla de inicio. El paseador recibe la notificación de la calificación. La redacción de la reseña corresponde exclusivamente al propietario.

### 16.2. Edición del perfil y de la tarifa

**Editar perfil y tarifas** habilita la modificación de:

- **Nombre.**
- **Teléfono.** Número que el propietario utiliza mediante la acción **Llamar**. Se recomienda registrarlo de forma completa.
- **Calle y número** y **Ciudad**.
- **Usar ubicación actual.** Completa la dirección con la posición del dispositivo.
- **Presentación (bio).**
- **Tarifa por hora (COP).** Valor numérico igual o superior a cero. Si el dato ingresado no corresponde a una tarifa válida, el sistema lo indica.

**Guardar** confirma los cambios. **Cancelar** regresa a la vista de consulta sin conservarlos.

**Cerrar sesión** devuelve a la pantalla de bienvenida. Los paseos y los datos del perfil permanecen asociados a la cuenta.

> **Figura 16.** Perfil del paseador.  
> *[Espacio para la figura. Insertar la captura de la fotografía, la etiqueta Paseador, la presentación, la tarifa y el botón Editar perfil y tarifas.]*

> **Figura 17.** Edición de la presentación y de la tarifa.  
> *[Espacio para la figura. Insertar la captura de los campos de presentación y tarifa por hora, con el botón Guardar.]*

## 17. Estados del paseo

| Estado | Significado para el paseador | Acciones habilitadas |
|---|---|---|
| **Pendiente** | Un propietario solicitó el servicio y espera respuesta. | **Confirmar paseo**, chat, llamada o **Cancelar**. |
| **Confirmado** | La solicitud fue aceptada y está a la espera de la fecha y hora acordadas. | **Iniciar paseo** al comenzar el recorrido, chat, llamada o cancelación, si el servicio ya no puede prestarse. |
| **En curso** | El recorrido con la mascota ya comenzó. El propietario puede consultar el mapa. | **Seguimiento**, chat, llamada y, al entregar la mascota, **Marcar completado**. |
| **Completado** | El servicio finalizó y la mascota fue entregada. | El propietario puede registrar la valoración. Corresponde cobrar en efectivo, si aún no se ha hecho. |
| **Cancelado** | El paseador o el propietario canceló el servicio antes de iniciarlo. | La solicitud queda cerrada. |

## 18. Presentación del paseador ante el propietario

En el directorio del propietario, el paseador se muestra con la siguiente información:

- Fotografía, nombre y extracto de la presentación.
- Tarifa por hora, o el texto **A convenir**.
- Calificación con estrellas, o la leyenda **Nuevo**.
- Ciudad.
- Distancia en kilómetros, cuando el propietario ha definido un punto de recogida y el paseador ha compartido su ubicación.
- La etiqueta **Disponible hoy**, si el GPS se encuentra activo.

Al abrir la ficha, el propietario consulta la presentación completa y las reseñas recientes, y puede seleccionar **Solicitar este paseador**. Esa solicitud se refleja en **Tus paseos** y en el panel de notificaciones.

## 19. Permisos del dispositivo

El sistema puede solicitar los siguientes permisos:

- **Ubicación.** Necesaria para figurar como paseador cercano, calcular la distancia hasta la recogida y permitir el seguimiento del servicio. Se recomienda mantenerla activa durante todo el recorrido.
- **Fotografías.** Necesaria únicamente al actualizar la imagen de perfil.

Si se deniega la ubicación, las solicitudes siguen siendo visibles; sin embargo, el propietario no podrá seguir el recorrido en el mapa y el paseador no verá la distancia real hasta el punto de recogida.

## 20. Secuencia de uso

El flujo habitual de atención de un paseo comprende las siguientes actividades:

1. Crear la cuenta con el rol **Paseador** e iniciar sesión.
2. En **Perfil**, registrar la fotografía, el teléfono, la ciudad, la presentación y la tarifa por hora.
3. En **Paseos**, seleccionar **Activar mi ubicación** y conceder el permiso.
4. Al recibirse una solicitud, consultarla en la campana o actualizar el listado deslizándolo hacia abajo.
5. Verificar la mascota, el propietario, la hora, la duración, la dirección y la distancia.
6. Seleccionar **Confirmar paseo**.
7. En la fecha acordada, informar por el **Chat** que el desplazamiento hacia el punto de recogida está en curso.
8. Al recibir la mascota, seleccionar **Iniciar paseo** y mantener la aplicación abierta con el GPS activo.
9. Durante el recorrido, utilizar **Seguimiento**, **Chat** o **Llamar** cuando sea necesario.
10. Al entregar la mascota, seleccionar **Marcar completado** y cobrar el servicio en efectivo.
