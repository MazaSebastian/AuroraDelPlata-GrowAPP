import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaBoxes } from 'react-icons/fa';
import { dispensaryService, DispensaryBatch } from '../services/dispensaryService';

// --- Styled Components ---

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
  
  h1 {
    font-size: 1.875rem;
    font-weight: 700;
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
  
  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.5rem;
  }
  
  .stat-label {
    color: #64748b;
    font-size: 0.875rem;
    font-weight: 500;
  }
`;

// --- Main Component ---

const Stock: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Harvest Data
  const [dispensaryBatches, setDispensaryBatches] = useState<DispensaryBatch[]>([]);
  const [aggregatedStock, setAggregatedStock] = useState<{ strain: string, totalWeight: number, batchesCount: number }[]>([]);

  useEffect(() => {
    loadHarvestStock();
  }, []);

  const loadHarvestStock = async () => {
    setIsLoading(true);
    const batches = await dispensaryService.getBatches();
    setDispensaryBatches(batches);

    // Aggregate Data
    const items: { [key: string]: { strain: string, totalWeight: number, batchesCount: number } } = {};
    batches.forEach(b => {
      if (!items[b.strain_name]) {
        items[b.strain_name] = { strain: b.strain_name, totalWeight: 0, batchesCount: 0 };
      }
      items[b.strain_name].totalWeight += b.current_weight;
      items[b.strain_name].batchesCount += 1;
    });

    // Convert to array and sort by weight desc
    setAggregatedStock(Object.values(items).sort((a, b) => b.totalWeight - a.totalWeight));
    setIsLoading(false);
  };

  // Calculate Stats
  const totalHarvestWeight = aggregatedStock.reduce((acc, curr) => acc + curr.totalWeight, 0);

  return (
    <PageContainer>
      <Header>
        <h1><FaBoxes style={{ marginRight: '10px' }} />Stock General</h1>
      </Header>

      {/* Global Stats */}
      <StatsGrid>
        <StatCard>
          <div className="stat-value">{totalHarvestWeight.toFixed(1)}g</div>
          <div className="stat-label">Total Flores</div>
        </StatCard>
        <StatCard>
          <div className="stat-value">{aggregatedStock.length}</div>
          <div className="stat-label">Variedades en Stock</div>
        </StatCard>
        <StatCard>
          <div className="stat-value">{dispensaryBatches.length}</div>
          <div className="stat-label">Lotes Activos</div>
        </StatCard>
      </StatsGrid>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>Cargando inventario...</div>
      ) : (
        <div style={{ background: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f7fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#718096' }}>GENÉTICA</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', color: '#718096' }}>CANTIDAD TOTAL</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', color: '#718096' }}>LOTES</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedStock.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold', color: '#2d3748' }}>{item.strain}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.25rem', fontWeight: 'bold' }}>{item.totalWeight.toFixed(1)}g</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>{item.batchesCount}</td>
                </tr>
              ))}
              {aggregatedStock.length === 0 && (
                <tr><td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>No hay stock de flores registrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
};

export default Stock;
