import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { KPICard } from '../components/charts/KPICard';
import { TrendChart } from '../components/charts/TrendChart';
import { metricsService, MonthlyMetric, GeneticPerformance, CostCategory } from '../services/metricsService';
import { FaChartLine, FaLeaf, FaDollarSign, FaBolt, FaExclamationTriangle } from 'react-icons/fa';
import { LoadingSpinner } from '../components/LoadingSpinner';

const Container = styled.div`
  padding: 2rem;
  padding-top: 5rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;
  h1 { font-size: 2rem; color: #2d3748; }
  p { color: #718096; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
      grid-template-columns: 1fr;
  }
`;

const Metrics: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [monthlyMetrics, setMonthlyMetrics] = useState<MonthlyMetric[]>([]);
    const [genetics, setGenetics] = useState<GeneticPerformance[]>([]);
    const [costs, setCosts] = useState<CostCategory[]>([]);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        loadData();
    }, [year]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [mMetrics, genPerf, costBreakdown] = await Promise.all([
                metricsService.getMonthlyMetrics(year),
                metricsService.getGeneticPerformance(),
                metricsService.getCostBreakdown(`${year}-01-01`, `${year}-12-31`)
            ]);

            setMonthlyMetrics(mMetrics);
            setGenetics(genPerf);
            setCosts(costBreakdown);
        } catch (error) {
            console.error("Error loading metrics:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner fullScreen text="Analizando datos..." />;

    // Aggregate Totals
    const totalYield = monthlyMetrics.reduce((acc, m) => acc + (Number(m.total_yield) || 0), 0);
    const totalRevenue = monthlyMetrics.reduce((acc, m) => acc + (Number(m.total_revenue) || 0), 0);
    const totalExpenses = monthlyMetrics.reduce((acc, m) => acc + (Number(m.total_expenses) || 0), 0);
    const costPerGram = totalYield > 0 ? (totalExpenses / totalYield).toFixed(2) : '0.00';
    const profit = totalRevenue - totalExpenses;

    return (
        <Container>
            <Header>
                <h1>Reportes y Métricas</h1>
                <p>Análisis de rendimiento y financiero del año {year}</p>
            </Header>

            {/* KPI Cards */}
            <Grid>
                <KPICard
                    title="Cosecha Total"
                    value={`${(totalYield / 1000).toFixed(2)} kg`}
                    icon={<FaLeaf />}
                    color="#48bb78"
                />
                <KPICard
                    title="Ingresos Estimados"
                    value={`$${totalRevenue.toLocaleString()}`}
                    icon={<FaDollarSign />}
                    color="#3182ce"
                    trend={totalRevenue > 0 ? 10 : 0} // Mock trend for now
                    trendLabel="vs año anterior"
                />
                <KPICard
                    title="Gastos Operativos"
                    value={`$${totalExpenses.toLocaleString()}`}
                    icon={<FaBolt />}
                    color="#f56565"
                />
                <KPICard
                    title="Costo por Gramo"
                    value={`$${costPerGram}`}
                    icon={<FaChartLine />}
                    color={Number(costPerGram) < 500 ? "#48bb78" : "#ecc94b"} // Example threshold
                />
            </Grid>

            {/* Main Charts */}
            <ChartsGrid>
                {/* Financial Trend */}
                <TrendChart
                    title="Flujo de Caja Mensual"
                    data={monthlyMetrics}
                    dataKey1="total_revenue" name1="Ingresos" color1="#3182ce" type1="bar"
                    dataKey2="total_expenses" name2="Gastos" color2="#f56565" type2="area"
                />

                {/* Yield Trend */}
                <TrendChart
                    title="Producción Mensual (Gramos)"
                    data={monthlyMetrics}
                    dataKey1="total_yield" name1="Cosecha (g)" color1="#48bb78" type1="area"
                    unit=""
                />
            </ChartsGrid>

            {/* Secondary Analysis */}
            <ChartsGrid>
                {/* Top Genetics Table/List could go here */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '1rem', color: '#2d3748' }}>Rendimiento por Genética</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                                    <th style={{ padding: '0.5rem', color: '#718096' }}>Genética</th>
                                    <th style={{ padding: '0.5rem', color: '#718096' }}>Total (g)</th>
                                    <th style={{ padding: '0.5rem', color: '#718096' }}>Cosechas</th>
                                    <th style={{ padding: '0.5rem', color: '#718096' }}>Promedio (g)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {genetics.map((g, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #edf2f7' }}>
                                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{g.genetic_name || 'Desconocida'}</td>
                                        <td style={{ padding: '0.75rem' }}>{Number(g.total_yield_g).toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem' }}>{g.harvest_count}</td>
                                        <td style={{ padding: '0.75rem', color: '#48bb78', fontWeight: 700 }}>{Number(g.avg_yield_per_harvest).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {genetics.length === 0 && (
                                    <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#a0aec0' }}>Sin datos de cosecha</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Cost Breakdown */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '1rem', color: '#2d3748' }}>Desglose de Gastos</h3>
                    {costs.map((c, i) => (
                        <div key={i} style={{ marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                                <span style={{ textTransform: 'capitalize' }}>{c.category === 'electricity' ? 'Luz' : c.category === 'nutrients' ? 'Nutrientes' : c.category}</span>
                                <span style={{ fontWeight: 600 }}>${Number(c.total_amount).toLocaleString()}</span>
                            </div>
                            <div style={{ height: '8px', background: '#edf2f7', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${c.percentage}%`, background: '#f56565', height: '100%' }}></div>
                            </div>
                        </div>
                    ))}
                    {costs.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#a0aec0' }}>No hay gastos registrados este año</div>
                    )}
                </div>
            </ChartsGrid>

        </Container>
    );
};

export default Metrics;
