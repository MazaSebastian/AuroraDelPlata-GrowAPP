import React from 'react';
import styled from 'styled-components';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Batch } from '../../types/rooms';
import { EsquejeraGrid } from './EsquejeraGrid';

interface PrintableMapReportProps {
  roomName: string;
  mapName: string;
  rows: number;
  cols: number;
  batches: Batch[];
}

const PrintContainer = styled.div`
  font-family: 'Inter', sans-serif;
  color: black;
  background: white;
  width: 100%;
`;

// Page 1: Map (Forces new page after)
const PageOne = styled.div`
  width: 100%;
  height: 100vh; /* Explicit height for page 1 */
  display: flex;
  flex-direction: column;
  padding: 2rem;
  box-sizing: border-box;
  
  @media print {
    display: block; /* Use block for print to adhere to break rules strictly */
    break-after: page;
    page-break-after: always;
    height: 100vh;
    padding: 0; /* Let print margins handle it or explicit padding */
  }
`;

// Page 2: Table (Forces new page before)
const PageTwo = styled.div`
  width: 100%;
  padding: 2rem;
  box-sizing: border-box;
  
  @media print {
    display: block;
    break-before: page;
    page-break-before: always;
    padding: 2rem 0;
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
  margin: 0 0 1rem 0;
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
  const currentDate = format(new Date(), "d 'de' MMMM, yyyy - HH:mm", { locale: es });

  return createPortal(
    <PrintContainer id="print-root" className="printable-report">
      {/* FORCE ROOT LEVEL RENDERING & ISOLATION */}
      <style>{`
        @media print {
            .printable-report {
                position: relative !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: auto !important;
                z-index: 99999 !important;
                background: white !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
            
            .printable-report * {
                visibility: visible !important;
            }
            
            /* Hide ALL other direct children of body (like #root) */
            body > *:not(.printable-report) {
                display: none !important;
            }

            body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
                visibility: visible !important;
            }
        }
      `}</style>

      {/* --- PAGE 1: MAP --- */}
      <PageOne style={{ display: 'block', minHeight: '95vh', pageBreakAfter: 'always', breakAfter: 'page' }}>
        <Header>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Title>Reporte: {roomName}</Title>
            <Subtitle>Mapa: {mapName}</Subtitle>
            <DateText>{currentDate}</DateText>
            <DateText style={{ marginTop: '0.25rem' }}><strong>Total Plantas:</strong> {totalPlants} | <strong>Lotes:</strong> {batches.length}</DateText>
          </div>
        </Header>
        <SectionTitle style={{ textAlign: 'center', marginBottom: '1rem', borderBottom: 'none' }}>
          Mapa de Distribución ({rows}x{cols})
        </SectionTitle>

        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
          <EsquejeraGrid
            rows={rows}
            cols={cols}
            batches={batches}
            onBatchClick={() => { }} // Read-only
            selectionMode={false}
            paintingMode={false}
          />
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '2rem', justifyContent: 'center', fontSize: '12px', color: '#666' }}>
          <div><strong>Total Plantas:</strong> {totalPlants}</div>
          <div><strong>Lotes Activos:</strong> {batches.length}</div>
        </div>
      </PageOne>

      {/* FORCE PAGE BREAK */}
      <div style={{ pageBreakBefore: 'always', breakBefore: 'page', height: '1px', width: '100%', visibility: 'hidden' }} />

      {/* --- PAGE 2: TABLE --- */}
      <PageTwo>

        {/* --- PAGE 2: DETAILS --- */}
        <Header>
          <div>
            <Title>{roomName}</Title>
            <Subtitle>Detalle de Lotes - Continuación</Subtitle>
          </div>
          <div style={{ textAlign: 'right' }}>
            <DateText>Página 2</DateText>
          </div>
        </Header>

        <SectionTitle>Listado de Lotes</SectionTitle>
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
      </PageTwo>
    </PrintContainer>,
    document.body
  );
};
