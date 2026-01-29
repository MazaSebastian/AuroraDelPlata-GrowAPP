# Sistema Técnico - Janos

Sistema de gestión técnica independiente que se conecta con el sistema de DJs para proporcionar funcionalidades de comunicación en tiempo real, gestión de equipamiento y mantenimiento.

## 🚀 Características Principales

### 📊 Dashboard Técnico
- **Estadísticas en tiempo real** del equipamiento
- **Monitoreo de eventos activos** desde el sistema de DJs
- **Alertas del sistema** con priorización
- **Estado de conexión** con el sistema de DJs

### 💬 Chat en Vivo
- **Comunicación bidireccional** entre técnicos y DJs
- **Mensajes urgentes** con notificaciones especiales
- **Historial de conversaciones** por evento
- **Indicadores de estado** de conexión

### 🔧 Gestión de Equipamiento
- **Inventario completo** de equipos técnicos
- **Estados de operación** en tiempo real
- **Asignación de equipos** a eventos
- **Historial de mantenimiento**

### 🛠️ Programación de Mantenimiento
- **Mantenimientos preventivos** programados
- **Mantenimientos correctivos** reactivos
- **Asignación de técnicos** a tareas
- **Seguimiento de progreso**

## 🏗️ Arquitectura

### Sistema Separado
- **Proyecto independiente** del sistema de DJs
- **Comunicación via WebSockets** para tiempo real
- **APIs REST** para datos históricos
- **Microservicios** para escalabilidad

### Conexión con Sistema de DJs
- **Socket.IO** para comunicación bidireccional
- **Eventos en tiempo real**:
  - Check-ins de DJs
  - Reportes técnicos
  - Cambios de estado de eventos
  - Mensajes de chat

## 🛠️ Tecnologías

- **Frontend**: React 18 + TypeScript
- **Estilos**: Styled Components
- **Comunicación**: Socket.IO Client
- **Iconos**: React Icons
- **Estado**: React Hooks + Context

## 📦 Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd salon-fiestas-technical

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm start
```

## 🔧 Configuración

### Variables de Entorno
```env
# URL del sistema de DJs
REACT_APP_DJ_SYSTEM_URL=http://localhost:3000

# URL de la API técnica
REACT_APP_TECHNICAL_API_URL=http://localhost:3001
```

### Puertos
- **Sistema Técnico**: `http://localhost:3001`
- **Sistema de DJs**: `http://localhost:3000`

## 🚀 Uso

### 1. Dashboard Principal
- Visualiza estadísticas en tiempo real
- Monitorea eventos activos
- Revisa alertas del sistema

### 2. Chat en Vivo
- Haz clic en el botón flotante de chat
- Selecciona un evento específico
- Envía mensajes urgentes si es necesario

### 3. Gestión de Equipamiento
- Revisa el estado de todos los equipos
- Actualiza información de mantenimiento
- Asigna equipos a eventos

## 🔌 Integración con Sistema de DJs

### Eventos Recibidos
- `dj-check-in`: Check-in de DJ con estado de equipamiento
- `dj-report`: Reportes técnicos de DJs
- `chat-message`: Mensajes del chat en vivo
- `event-status-change`: Cambios en eventos
- `stats-update`: Actualizaciones de estadísticas

### Eventos Enviados
- `technical-chat-message`: Mensajes del chat técnico
- `update-check-in-status`: Actualización de estado de check-ins
- `update-report-status`: Actualización de estado de reportes
- `equipment-alert`: Alertas de equipamiento

## 📱 Responsive Design

El sistema está completamente optimizado para:
- **Desktop**: Pantallas grandes con layout completo
- **Tablet**: Layout adaptativo con navegación optimizada
- **Mobile**: Interfaz táctil con componentes redimensionados

## 🔒 Seguridad

- **Validación de tipos** con TypeScript
- **Sanitización de datos** en entrada/salida
- **Reconexión automática** en caso de desconexión
- **Timeouts** para conexiones lentas

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm test -- --coverage

# Tests en modo watch
npm test -- --watch
```

## 📦 Build de Producción

```bash
# Crear build optimizado
npm run build

# Servir build localmente
npx serve -s build
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para soporte técnico o preguntas:
- **Email**: soporte@janos.com
- **Chat**: Disponible en el sistema
- **Documentación**: [Wiki del proyecto](wiki-url)

---

**Desarrollado con ❤️ para Janos**
