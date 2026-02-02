import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { patientsService, Patient } from '../services/patientsService';
import { usersService, Profile } from '../services/usersService';
import { ConfirmModal } from '../components/ConfirmModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { FaUserPlus, FaIdCard, FaEdit, FaSearch, FaFileUpload, FaCheckCircle, FaExclamationCircle, FaFileAlt } from 'react-icons/fa';

// Styled Components
const PageContainer = styled.div`
  padding: 1rem;
  max-width: 1400px; 
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: #319795;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    background: #2c7a7b;
    transform: translateY(-1px);
  }

  &:disabled {
      background: #a0aec0;
      cursor: not-allowed;
      transform: none;
  }
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const PatientCard = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
`;

const StatusBadge = styled.span<{ status: string }>`
  background: ${props =>
        props.status === 'active' ? '#c6f6d5' :
            props.status === 'expired' ? '#fed7d7' :
                props.status === 'pending' ? '#ffebee' : '#edf2f7'};
  color: ${props =>
        props.status === 'active' ? '#22543d' :
            props.status === 'expired' ? '#822727' :
                props.status === 'pending' ? '#c53030' : '#4a5568'};
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  margin-bottom: 1.5rem;
`;

// Modal Styles
const Modal = styled.div<{ isOpen: boolean }>`
  display: ${props => props.isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  width: 100%;
  max-width: 800px; /* Wider for full form */
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #4a5568;
    font-size: 0.9rem;
  }
  
  input, select, textarea {
    width: 100%;
    padding: 0.6rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    font-size: 0.95rem;
  }
`;

const FormRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;

    @media (max-width: 600px) {
        grid-template-columns: 1fr;
    }
`;

const SectionHeader = styled.h3`
    font-size: 1.1rem;
    color: #2d3748;
    margin-top: 1.5rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 0.5rem;
`;

const FileUploadBox = styled.div`
    border: 2px dashed #cbd5e0;
    border-radius: 0.5rem;
    padding: 1.5rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: #f7fafc;

    &:hover {
        border-color: #319795;
        background: #e6fffa;
    }

    input {
        display: none;
    }
