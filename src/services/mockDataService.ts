import type { Crop, CropTask, DailyRecord } from '../types';

// ==========================
// Datos mock para Gestión de Cultivos (2 personas)
// ==========================

const STORAGE_KEYS = {
  crops: 'crop_crops',
  records: 'crop_records',
  tasks: 'crop_tasks'
};

const inMemory: {
  crops?: Crop[];
  records?: DailyRecord[];
  tasks?: CropTask[];
} = {};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { }
  return fallback;
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { }
}

export const mockCropPartners = [
  { id: 'partner-1', name: 'Socio A', email: 'socioa@example.com' },
  { id: 'partner-2', name: 'Socio B', email: 'sociob@example.com' }
];

export function getCrops(): Crop[] {
  if (!inMemory.crops) {
    inMemory.crops = loadFromStorage<Crop[]>(STORAGE_KEYS.crops, [
      {
        id: 'crop-1',
        name: 'Gorilla Glue #4',
        location: 'Invernadero Norte',
        startDate: new Date().toISOString().slice(0, 10),
        photoUrl: undefined,
        partners: mockCropPartners,
        status: 'active'
      },
      {
        id: 'crop-2',
        name: 'Lemon Haze',
        location: 'Invernadero Sur',
        startDate: new Date(Date.now() - 86400000 * 40).toISOString().slice(0, 10), // 40 days ago
        photoUrl: undefined,
        partners: mockCropPartners,
        status: 'active'
      }
    ]);
  }
  return inMemory.crops;
}

export function saveCrops(crops: Crop[]) {
  inMemory.crops = crops;
  saveToStorage(STORAGE_KEYS.crops, crops);
}

export function getDailyRecords(cropId: string): DailyRecord[] {
  if (!inMemory.records) {
    const today = new Date();
    const isoDate = today.toISOString().slice(0, 10);
    inMemory.records = loadFromStorage<DailyRecord[]>(STORAGE_KEYS.records, [
      {
        id: 'rec-1',
        cropId: 'crop-1',
        date: isoDate,
        params: { temperatureC: 24.5, humidityPct: 58, soilMoisturePct: 45, ph: 6.3, ecMs: 1.8 },
        notes: 'Riego ligero por la mañana. Plantas vigorosas.',
        photos: [],
        createdBy: 'partner-1',
        createdAt: new Date().toISOString()
      },
      {
        id: 'rec-2',
        cropId: 'crop-2',
        date: isoDate,
        params: { temperatureC: 24.2, humidityPct: 60, soilMoisturePct: 50, ph: 6.2, ecMs: 1.6 },
        notes: 'Poda de bajos realizada.',
        photos: [],
        createdBy: 'partner-1',
        createdAt: new Date().toISOString()
      }
    ]);
  }
  return inMemory.records.filter(r => r.cropId === cropId);
}

export function addDailyRecord(record: DailyRecord) {
  const records = inMemory.records ?? getDailyRecords(record.cropId);
  const updated = [record, ...records];
  inMemory.records = updated;
  saveToStorage(STORAGE_KEYS.records, updated);
}

export function getTasks(cropId: string): CropTask[] {
  if (!inMemory.tasks) {
    inMemory.tasks = loadFromStorage<CropTask[]>(STORAGE_KEYS.tasks, [
      {
        id: 'task-1',
        cropId: 'crop-1',
        title: 'Revisión de plagas',
        description: 'Inspeccionar hojas nuevas',
        assignedTo: 'partner-2',
        status: 'pending',
        priority: 'medium',
        createdAt: new Date().toISOString(),
        createdBy: 'partner-1'
      }
    ]);
  }
  return inMemory.tasks.filter(t => t.cropId === cropId);
}

export function upsertTask(task: CropTask) {
  const tasks = inMemory.tasks ?? [];
  const idx = tasks.findIndex(t => t.id === task.id);
  if (idx >= 0) {
    tasks[idx] = task;
  } else {
    tasks.unshift(task);
  }
  inMemory.tasks = tasks;
  saveToStorage(STORAGE_KEYS.tasks, tasks);
}


