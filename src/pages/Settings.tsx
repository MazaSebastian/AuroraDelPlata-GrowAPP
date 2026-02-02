import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaCog, FaSave, FaDna } from 'react-icons/fa';
import { geneticsService } from '../services/geneticsService';
import { ToastModal } from '../components/ToastModal';
import { Genetic } from '../types/genetics';

const PageContainer = styled.div`
  padding: 1rem;
  padding-top: 5rem;
  max-width: 800px;
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
  margin-bottom: 2rem;
  
  h1 {
    font-size: 1.875rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
`;

const Section = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  margin-bottom: 2rem;
`;

const SectionHeader = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SaveButton = styled.button`
background: #3182ce;
color: white;
border: none;
padding: 0.75rem 1.5rem;
border - radius: 0.5rem;
font - weight: 600;
cursor: pointer;
display: flex;
align - items: center;
gap: 0.5rem;
transition: all 0.2s;
  
  &:hover {
  background: #2b6cb0;
  transform: translateY(-1px);
}
  
  &:disabled {
  opacity: 0.5;
  cursor: not - allowed;
}
`;

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [genetics, setGenetics] = useState<Genetic[]>([]);
  const [toast, setToast] = useState<{ isOpen: boolean, message: string, type: 'success' | 'error' }>({
    isOpen: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    loadGenetics();
  }, []);

  const loadGenetics = async () => {
    setLoading(true); // Loading starts here
    const data = await geneticsService.getGenetics();
    setGenetics(data);
    setLoading(false); // Loading ends here
  };

  const handleSaveGenetics = async () => {
    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    for (const gen of genetics) {
      const success = await geneticsService.updateGenetic(gen.id, { default_price_per_gram: gen.default_price_per_gram });
      if (success) successCount++;
      else errorCount++;
    }

    if (errorCount === 0) {
      setToast({ isOpen: true, message: 'Precios de genéticas actualizados', type: 'success' });
    } else {
      setToast({ isOpen: true, message: `Actualizados: ${successCount}.Errores: ${errorCount} `, type: 'error' });
    }
    setSaving(false);
  };

  const updateGeneticPrice = (id: string, price: string) => {
    setGenetics(genetics.map(g =>
      g.id === id ? { ...g, default_price_per_gram: parseFloat(price) || 0 } : g
    ));
  };

  const closeToast = () => setToast({ ...toast, isOpen: false });

  if (loading) return <PageContainer>Cargando configuración...</PageContainer>;

  return (
    <PageContainer>
      <Header>
        <h1><FaCog /> Configuración</h1>
      </Header>



      <Section>
        <SectionHeader>
          <FaDna /> Precios por Genética
        </SectionHeader>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {genetics.map(gen => (
            <div key={gen.id} style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#2d3748' }}>{gen.name}</div>
              <input
                type="number"
                placeholder="Precio ($)"
                value={gen.default_price_per_gram || ''}
                onChange={e => updateGeneticPrice(gen.id, e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '0.25rem' }}
              />
            </div>
          ))}
        </div>

        <SaveButton onClick={handleSaveGenetics} disabled={saving} style={{ background: '#805ad5' }}>
          <FaSave /> {saving ? 'Guardando...' : 'Guardar Precios Genéticas'}
        </SaveButton>
      </Section>

      <ToastModal
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />
    </PageContainer>
  );
};

export default Settings;
