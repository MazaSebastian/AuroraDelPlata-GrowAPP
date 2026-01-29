import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaPlus, FaEdit, FaTrash, FaShoppingCart, FaSearch, FaDownload, FaCheck } from 'react-icons/fa';
import { supabase } from '../services/supabaseClient';

interface CompraItem {
  id: string;
  name: string;
  priority: 'BAJO' | 'MEDIO' | 'ALTO';
  completed: boolean;
  created_at: string;
  notes?: string;
}

const PageContainer = styled.div`
  padding: 1rem;
  padding-top: 5rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  
  @media (max-width: 768px) {
    padding: 0.5rem;
    padding-top: 4rem;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  h1 {
    font-size: 1.875rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    
    @media (max-width: 768px) {
      font-size: 1.5rem;
    }
  }
`;

const SearchBar = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex: 1;
  max-width: 400px;
  
  @media (max-width: 768px) {
    max-width: none;
    width: 100%;
  }
  
  .search-input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' | 'success' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  background: ${props => {
    switch (props.variant) {
      case 'primary': return '#3b82f6';
      case 'secondary': return '#6b7280';
      case 'danger': return '#ef4444';
      case 'success': return '#10b981';
      default: return '#f3f4f6';
    }
  }};
  
  color: ${props => props.variant ? 'white' : '#374151'};
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
  
  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.5rem;
    
    @media (max-width: 768px) {
      font-size: 1.5rem;
    }
  }
  
  .stat-label {
    color: #64748b;
    font-size: 0.875rem;
    font-weight: 500;
  }
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const FilterTab = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  border: 1px solid ${props => props.active ? '#3b82f6' : '#d1d5db'};
  background: ${props => props.active ? '#3b82f6' : 'white'};
  color: ${props => props.active ? 'white' : '#374151'};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.active ? '#2563eb' : '#f3f4f6'};
  }
`;

const ComprasList = styled.div`
  display: grid;
  gap: 1rem;
  
  @media (max-width: 768px) {
    gap: 0.75rem;
  }
`;

const CompraCard = styled.div<{ completed: boolean; priority: string }>`
  background: white;
  border: 1px solid #e2e8f0;
  border-left: 4px solid ${props => {
    if (props.completed) return '#10b981';
    switch (props.priority) {
      case 'ALTO': return '#ef4444';
      case 'MEDIO': return '#f59e0b';
      case 'BAJO': return '#3b82f6';
      default: return '#6b7280';
    }
  }};
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.2s ease;
  opacity: ${props => props.completed ? 0.6 : 1};
  
  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const CompraHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
