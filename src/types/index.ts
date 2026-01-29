// Auth & Users
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'technician' | 'partner';
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

// ==========================
// Tipos para Gestión de Cultivos (CRM de Cultivo)
// ==========================

export interface CropPartner {
  id: string;
  name: string;
  email: string;
}

export interface Crop {
  id: string;
  name: string;
  location?: string;
  startDate: string; // ISO
  estimatedHarvestDate?: string; // ISO
  photoUrl?: string;
  partners: CropPartner[]; // pensado para 2 personas
  status: 'active' | 'paused' | 'completed';
  color?: string; // New field for color
}

export interface EnvParams {
  temperatureC: number; // °C
  humidityPct: number; // %
  soilMoisturePct?: number; // %
  ph?: number; // 0-14
  ecMs?: number; // mS/cm
}

export interface DailyRecord {
  id: string;
  cropId: string;
  date: string; // ISO date
  params: EnvParams;
  notes?: string;
  photos?: string[];
  createdBy: string; // partner id
  createdAt: string; // ISO timestamp
}

export interface CropTask {
  id: string;
  cropId: string;
  title: string;
  description?: string;
  assignedTo?: string; // partner id
  status: 'pending' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string; // ISO date
  createdAt: string;
  createdBy: string;
  completedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: 'info' | 'warning' | 'danger' | 'fertilizante' | 'defoliacion' | 'poda_apical' | 'hst' | 'lst' | 'enmienda' | 'te_compost' | 'agua' | 'esquejes';
  status: 'pending' | 'done' | 'dismissed';
  due_date?: string;
  created_at: string;
}


// ==========================
// Tipos para Gestión de Insumos (Materia Prima)
// ==========================

export interface Insumo {
  id: string;
  nombre: string;
  categoria: 'semillas' | 'fertilizantes' | 'sustratos' | 'herramientas' | 'pesticidas' | 'otros';
  unidad_medida: string;
  precio_actual: number;
  precio_anterior?: number;
  proveedor?: string;
  fecha_ultima_compra?: string;
  fecha_ultimo_precio: string;
  stock_actual: number;
  stock_minimo: number;
  notas?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface HistorialPrecio {
  id: string;
  insumo_id: string;
  precio: number;
  fecha_cambio: string;
  motivo_cambio?: 'compra' | 'ajuste' | 'inflación' | 'oferta' | 'otro';
  proveedor?: string;
  cantidad_comprada?: number;
  costo_total?: number;
  created_at: string;
  created_by?: string;
}

export interface InsumoConHistorial extends Insumo {
  historial_precios: HistorialPrecio[];
  variacion_precio?: number;
  porcentaje_variacion?: number;
}

export interface StickyNote {
  id: string;
  content: string;
  color: 'yellow' | 'blue' | 'pink' | 'green';
  created_at: string;
  created_by?: string;
  user_id?: string;
}
