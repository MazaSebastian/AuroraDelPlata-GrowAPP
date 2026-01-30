import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaBoxes,
  FaTimesCircle,
  FaDownload
} from 'react-icons/fa';
import type { Insumo } from '../types';
import {
  getInsumos,
  createInsumo,
  updateInsumo,
  deleteInsumo,
  getInsumosStats
} from '../services/insumosService';

const Page = styled.div`
  padding: 1rem;
  padding-top: 5rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;

  h1 {
    font-size: 1.5rem;
    color: #1e293b;
    margin: 0;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.5rem;
  }

  .stat-label {
    color: #64748b;
    font-size: 0.875rem;
  }

  &.warning .stat-value {
    color: #f59e0b;
  }

  &.danger .stat-value {
    color: #ef4444;
  }

  &.success .stat-value {
    color: #10b981;
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: center;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' | 'success' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  font-size: 0.875rem;

  background: ${props => {
    switch (props.variant) {
      case 'secondary': return '#64748b';
      case 'danger': return '#ef4444';
      case 'success': return '#10b981';
      default: return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
    }
  }};
  color: white;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const SearchInput = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  min-width: 250px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const Table = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr auto;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
`;

const TableRow = styled.div<{ isSelected?: boolean }>`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr auto;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #f8fafc;
  }

  ${props => props.isSelected && `
    background: #dbeafe;
    border-left: 4px solid #3b82f6;
  `}

  &:last-child {
    border-bottom: none;
  }
`;

const Badge = styled.span<{ variant?: 'green' | 'yellow' | 'red' | 'gray' }>`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  border-radius: 9999px;
  font-weight: 600;
  background: ${props => {
    switch (props.variant) {
      case 'green': return '#dcfce7';
      case 'yellow': return '#fef3c7';
      case 'red': return '#fee2e2';
      default: return '#e5e7eb';
    }
  }};
  color: ${props => {
    switch (props.variant) {
      case 'green': return '#166534';
      case 'yellow': return '#92400e';
      case 'red': return '#991b1b';
      default: return '#374151';
    }
  }};
`;

const PriceChange = styled.span<{ isPositive: boolean }>`
  color: ${props => props.isPositive ? '#10b981' : '#ef4444'};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const Modal = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h2 {
    margin: 0;
    color: #1e293b;
  }
`;

