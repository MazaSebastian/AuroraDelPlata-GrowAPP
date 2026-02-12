import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import QRCode from 'react-qr-code';
import { Batch } from '../../types/rooms';

interface PrintableBatchLabelsProps {
  batches: Batch[];
}

const PrintGlobalStyle = createGlobalStyle`
  @media print {
    body * {
      visibility: hidden;
    }
    #printable-batch-labels-root, #printable-batch-labels-root * {
      visibility: visible;
    }
    #printable-batch-labels-root {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      z-index: 9999;
      background: white;
    }
    @page {
      margin: 0;
    }
  }
`;

const PrintContainer = styled.div`
  display: none; // Hidden by default
  @media print {
    display: block; // Visible in print
  }
`;

// Label Size: Aprox 5cm x 2.5cm or similar standard small label
// We'll use a grid layout for multiple labels per page
const LabelGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2mm; 
  padding: 5mm;
`;

const Label = styled.div`
  width: 50mm;
  height: 25mm;
  border: 1px dashed #ccc; // Helper border, maybe remove for final or make configurable
  box-sizing: border-box;
  padding: 2mm;
  display: flex;
  align-items: center;
  justify-content: space-between;
  page-break-inside: avoid;
  overflow: hidden;
`;

const Info = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
`;

const GeneticName = styled.div`
  font-size: 10px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Code = styled.div`
  font-size: 8px;
  font-family: monospace;
  margin-top: 1mm;
`;

const DateText = styled.div`
    font-size: 6px;
    color: #666;
    margin-top: 1mm;
`;

export const PrintableBatchLabels: React.FC<PrintableBatchLabelsProps> = ({ batches }) => {
  return (
    <PrintContainer id="printable-batch-labels-root">
      <PrintGlobalStyle />
      <LabelGrid>
        {batches.map(batch => (
          <Label key={batch.id}>
            <Info>
              <GeneticName>{batch.genetic?.name || batch.name}</GeneticName>
              <Code>{batch.tracking_code || '---'}</Code>
              <DateText>{new Date().toLocaleDateString()}</DateText>
            </Info>
            <div style={{ width: '20mm', height: '20mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QRCode
                value={batch.tracking_code || batch.id}
                size={64} // approx 17mm
                level="M"
              />
            </div>
          </Label>
        ))}
      </LabelGrid>
    </PrintContainer>
  );
};
