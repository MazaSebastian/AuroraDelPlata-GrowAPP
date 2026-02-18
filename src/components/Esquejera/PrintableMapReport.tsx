import React from 'react';
import styled from 'styled-components';
import { Batch } from '../../types/rooms';
import { EsquejeraGrid } from './EsquejeraGrid';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PrintableMapReportProps {
  roomName: string;
  mapName: string;
  rows: number;
  cols: number;
  batches: Batch[];
}

const PrintContainer = styled.div`
  padding: 2rem;
  font-family: 'Inter', sans-serif;
  color: black;
  background: white;

  @media print {
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 2px solid #000;
  padding-bottom: 1rem;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 24px;
  margin: 0;
  font-weight: bold;
`;

const Subtitle = styled.h2`
  font-size: 18px;
  margin: 0.5rem 0 0 0;
  font-weight: normal;
  color: #444;
`;

const DateText = styled.div`
  font-size: 14px;
  color: #666;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  margin: 1.5rem 0 1rem 0;
  border-bottom: 1px solid #ccc;
  padding-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin-top: 1rem;

  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }

  th {
    background-color: #f2f2f2;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 10px;
  }

  tr:nth-child(even) {
    background-color: #f9f9f9;
  }
`;

export const PrintableMapReport: React.FC<PrintableMapReportProps> = ({ roomName, mapName, rows, cols, batches }) => {
  // Sort batches by position (A1, A2, B1...)
  const sortedBatches = [...batches].sort((a, b) => {
    if (!a.grid_position || !b.grid_position) return 0;
    return a.grid_position.localeCompare(b.grid_position);
  });

  const totalPlants = batches.reduce((acc, b) => acc + b.quantity, 0);

  return (
    <PrintContainer>
      <Header>
        <div>
          <Title>{roomName}</Title>
          <Subtitle>{mapName} ({rows}x{cols})</Subtitle>
        </div>
        <div style={{ textAlign: 'right' }}>
          <DateText>Generado: {format(new Date(), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}</DateText>
          <DateText>Total Esquejes: <strong>{totalPlants}</strong></DateText>
        </div>
      </Header>

      <SectionTitle>Mapa Visual</SectionTitle>
      <div style={{ transform: 'scale(0.8)', transformOrigin: 'top left', marginBottom: '0', breakInside: 'avoid' }}>
        <EsquejeraGrid
          rows={rows}
          cols={cols}
          batches={batches}
          onBatchClick={() => { }} // No interactive click in print
          paintingMode={false}
        />
      </div>

      <SectionTitle style={{ marginTop: '2rem', breakBefore: 'page', pageBreakBefore: 'always' }}>Detalle de Lotes / Genéticas</SectionTitle>
      <Table>
        <thead>
          <tr>
            <th style={{ width: '60px', textAlign: 'center' }}>Pos</th>
            <th style={{ width: '120px' }}>Código</th>
            <th>Genética / Nombre</th>
            <th style={{ width: '60px', textAlign: 'center' }}>Cant.</th>
            <th>Notas</th>
            <th style={{ width: '80px' }}>Fecha Inicio</th>
          </tr>
        </thead>
        <tbody>
          {sortedBatches.map(batch => (
            <tr key={batch.id}>
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{batch.grid_position}</td>
              <td style={{ fontFamily: 'monospace' }}>{batch.tracking_code || '-'}</td>
              <td>{batch.genetic?.name || batch.name}</td>
              <td style={{ textAlign: 'center' }}>{batch.quantity}</td>
              <td>{batch.notes || '-'}</td>
              <td>{format(new Date(batch.start_date), 'dd/MM/yy')}</td>
            </tr>
          ))}
          {sortedBatches.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '1rem', color: '#999' }}>
                El mapa está vacío.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </PrintContainer>
  );
};