const Form = styled.form`
  display: grid;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: grid;
  gap: 0.5rem;

  label {
    font-weight: 600;
    color: #374151;
    font-size: 0.875rem;
  }

  input, select, textarea {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Insumos: React.FC = () => {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [filteredInsumos, setFilteredInsumos] = useState<Insumo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'semillas' as 'semillas' | 'fertilizantes' | 'sustratos' | 'herramientas' | 'pesticidas' | 'otros',
    unidad_medida: '',
    precio_actual: '',
    proveedor: '',
    stock_actual: '',
    stock_minimo: '',
    notas: ''
  });

  // Cargar insumos desde Supabase
  useEffect(() => {
    loadInsumos();
  }, []);

  const loadInsumos = async () => {
    try {
      const data = await getInsumos();
      setInsumos(data);
    } catch (error) {
      console.error('Error al cargar insumos:', error);
    }
  };

  // Filtrar insumos
  useEffect(() => {
    let filtered = insumos;

    if (searchTerm) {
      filtered = filtered.filter(insumo =>
        insumo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        insumo.proveedor?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(insumo => insumo.categoria === selectedCategory);
    }

    setFilteredInsumos(filtered);
  }, [insumos, searchTerm, selectedCategory]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalInsumos = insumos.length;
    const stockBajo = insumos.filter(i => i.stock_actual <= i.stock_minimo).length;
    const conVariacionPrecio = insumos.filter(i => i.precio_anterior && i.precio_actual !== i.precio_anterior).length;
    const totalValor = insumos.reduce((sum, i) => sum + (i.precio_actual * i.stock_actual), 0);

    return { totalInsumos, stockBajo, conVariacionPrecio, totalValor };
  }, [insumos]);

  // Cargar estadísticas desde Supabase
  useEffect(() => {
    const loadStats = async () => {
      try {
        const supabaseStats = await getInsumosStats();
        if (supabaseStats) {
          // Las estadísticas se calculan localmente por ahora
          // En el futuro se pueden obtener directamente de Supabase
        }
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      }
    };

    loadStats();
  }, []);

  const handleOpenModal = (insumo?: Insumo) => {
    if (insumo) {
      setEditingInsumo(insumo);
      setFormData({
        nombre: insumo.nombre,
        categoria: insumo.categoria,
        unidad_medida: insumo.unidad_medida,
        precio_actual: insumo.precio_actual.toString(),
        proveedor: insumo.proveedor || '',
        stock_actual: insumo.stock_actual.toString(),
        stock_minimo: insumo.stock_minimo.toString(),
        notas: insumo.notas || ''
      });
    } else {
      setEditingInsumo(null);
      setFormData({
        nombre: '',
        categoria: 'semillas',
        unidad_medida: '',
        precio_actual: '',
        proveedor: '',
        stock_actual: '',
        stock_minimo: '',
        notas: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newInsumo: Omit<Insumo, 'id' | 'created_at' | 'updated_at'> = {
        nombre: formData.nombre,
        categoria: formData.categoria,
        unidad_medida: formData.unidad_medida,
        precio_actual: parseFloat(formData.precio_actual),
        proveedor: formData.proveedor || undefined,
        fecha_ultimo_precio: new Date().toISOString().split('T')[0],
        stock_actual: parseFloat(formData.stock_actual),
        stock_minimo: parseFloat(formData.stock_minimo),
        notas: formData.notas || undefined,
        activo: true
      };

      if (editingInsumo) {
        // Actualizar insumo existente
        const updated = await updateInsumo(editingInsumo.id, newInsumo);
        if (updated) {
          setInsumos(prev => prev.map(i =>
            i.id === editingInsumo.id ? updated : i
          ));
        }
      } else {
        // Crear nuevo insumo
        const created = await createInsumo(newInsumo);
        if (created) {
          setInsumos(prev => [...prev, created]);
        }
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error('Error al guardar insumo:', error);
      alert('Error al guardar el insumo. Por favor, intenta de nuevo.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este insumo?')) {
      try {
        const success = await deleteInsumo(id);
        if (success) {
          setInsumos(prev => prev.filter(i => i.id !== id));
        } else {
          alert('Error al eliminar el insumo. Por favor, intenta de nuevo.');
        }
      } catch (error) {
        console.error('Error al eliminar insumo:', error);
        alert('Error al eliminar el insumo. Por favor, intenta de nuevo.');
      }
    }
  };

  const getPriceChange = (insumo: Insumo) => {
    if (!insumo.precio_anterior) return null;
    const change = insumo.precio_actual - insumo.precio_anterior;
    const percentage = (change / insumo.precio_anterior) * 100;
    return { change, percentage };
  };

  const exportToCSV = () => {
    const headers = ['Nombre', 'Categoría', 'Unidad', 'Precio Actual', 'Stock', 'Proveedor', 'Última Compra'];
    const csvContent = [
      headers.join(','),
      ...filteredInsumos.map(insumo => [
        insumo.nombre,
        insumo.categoria,
        insumo.unidad_medida,
        insumo.precio_actual,
        insumo.stock_actual,
        insumo.proveedor || '',
        insumo.fecha_ultima_compra || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `insumos_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  return (
    <Page>
      <Header>
        <h1>Gestión de Insumos</h1>
        <Button onClick={() => handleOpenModal()}>
          <FaPlus /> Nuevo Insumo
        </Button>
      </Header>

      <StatsGrid>
        <StatCard>
          <div className="stat-value">{stats.totalInsumos}</div>
          <div className="stat-label">Total Insumos</div>
        </StatCard>
        <StatCard className={stats.stockBajo > 0 ? 'warning' : 'success'}>
          <div className="stat-value">{stats.stockBajo}</div>
          <div className="stat-label">Stock Bajo</div>
        </StatCard>
        <StatCard className={stats.conVariacionPrecio > 0 ? 'warning' : 'success'}>
          <div className="stat-value">{stats.conVariacionPrecio}</div>
          <div className="stat-label">Con Variación</div>
        </StatCard>
        <StatCard>
          <div className="stat-value">${stats.totalValor.toFixed(2)}</div>
          <div className="stat-label">Valor Total</div>
        </StatCard>
      </StatsGrid>

      <Controls>
        <SearchInput
          placeholder="Buscar por nombre o proveedor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          <option value="semillas">Semillas</option>
          <option value="fertilizantes">Fertilizantes</option>
          <option value="sustratos">Sustratos</option>
          <option value="herramientas">Herramientas</option>
          <option value="pesticidas">Pesticidas</option>
          <option value="otros">Otros</option>
        </Select>
        <Button variant="secondary" onClick={exportToCSV}>
          <FaDownload /> Exportar CSV
        </Button>
      </Controls>

      <Table>
        <TableHeader>
          <div>Nombre</div>
          <div>Categoría</div>
          <div>Precio</div>
          <div>Variación</div>
          <div>Stock</div>
          <div>Proveedor</div>
          <div>Última Compra</div>
          <div>Acciones</div>
        </TableHeader>

        {filteredInsumos.map(insumo => {
          const priceChange = getPriceChange(insumo);
          const isStockLow = insumo.stock_actual <= insumo.stock_minimo;

          return (
            <TableRow key={insumo.id}>
              <div>
                <div style={{ fontWeight: 600 }}>{insumo.nombre}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {insumo.unidad_medida}
                </div>
              </div>
              <div>
                <Badge variant="gray">{insumo.categoria}</Badge>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>${insumo.precio_actual}</div>
                {insumo.precio_anterior && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Antes: ${insumo.precio_anterior}
                  </div>
                )}
              </div>
              <div>
                {priceChange ? (
                  <PriceChange isPositive={priceChange.change >= 0}>
                    {priceChange.change >= 0 ? '+' : ''}${priceChange.change.toFixed(2)}
                    <span style={{ fontSize: '0.75rem' }}>
                      ({priceChange.percentage >= 0 ? '+' : ''}{priceChange.percentage.toFixed(1)}%)
                    </span>
                  </PriceChange>
                ) : (
                  <span style={{ color: '#64748b' }}>—</span>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>
                  {insumo.stock_actual} {insumo.unidad_medida}
                </div>
                {isStockLow && (
                  <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>
                    Stock bajo
                  </div>
                )}
              </div>
              <div>
                {insumo.proveedor || '—'}
              </div>
              <div>
                {insumo.fecha_ultima_compra ?
                  new Date(insumo.fecha_ultima_compra).toLocaleDateString('es-AR') :
                  '—'
                }
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  variant="secondary"
                  onClick={() => handleOpenModal(insumo)}
                  style={{ padding: '0.5rem' }}
                >
                  <FaEdit />
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDelete(insumo.id)}
                  style={{ padding: '0.5rem' }}
                >
                  <FaTrash />
                </Button>
              </div>
            </TableRow>
          );
        })}
      </Table>

      {filteredInsumos.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#64748b',
          background: 'white',
          border: '1px solid #e2e8f0',
          borderTop: 'none',
          borderBottomLeftRadius: '0.75rem',
          borderBottomRightRadius: '0.75rem'
        }}>
          <FaBoxes style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No hay insumos registrados</h3>
          <p>Comienza agregando tu primer insumo para monitorear precios y stock</p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClick={() => setIsModalOpen(false)}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <h2>{editingInsumo ? 'Editar Insumo' : 'Nuevo Insumo'}</h2>
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              style={{ padding: '0.5rem' }}
            >
              <FaTimesCircle />
            </Button>
          </ModalHeader>

          <Form onSubmit={handleSubmit}>
            <FormRow>
              <FormGroup>
                <label>Nombre del Insumo *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  required
                  placeholder="Ej: Semillas Tomate Cherry"
                />
              </FormGroup>
              <FormGroup>
                <label>Categoría *</label>
                <Select
                  value={formData.categoria}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value as any }))}
                  required
                >
                  <option value="semillas">Semillas</option>
                  <option value="fertilizantes">Fertilizantes</option>
                  <option value="sustratos">Sustratos</option>
                  <option value="herramientas">Herramientas</option>
                  <option value="pesticidas">Pesticidas</option>
                  <option value="otros">Otros</option>
                </Select>
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <label>Unidad de Medida *</label>
                <input
                  type="text"
                  value={formData.unidad_medida}
                  onChange={(e) => setFormData(prev => ({ ...prev, unidad_medida: e.target.value }))}
                  required
                  placeholder="Ej: kg, litros, unidades"
                />
              </FormGroup>
              <FormGroup>
                <label>Precio Actual *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precio_actual}
                  onChange={(e) => setFormData(prev => ({ ...prev, precio_actual: e.target.value }))}
                  required
                  placeholder="0.00"
                />
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <label>Stock Actual *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.stock_actual}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock_actual: e.target.value }))}
                  required
                  placeholder="0.00"
                />
              </FormGroup>
              <FormGroup>
                <label>Stock Mínimo *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.stock_minimo}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock_minimo: e.target.value }))}
                  required
                  placeholder="0.00"
                />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <label>Proveedor</label>
              <input
                type="text"
                value={formData.proveedor}
                onChange={(e) => setFormData(prev => ({ ...prev, proveedor: e.target.value }))}
                placeholder="Nombre del proveedor"
              />
            </FormGroup>

            <FormGroup>
              <label>Notas</label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                placeholder="Información adicional sobre el insumo..."
              />
            </FormGroup>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingInsumo ? 'Actualizar' : 'Crear'} Insumo
              </Button>
            </div>
          </Form>
        </ModalContent>
      </Modal>
    </Page>
  );
};

export default Insumos;