`;

const Patients: React.FC = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Edit Patient State
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    // Confirm Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDanger: false
    });

    // Form Data
    const [users, setUsers] = useState<Profile[]>([]); // Candidates

    // Registration Form State
    const [regForm, setRegForm] = useState({
        fullName: '',
        email: '',
        reprocannNumber: '',
        reprocannStatus: 'pending',
        expirationDate: '',
        issueDate: '',
        documentNumber: '',
        phone: '',
        address: '',
        notes: ''
    });

    // File States
    const [files, setFiles] = useState<{
        reprocann?: File,
        affidavit?: File,
        consent?: File
    }>({});

    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        const patientsData = await patientsService.getPatients();
        setPatients(patientsData);

        const usersData = await usersService.getUsers();
        setUsers(usersData);

        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleFileChange = (type: 'reprocann' | 'affidavit' | 'consent', e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFiles(prev => ({ ...prev, [type]: e.target.files![0] }));
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);
        try {
            // New Flow: Register User + Patient
            // 1. Files will be uploaded after we get the ID? 
            // OR we upload to a temp folder?
            // Wait, patientsService.registerNewPatient does NOT return the ID immediately in a clean way unless we modify it to handle uploads internally OR we upload after creation.
            // But to upload we need the userId for the folder path...
            // "reprocann/${regForm.userId}" <- We don't have userId yet!

            // Strategy: Register User First (get ID), Then Upload, Then Update/Create Patient?
            // Actually `registerNewPatient` returns the Patient object (which has ID).
            // But we need to pass the file URLs to it.

            // Let's modify registerNewPatient to accept files? Or just do it here:
            // We can't upload files BEFORE we have the user ID if we want organized folders.
            // But we can upload to "temp" and move? No.

            // BETTER: 
            // 1. Call separate method to create User only? No, we encapsulated it.
            // 2. Let's create the User/Patient with NO files first.
            // 3. Then upload files using the returned ID.
            // 4. Then update the patient record with file URLs.

            // Let's go with step 2-4.

            const userData = { email: regForm.email, fullName: regForm.fullName };
            const initialPatientData: Partial<Patient> = {
                reprocann_number: regForm.reprocannNumber,
                reprocann_status: 'pending',
                expiration_date: regForm.expirationDate,
                reprocann_issue_date: regForm.issueDate,
                document_number: regForm.documentNumber,
                phone: regForm.phone,
                address: regForm.address,
                notes: regForm.notes,
                monthly_limit: 40
            };

            const createdPatient = await patientsService.registerNewPatient(initialPatientData, userData);

            if (!createdPatient || !createdPatient.profile_id) {
                throw new Error("Failed to create patient");
            }

            const newUserId = createdPatient.profile_id;
            const patientId = createdPatient.id;

            // 2. Upload Files using the new User ID
            let urlReprocann = null;
            let urlAffidavit = null;
            let urlConsent = null;

            if (files.reprocann) {
                urlReprocann = await patientsService.uploadDocument(files.reprocann, `reprocann/${newUserId}`);
            }
            if (files.affidavit) {
                urlAffidavit = await patientsService.uploadDocument(files.affidavit, `affidavit/${newUserId}`);
            }
            if (files.consent) {
                urlConsent = await patientsService.uploadDocument(files.consent, `consent/${newUserId}`);
            }

            // 3. Update Patient with URLs if any file was uploaded
            if (urlReprocann || urlAffidavit || urlConsent) {
                await patientsService.upsertPatient({
                    id: patientId,
                    file_reprocann_url: urlReprocann || undefined,
                    file_affidavit_url: urlAffidavit || undefined,
                    file_consent_url: urlConsent || undefined,
                });
            }

            setIsAddOpen(false);
            resetForm();
            loadData();
            alert("Socio registrado exitosamente.");

        } catch (error: any) {
            console.error("Error registering patient:", error);
            alert("Error al registrar socio: " + (error.message || 'Check console'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setRegForm({
            fullName: '',
            email: '',
            reprocannNumber: '',
            reprocannStatus: 'pending',
            expirationDate: '',
            issueDate: '',
            documentNumber: '',
            phone: '',
            address: '',
            notes: ''
        });
        setFiles({});
    };

    const openEdit = (patient: Patient) => {
        setSelectedPatient(patient);
        setIsEditOpen(true);
    };

    const handleUpdatePatient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient) return;

        try {
            await patientsService.upsertPatient(selectedPatient);
            alert("Socio actualizado exitosamente.");
            setIsEditOpen(false);
            loadData();
        } catch (error) {
            console.error("Error updating patient:", error);
            alert("Error al actualizar socio.");
        }
    };

    const filteredPatients = patients.filter(p =>
        p.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.reprocann_number?.includes(searchTerm)
    );

    return (
        <PageContainer>
            <Header>
                <Title><FaIdCard /> Gestión de Socios</Title>
                <ActionButton onClick={() => setIsAddOpen(true)}>
                    <FaUserPlus /> Nuevo Socio
                </ActionButton>
            </Header>

            <SearchInput
                placeholder="Buscar por nombre o reprocann..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />

            {isLoading ? (
                <LoadingSpinner text="Cargando socios..." />
            ) : (
                <CardGrid>
                    {filteredPatients.map(patient => (
                        <PatientCard key={patient.id} onClick={() => openEdit(patient)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <StatusBadge status={patient.reprocann_status}>
                                    {patient.reprocann_status === 'active' ? 'Activo' :
                                        patient.reprocann_status === 'expired' ? 'Vencido' : 'Pendiente'}
                                </StatusBadge>
                                <span style={{ fontSize: '0.8rem', color: '#718096' }}>Límite Mensual: {patient.monthly_limit}g</span>
                            </div>
                            <h3 style={{ margin: '0 0 0.25rem 0' }}>{patient.profile?.full_name || 'Sin Nombre'}</h3>
                            <p style={{ color: '#718096', fontSize: '0.9rem', margin: 0 }}>
                                {patient.reprocann_number || 'Sin Reprocann'}
                            </p>
                            {/* Show extra info if available */}
                            {patient.document_number && <p style={{ fontSize: '0.8rem', color: '#a0aec0' }}>DNI: {patient.document_number}</p>}
                            {patient.expiration_date && (
                                <small style={{ color: new Date(patient.expiration_date) < new Date() ? 'red' : 'green', display: 'block', marginTop: '0.5rem' }}>
                                    Vence: {patient.expiration_date}
                                </small>
                            )}
                        </PatientCard>
                    ))}
                </CardGrid>
            )}

            {/* Modal: Add Patient (Registration) */}
            <Modal isOpen={isAddOpen}>
                <ModalContent>
                    <h2 style={{ marginBottom: '1.5rem' }}>📄 Vinculación de Nuevo Socio</h2>
                    <form onSubmit={handleRegister}>

                        <SectionHeader>Datos Personales</SectionHeader>

                        <FormGroup>
                            <label>Nombre Completo</label>
                            <input
                                value={regForm.fullName}
                                onChange={e => setRegForm({ ...regForm, fullName: e.target.value })}
                                placeholder="Nombre y Apellido"
                                required
                            />
                        </FormGroup>

                        <FormGroup>
                            <label>Email</label>
                            <input
                                type="email"
                                value={regForm.email}
                                onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                                placeholder="email@ejemplo.com"
                                required
                            />
                        </FormGroup>

                        <FormRow>
                            <FormGroup>
                                <label>DNI / Documento</label>
                                <input
                                    value={regForm.documentNumber}
                                    onChange={e => setRegForm({ ...regForm, documentNumber: e.target.value })}
                                    placeholder="Número de documento"
                                    required
                                />
                            </FormGroup>
                            <FormGroup>
                                <label>Teléfono</label>
                                <input
                                    value={regForm.phone}
                                    onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                                    placeholder="+54 9 ..."
                                />
                            </FormGroup>
                        </FormRow>
                        <FormGroup>
                            <label>Dirección</label>
                            <input
                                value={regForm.address}
                                onChange={e => setRegForm({ ...regForm, address: e.target.value })}
                                placeholder="Calle, Altura, Localidad"
                            />
                        </FormGroup>

                        <SectionHeader>Datos REPROCANN</SectionHeader>
                        <FormGroup>
                            <label>Código de Vinculación / Número de Trámite</label>
                            <input
                                value={regForm.reprocannNumber}
                                onChange={e => setRegForm({ ...regForm, reprocannNumber: e.target.value })}
                                placeholder="XXXX-XXXX-XXXX"
                                required
                            />
                        </FormGroup>
                        <FormRow>
                            <FormGroup>
                                <label>Fecha Emisión</label>
                                <input
                                    type="date"
                                    value={regForm.issueDate}
                                    onChange={e => setRegForm({ ...regForm, issueDate: e.target.value })}
                                    required
                                />
                            </FormGroup>
                            <FormGroup>
                                <label>Fecha Vencimiento</label>
                                <input
                                    type="date"
                                    value={regForm.expirationDate}
                                    onChange={e => setRegForm({ ...regForm, expirationDate: e.target.value })}
                                    required
                                />
                            </FormGroup>
                        </FormRow>

                        <SectionHeader>Documentación (Adjuntos)</SectionHeader>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <FormGroup>
                                <label>Credencial REPROCANN</label>
                                <FileUploadBox onClick={() => document.getElementById('file-reprocann')?.click()}>
                                    {files.reprocann ? <FaCheckCircle color="green" size={24} /> : <FaFileUpload size={24} color="#a0aec0" />}
                                    <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                        {files.reprocann ? files.reprocann.name : 'Subir Credencial'}
                                    </p>
                                    <input id="file-reprocann" type="file" onChange={e => handleFileChange('reprocann', e)} accept="image/*,.pdf" />
                                </FileUploadBox>
                            </FormGroup>

                            <FormGroup>
                                <label>Declaración Jurada</label>
                                <FileUploadBox onClick={() => document.getElementById('file-affidavit')?.click()}>
                                    {files.affidavit ? <FaCheckCircle color="green" size={24} /> : <FaFileUpload size={24} color="#a0aec0" />}
                                    <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                        {files.affidavit ? files.affidavit.name : 'Subir DDJJ'}
                                    </p>
                                    <input id="file-affidavit" type="file" onChange={e => handleFileChange('affidavit', e)} accept=".pdf,image/*" />
                                </FileUploadBox>
                            </FormGroup>

                            <FormGroup>
                                <label>Consentimiento Bilateral</label>
                                <FileUploadBox onClick={() => document.getElementById('file-consent')?.click()}>
                                    {files.consent ? <FaCheckCircle color="green" size={24} /> : <FaFileUpload size={24} color="#a0aec0" />}
                                    <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                        {files.consent ? files.consent.name : 'Subir Consentimiento'}
                                    </p>
                                    <input id="file-consent" type="file" onChange={e => handleFileChange('consent', e)} accept=".pdf,image/*" />
                                </FileUploadBox>
                            </FormGroup>
                        </div>

                        <FormGroup style={{ marginTop: '1rem' }}>
                            <label>Notas Adicionales</label>
                            <textarea
                                value={regForm.notes}
                                onChange={e => setRegForm({ ...regForm, notes: e.target.value })}
                                placeholder="Observaciones sobre documentación o paciente..."
                            />
                        </FormGroup>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                            <ActionButton type="button" style={{ background: '#718096' }} onClick={() => { setIsAddOpen(false); resetForm(); }}>Cancelar</ActionButton>
                            <ActionButton type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Guardando...' : 'Registrar Socio'}
                            </ActionButton>
                        </div>
                    </form>
                </ModalContent>
            </Modal>

            {/* Modal: View/Edit Patient Details */}
            <Modal isOpen={isEditOpen}>
                <ModalContent>
                    {selectedPatient && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                                <div>
                                    <h2 style={{ margin: 0 }}>{selectedPatient.profile?.full_name}</h2>
                                    <span style={{ fontSize: '0.9rem', color: '#718096' }}>{selectedPatient.profile?.email}</span>
                                </div>
                                <StatusBadge status={selectedPatient.reprocann_status} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                                    {selectedPatient.reprocann_status.toUpperCase()}
                                </StatusBadge>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div>
                                    <SectionHeader style={{ marginTop: 0 }}>Datos Personales</SectionHeader>
                                    <p><strong>DNI:</strong> {selectedPatient.document_number || '-'}</p>
                                    <p><strong>Teléfono:</strong> {selectedPatient.phone || '-'}</p>
                                    <p><strong>Dirección:</strong> {selectedPatient.address || '-'}</p>
                                    <p><strong>Límite Mensual:</strong> {selectedPatient.monthly_limit}g</p>
                                </div>
                                <div>
                                    <SectionHeader style={{ marginTop: 0 }}>Datos REPROCANN</SectionHeader>
                                    <p><strong>Código:</strong> {selectedPatient.reprocann_number}</p>
                                    <p><strong>Emisión:</strong> {selectedPatient.reprocann_issue_date || '-'}</p>
                                    <p><strong>Vencimiento:</strong> <span style={{ color: new Date(selectedPatient.expiration_date!) < new Date() ? 'red' : 'inherit' }}>{selectedPatient.expiration_date}</span></p>
                                </div>
                            </div>

                            <SectionHeader>Documentación</SectionHeader>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                {selectedPatient.file_reprocann_url ? (
                                    <ActionButton as="a" href={selectedPatient.file_reprocann_url} target="_blank" style={{ background: '#4299e1', fontSize: '0.9rem' }}>
                                        <FaFileAlt /> Ver Credencial
                                    </ActionButton>
                                ) : <span style={{ color: '#a0aec0' }}>Sin Credencial</span>}

                                {selectedPatient.file_affidavit_url ? (
                                    <ActionButton as="a" href={selectedPatient.file_affidavit_url} target="_blank" style={{ background: '#4299e1', fontSize: '0.9rem' }}>
                                        <FaFileAlt /> Ver DDJJ
                                    </ActionButton>
                                ) : <span style={{ color: '#a0aec0' }}>Sin DDJJ</span>}

                                {selectedPatient.file_consent_url ? (
                                    <ActionButton as="a" href={selectedPatient.file_consent_url} target="_blank" style={{ background: '#4299e1', fontSize: '0.9rem' }}>
                                        <FaFileAlt /> Ver Consentimiento
                                    </ActionButton>
                                ) : <span style={{ color: '#a0aec0' }}>Sin Consentimiento</span>}
                            </div>

                            <SectionHeader>Gestión de Estado</SectionHeader>

                            {selectedPatient.reprocann_status === 'pending' && (
                                <div style={{ background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c5282' }}>ℹ️ Acción Requerida</h4>
                                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#4a5568' }}>
                                        Este socio está pendiente. Si la documentación es correcta, apruébalo para habilitar su cuenta.
                                    </p>
                                    <ActionButton
                                        type="button"
                                        style={{ width: '100%', justifyContent: 'center', background: '#48bb78' }}
                                        onClick={() => {
                                            setConfirmModal({
                                                isOpen: true,
                                                title: 'Aprobar Socio',
                                                message: `¿Estás seguro de que deseas aprobar y habilitar a ${selectedPatient.profile?.full_name}? Esto activará su cuenta inmediatamente.`,
                                                onConfirm: async () => {
                                                    try {
                                                        await patientsService.upsertPatient({ ...selectedPatient, reprocann_status: 'active' });
                                                        // alert("✅ Socio aprobado correctamente."); // Optional: Toast notification instead?
                                                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                                        setIsEditOpen(false);
                                                        loadData();
                                                    } catch (error) {
                                                        console.error(error);
                                                        alert("Error al aprobar.");
                                                    }
                                                },
                                                isDanger: false
                                            });
                                        }}
                                    >
                                        <FaCheckCircle /> APROBAR Y HABILITAR SOCIO
                                    </ActionButton>
                                </div>
                            )}

                            <SectionHeader>Edición Manual</SectionHeader>
                            <form onSubmit={handleUpdatePatient}>
                                <FormGroup>
                                    <label>Cambiar Estado</label>
                                    <select
                                        value={selectedPatient.reprocann_status}
                                        onChange={e => setSelectedPatient({ ...selectedPatient, reprocann_status: e.target.value as any })}
                                    >
                                        <option value="pending">Pendiente de Revisión</option>
                                        <option value="active">Activo (Habilitado)</option>
                                        <option value="expired">Vencido</option>
                                        <option value="rejected">Rechazado</option>
                                    </select>
                                </FormGroup>
                                <FormGroup>
                                    <label>Actualizar Límite (g)</label>
                                    <input
                                        type="number"
                                        value={selectedPatient.monthly_limit}
                                        onChange={e => setSelectedPatient({ ...selectedPatient, monthly_limit: Number(e.target.value) })}
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <label>Notas Internas</label>
                                    <textarea
                                        value={selectedPatient.notes || ''}
                                        onChange={e => setSelectedPatient({ ...selectedPatient, notes: e.target.value })}
                                        rows={2}
                                    />
                                </FormGroup>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <ActionButton
                                        type="button"
                                        style={{ background: '#e53e3e', fontSize: '0.85rem' }}
                                        onClick={() => {
                                            setConfirmModal({
                                                isOpen: true,
                                                title: 'Eliminar Socio',
                                                message: `¿Estás seguro de que deseas eliminar a ${selectedPatient.profile?.full_name}? Esta acción es irreversible.`,
                                                onConfirm: async () => {
                                                    try {
                                                        await patientsService.deletePatient(selectedPatient.id);
                                                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                                        setIsEditOpen(false);
                                                        loadData();
                                                    } catch (error) {
                                                        console.error(error);
                                                        alert("Error al eliminar.");
                                                    }
                                                },
                                                isDanger: true
                                            });
                                        }}
                                    >
                                        Eliminar Paciente
                                    </ActionButton>

                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <ActionButton type="button" style={{ background: '#718096' }} onClick={() => setIsEditOpen(false)}>Cerrar</ActionButton>
                                        <ActionButton type="submit">Guardar Cambios</ActionButton>
                                    </div>
                                </div>
                            </form>
                        </>
                    )}
                </ModalContent>
            </Modal>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                confirmText="Sí, Aprobar"
                cancelText="Cancelar"
                isDanger={confirmModal.isDanger}
            />
        </PageContainer>
    );
};

export default Patients;
