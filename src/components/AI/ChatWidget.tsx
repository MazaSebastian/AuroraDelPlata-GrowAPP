import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { FaRobot, FaTimes, FaPaperPlane, FaLeaf, FaPaperclip, FaTrash, FaImage } from 'react-icons/fa'; // Updated icons
import { aiService, ChatMessage } from '../../services/aiService';
// import ReactMarkdown from 'react-markdown'; // DISABLED FOR DEBUGGING

// Using FaRobot as a generic bot icon, but we can use something more specific like FaLeaf for "Grower" vibe.

export const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', content: "Hola, soy tu Master Grower virtual. 🌱 ¿En qué puedo ayudarte hoy?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        console.log("ChatWidget Mounted");
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log("File input changed");
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            console.log("File selected:", file.name);

            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                console.log("File read successfully, setting state. Length:", result.length);
                setSelectedImage(result);
            };
            reader.onerror = (err) => {
                console.error("Error reading file:", err);
            };
            reader.readAsDataURL(file);

            // Clear the input value to allow selecting the same file again if needed
            e.target.value = '';
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSend = async () => {
        if ((!input.trim() && !selectedImage) || isLoading) return;

        // Optimistically add user message
        const userMsg: ChatMessage = {
            role: 'user',
            content: input,
            image: selectedImage || undefined
        };

        setMessages(prev => [...prev, userMsg]);

        const textToSend = input;
        const imageToSend = selectedImage;

        setInput('');
        setSelectedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Ensure clear
        setIsLoading(true);

        try {
            const reply = await aiService.sendMessage(textToSend, messages, imageToSend || undefined);
            setMessages(prev => [...prev, { role: 'model', content: reply }]);
        } catch (error) {
            console.error("Send error:", error);
            setMessages(prev => [...prev, { role: 'model', content: "⚠️ Hubo un error al conectar con el cerebro del cultivo. Intenta de nuevo." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <Wrapper>
            {/* Chat Window */}
            {isOpen && (
                <ChatWindow>
                    <Header>
                        <HeaderTitle>
                            <FaLeaf /> Master Grower AI
                        </HeaderTitle>
                        <CloseButton onClick={() => setIsOpen(false)}><FaTimes /></CloseButton>
                    </Header>

                    <MessagesArea>
                        {messages.map((msg, index) => (
                            <MessageBubble key={index} $isUser={msg.role === 'user'}>
                                {msg.role === 'model' && <BotIcon><FaRobot /></BotIcon>}
                                <BubbleContent $isUser={msg.role === 'user'}>
                                    {msg.image && <SentImage src={msg.image} alt="User upload" />}
                                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                                </BubbleContent>
                            </MessageBubble>
                        ))}
                        {isLoading && (
                            <LoadingIndicator>
                                <span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
                            </LoadingIndicator>
                        )}
                        <div ref={messagesEndRef} />
                    </MessagesArea>

                    {/* Image Preview Area */}
                    {selectedImage && (
                        <PreviewArea>
                            <PreviewImage src={selectedImage} alt="Preview" />
                            <RemoveImageButton onClick={handleRemoveImage}>
                                <FaTimes size={12} />
                            </RemoveImageButton>
                        </PreviewArea>
                    )}

                    <InputArea>
                        <HiddenInput
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                        />
                        <AttachButton type="button" onClick={() => fileInputRef.current?.click()} title="Adjuntar imagen">
                            <FaPaperclip />
                        </AttachButton>
                        <TextArea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder={selectedImage ? "Describe la imagen..." : "Pregunta sobre tu cultivo..."}
                            rows={1}
                        />
                        <SendButton onClick={handleSend} disabled={(!input.trim() && !selectedImage) || isLoading}>
                            <FaPaperPlane />
                        </SendButton>
                    </InputArea>
                </ChatWindow>
            )}

            {/* Floating Button */}
            <FloatingButton onClick={() => setIsOpen(!isOpen)} $isOpen={isOpen}>
                {isOpen ? <FaTimes size={20} /> : <FaRobot size={24} />}
            </FloatingButton>
        </Wrapper>
    );
};

// Styles

const pulse = keyframes`
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(72, 187, 120, 0.7); }
    70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(72, 187, 120, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(72, 187, 120, 0); }
`;

const Wrapper = styled.div`
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
`;

const FloatingButton = styled.button<{ $isOpen: boolean }>`
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #38a169;
    color: white;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    
    &:hover {
        transform: scale(1.1);
        background: #2f855a;
    }

    ${props => !props.$isOpen && css`animation: ${pulse} 3s infinite;`}
`;

const ChatWindow = styled.div`
    width: 350px;
    height: 500px;
    max-height: 80vh;
    background: white;
    border-radius: 1rem;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transform-origin: bottom right;
    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

    @keyframes popIn {
        from { opacity: 0; transform: scale(0.8); }
        to { opacity: 1; transform: scale(1); }
    }
`;

const Header = styled.div`
    background: #38a169;
    color: white;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #2f855a;
`;

const HeaderTitle = styled.h4`
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    opacity: 0.8;
    &:hover { opacity: 1; }
`;

const MessagesArea = styled.div`
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
    background: #f7fafc;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    /* Scrollbar styling */
    &::-webkit-scrollbar { width: 6px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 3px; }
`;

const MessageBubble = styled.div<{ $isUser: boolean }>`
    display: flex;
    gap: 0.5rem;
    align-items: flex-end;
    flex-direction: ${props => props.$isUser ? 'row-reverse' : 'row'};
    align-self: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
    max-width: 85%;
`;

const BotIcon = styled.div`
    width: 28px;
    height: 28px;
    background: #e2e8f0;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #4a5568;
    font-size: 0.8rem;
    flex-shrink: 0;
`;

const BubbleContent = styled.div<{ $isUser: boolean }>`
    background: ${props => props.$isUser ? '#38a169' : 'white'};
    color: ${props => props.$isUser ? 'white' : '#2d3748'};
    padding: 0.75rem 1rem;
    border-radius: 1rem;
    border-bottom-right-radius: ${props => props.$isUser ? '0.25rem' : '1rem'};
    border-bottom-left-radius: ${props => props.$isUser ? '1rem' : '0.25rem'};
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    font-size: 0.95rem;
    line-height: 1.5;

    p { margin: 0; }
    ul, ol { margin: 0.5rem 0; padding-left: 1.2rem; }
    code { background: rgba(0,0,0,0.1); padding: 0.1rem 0.3rem; border-radius: 0.25rem; }
`;

const SentImage = styled.img`
    max-width: 100%;
    max-height: 200px;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
    display: block;
`;

const LoadingIndicator = styled.div`
    color: #a0aec0;
    font-size: 1.5rem;
    padding-left: 1rem;
    .dot { animation: blink 1.4s infinite both; }
    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes blink {
        0% { opacity: 0.2; }
        20% { opacity: 1; }
        100% { opacity: 0.2; }
    }
`;

const InputArea = styled.div`
    padding: 0.75rem;
    background: white;
    border-top: 1px solid #e2e8f0;
    display: flex;
    gap: 0.5rem;
    align-items: center;
`;

const TextArea = styled.textarea`
    flex: 1;
    border: 1px solid #e2e8f0;
    border-radius: 1.5rem;
    padding: 0.6rem 1rem;
    font-family: inherit;
    font-size: 0.95rem;
    resize: none;
    outline: none;
    background: #f7fafc;
    &:focus { border-color: #38a169; background: white; }
`;

const SendButton = styled.button`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #38a169;
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: transform 0.1s;
    
    &:hover:not(:disabled) { transform: scale(1.05); }
    &:disabled { background: #cbd5e0; cursor: default; }
`;

const HiddenInput = styled.input`
    display: none;
`;

const AttachButton = styled.button`
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #edf2f7;
    color: #4a5568;
    border: none;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background 0.2s;
    
    &:hover { background: #e2e8f0; color: #2d3748; }
`;

const PreviewArea = styled.div`
    padding: 0.5rem 1rem;
    background: white;
    border-top: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    animation: fadeIn 0.2s;
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`;

const PreviewImage = styled.img`
    height: 60px;
    width: auto;
    border-radius: 0.5rem;
    border: 1px solid #cbd5e0;
`;

const RemoveImageButton = styled.button`
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fc8181;
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: -10px;
    margin-top: -40px; /* Position vaguely top right of image */
    
    &:hover { background: #f56565; }
`;
