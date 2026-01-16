// ============================================================================
// FICHIER: WinekModal.jsx
// ROLE: Tableau de bord social "Winek" (Où est-tu ?)
// Fonctionnalité de partage de position en temps réel entre amis.
// ============================================================================

import React, { useState } from 'react';
import { X, Share2, Users, MapPin, Eye, EyeOff, Plus } from 'lucide-react';

const WinekModal = ({ isOpen, onClose, sharingEnabled, setSharingEnabled }) => {
    // Si pas ouvert, on n'affiche rien du tout
    if (!isOpen) return null;

    // A l'avenir, on pourrait avoir des onglets (Amis / Demandes)
    const [activeTab, setActiveTab] = useState('friends');

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 4000,
            background: '#111', display: 'flex', flexDirection: 'column',
            animation: 'slideInUp 0.3s' // Ça monte depuis le bas
        }}>
            {/* Header avec Dégradé */}
            <div style={{
                padding: '24px', paddingTop: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)'
            }}>
                <div>
                    {/* Gros Titre WINEK */}
                    <h1 style={{ margin: 0, color: '#2ecc71', fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>Winek.</h1>
                    <p style={{ margin: '4px 0 0', color: '#888', fontSize: '14px' }}>Localisation en temps réel</p>
                </div>
                {/* Bouton Fermer Rond */}
                <div onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}>
                    <X color="#fff" size={24} />
                </div>
            </div>

            {/* Contenu Défilant */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>

                {/* GROS BLOC STATUT (Activé / Désactivé) 
                    On change la couleur et l'ombre selon si le partage est activé.
                */}
                <div style={{
                    background: sharingEnabled
                        ? 'linear-gradient(135deg, rgba(46, 204, 113, 0.2) 0%, rgba(39, 174, 96, 0.1) 100%)' // Vert si activé
                        : '#1c1c1e', // Gris si éteint
                    border: `1px solid ${sharingEnabled ? '#2ecc71' : '#333'}`,
                    borderRadius: '24px', padding: '24px', marginBottom: '32px',
                    boxShadow: sharingEnabled ? '0 0 30px rgba(46, 204, 113, 0.15)' : 'none',
                    transition: 'all 0.3s ease'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                        {/* Icône Oeil */}
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: sharingEnabled ? '#2ecc71' : '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {sharingEnabled ? <Eye color="#fff" size={24} /> : <EyeOff color="#888" size={24} />}
                        </div>
                        {/* Toggle Switch */}
                        <div onClick={() => setSharingEnabled(!sharingEnabled)} style={{
                            width: '60px', height: '34px', background: sharingEnabled ? '#2ecc71' : '#333', borderRadius: '17px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
                        }}>
                            <div style={{
                                width: '28px', height: '28px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px',
                                left: sharingEnabled ? '29px' : '3px', transition: 'left 0.3s', boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                            }} />
                        </div>
                    </div>
                    <div style={{ color: '#fff', fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>
                        {sharingEnabled ? 'Vous êtes visible' : 'Mode Fantôme'}
                    </div>
                    <div style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.4' }}>
                        {sharingEnabled
                            ? 'Vos amis peuvent voir votre position actuelle et vos déplacements en direct.'
                            : 'Votre position est masquée. Activez pour partager votre trajet.'}
                    </div>
                </div>

                {/* BOUTONS ACTIONS RAPIDES (Grille de 2) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                    <div style={{ background: '#1c1c1e', padding: '16px', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(52, 152, 219, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Share2 size={20} color="#3498db" />
                        </div>
                        <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>Partager lien</span>
                    </div>
                    <div style={{ background: '#1c1c1e', padding: '16px', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(155, 89, 182, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Plus size={20} color="#9b59b6" />
                        </div>
                        <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>Ajouter ami</span>
                    </div>
                </div>

                {/* LISTE DES AMIS */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <div style={{ color: '#fff', fontWeight: '700', fontSize: '18px' }}>Amis (3)</div>
                        <div style={{ color: '#2ecc71', fontSize: '14px', fontWeight: '600' }}>Voir tout</div>
                    </div>

                    {[
                        { name: 'Yacine B.', status: 'En route vers 1er Mai', color: '#e67e22', time: '2 min', icon: 'Bus' },
                        { name: 'Amine K.', status: 'À proximité', color: '#2ecc71', time: 'Now', icon: 'Walk' },
                        { name: 'Sarah M.', status: 'Hors ligne', color: '#7f8c8d', time: '1h', icon: 'Off' }
                    ].map((friend, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', padding: '16px', background: '#1c1c1e',
                            borderRadius: '16px', marginBottom: '12px', border: '1px solid #2c2c2e'
                        }}>
                            {/* Avatar Ami (avec bordure statut) */}
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%', background: '#333',
                                marginRight: '16px', position: 'relative',
                                border: `2px solid ${friend.status === 'Hors ligne' ? 'transparent' : '#2ecc71'}`
                            }}>
                                {/* Mock Avatar (Couleur aléatoire) */}
                                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `hsl(${i * 60}, 70%, 50%)`, opacity: 0.5 }} />
                            </div>

                            {/* Infos Ami */}
                            <div style={{ flex: 1 }}>
                                <div style={{ color: '#fff', fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>{friend.name}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {friend.status !== 'Hors ligne' && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: friend.color }} />}
                                    <div style={{ color: '#888', fontSize: '13px' }}>{friend.status}</div>
                                </div>
                            </div>

                            {/* Bouton Localiser */}
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '12px', background: '#2c2c2e',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <MapPin size={18} color="#fff" />
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default WinekModal;

