import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaPlus, FaEdit, FaTrash, FaBox, FaSearch, FaDownload } from 'react-icons/fa';
import { StockItem, syncStockItemsFromSupabase, createStockItemSupabase, updateStockQtySupabase, deleteStockItemSupabase } from '../services/stockService';

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

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
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

const StockGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const StockCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const StockHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  
  .stock-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
    
    @media (max-width: 768px) {
      font-size: 1rem;
    }
  }
  
  .stock-actions {
    display: flex;
    gap: 0.5rem;
  }
`;

const StockInfo = styled.div`
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1rem;
  
  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .label {
      color: #64748b;
      font-size: 0.875rem;
    }
    
    .value {
      font-weight: 600;
      color: #1e293b;
    }
  }
`;

const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  .qty-input {
    width: 80px;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    text-align: center;
    font-size: 0.875rem;
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
    }
  }
  
  .qty-btn {
    width: 32px;
    height: 32px;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 0.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    
    &:hover {
      background: #f3f4f6;
    }
  }
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
  
  input, select {
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

const Stock: React.FC = () => {
  const [items, setItems] = useState<StockItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [formData, setFormData] = useState({ name: '', qty: '', unit: 'g' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStockItems();
  }, []);

  useEffect(() => {
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [items, searchTerm]);

  const loadStockItems = async () => {
    setIsLoading(true);
    const data = await syncStockItemsFromSupabase();
    if (data) {
      setItems(data);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.qty) return;

    const item: StockItem = {
      id: editingItem?.id || `item-${Date.now()}`,
      name: formData.name.trim(),
      qty: Number(formData.qty),
      unit: formData.unit || 'u',
      category: 'general',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const success = editingItem
      ? await updateStockQtySupabase(item.id, item.qty)
      : await createStockItemSupabase(item);

    if (success) {
      await loadStockItems();
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({ name: '', qty: '', unit: 'g' });
    }
  };

  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      qty: item.qty.toString(),
      unit: item.unit || 'g'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar este ítem de stock?')) {
      const success = await deleteStockItemSupabase(id);
      if (success) {
        await loadStockItems();
      }
    }
  };

  const updateQuantity = async (id: string, newQty: number) => {
    const success = await updateStockQtySupabase(id, newQty);
    if (success) {
      await loadStockItems();
    }
  };

  const exportCSV = () => {
    const headers = ['Nombre', 'Cantidad', 'Unidad'];
    const csvContent = [
      headers.join(','),
      ...filteredItems.map(item => [
        `"${item.name}"`,
        item.qty,
        item.unit || 'g'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `stock_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = {
    totalItems: items.length,
    totalQuantity: items.reduce((sum, item) => sum + item.qty, 0),
    lowStock: items.filter(item => item.qty < 10).length,
    categories: new Set(items.map(item => item.unit)).size
  };

  if (isLoading) {
    return (
      <PageContainer>
        <Header>
          <h1>Stock</h1>
        </Header>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Cargando inventario...
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <h1>Stock</h1>
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
          <div className="stat-value">{stats.totalItems}</div>
          <div className="stat-label">Total Ítems</div>
        </StatCard>
        <StatCard>
          <div className="stat-value">{stats.totalQuantity}</div>
          <div className="stat-label">Cantidad Total</div>
        </StatCard>
        <StatCard>
          <div className="stat-value">{stats.lowStock}</div>
          <div className="stat-label">Stock Bajo</div>
        </StatCard>
        <StatCard>
          <div className="stat-value">{stats.categories}</div>
          <div className="stat-label">Categorías</div>
        </StatCard>
      </StatsGrid>

      {filteredItems.length === 0 ? (
        <EmptyState>
          <div className="empty-icon">📦</div>
          <h3>No hay ítems en stock</h3>
          <p>Comienza agregando tu primer ítem al inventario</p>
          <Button onClick={() => setIsModalOpen(true)}>
            <FaPlus /> Agregar Ítem
          </Button>
        </EmptyState>
      ) : (
        <StockGrid>
          {filteredItems.map((item) => (
            <StockCard key={item.id}>
              <StockHeader>
                <h3 className="stock-name">{item.name}</h3>
                <div className="stock-actions">
                  <Button
                    variant="secondary"
                    onClick={() => handleEdit(item)}
                    style={{ padding: '0.5rem' }}
                  >
                    <FaEdit />
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(item.id)}
                    style={{ padding: '0.5rem' }}
                  >
                    <FaTrash />
                  </Button>
                </div>
              </StockHeader>

              <StockInfo>
                <div className="info-row">
                  <span className="label">Cantidad:</span>
                  <span className="value">{item.qty} {item.unit || 'g'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Estado:</span>
                  <span className="value" style={{
                    color: item.qty < 10 ? '#ef4444' : item.qty < 50 ? '#f59e0b' : '#10b981'
                  }}>
                    {item.qty < 10 ? 'Bajo' : item.qty < 50 ? 'Medio' : 'Alto'}
                  </span>
                </div>
              </StockInfo>

              <QuantityControl>
                <button
                  className="qty-btn"
                  onClick={() => updateQuantity(item.id, Math.max(0, item.qty - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  className="qty-input"
                  value={item.qty}
                  onChange={(e) => updateQuantity(item.id, Math.max(0, Number(e.target.value)))}
                  min="0"
                />
                <button
                  className="qty-btn"
                  onClick={() => updateQuantity(item.id, item.qty + 1)}
                >
                  +
                </button>
              </QuantityControl>
            </StockCard>
          ))}
        </StockGrid>
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
                placeholder="Ej: Fertilizante NPK"
                required
              />
            </FormGroup>

            <FormGroup>
              <label>Cantidad</label>
              <input
                type="number"
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                placeholder="0"
                min="0"
                required
              />
            </FormGroup>

            <FormGroup>
              <label>Unidad</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                <option value="g">Gramos (g)</option>
                <option value="kg">Kilogramos (kg)</option>
                <option value="l">Litros (l)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="un">Unidades (un)</option>
                <option value="pz">Piezas (pz)</option>
              </select>
            </FormGroup>

            <ModalActions>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingItem(null);
                  setFormData({ name: '', qty: '', unit: 'g' });
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

export default Stock;
