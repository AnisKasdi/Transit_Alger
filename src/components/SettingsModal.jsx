// ============================================================================
// FICHIER: SettingsModal.jsx
// ROLE: Panneau de paramètres de l'application (Profil, Langue, Mode Sombre)
// ============================================================================

import React, { useState } from 'react';
import { X, User, Globe, Bell, Shield, Info, ChevronRight, Moon, LogOut } from 'lucide-react';

// Composant Principal
const SettingsModal = ({ isOpen, onClose, userProfile }) => {
    // Si la modale n'est pas ouverte, on ne retourne rien (pas d'affichage)
    if (!isOpen) return null;

    // --- ETATS LOCAUX (Mémoire du composant) ---
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(true); // Vrai par défaut car le thème est sombre
    const [language, setLanguage] = useState('fr');

    // --------------------------------------------------------
    // SOUS-COMPOSANT : Section (Un bloc de réglages avec titre)
    // --------------------------------------------------------
    const Section = ({ title, children }) => (
        <div style={{ marginBottom: '24px' }}>
            {/* Titre en majuscule gris */}
            <div style={{ color: '#8e8e93', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '8px' }}>
                {title}
            </div>
            {/* Le conteneur arrondi gris foncé */}
            <div style={{ background: '#1c1c1e', borderRadius: '12px', overflow: 'hidden' }}>
                {children}
            </div>
        </div>
    );

    // --------------------------------------------------------
    // SOUS-COMPOSANT : Item (Une ligne de réglage clickable)
    // --------------------------------------------------------
    const Item = ({ icon: Icon, label, value, type = 'arrow', onClick, isLast }) => (
        <div onClick={onClick} style={{
            display: 'flex', alignItems: 'center', padding: '16px',
            borderBottom: isLast ? 'none' : '1px solid #2c2c2e', // Pas de ligne séparatrice pour le dernier
            cursor: 'pointer', active: { background: '#2c2c2e' }
        }}>
            {/* Carré de l'icône */}
            <div style={{
                width: '32px', height: '32px', borderRadius: '8px', background: '#2c2c2e',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px'
            }}>
                <Icon size={18} color="#fff" />
            </div>
            {/* Texte Principal */}
            <div style={{ flex: 1, color: '#fff', fontSize: '16px', fontWeight: '500' }}>
                {label}
            </div>

            {/* Type 'arrow' : Affiche une flèche et une valeur optionnelle (ex: "Français >") */}
            {type === 'arrow' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {value && <span style={{ color: '#8e8e93', fontSize: '14px' }}>{value}</span>}
                    <ChevronRight size={16} color="#8e8e93" />
                </div>
            )}

            {/* Type 'toggle' : Affiche un interrupteur ON/OFF style iOS */}
            {type === 'toggle' && (
                <div style={{
                    width: '50px', height: '30px', background: value ? '#2ecc71' : '#3a3a3c',
                    borderRadius: '15px', position: 'relative', transition: 'background 0.3s'
                }}>
                    <div style={{
                        width: '26px', height: '26px', background: '#fff', borderRadius: '50%',
                        position: 'absolute', top: '2px', left: value ? '22px' : '2px', // Le rond bouge selon la valeur
                        transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                </div>
            )}
        </div>
    );

    // --------------------------------------------------------
    // RENDU PRINCIPAL
    // --------------------------------------------------------
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5000,
            background: '#000', animation: 'slideInLeft 0.3s', // Animation d'entrée
            display: 'flex', flexDirection: 'column'
        }}>
            {/* HEADER : Titre et Bouton Fermer */}
            <div style={{
                padding: '16px', paddingTop: '48px', display: 'flex', alignItems: 'center',
                background: 'rgba(28, 28, 30, 0.8)', backdropFilter: 'blur(20px)',
                borderBottom: '1px solid #2c2c2e'
            }}>
                <div onClick={onClose} style={{
                    background: '#2c2c2e', width: '36px', height: '36px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginRight: '16px'
                }}>
                    <X color="#fff" size={20} />
                </div>
                <div style={{ color: '#fff', fontSize: '20px', fontWeight: '700' }}>Paramètres</div>
            </div>

            {/* CONTENU DÉFILANT */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

                {/* Carte de Profil en haut */}
                <div style={{
                    display: 'flex', alignItems: 'center', marginBottom: '32px',
                    background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)', // Dégradé vert
                    padding: '20px', borderRadius: '20px', boxShadow: '0 8px 24px rgba(46, 204, 113, 0.25)'
                }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.3)',
                        marginRight: '16px', overflow: 'hidden', background: '#fff'
                    }}>
                        {userProfile?.avatar ? (
                            <img src={userProfile.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#bdc3c7' }}>
                                <User size={32} color="#fff" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div style={{ color: '#fff', fontSize: '20px', fontWeight: '800' }}>{userProfile?.name || 'Utilisateur'}</div>
                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Modifier le profil</div>
                    </div>
                </div>

                {/* Section Préférences */}
                <Section title="Préférences">
                    <Item
                        icon={Globe}
                        label="Langue"
                        value={language === 'fr' ? 'Français' : 'Arab'}
                        onClick={() => setLanguage(language === 'fr' ? 'ar' : 'fr')}
                    />
                    <Item
                        icon={Moon}
                        label="Mode Sombre"
                        type="toggle"
                        value={darkMode}
                        onClick={() => setDarkMode(!darkMode)}
                    />
                    <Item
                        icon={Bell}
                        label="Notifications"
                        type="toggle"
                        value={notifications}
                        onClick={() => setNotifications(!notifications)}
                        isLast
                    />
                </Section>

                {/* Section Infos légales */}
                <Section title="Support & Légal">
                    <Item icon={Shield} label="Politique de confidentialité" />
                    <Item icon={Info} label="À propos de Transit Alger" value="v1.0.2" isLast />
                </Section>

                {/* Bouton Déconnexion */}
                <div style={{ marginTop: '32px' }}>
                    <button style={{
                        width: '100%', padding: '16px', background: 'rgba(231, 76, 60, 0.1)',
                        color: '#e74c3c', border: 'none', borderRadius: '12px',
                        fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}>
                        <LogOut size={20} />
                        Déconnexion
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SettingsModal;

