import styled from 'styled-components';

export const MainContent = styled.main`
  margin-left: 260px;
  padding: 2rem;
  min-height: 100vh;
  background-color: #f8fafc;
  
  @media (max-width: 768px) {
    margin-left: 0;
    padding: 1rem;
    padding-top: 5rem; /* Space for MobileHeader */
  }
`;
