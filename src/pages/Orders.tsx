import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { 
  FaClipboardList, 
  FaPlus, 
  FaDownload,
  FaBuilding,
  FaUser,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaArrowLeft,
  FaTimesCircle
} from 'react-icons/fa';

// Interfaces
interface Order {
  id: string;
  salon: string;
  dj: string;
  item: string;
  quantity: number;
  description: string;
  status: 'received' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

// Styled Components
const OrdersContainer = styled.div`
  padding: 2rem;
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  max-width: 1200px;
  margin: 0 auto;
`;

const HeaderSection = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 1000px;
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderLeft = styled.div`
  h1 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }
  
  p {
    font-size: 1rem;
    opacity: 0.9;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.75rem;
  font-weight: 400;
  opacity: 0.8;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    opacity: 1;
    transform: translateY(-1px);
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  width: 100%;
`;

const ControlsSection = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 1000px;
`;

const ControlsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  
  label {
    font-weight: 600;
    color: #374151;
    font-size: 0.8rem;
  }
  
  input, select {
    padding: 0.625rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    transition: border-color 0.2s;
    
    &:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'success' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.8rem;
  
  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: #667eea;
          color: white;
          &:hover {
            background: #5a67d8;
            transform: translateY(-1px);
          }
        `;
      case 'success':
        return `
          background: #10b981;
          color: white;
          &:hover {
            background: #059669;
            transform: translateY(-1px);
          }
        `;
      default:
        return `
          background: #f3f4f6;
          color: #374151;
          &:hover {
            background: #e5e7eb;
            transform: translateY(-1px);
          }
        `;
    }
  }}
`;

const OrdersGrid = styled.div`
  display: grid;
  gap: 0.75rem;
  width: 100%;
  min-height: 0;
  flex: 1;
`;

const OrderCard = styled.div<{ status: string }>`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 1rem;
  padding: 1.25rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border-left: 4px solid ${props => {
    switch (props.status) {
      case 'received': return '#f59e0b';
      case 'in-progress': return '#3b82f6';
      case 'completed': return '#10b981';
      default: return '#6b7280';
    }
  }};
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
`;

const OrderInfo = styled.div`
  flex: 1;
  
  .order-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.375rem;
  }
  
  .order-meta {
    display: flex;
    gap: 0.75rem;
    font-size: 0.8rem;
    color: #6b7280;
    margin-bottom: 0.375rem;
  }
  
  .order-description {
    color: #374151;
    font-size: 0.8rem;
    line-height: 1.4;
  }
`;

const OrderStatus = styled.div<{ status: string }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  ${props => {
    switch (props.status) {
      case 'received':
        return `
          background: #fef3c7;
          color: #92400e;
        `;
      case 'in-progress':
        return `
          background: #dbeafe;
          color: #1e40af;
        `;
      case 'completed':
        return `
          background: #d1fae5;
          color: #065f46;
        `;
      default:
        return `
          background: #f3f4f6;
          color: #374151;
        `;
    }
  }}
`;

const OrderActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
  justify-content: space-between;
  align-items: center;
`;

const OrderMetaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  color: #6b7280;
  
  .last-updated {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
`;

const StatusBadge = styled.div<{ status: string }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.625rem;
  border-radius: 1rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  ${props => {
    switch (props.status) {
      case 'received':
        return `
          background: #fef3c7;
          color: #92400e;
        `;
      case 'in-progress':
        return `
          background: #dbeafe;
          color: #1e40af;
        `;
      case 'completed':
        return `
          background: #d1fae5;
          color: #065f46;
        `;
      default:
        return `
          background: #f3f4f6;
          color: #374151;
        `;
    }
  }}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 100%;
  
  .empty-icon {
    font-size: 2.5rem;
    color: #9ca3af;
    margin-bottom: 0.75rem;
  }
  
  h3 {
    color: #374151;
    margin-bottom: 0.375rem;
  }
  
  p {
    color: #6b7280;
    margin-bottom: 1rem;
  }
