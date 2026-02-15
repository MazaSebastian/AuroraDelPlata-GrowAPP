import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const PageTransition = styled.div`
  animation: ${fadeIn} 0.4s ease-out;
  width: 100%;
  height: 100%;
`;

export default PageTransition;
