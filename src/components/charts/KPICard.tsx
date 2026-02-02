import React from 'react';
import styled from 'styled-components';
import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';

const Card = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 1px solid #e2e8f0;
  transition: transform 0.2s;
  &:hover { transform: translateY(-2px); }
`;

const Title = styled.h3`
  font-size: 0.85rem;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Value = styled.div`
  font-size: 1.8rem;
  font-weight: 800;
  color: #2d3748;
`;

const Trend = styled.div<{ $isPositive: boolean }>`
  font-size: 0.85rem;
  color: ${p => p.$isPositive ? '#48bb78' : '#f56565'};
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
  font-weight: 600;
`;

interface KPICardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: number; // Percent change
    trendLabel?: string;
    color?: string;
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, icon, trend, trendLabel, color }) => {
    return (
        <Card style={color ? { borderTop: `4px solid ${color}` } : {}}>
            <Title>{icon} {title}</Title>
            <Value>{value}</Value>
            {trend !== undefined && (
                <Trend $isPositive={trend >= 0}>
                    {trend > 0 ? <FaArrowUp /> : trend < 0 ? <FaArrowDown /> : <FaMinus />}
                    {Math.abs(trend)}% {trendLabel}
                </Trend>
            )}
        </Card>
    );
};
