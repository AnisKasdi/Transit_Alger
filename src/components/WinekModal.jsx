// ============================================================================
// FICHIER: WinekModal.jsx
// ROLE: Tableau de bord social "Winek" (Où est-tu ?)
// Fonctionnalité: Liste d'amis, Détails Profil, Chat, Ajout d'ami.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { X, Share2, Users, MapPin, Eye, EyeOff, Plus, MessageCircle, Ticket, Heart, ArrowLeft, Search, QrCode, Send } from 'lucide-react';

const WinekModal = ({ isOpen, onClose, sharingEnabled, setSharingEnabled }) => {
    if (!isOpen) return null;

    // --- ETATS ---
    const [view, setView] = useState('LIST'); // 'LIST', 'DETAILS', 'ADD', 'CHAT'
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([
        { sender: 'them', text: 'T\'es où ?' },
        { sender: 'me', text: 'J\'arrive dans 5 min !' }
    ]);

    // Données Mock Amis
    const friends = [
        { id: 1, name: 'Yacine B.', status: 'En route vers 1er Mai', color: '#e67e22', time: '2 min', avatarColor: '#e67e22' },
        { id: 2, name: 'Amine K.', status: 'À proximité', color: '#2ecc71', time: 'Now', avatarColor: '#2ecc71' },
        { id: 3, name: 'Sarah M.', status: 'Hors ligne', color: '#7f8c8d', time: '1h', avatarColor: '#9b59b6' }
    ];

    // --- HANDLERS ---
    const handleFriendClick = (friend) => {
        setSelectedFriend(friend);
        setView('DETAILS');
    };

    const handleBack = () => {
        if (view === 'CHAT') setView('DETAILS');
        else setView('LIST');
    };

    const handleSendMessage = () => {
        if (!chatMessage.trim()) return;
        setChatHistory([...chatHistory, { sender: 'me', text: chatMessage }]);
        setChatMessage('');
        // Mock réponse
        setTimeout(() => {
            setChatHistory(prev => [...prev, { sender: 'them', text: 'Ok ça marche !' }]);
        }, 1500);
    };

    // --- VUES ---

    // 1. LISTE DES AMIS
    const renderList = () => (
        <>
            {/* Statut Partage */}
            <div style={{
                background: sharingEnabled ? 'linear-gradient(135deg, rgba(46, 204, 113, 0.2) 0%, rgba(39, 174, 96, 0.1) 100%)' : '#1c1c1e',
                border: `1px solid ${sharingEnabled ? '#2ecc71' : '#333'}`,
                borderRadius: '24px', padding: '20px', marginBottom: '24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: sharingEnabled ? '#2ecc71' : '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {sharingEnabled ? <Eye color="#fff" size={20} /> : <EyeOff color="#888" size={20} />}
                    </div>
                    <div>
                        <div style={{ color: '#fff', fontWeight: '700' }}>{sharingEnabled ? 'Visible' : 'Fantôme'}</div>
                        <div style={{ color: '#aaa', fontSize: '12px' }}>{sharingEnabled ? 'Vos amis vous voient' : 'Position masquée'}</div>
                    </div>
                </div>
                <div onClick={() => setSharingEnabled(!sharingEnabled)} style={{
                    width: '50px', height: '30px', background: sharingEnabled ? '#2ecc71' : '#333', borderRadius: '15px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
                }}>
                    <div style={{
                        width: '26px', height: '26px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px',
                        left: sharingEnabled ? '22px' : '2px', transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                </div>
            </div>

            {/* Actions Rapides */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
                <div onClick={() => alert("Lien copié !")} style={{ background: '#1c1c1e', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <div style={{ padding: '8px', background: 'rgba(52, 152, 219, 0.2)', borderRadius: '50%' }}><Share2 size={18} color="#3498db" /></div>
                    <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>Partager</span>
                </div>
                <div onClick={() => setView('ADD')} style={{ background: '#1c1c1e', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <div style={{ padding: '8px', background: 'rgba(155, 89, 182, 0.2)', borderRadius: '50%' }}><Plus size={18} color="#9b59b6" /></div>
                    <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>Ajouter</span>
                </div>
            </div>

            {/* Liste */}
            <h3 style={{ color: '#fff', margin: '0 0 16px 0' }}>Amis proches</h3>
            {friends.map(friend => (
                <div key={friend.id} onClick={() => handleFriendClick(friend)} style={{
                    display: 'flex', alignItems: 'center', padding: '16px', background: '#1c1c1e', borderRadius: '16px', marginBottom: '12px', cursor: 'pointer'
                }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: friend.avatarColor, marginRight: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                        {friend.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ color: '#fff', fontWeight: '700' }}>{friend.name}</div>
                        <div style={{ color: '#888', fontSize: '13px' }}>{friend.status}</div>
                    </div>
                    {friend.status !== 'Hors ligne' && <MapPin size={20} color="#2ecc71" />}
                </div>
            ))}
        </>
    );

    // 2. DÉTAILS AMI
    const renderDetails = () => (
        <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: selectedFriend.avatarColor, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: '#fff', fontWeight: 'bold', border: '4px solid #1c1c1e' }}>
                    {selectedFriend.name.charAt(0)}
                </div>
                <h2 style={{ color: '#fff', margin: '0 0 4px 0' }}>{selectedFriend.name}</h2>
                <div style={{ color: '#2ecc71', fontSize: '14px', fontWeight: '500' }}>{selectedFriend.status}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div onClick={() => setView('CHAT')} style={{ background: '#1c1c1e', padding: '24px', borderRadius: '20px', textAlign: 'center', cursor: 'pointer' }}>
                    <MessageCircle size={32} color="#3498db" style={{ marginBottom: '12px' }} />
                    <div style={{ color: '#fff', fontWeight: '600' }}>Message</div>
                </div>
                <div onClick={() => alert(`Localisation de ${selectedFriend.name}...`)} style={{ background: '#1c1c1e', padding: '24px', borderRadius: '20px', textAlign: 'center', cursor: 'pointer' }}>
                    <MapPin size={32} color="#2ecc71" style={{ marginBottom: '12px' }} />
                    <div style={{ color: '#fff', fontWeight: '600' }}>Localiser</div>
                </div>
                <div onClick={() => alert("Ticket envoyé !")} style={{ background: '#1c1c1e', padding: '24px', borderRadius: '20px', textAlign: 'center', cursor: 'pointer' }}>
                    <Ticket size={32} color="#e67e22" style={{ marginBottom: '12px' }} />
                    <div style={{ color: '#fff', fontWeight: '600' }}>Envoyer Ticket</div>
                </div>
                <div onClick={() => alert("Poke envoyé !")} style={{ background: '#1c1c1e', padding: '24px', borderRadius: '20px', textAlign: 'center', cursor: 'pointer' }}>
                    <Heart size={32} color="#e74c3c" style={{ marginBottom: '12px' }} />
                    <div style={{ color: '#fff', fontWeight: '600' }}>Nudge</div>
                </div>
            </div>
        </>
    );

    // 3. CHAT MOCK
    const renderChat = () => (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
                {chatHistory.map((msg, i) => (
                    <div key={i} style={{
                        alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start',
                        background: msg.sender === 'me' ? '#2ecc71' : '#1c1c1e',
                        color: '#fff', padding: '10px 16px', borderRadius: '16px', marginBottom: '8px',
                        maxWidth: '80%', marginLeft: msg.sender === 'me' ? 'auto' : 0
                    }}>
                        {msg.text}
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', padding: '10px 0' }}>
                <input
                    value={chatMessage}
                    onChange={e => setChatMessage(e.target.value)}
                    placeholder="Message..."
                    style={{ flex: 1, background: '#1c1c1e', border: 'none', borderRadius: '20px', padding: '12px 16px', color: '#fff', outline: 'none' }}
                />
                <button onClick={handleSendMessage} style={{ background: '#2ecc71', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Send size={20} color="#fff" />
                </button>
            </div>
        </div>
    );

    // 4. AJOUTER AMI
    const renderAdd = () => (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 32px' }}>
                <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(46, 204, 113, 0.3)', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                <div style={{ position: 'absolute', inset: '20px', border: '2px solid rgba(46, 204, 113, 0.5)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Search size={48} color="#2ecc71" />
                </div>
            </div>
            <h3 style={{ color: '#fff' }}>Recherche à proximité...</h3>
            <p style={{ color: '#888', maxWidth: '280px', margin: '0 auto 32px' }}>Vos amis doivent aussi avoir ouvert cette page pour apparaître.</p>

            <button style={{ background: '#1c1c1e', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
                <QrCode size={20} /> Scanner un QR Code
            </button>
        </div>
    );

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 4000,
            background: '#000', display: 'flex', flexDirection: 'column',
            animation: 'slideInUp 0.3s'
        }}>
            {/* Header Commun */}
            <div style={{ padding: '20px', paddingTop: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1c1c1e' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {view !== 'LIST' && (
                        <div onClick={handleBack} style={{ padding: '8px', background: '#1c1c1e', borderRadius: '50%', cursor: 'pointer' }}>
                            <ArrowLeft size={20} color="#fff" />
                        </div>
                    )}
                    <h1 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: '700' }}>
                        {view === 'LIST' ? 'Winek.' : (view === 'ADD' ? 'Ajouter' : (view === 'CHAT' ? selectedFriend?.name : 'Profil'))}
                    </h1>
                </div>
                <div onClick={onClose} style={{ padding: '8px', background: '#1c1c1e', borderRadius: '50%', cursor: 'pointer' }}>
                    <X size={20} color="#fff" />
                </div>
            </div>

            {/* Contenu Variables */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                {view === 'LIST' && renderList()}
                {view === 'DETAILS' && renderDetails()}
                {view === 'ADD' && renderAdd()}
                {view === 'CHAT' && renderChat()}
            </div>
        </div>
    );
};

export default WinekModal;
