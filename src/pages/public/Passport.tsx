import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../services/supabaseClient';
import { FaLeaf, FaCalendarCheck, FaWeightHanging, FaCheckCircle, FaCannabis } from 'react-icons/fa';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Styled Components for Mobile-First Design
const Container = styled.div`
  min-height: 100vh;
  background-color: #f7fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'Inter', sans-serif;
`;

const Header = styled.div`
  background: white;
  width: 100%;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  text-align: center;
  border-bottom: 1px solid #e2e8f0;

  img {
    height: 60px;
    margin-bottom: 0.5rem;
  }
  
  h1 {
    font-size: 1.25rem;
    color: #2d3748;
    margin: 0;
    font-weight: 700;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 1rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  margin: 2rem 1rem;
  width: 90%;
  max-width: 400px;
  overflow: hidden;
  border: 1px solid #edf2f7;
`;

const CoverImage = styled.div`
  height: 200px;
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 4rem;
`;

const Content = styled.div`
  padding: 2rem;
`;

const StrainTitle = styled.h2`
  font-size: 1.75rem;
  color: #1a202c;
  margin: 0 0 0.5rem 0;
  text-align: center;
  font-weight: 800;
`;

const BatchCode = styled.div`
  text-align: center;
  color: #718096;
  font-family: monospace;
  background: #edf2f7;
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
  width: 100%;
  font-size: 0.9rem;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #edf2f7;
  
  &:last-child {
    border-bottom: none;
  }

  .label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #718096;
    font-weight: 500;
  }

  .value {
    font-weight: 700;
    color: #2d3748;
    text-align: right;
  }
`;

const Footer = styled.div`
  margin-top: auto;
  padding: 2rem;
  text-align: center;
  color: #a0aec0;
  font-size: 0.85rem;
  
  span {
    display: block;
    margin-top: 0.5rem;
    font-weight: 600;
    color: #38a169;
  }
`;

const Passport: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [batch, setBatch] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBatch = async () => {
            if (!id) return;

            if (!supabase) {
                setError("Error de conexión con la base de datos.");
                setLoading(false);
                return;
            }

            // Fetch batch data (public access thanks to RLS policy)
            const { data, error } = await supabase
                .from('chakra_dispensary_batches')
                .select(`
            *,
            chakra_harvest_logs (
                created_at,
                notes
            )
        `)
                .eq('id', id)
                .single();

            if (error) {
                console.error("Error fetching passport:", error);
                setError("Lote no encontrado o acceso restringido.");
            } else {
                setBatch(data);
            }
            setLoading(false);
        };

        fetchBatch();
    }, [id]);

    if (loading) return <Container style={{ justifyContent: 'center' }}>Cargando información...</Container>;
    if (error) return <Container style={{ justifyContent: 'center' }}>{error}</Container>;
    if (!batch) return null;

    const harvestDate = batch.chakra_harvest_logs?.created_at
        ? new Date(batch.chakra_harvest_logs.created_at)
        : new Date(batch.created_at);

    const now = new Date();
    const cureDays = Math.floor((now.getTime() - harvestDate.getTime()) / (1000 * 3600 * 24));

    return (
        <Container>
            <Header>
                <img src="/logo.png" alt="Aurora Del Plata" />
                <h1>Pasaporte Digital de Lote</h1>
            </Header>

            <Card>
                <CoverImage>
                    <FaCannabis />
                </CoverImage>
                <Content>
                    <StrainTitle>{batch.strain_name}</StrainTitle>
                    <div style={{ textAlign: 'center' }}>
                        <BatchCode>{batch.batch_code}</BatchCode>
                    </div>

                    <InfoRow>
                        <div className="label"><FaCheckCircle style={{ color: '#319795' }} /> Estado</div>
                        <div className="value" style={{ textTransform: 'uppercase', color: batch.status === 'available' ? '#38a169' : '#d69e2e' }}>
                            {batch.status === 'available' ? 'Disponible' : batch.status}
                        </div>
                    </InfoRow>

                    <InfoRow>
                        <div className="label"><FaCalendarCheck style={{ color: '#805ad5' }} /> Cosecha</div>
                        <div className="value">{format(harvestDate, 'dd MMM yyyy', { locale: es })}</div>
                    </InfoRow>

                    <InfoRow>
                        <div className="label"><FaWeightHanging style={{ color: '#dd6b20' }} /> Curado</div>
                        <div className="value">{cureDays} días</div>
                    </InfoRow>

                    <InfoRow>
                        <div className="label"><FaLeaf style={{ color: '#38a169' }} /> Calidad</div>
                        <div className="value">{batch.quality_grade}</div>
                    </InfoRow>
                </Content>
            </Card>

            <Footer>
                Verificado por el sistema de trazabilidad de
                <span>AURORA DEL PLATA</span>
            </Footer>
        </Container>
    );
};

export default Passport;
