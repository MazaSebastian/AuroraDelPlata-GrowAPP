import React, { useState } from 'react';

import styled from 'styled-components';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FaChartLine,
  FaChartPie,
  FaBoxes,
  FaShoppingBag,
  FaBars,
  FaSeedling,
  FaSignOutAlt,
  FaMoneyBillWave,
  FaDna,
  FaCut,
  FaIdCard,
  FaHandHoldingMedical,
  FaCog,
  FaPlug,
  FaFlask,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';




const SidebarContainer = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 260px;
  background: white;
  border-right: 1px solid #e2e8f0;
  z-index: 1000;
  transition: transform 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 24px rgba(0,0,0,0.05);
  overflow-y: auto;

  @media (max-width: 768px) {
    transform: ${props => props.isOpen ? 'translateX(0)' : 'translateX(-100%)'};
  }
`;

const MobileHeader = styled.div`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  z-index: 900;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);

  @media (max-width: 768px) {
    display: flex;
  }

  .brand {
    font-weight: 800;
    color: #2f855a;
    font-size: 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const Overlay = styled.div<{ isOpen: boolean }>`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 950;
  backdrop-filter: blur(2px);
  opacity: ${props => props.isOpen ? 1 : 0};
  pointer-events: ${props => props.isOpen ? 'all' : 'none'};
  transition: opacity 0.3s ease;

  @media (max-width: 768px) {
    display: block;
  }
`;

const LogoSection = styled.div`
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid #f0f4f8;

  h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #2f855a 0%, #38b2ac 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  svg {
    font-size: 1.75rem;
    color: #38a169;
  }
`;

const NavList = styled.nav`
  padding: 1.5rem 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
`;

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  text-decoration: none;
  color: #4a5568;
  font-weight: 500;
  border-radius: 0.75rem;
  transition: all 0.2s;

  &:hover {
    background: #f0fff4;
    color: #2f855a;
    transform: translateX(4px);
  }

  &.active {
    background: #c6f6d5;
    color: #22543d;
    font-weight: 600;
  }

  svg {
    font-size: 1.25rem;
  }
`;

const SectionTitle = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  color: #a0aec0;
  margin: 1.5rem 0 0.5rem 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const UserSection = styled.div`
  padding: 1.5rem;
  border-top: 1px solid #f0f4f8;
  background: #fafafa;
`;

const LogoutButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  color: #e53e3e;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #fff5f5;
    border-color: #feb2b2;
  }
`;

const HamburgerButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #4a5568;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  // Close sidebar when route changes only on mobile
  React.useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <>
      <MobileHeader>
        <div className="brand">
          <img src="/LOGO APIDC.png" alt="Logo" style={{ height: '32px' }} />
        </div>
        <HamburgerButton onClick={() => setIsOpen(true)}>
          <FaBars />
        </HamburgerButton>
      </MobileHeader>

      <Overlay isOpen={isOpen} onClick={() => setIsOpen(false)} />

      <SidebarContainer isOpen={isOpen}>
        <LogoSection style={{ justifyContent: 'center', padding: '1.5rem' }}>
          <img src="/LOGO APIDC.png" alt="Logo" style={{ height: 'auto', width: '100%', maxWidth: '180px' }} />
        </LogoSection>

        <NavList>
          <StyledNavLink to="/">
            <FaChartLine /> Dashboard
          </StyledNavLink>

          <SectionTitle>Cultivo</SectionTitle>

          <StyledNavLink to="/crops">
            <FaSeedling /> Cultivos
          </StyledNavLink>
          <StyledNavLink to="/clones">
            <FaCut /> Esquejes
          </StyledNavLink>
          <StyledNavLink to="/devices">
            <FaPlug /> Dispositivos
          </StyledNavLink>
          <StyledNavLink to="/stock">
            <FaBoxes /> Stock
          </StyledNavLink>
          <StyledNavLink to="/dispensary">
            <FaHandHoldingMedical /> Dispensario
          </StyledNavLink>
          <StyledNavLink to="/genetics">
            <FaDna /> Madres
          </StyledNavLink>
          <StyledNavLink to="/laboratory">
            <FaFlask /> Laboratorio
          </StyledNavLink>

          <SectionTitle>Gestión</SectionTitle>

          <StyledNavLink to="/insumos">
            <FaShoppingBag /> Insumos
          </StyledNavLink>
          <StyledNavLink to="/expenses">
            <FaMoneyBillWave /> Gastos
          </StyledNavLink>
          <StyledNavLink to="/patients">
            <FaIdCard /> Socios
          </StyledNavLink>
          <StyledNavLink to="/metrics">
            <FaChartPie /> Métricas
          </StyledNavLink>
          <StyledNavLink to="/settings">
            <FaCog /> Configuración
          </StyledNavLink>
        </NavList>

        <UserSection>

          <LogoutButton onClick={logout}>
            <FaSignOutAlt /> Cerrar Sesión
          </LogoutButton>
        </UserSection>

      </SidebarContainer >
    </>
  );
};

export default Sidebar;
