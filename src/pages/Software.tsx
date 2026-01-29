import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaDownload, 
  FaDesktop,
  FaLaptop,
  FaCode,
  FaCog,
  FaInfoCircle,
  FaExternalLinkAlt,
  FaFileArchive,
  FaWindows,
  FaApple,
  FaLinux
} from 'react-icons/fa';

interface SoftwareItem {
  id: string;
  name: string;
  category: string;
  version: string;
  fileSize: string;
  platform: string[];
  description: string;
  downloadUrl: string;
  websiteUrl?: string;
  requirements?: string;
  features?: string[];
}

const SoftwareContainer = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.75rem;
  font-weight: 400;
  opacity: 0.8;
  
  &:hover {
    background: rgba(59, 130, 246, 0.2);
    opacity: 1;
    transform: translateY(-1px);
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const PageSubtitle = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 1rem;
`;

const MainContent = styled.div`
  display: grid;
  gap: 2rem;
`;

const CategorySection = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f3f4f6;
`;

const CategoryIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
`;

const CategoryTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const CategoryDescription = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;
`;

const SoftwareGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
`;

const SoftwareCard = styled.div`
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.2s;
  
  &:hover {
    border-color: #10b981;
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  }
`;

const SoftwareHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const SoftwareInfo = styled.div`
  flex: 1;
`;

const SoftwareName = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
`;

const SoftwareMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.75rem;
`;

const SoftwareMetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const PlatformIcons = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PlatformIcon = styled.div<{ platform: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: ${props => {
    switch (props.platform.toLowerCase()) {
      case 'windows': return '#0078d4';
      case 'mac': return '#000000';
      case 'linux': return '#fcc624';
      default: return '#6b7280';
    }
  }};
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
`;

const SoftwareActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  background: ${props => props.variant === 'primary' ? '#10b981' : '#f3f4f6'};
  color: ${props => props.variant === 'primary' ? 'white' : '#6b7280'};
  
  &:hover {
    background: ${props => props.variant === 'primary' ? '#059669' : '#e5e7eb'};
    transform: translateY(-1px);
  }
`;

const SoftwareDescription = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.6;
  margin: 0 0 1rem 0;
`;

const SoftwareFeatures = styled.div`
  margin-top: 1rem;
`;

const FeaturesTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FeatureItem = styled.li`
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
  padding-left: 1rem;
  position: relative;
  
  &:before {
    content: '•';
    position: absolute;
    left: 0;
    color: #10b981;
  }
`;

const Requirements = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border-left: 3px solid #10b981;
`;

const RequirementsTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RequirementsText = styled.p`
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  h3 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }
  
  p {
    font-size: 0.875rem;
  }
