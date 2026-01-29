import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaLeaf } from 'react-icons/fa';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0fdf4; /* Green-50 */
  padding: 1rem;
  position: relative;
  overflow: hidden;
`;

const BackgroundCircle = styled.div<{ size: string, top?: string, left?: string, right?: string, bottom?: string, color: string }>`
  position: absolute;
  width: ${props => props.size};
  height: ${props => props.size};
  border-radius: 50%;
  background: ${props => props.color};
  top: ${props => props.top};
  left: ${props => props.left};
  right: ${props => props.right};
  bottom: ${props => props.bottom};
  opacity: 0.1;
  z-index: 0;
`;

const LoginCard = styled.div`
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 1.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  padding: 3rem;
  width: 100%;
  max-width: 420px;
  position: relative;
  border: 1px solid rgba(34, 197, 94, 0.1); /* Green-500 border tint */
  z-index: 10;
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  .icon-wrapper {
    width: 64px;
    height: 64px;
    background: #dcfce7; /* Green-100 */
    color: #16a34a; /* Green-600 */
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    margin: 0 auto 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }
  
  h1 {
    font-size: 1.875rem;
    font-weight: 800;
    color: #166534; /* Green-800 */
    margin-bottom: 0.5rem;
    letter-spacing: -0.025em;
  }
  
  p {
    color: #64748b;
    font-size: 0.95rem;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.75rem;
  font-size: 1rem;
  transition: all 0.2s;
  background: #f8fafc;

  &:focus {
    outline: none;
    border-color: #22c55e; /* Green-500 */
    background: white;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
  }
`;

const PasswordWrapper = styled.div`
  position: relative;
  
  input {
    padding-right: 2.5rem;
  }
`;

const ToggleButton = styled.button`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
  
  &:hover {
    color: #475569;
  }
`;

const LoginButton = styled.button`
  width: 100%;
  padding: 0.875rem;
  background: #16a34a; /* Green-600 */
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;
  box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.2);

  &:hover {
    background: #15803d; /* Green-700 */
    transform: translateY(-1px);
    box-shadow: 0 10px 15px -3px rgba(22, 163, 74, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    background: #9ca3af;
    transform: none;
    box-shadow: none;
  }
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border-left: 4px solid #ef4444;
  color: #b91c1c;
  padding: 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
`;

const FooterLink = styled.div`
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: #64748b;
  
  a {
    color: #16a34a;
    text-decoration: none;
    font-weight: 600;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login({ email, password });

      if (success) {
        navigate('/', { replace: true });
      } else {
        setError('Credenciales inválidas. Intenta de nuevo.');
      }
    } catch (err) {
      console.error('Error en login:', err);
      setError('Error de conexión. Intenta más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer>
      {/* Background Decorations */}
      <BackgroundCircle size="300px" top="-50px" left="-50px" color="#22c55e" />
      <BackgroundCircle size="400px" bottom="-100px" right="-100px" color="#3b82f6" />

      <LoginCard>
        <Logo>
          <div className="icon-wrapper">
            <FaLeaf />
          </div>
          <h1>Chakra GrowApp</h1>
          <p>Gestión de Cultivos</p>
        </Logo>


        <Form onSubmit={handleSubmit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}

          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Contraseña</Label>
            <PasswordWrapper>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <ToggleButton type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </ToggleButton>
            </PasswordWrapper>
          </FormGroup>

          <LoginButton type="submit" disabled={isLoading}>
            {isLoading ? 'Accediendo...' : 'Iniciar Sesión'}
          </LoginButton>
        </Form>

        <FooterLink>
          ¿No tienes acceso? <a href="#">Contacta al administrador</a>
        </FooterLink>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
