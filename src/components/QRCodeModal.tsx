import React from 'react';
import styled from 'styled-components';
import QRCode from 'react-qr-code';
import { FaTimes, FaDownload } from 'react-icons/fa';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const Content = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  width: 90%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #a0aec0;
  &:hover { color: #e53e3e; }
`;

const Title = styled.h3`
  margin-top: 0;
  color: #2d3748;
  font-size: 1.25rem;
  margin-bottom: 2rem;
  text-align: center;
`;

const QRWrapper = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  margin-bottom: 2rem;
`;

const DownloadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #3182ce;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2b6cb0;
    transform: translateY(-1px);
  }
`;

interface QRCodeModalProps {
    isOpen: boolean;
    value: string;
    title?: string;
    onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
    isOpen,
    value,
    title = "Código QR",
    onClose
}) => {
    if (!isOpen) return null;

    const handleDownload = () => {
        const svg = document.getElementById("qr-code-svg");
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);
                const pngFile = canvas.toDataURL("image/png");
                const downloadLink = document.createElement("a");
                downloadLink.download = `QR-${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
            };
            img.src = "data:image/svg+xml;base64," + btoa(svgData);
        }
    };

    return (
        <Overlay onClick={onClose}>
            <Content onClick={e => e.stopPropagation()}>
                <CloseButton onClick={onClose}>
                    <FaTimes />
                </CloseButton>
                <Title>{title}</Title>
                <QRWrapper>
                    <QRCode
                        id="qr-code-svg"
                        value={value}
                        size={200}
                        level="H"
                    />
                </QRWrapper>
                <DownloadButton onClick={handleDownload}>
                    <FaDownload /> Descargar PNG
                </DownloadButton>
            </Content>
        </Overlay>
    );
};