`;

// Mock Data
const mockOrders: Order[] = [
  {
    id: '1',
    salon: 'San Telmo',
    dj: 'Carlos Rodríguez',
    item: 'Líquido de Humo',
    quantity: 2,
    description: 'Necesito líquido de humo para el evento del sábado',
    status: 'received',
    priority: 'high',
    createdAt: '2025-01-13T10:30:00Z',
    updatedAt: '2025-01-13T10:30:00Z',
    notes: 'Urgente para evento de 200 personas'
  },
  {
    id: '2',
    salon: 'Palermo',
    dj: 'María González',
    item: 'Chispas de Backup',
    quantity: 1,
    description: 'Chispas de respaldo para máquina principal',
    status: 'in-progress',
    priority: 'medium',
    createdAt: '2025-01-12T15:45:00Z',
    updatedAt: '2025-01-13T09:15:00Z'
  },
  {
    id: '3',
    salon: 'Recoleta',
    dj: 'Juan Pérez',
    item: 'Cables XLR',
    quantity: 3,
    description: 'Cables XLR de 5 metros para conexiones',
    status: 'completed',
    priority: 'low',
    createdAt: '2025-01-10T08:20:00Z',
    updatedAt: '2025-01-12T14:30:00Z'
  },
  {
    id: '4',
    salon: 'Belgrano',
    dj: 'Ana Silva',
    item: 'Focos LED RGB',
    quantity: 4,
    description: 'Focos LED RGB para iluminación de escenario',
    status: 'received',
    priority: 'high',
    createdAt: '2025-01-13T11:00:00Z',
    updatedAt: '2025-01-13T11:00:00Z'
  }
];

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [selectedSalon, setSelectedSalon] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  
  // New order form state
  const [newOrder, setNewOrder] = useState({
    salon: '',
    dj: '',
    item: '',
    quantity: 1,
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });



  const handleCreateOrder = () => {
    const order: Order = {
      id: Date.now().toString(),
      salon: newOrder.salon,
      dj: newOrder.dj,
      item: newOrder.item,
      quantity: newOrder.quantity,
      description: newOrder.description,
      status: 'received', // Estado inicial - será gestionado por el área técnica
      priority: newOrder.priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // TODO: Enviar pedido al backend para que el área técnica lo reciba
    // En el futuro, esto se integrará con el sistema del área técnica
    console.log('Nuevo pedido creado:', order);
    
    setOrders(prev => [order, ...prev]);
    setNewOrder({
      salon: '',
      dj: '',
      item: '',
      quantity: 1,
      description: '',
      priority: 'medium'
    });
    setShowNewOrderForm(false);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSalon = !selectedSalon || order.salon === selectedSalon;
    const matchesStatus = !selectedStatus || order.status === selectedStatus;
    const matchesPriority = !selectedPriority || order.priority === selectedPriority;
    const matchesSearch = !searchTerm || 
      order.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.dj.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.salon.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSalon && matchesStatus && matchesPriority && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received': return <FaExclamationTriangle />;
      case 'in-progress': return <FaClock />;
      case 'completed': return <FaCheckCircle />;
      default: return <FaTimesCircle />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'received': return 'Recibido';
      case 'in-progress': return 'En Proceso';
      case 'completed': return 'Completado';
      default: return 'Desconocido';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Baja';
      case 'medium': return 'Media';
      case 'high': return 'Alta';
      default: return 'Media';
    }
  };

  return (
    <OrdersContainer>
      <HeaderSection>
        <HeaderContent>
          <HeaderLeft>
            <h1>Pedidos Técnicos - DJ</h1>
            <p>Solicitudes al departamento técnico</p>
          </HeaderLeft>
          <HeaderRight>
            <BackButton onClick={() => navigate('/dashboard')} title="Volver al Dashboard">
              <FaArrowLeft />
              Dashboard
            </BackButton>
          </HeaderRight>
        </HeaderContent>
      </HeaderSection>

      <MainContent>
        <ControlsSection>
          <div style={{ 
            background: 'rgba(102, 126, 234, 0.1)', 
            border: '1px solid rgba(102, 126, 234, 0.2)', 
            borderRadius: '0.5rem', 
            padding: '0.75rem', 
            marginBottom: '1rem',
            color: '#1e40af',
            fontSize: '0.8rem'
          }}>
            <strong>ℹ️ Información:</strong> Los estados de los pedidos son gestionados exclusivamente por el área técnica. 
            Los DJs pueden crear pedidos y hacer seguimiento de su estado, pero no pueden modificarlo.
          </div>
          <ControlsGrid>
            <FormGroup>
              <label>Salón</label>
              <select 
                value={selectedSalon} 
                onChange={(e) => setSelectedSalon(e.target.value)}
              >
                <option value="">Todos los salones</option>
                <option value="San Telmo">San Telmo</option>
                <option value="Palermo">Palermo</option>
                <option value="Recoleta">Recoleta</option>
                <option value="Belgrano">Belgrano</option>
              </select>
            </FormGroup>
            
            <FormGroup>
              <label>Estado</label>
              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="received">Recibido</option>
                <option value="in-progress">En Proceso</option>
                <option value="completed">Completado</option>
              </select>
            </FormGroup>
            
            <FormGroup>
              <label>Prioridad</label>
              <select 
                value={selectedPriority} 
                onChange={(e) => setSelectedPriority(e.target.value)}
              >
                <option value="">Todas las prioridades</option>
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </FormGroup>
            
            <FormGroup>
              <label>Buscar</label>
              <input
                type="text"
                placeholder="Buscar por item, DJ o salón..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </FormGroup>
          </ControlsGrid>
          
          <ActionButtons>
            <ActionButton variant="secondary">
              <FaDownload />
              Exportar
            </ActionButton>
            <ActionButton 
              variant="primary" 
              onClick={() => setShowNewOrderForm(!showNewOrderForm)}
            >
              <FaPlus />
              Nuevo Pedido
            </ActionButton>
          </ActionButtons>
        </ControlsSection>

        {showNewOrderForm && (
          <ControlsSection>
            <h3 style={{ marginBottom: '0.75rem', color: '#1e293b', fontSize: '1.1rem' }}>Nuevo Pedido</h3>
            <ControlsGrid>
              <FormGroup>
                <label>Salón</label>
                <select 
                  value={newOrder.salon} 
                  onChange={(e) => setNewOrder(prev => ({ ...prev, salon: e.target.value }))}
                >
                  <option value="">Seleccionar salón</option>
                  <option value="San Telmo">San Telmo</option>
                  <option value="Palermo">Palermo</option>
                  <option value="Recoleta">Recoleta</option>
                  <option value="Belgrano">Belgrano</option>
                </select>
              </FormGroup>
              
              <FormGroup>
                <label>DJ</label>
                <input
                  type="text"
                  placeholder="Nombre del DJ"
                  value={newOrder.dj}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, dj: e.target.value }))}
                />
              </FormGroup>
              
              <FormGroup>
                <label>Item</label>
                <input
                  type="text"
                  placeholder="Ej: Líquido de humo, Chispas de backup..."
                  value={newOrder.item}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, item: e.target.value }))}
                />
              </FormGroup>
              
              <FormGroup>
                <label>Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={newOrder.quantity}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                />
              </FormGroup>
              
              <FormGroup>
                <label>Prioridad</label>
                <select 
                  value={newOrder.priority} 
                  onChange={(e) => setNewOrder(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </FormGroup>
            </ControlsGrid>
            
            <FormGroup>
              <label>Descripción</label>
              <textarea
                placeholder="Descripción detallada del pedido..."
                value={newOrder.description}
                onChange={(e) => setNewOrder(prev => ({ ...prev, description: e.target.value }))}
                style={{
                  padding: '0.625rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.8rem',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            </FormGroup>
            
            <ActionButtons>
              <ActionButton variant="secondary" onClick={() => setShowNewOrderForm(false)}>
                Cancelar
              </ActionButton>
              <ActionButton 
                variant="success" 
                onClick={handleCreateOrder}
                disabled={!newOrder.salon || !newOrder.dj || !newOrder.item}
              >
                Crear Pedido
              </ActionButton>
            </ActionButtons>
          </ControlsSection>
        )}

        <OrdersGrid>
          {filteredOrders.length > 0 ? (
            filteredOrders.map(order => (
              <OrderCard key={order.id} status={order.status}>
                <OrderHeader>
                  <OrderInfo>
                    <div className="order-title">{order.item}</div>
                    <div className="order-meta">
                      <span><FaBuilding /> {order.salon}</span>
                      <span><FaUser /> {order.dj}</span>
                      <span><FaCalendarAlt /> {new Date(order.createdAt).toLocaleDateString()}</span>
                      <span>Prioridad: {getPriorityLabel(order.priority)}</span>
                    </div>
                    <div className="order-description">
                      {order.description}
                    </div>
                  </OrderInfo>
                  <OrderStatus status={order.status}>
                    {getStatusIcon(order.status)}
                    {getStatusLabel(order.status)}
                  </OrderStatus>
                </OrderHeader>
                
                <OrderActions>
                  <OrderMetaInfo>
                    <div className="last-updated">
                      <FaCalendarAlt />
                      Última actualización: {new Date(order.updatedAt).toLocaleDateString()} {new Date(order.updatedAt).toLocaleTimeString()}
                    </div>
                  </OrderMetaInfo>
                  <StatusBadge status={order.status}>
                    {getStatusIcon(order.status)}
                    {getStatusLabel(order.status)}
                  </StatusBadge>
                </OrderActions>
              </OrderCard>
            ))
          ) : (
            <EmptyState>
              <div className="empty-icon">
                <FaClipboardList />
              </div>
              <h3>No hay pedidos</h3>
              <p>No se encontraron pedidos con los filtros aplicados</p>
              <ActionButton variant="primary" onClick={() => setShowNewOrderForm(true)}>
                <FaPlus />
                Crear Primer Pedido
              </ActionButton>
            </EmptyState>
          )}
        </OrdersGrid>
      </MainContent>
    </OrdersContainer>
  );
};

export default OrdersPage;
