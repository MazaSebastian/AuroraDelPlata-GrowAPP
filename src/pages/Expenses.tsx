
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaMoneyBillWave, FaTrash } from 'react-icons/fa';
import { expensesService, CashMovement } from '../services/expensesService';
import { format } from 'date-fns';

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 5rem; // Sidebar space
`;

const Header = styled.div`
  margin-bottom: 2rem;
  h1 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #2d3748;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #edf2f7;
`;

const BalanceCard = styled(Card)`
  background: white; // linear-gradient(135deg, #319795 0%, #38b2ac 100%);
  color: #2d3748;
  grid-column: 1 / -1;

  h2 { font-size: 1rem; color: #718096; margin: 0 0 0.5rem 0; }
  .balance { font-size: 3rem; font-weight: 800; margin: 0; color: #1a202c; }
  .sub-balances { 
     display: flex; gap: 2rem; margin-top: 1rem; color: #4a5568; font-size: 0.9rem;
     strong { color: #2d3748; }
  }
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  input, select {
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    width: 100%;
    font-size: 1rem;
  }

  button {
    background: #38b2ac;
    color: white;
    border: none;
    padding: 0.75rem;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    &:hover { background: #319795; }
  }
`;

const TableContainer = styled(Card)`
  grid-column: 1 / -1;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    text-align: left;
    padding: 1rem;
    border-bottom: 1px solid #edf2f7;
  }
  
  th { color: #718096; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
  td { color: #2d3748; }

  .type-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 700;
    &.INGRESO { background: #f0fff4; color: #38a169; }
    &.EGRESO { background: #fff5f5; color: #e53e3e; }
  }
`;

const Expenses: React.FC = () => {
    const [movements, setMovements] = useState<CashMovement[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [type, setType] = useState<'INGRESO' | 'EGRESO'>('EGRESO');
    const [owner, setOwner] = useState('Sebastian');
    const [concept, setConcept] = useState('');
    const [amount, setAmount] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await expensesService.getMovements();
        setMovements(data);
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!concept || !amount) return alert('Completa todos los campos');

        const newVal = {
            type,
            owner,
            concept,
            amount: parseFloat(amount),
            date: new Date().toISOString().split('T')[0] // today YYYY-MM-DD
        };

        const result = await expensesService.createMovement(newVal);
        if (result.success) {
            setConcept('');
            setAmount('');
            loadData();
        } else {
            alert('Error al crear: ' + result.error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Eliminar movimiento?')) return;
        await expensesService.deleteMovement(id);
        loadData();
    };

    // Calculations
    const calculateBalance = (user?: string) => {
        return movements.reduce((acc, curr) => {
            if (user && curr.owner !== user) return acc;
            return curr.type === 'INGRESO' ? acc + curr.amount : acc - curr.amount;
        }, 0);
    };

    const totalBalance = calculateBalance();
    const sebaBalance = calculateBalance('Sebastian');
    const santiBalance = calculateBalance('Santiago');

    const formatMoney = (val: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);
    };

    return (
        <Container>
            <Header>
                <h1><FaMoneyBillWave color="#38b2ac" /> Control de Gastos</h1>
            </Header>

            <Grid>
                <BalanceCard>
                    <h2>Saldo Chakra Total</h2>
                    <p className="balance" style={{ color: totalBalance >= 0 ? '#2f855a' : '#c53030' }}>
                        {formatMoney(totalBalance)}
                    </p>
                    <div className="sub-balances">
                        <span>Saldo Sebastian: <strong>{formatMoney(sebaBalance)}</strong></span>
                        <span>Saldo Santiago: <strong>{formatMoney(santiBalance)}</strong></span>
                    </div>
                </BalanceCard>

                {/* Input Form */}
                <Card>
                    <h3 style={{ marginTop: 0 }}>Nuevo Movimiento</h3>
                    <Form>
                        <select value={type} onChange={e => setType(e.target.value as any)}>
                            <option value="EGRESO">EGRESO (Gasto)</option>
                            <option value="INGRESO">INGRESO (Aporte)</option>
                        </select>
                        <select value={owner} onChange={e => setOwner(e.target.value)}>
                            <option value="Sebastian">Sebastian</option>
                            <option value="Santiago">Santiago</option>
                            {/* Add 'Chakra' or others if needed */}
                        </select>
                        <input
                            placeholder="Concepto (ej: Fertilizante, Luz)"
                            value={concept}
                            onChange={e => setConcept(e.target.value)}
                        />
                        <input
                            type="number"
                            placeholder="Monto"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                        />
                        <button onClick={handleCreate}>Agregar Movimiento</button>
                    </Form>
                </Card>

                {/* List */}
                <TableContainer>
                    <h3 style={{ paddingLeft: '1rem', marginTop: '1rem' }}>Movimientos Recientes</h3>
                    {loading ? <p style={{ padding: '1rem' }}>Cargando...</p> : (
                        <Table>
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Fecha</th>
                                    <th>Concepto</th>
                                    <th>Responsable</th>
                                    <th>Monto</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {movements.map(m => (
                                    <tr key={m.id}>
                                        <td><span className={`type-badge ${m.type}`}>{m.type}</span></td>
                                        <td>{format(new Date(m.date), 'dd/MM/yyyy')}</td>
                                        <td>{m.concept}</td>
                                        <td>{m.owner}</td>
                                        <td style={{ fontWeight: 600, color: m.type === 'INGRESO' ? '#38a169' : '#e53e3e' }}>
                                            {m.type === 'INGRESO' ? '+' : '-'}{formatMoney(m.amount)}
                                        </td>
                                        <td>
                                            <button onClick={() => m.id && handleDelete(m.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#cbd5e0' }}>
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </TableContainer>
            </Grid>
        </Container>
    );
};

export default Expenses;
