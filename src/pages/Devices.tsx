
import React from 'react';
import styled from 'styled-components';
import { TuyaManager } from '../components/TuyaManager';
import { FaPlug } from 'react-icons/fa';

const Container = styled.div`
  padding: 2rem;
  padding-top: 5rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  h1 {
    font-size: 2rem;
    font-weight: 800;
    color: #1a202c;
    background: linear-gradient(135deg, #38b2ac 0%, #319795 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
`;

const Devices: React.FC = () => {
    return (
        <Container>
            <Header>
                <h1><FaPlug /> Dispositivos IoT</h1>
            </Header>

            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <p style={{ marginBottom: '1.5rem', color: '#718096' }}>
                    Gestión centralizada de dispositivos inteligentes Tuya. Controla luces, enchufes y monitorea sensores.
                </p>
                <TuyaManager mode="full" />
            </div>
        </Container>
    );
};

export default Devices;