`;

const CompraInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const CompraName = styled.h3<{ completed: boolean }>`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  text-decoration: ${props => props.completed ? 'line-through' : 'none'};
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const PriorityBadge = styled.span<{ priority: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  
  background: ${props => {
    switch (props.priority) {
      case 'ALTO': return '#fee2e2';
      case 'MEDIO': return '#fef3c7';
      case 'BAJO': return '#dbeafe';
      default: return '#f3f4f6';
    }
  }};
  
  color: ${props => {
    switch (props.priority) {
      case 'ALTO': return '#dc2626';
      case 'MEDIO': return '#d97706';
      case 'BAJO': return '#2563eb';
      default: return '#6b7280';
    }
  }};
`;

const CompraActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const CompraMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const CompraDate = styled.span`
  color: #64748b;
  font-size: 0.875rem;
`;

const CompraNotes = styled.p`
  color: #64748b;
  font-size: 0.875rem;
  margin: 0.5rem 0 0 0;
  font-style: italic;
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
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  
  @media (max-width: 768px) {
    padding: 1.5rem;
  }
  
  h2 {
    margin: 0 0 1.5rem 0;
    font-size: 1.5rem;
    font-weight: 600;
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
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }
  
  input, select, textarea {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1rem;
    
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

const ModalActions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #374151;
  }
  
  p {
    margin-bottom: 1.5rem;
  }
`;

const Compras: React.FC = () => {
  const [items, setItems] = useState<CompraItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<CompraItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'TODOS' | 'PENDIENTES' | 'COMPLETADOS'>('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CompraItem | null>(null);
  const [formData, setFormData] = useState({ name: '', priority: 'MEDIO' as 'BAJO' | 'MEDIO' | 'ALTO', notes: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCompras();
  }, []);

  useEffect(() => {
    let filtered = items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (activeFilter === 'PENDIENTES') {
      filtered = filtered.filter(item => !item.completed);
    } else if (activeFilter === 'COMPLETADOS') {
      filtered = filtered.filter(item => item.completed);
    }

    setFilteredItems(filtered);
  }, [items, searchTerm, activeFilter]);

  const loadCompras = async () => {
    setIsLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('compras')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading compras:', error);
        } else {
          setItems(data || []);
        }
      }
    } catch (error) {
      console.error('Error loading compras:', error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const item: CompraItem = {
      id: editingItem?.id || `compra-${Date.now()}`,
      name: formData.name.trim(),
      priority: formData.priority,
      completed: false,
      created_at: new Date().toISOString(),
      notes: formData.notes.trim() || undefined
    };

    try {
      if (supabase) {
        if (editingItem) {
          const { error } = await supabase
            .from('compras')
            .update({ name: item.name, priority: item.priority, notes: item.notes })
            .eq('id', item.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('compras')
            .insert([item]);

          if (error) throw error;
        }

        await loadCompras();
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({ name: '', priority: 'MEDIO' as 'BAJO' | 'MEDIO' | 'ALTO', notes: '' });
      }
    } catch (error) {
      console.error('Error saving compra:', error);
    }
  };

  const handleEdit = (item: CompraItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      priority: item.priority,
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar este ítem de la lista de compras?')) {
      try {
        if (supabase) {
          const { error } = await supabase
            .from('compras')
            .delete()
            .eq('id', id);

          if (error) throw error;
          await loadCompras();
        }
      } catch (error) {
        console.error('Error deleting compra:', error);
      }
    }
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    try {
      if (supabase) {
        if (!completed) {
          // Marcar como completada
          const { error } = await supabase
            .from('compras')
            .update({ completed: true })
            .eq('id', id);

          if (error) throw error;
          
          // Mostrar mensaje de confirmación
          setTimeout(() => {
            // Eliminar de la lista después de mostrar el tachado
            deleteCompletedItem(id);
          }, 1000);
        }
        await loadCompras();
      }
    } catch (error) {
      console.error('Error updating compra:', error);
    }
  };

  const deleteCompletedItem = async (id: string) => {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('compras')
          .delete()
          .eq('id', id);

        if (error) throw error;
        await loadCompras();
      }
    } catch (error) {
      console.error('Error deleting completed compra:', error);
    }
  };

  const exportCSV = () => {
    const headers = ['Nombre', 'Prioridad', 'Estado', 'Notas', 'Fecha'];
    const csvContent = [
      headers.join(','),
      ...filteredItems.map(item => [
        `"${item.name}"`,
        item.priority,
        item.completed ? 'Completado' : 'Pendiente',
        `"${item.notes || ''}"`,
        new Date(item.created_at).toLocaleDateString('es-AR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `compras_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = {
    total: items.length,
    pending: items.filter(item => !item.completed).length,
    completed: items.filter(item => item.completed).length,
    highPriority: items.filter(item => item.priority === 'ALTO' && !item.completed).length
  };

  if (isLoading) {
    return (
      <PageContainer>
        <Header>
          <h1><FaShoppingCart /> Compras</h1>
        </Header>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Cargando lista de compras...
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <h1><FaShoppingCart /> Compras</h1>
        <SearchBar>
          <FaSearch style={{ color: '#6b7280' }} />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar ítems..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBar>
        <ActionButtons>
          <Button onClick={() => setIsModalOpen(true)}>
            <FaPlus /> Nuevo Ítem
          </Button>
          <Button variant="secondary" onClick={exportCSV}>
            <FaDownload /> Exportar
          </Button>
        </ActionButtons>
      </Header>

      <StatsGrid>
        <StatCard>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Ítems</div>
        </StatCard>
        <StatCard>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pendientes</div>
        </StatCard>
        <StatCard>
          <div className="stat-value">{stats.completed}</div>
          <div className="stat-label">Completados</div>
        </StatCard>
        <StatCard>
          <div className="stat-value">{stats.highPriority}</div>
          <div className="stat-label">Alta Prioridad</div>
        </StatCard>
      </StatsGrid>

      <FilterTabs>
        <FilterTab
          active={activeFilter === 'TODOS'}
          onClick={() => setActiveFilter('TODOS')}
        >
          Todos ({items.length})
        </FilterTab>
        <FilterTab
          active={activeFilter === 'PENDIENTES'}
          onClick={() => setActiveFilter('PENDIENTES')}
        >
          Pendientes ({stats.pending})
        </FilterTab>
        <FilterTab
          active={activeFilter === 'COMPLETADOS'}
          onClick={() => setActiveFilter('COMPLETADOS')}
        >
          Completados ({stats.completed})
        </FilterTab>
      </FilterTabs>

      {filteredItems.length === 0 ? (
        <EmptyState>
          <div className="empty-icon">🛒</div>
          <h3>No hay ítems en la lista</h3>
          <p>Comienza agregando tu primer ítem a la lista de compras</p>
          <Button onClick={() => setIsModalOpen(true)}>
            <FaPlus /> Agregar Ítem
          </Button>
        </EmptyState>
      ) : (
        <ComprasList>
          {filteredItems.map((item) => (
            <CompraCard key={item.id} completed={item.completed} priority={item.priority}>
              <CompraHeader>
                <CompraInfo>
                  <CompraName completed={item.completed}>{item.name}</CompraName>
                  <PriorityBadge priority={item.priority}>{item.priority}</PriorityBadge>
                </CompraInfo>
                <CompraActions>
                  {!item.completed && (
                    <Button
                      variant="success"
                      onClick={() => toggleComplete(item.id, item.completed)}
                      style={{ padding: '0.5rem' }}
                      title="Marcar como completada"
                    >
                      <FaCheck />
                    </Button>
                  )}
                  {item.completed && (
                    <span style={{ 
                      color: '#10b981', 
                      fontSize: '0.875rem', 
                      fontWeight: '600',
                      padding: '0.5rem',
                      background: '#d1fae5',
                      borderRadius: '0.25rem'
                    }}>
                      ✓ Completada
                    </span>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => handleEdit(item)}
                    style={{ padding: '0.5rem' }}
                    title="Editar"
                  >
                    <FaEdit />
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(item.id)}
                    style={{ padding: '0.5rem' }}
                    title="Eliminar"
                  >
                    <FaTrash />
                  </Button>
                </CompraActions>
              </CompraHeader>
              
              {item.notes && (
                <CompraNotes>{item.notes}</CompraNotes>
              )}
              
              <CompraMeta>
                <CompraDate>
                  {new Date(item.created_at).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </CompraDate>
              </CompraMeta>
            </CompraCard>
          ))}
        </ComprasList>
      )}

      <Modal isOpen={isModalOpen}>
        <ModalContent>
          <h2>{editingItem ? 'Editar Ítem' : 'Nuevo Ítem'}</h2>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <label>Nombre del ítem</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Leche, Pan, Frutas..."
                required
              />
            </FormGroup>
            
            <FormGroup>
              <label>Prioridad</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'BAJO' | 'MEDIO' | 'ALTO' })}
              >
                <option value="BAJO">Baja</option>
                <option value="MEDIO">Media</option>
                <option value="ALTO">Alta</option>
              </select>
            </FormGroup>
            
            <FormGroup>
              <label>Notas (opcional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Detalles adicionales, marca específica, etc."
              />
            </FormGroup>
            
            <ModalActions>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingItem(null);
                  setFormData({ name: '', priority: 'MEDIO' as 'BAJO' | 'MEDIO' | 'ALTO', notes: '' });
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                {editingItem ? 'Actualizar' : 'Crear'}
              </Button>
            </ModalActions>
          </Form>
        </ModalContent>
      </Modal>
    </PageContainer>
  );
};

export default Compras;