`;

const SoftwarePage: React.FC = () => {
  const navigate = useNavigate();

  // Datos de software para DJs
  const softwareItems: SoftwareItem[] = [
    // Software de DJ
    {
      id: '1',
      name: 'VirtualDJ',
      category: 'Software de DJ',
      version: '2023',
      fileSize: '45.2 MB',
      platform: ['Windows', 'Mac'],
      description: 'Software profesional de DJ con control de vinilos, efectos en tiempo real y sincronización automática de BPM.',
      downloadUrl: '#',
      websiteUrl: 'https://www.virtualdj.com',
      requirements: 'Windows 10/11 o macOS 10.15+, 4GB RAM, 2GB espacio libre',
      features: [
        'Control de vinilos y CDJs',
        'Efectos en tiempo real',
        'Sincronización automática de BPM',
        'Biblioteca de música integrada',
        'Grabación de sesiones'
      ]
    },
    {
      id: '2',
      name: 'Serato DJ Pro',
      category: 'Software de DJ',
      version: '3.0.5',
      fileSize: '38.7 MB',
      platform: ['Windows', 'Mac'],
      description: 'Software premium de DJ con análisis de música avanzado, efectos profesionales y compatibilidad con hardware de alta calidad.',
      downloadUrl: '#',
      websiteUrl: 'https://serato.com',
      requirements: 'Windows 10/11 o macOS 10.15+, 8GB RAM, 4GB espacio libre',
      features: [
        'Análisis de música avanzado',
        'Efectos profesionales',
        'Compatibilidad con hardware premium',
        'Modo de práctica',
        'Integración con streaming'
      ]
    },
    {
      id: '3',
      name: 'Rekordbox',
      category: 'Software de DJ',
      version: '6.7.1',
      fileSize: '52.1 MB',
      platform: ['Windows', 'Mac'],
      description: 'Software oficial de Pioneer DJ para preparación de música y control de equipos CDJ y DJM.',
      downloadUrl: '#',
      websiteUrl: 'https://rekordbox.com',
      requirements: 'Windows 10/11 o macOS 10.15+, 4GB RAM, 2GB espacio libre',
      features: [
        'Preparación de música',
        'Compatibilidad con CDJ/DJM',
        'Análisis de música',
        'Sincronización con equipos',
        'Modo export para USB'
      ]
    },
    {
      id: '4',
      name: 'Traktor Pro',
      category: 'Software de DJ',
      version: '3.8.0',
      fileSize: '41.3 MB',
      platform: ['Windows', 'Mac'],
      description: 'Software de DJ de Native Instruments con efectos únicos, loops y remix decks avanzados.',
      downloadUrl: '#',
      websiteUrl: 'https://www.native-instruments.com',
      requirements: 'Windows 10/11 o macOS 10.15+, 8GB RAM, 3GB espacio libre',
      features: [
        'Efectos únicos de NI',
        'Remix decks',
        'Loops avanzados',
        'Control de hardware NI',
        'Integración con Maschine'
      ]
    },

    // Software de Video
    {
      id: '5',
      name: 'Resolume Arena',
      category: 'Software de Video',
      version: '7.3.2',
      fileSize: '89.5 MB',
      platform: ['Windows', 'Mac'],
      description: 'Software profesional de VJ para mapeo de proyección, efectos de video en tiempo real y sincronización con audio.',
      downloadUrl: '#',
      websiteUrl: 'https://resolume.com',
      requirements: 'Windows 10/11 o macOS 10.15+, 16GB RAM, 8GB espacio libre, GPU dedicada',
      features: [
        'Mapeo de proyección',
        'Efectos de video en tiempo real',
        'Sincronización con audio',
        'Múltiples capas de video',
        'Control MIDI'
      ]
    },
    {
      id: '6',
      name: 'vMix',
      category: 'Software de Video',
      version: '26.0',
      fileSize: '156.2 MB',
      platform: ['Windows'],
      description: 'Software de mezcla de video en vivo para eventos, streaming y producción profesional.',
      downloadUrl: '#',
      websiteUrl: 'https://www.vmix.com',
      requirements: 'Windows 10/11, 16GB RAM, 10GB espacio libre, GPU dedicada recomendada',
      features: [
        'Mezcla de video en vivo',
        'Streaming integrado',
        'Efectos de transición',
        'Grabación multicámara',
        'Titulador integrado'
      ]
    },
    {
      id: '7',
      name: 'OBS Studio',
      category: 'Software de Video',
      version: '29.1.3',
      fileSize: '78.4 MB',
      platform: ['Windows', 'Mac', 'Linux'],
      description: 'Software gratuito de grabación y streaming de video con múltiples fuentes y efectos.',
      downloadUrl: '#',
      websiteUrl: 'https://obsproject.com',
      requirements: 'Windows 10/11, macOS 10.15+ o Linux, 8GB RAM, 4GB espacio libre',
      features: [
        'Grabación y streaming',
        'Múltiples fuentes de video',
        'Efectos y filtros',
        'Plugins de terceros',
        'Gratuito y open source'
      ]
    },

    // Software de Audio
    {
      id: '8',
      name: 'Ableton Live',
      category: 'Software de Audio',
      version: '11.3.10',
      fileSize: '2.1 GB',
      platform: ['Windows', 'Mac'],
      description: 'DAW profesional para producción musical, live performance y composición electrónica.',
      downloadUrl: '#',
      websiteUrl: 'https://www.ableton.com',
      requirements: 'Windows 10/11 o macOS 10.15+, 8GB RAM, 8GB espacio libre',
      features: [
        'Producción musical',
        'Live performance',
        'Instrumentos virtuales',
        'Efectos de audio',
        'Sincronización MIDI'
      ]
    },
    {
      id: '9',
      name: 'Audacity',
      category: 'Software de Audio',
      version: '3.4.2',
      fileSize: '15.7 MB',
      platform: ['Windows', 'Mac', 'Linux'],
      description: 'Editor de audio gratuito para grabación, edición y procesamiento de archivos de audio.',
      downloadUrl: '#',
      websiteUrl: 'https://www.audacityteam.org',
      requirements: 'Windows 10/11, macOS 10.15+ o Linux, 4GB RAM, 2GB espacio libre',
      features: [
        'Grabación de audio',
        'Edición multipista',
        'Efectos de audio',
        'Conversión de formatos',
        'Gratuito y open source'
      ]
    },

    // Herramientas de Utilidad
    {
      id: '10',
      name: 'BPM Counter',
      category: 'Herramientas de Utilidad',
      version: '2.1.0',
      fileSize: '3.2 MB',
      platform: ['Windows', 'Mac'],
      description: 'Herramienta para detectar automáticamente el BPM de canciones y organizar bibliotecas musicales.',
      downloadUrl: '#',
      requirements: 'Windows 10/11 o macOS 10.15+, 2GB RAM, 1GB espacio libre',
      features: [
        'Detección automática de BPM',
        'Análisis de música',
        'Organización de bibliotecas',
        'Exportación de metadatos',
        'Interfaz simple'
      ]
    },
    {
      id: '11',
      name: 'Key Detector',
      category: 'Herramientas de Utilidad',
      version: '1.8.5',
      fileSize: '2.8 MB',
      platform: ['Windows', 'Mac'],
      description: 'Software para detectar la tonalidad musical de canciones y crear listas compatibles.',
      downloadUrl: '#',
      requirements: 'Windows 10/11 o macOS 10.15+, 2GB RAM, 1GB espacio libre',
      features: [
        'Detección de tonalidad',
        'Compatibilidad musical',
        'Análisis de progresiones',
        'Exportación de datos',
        'Integración con software DJ'
      ]
    },
    {
      id: '12',
      name: 'Playlist Manager',
      category: 'Herramientas de Utilidad',
      version: '3.2.1',
      fileSize: '5.4 MB',
      platform: ['Windows', 'Mac'],
      description: 'Gestor de listas de reproducción para organizar música por eventos, géneros y estados de ánimo.',
      downloadUrl: '#',
      requirements: 'Windows 10/11 o macOS 10.15+, 4GB RAM, 2GB espacio libre',
      features: [
        'Gestión de playlists',
        'Organización por eventos',
        'Filtros avanzados',
        'Sincronización con software DJ',
        'Backup automático'
      ]
    }
  ];

  const categories = Array.from(new Set(softwareItems.map(item => item.category)));

  const handleDownload = (software: SoftwareItem) => {
    // En producción, esto descargaría el archivo real
    window.open(software.downloadUrl, '_blank');
  };

  const handleWebsite = (software: SoftwareItem) => {
    if (software.websiteUrl) {
      window.open(software.websiteUrl, '_blank');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Software de DJ':
        return <FaDesktop />;
      case 'Software de Video':
        return <FaCode />;
      case 'Software de Audio':
        return <FaLaptop />;
      case 'Herramientas de Utilidad':
        return <FaCog />;
      default:
        return <FaDesktop />;
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'Software de DJ':
        return 'Software profesional para mezcla y control de música en eventos';
      case 'Software de Video':
        return 'Herramientas para VJ, streaming y producción de video';
      case 'Software de Audio':
        return 'DAWs y editores de audio para producción musical';
      case 'Herramientas de Utilidad':
        return 'Utilidades para análisis y organización de música';
      default:
        return 'Software de utilidad para DJs';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'windows':
        return <FaWindows />;
      case 'mac':
        return <FaApple />;
      case 'linux':
        return <FaLinux />;
      default:
        return <FaDesktop />;
    }
  };

  return (
    <SoftwareContainer>
      <HeaderSection>
        <HeaderContent>
          <HeaderLeft>
            <BackButton onClick={() => navigate('/dashboard')} title="Volver al Dashboard">
              <FaArrowLeft />
              Dashboard
            </BackButton>
            <div>
              <PageTitle>Software de Utilidad</PageTitle>
              <PageSubtitle>Herramientas y software profesional para DJs</PageSubtitle>
            </div>
          </HeaderLeft>
          <HeaderRight>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Software Profesional
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                {softwareItems.length} programas disponibles
              </div>
            </div>
          </HeaderRight>
        </HeaderContent>
      </HeaderSection>

      <MainContent>
        {categories.length > 0 ? (
          categories.map(category => (
            <CategorySection key={category}>
              <CategoryHeader>
                <CategoryIcon>
                  {getCategoryIcon(category)}
                </CategoryIcon>
                <div>
                  <CategoryTitle>{category}</CategoryTitle>
                  <CategoryDescription>{getCategoryDescription(category)}</CategoryDescription>
                </div>
              </CategoryHeader>
              
              <SoftwareGrid>
                {softwareItems
                  .filter(item => item.category === category)
                  .map(software => (
                    <SoftwareCard key={software.id}>
                      <SoftwareHeader>
                        <SoftwareInfo>
                          <SoftwareName>{software.name}</SoftwareName>
                          <SoftwareMeta>
                            <SoftwareMetaItem>
                              <FaInfoCircle />
                              v{software.version}
                            </SoftwareMetaItem>
                            <SoftwareMetaItem>
                              <FaFileArchive />
                              {software.fileSize}
                            </SoftwareMetaItem>
                            <PlatformIcons>
                              {software.platform.map(platform => (
                                <PlatformIcon key={platform} platform={platform} title={platform}>
                                  {getPlatformIcon(platform)}
                                </PlatformIcon>
                              ))}
                            </PlatformIcons>
                          </SoftwareMeta>
                        </SoftwareInfo>
                        <SoftwareActions>
                          <ActionButton
                            variant="primary"
                            onClick={() => handleDownload(software)}
                            title="Descargar"
                          >
                            <FaDownload />
                            Descargar
                          </ActionButton>
                          {software.websiteUrl && (
                            <ActionButton
                              onClick={() => handleWebsite(software)}
                              title="Visitar sitio web"
                            >
                              <FaExternalLinkAlt />
                            </ActionButton>
                          )}
                        </SoftwareActions>
                      </SoftwareHeader>
                      
                      <SoftwareDescription>{software.description}</SoftwareDescription>
                      
                      {software.features && (
                        <SoftwareFeatures>
                          <FeaturesTitle>Características principales:</FeaturesTitle>
                          <FeaturesList>
                            {software.features.map((feature, index) => (
                              <FeatureItem key={index}>{feature}</FeatureItem>
                            ))}
                          </FeaturesList>
                        </SoftwareFeatures>
                      )}
                      
                      {software.requirements && (
                        <Requirements>
                          <RequirementsTitle>
                            <FaInfoCircle />
                            Requisitos del sistema
                          </RequirementsTitle>
                          <RequirementsText>{software.requirements}</RequirementsText>
                        </Requirements>
                      )}
                    </SoftwareCard>
                  ))}
              </SoftwareGrid>
            </CategorySection>
          ))
        ) : (
          <EmptyState>
            <div className="empty-icon">
              <FaDesktop />
            </div>
            <h3>No hay software disponible</h3>
            <p>El software de utilidad aparecerá aquí cuando esté disponible</p>
          </EmptyState>
        )}
      </MainContent>
    </SoftwareContainer>
  );
};

export default SoftwarePage;
