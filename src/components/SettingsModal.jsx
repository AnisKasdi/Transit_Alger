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
    const [view, setView] = useState('MAIN'); // 'MAIN', 'PRIVACY', 'PROFILE', 'EDIT_PROFILE'

    // Etat Profil (Simulé pour l'instant)
    const [profile, setProfile] = useState({
        name: userProfile?.name || 'Anis K.',
        level: 5,
        xp: 340,
        maxXp: 500,
        title: 'Voyageur Urbain',
        avatarId: 0,
        stats: { trips: 42, km: 158, co2: 12.5 }
    });

    // Mock Avatars (Couleurs pour l'instant, ou positions dans une sprite sheet)
    const avatars = [
        { id: 0, color: '#e67e22', icon: '👦' },
        { id: 1, color: '#2ecc71', icon: '👩' },
        { id: 2, color: '#3498db', icon: '🧔' },
        { id: 3, color: '#9b59b6', icon: '🧕' },
        { id: 4, color: '#f1c40f', icon: '👱' },
        { id: 5, color: '#e74c3c', icon: '👵' },
    ];

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
                <div onClick={() => { if (view === 'PRIVACY') setView('MAIN'); else onClose(); }} style={{
                    background: '#2c2c2e', width: '36px', height: '36px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginRight: '16px'
                }}>
                    {view === 'PRIVACY' ? <ChevronRight style={{ transform: 'rotate(180deg)' }} color="#fff" size={20} /> : <X color="#fff" size={20} />}
                </div>
                <div style={{ color: '#fff', fontSize: '20px', fontWeight: '700' }}>
                    {view === 'PRIVACY' ? 'Confidentialité' : (view === 'PROFILE' ? 'Mon Profil' : (view === 'EDIT_PROFILE' ? 'Modifier' : 'Paramètres'))}
                </div>
            </div>

            {/* CONTENU DÉFILANT */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

                {view === 'MAIN' ? (
                    <>
                        {/* Carte de Profil en haut */}
                        <div
                            onClick={() => setView('PROFILE')}
                            style={{
                                display: 'flex', alignItems: 'center', marginBottom: '32px',
                                background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                                padding: '20px', borderRadius: '20px', boxShadow: '0 8px 24px rgba(46, 204, 113, 0.25)',
                                cursor: 'pointer', position: 'relative', overflow: 'hidden'
                            }}>
                            {/* Effet de brillance */}
                            <div style={{ position: 'absolute', top: -50, right: -50, width: 100, height: 100, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />

                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.3)',
                                marginRight: '16px', overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px'
                            }}>
                                {avatars[profile.avatarId].icon}
                            </div>
                            <div>
                                <div style={{ color: '#fff', fontSize: '20px', fontWeight: '800' }}>{profile.name}</div>
                                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '500' }}>Niveau {profile.level} • {profile.title}</div>
                            </div>
                            <div style={{ marginLeft: 'auto', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '50%' }}>
                                <ChevronRight size={20} color="#fff" />
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
                            <Item icon={Shield} label="Politique de confidentialité" onClick={() => setView('PRIVACY')} />
                            <Item icon={Info} label="À propos de Transit Alger" value="v1.0.2" onClick={() => alert("Transit Alger v1.0.2\nDéveloppé avec ❤️")} isLast />
                        </Section>

                        {/* Bouton Déconnexion */}
                        <div style={{ marginTop: '32px' }}>
                            <button
                                onClick={() => { if (confirm("Voulez-vous vraiment vous déconnecter ?")) window.location.reload(); }}
                                style={{
                                    width: '100%', padding: '16px', background: 'rgba(231, 76, 60, 0.1)',
                                    color: '#e74c3c', border: 'none', borderRadius: '12px',
                                    fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    cursor: 'pointer'
                                }}>
                                <LogOut size={20} />
                                Déconnexion
                            </button>
                        </div>
                    </>
                ) : view === 'PROFILE' ? (
                    <>
                        {/* Header Profil */}
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <div style={{
                                width: '100px', height: '100px', borderRadius: '50%', background: '#fff',
                                margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px',
                                border: '4px solid #2ecc71', boxShadow: '0 0 20px rgba(46, 204, 113, 0.3)'
                            }}>
                                {avatars[profile.avatarId].icon}
                            </div>
                            <h2 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '24px' }}>{profile.name}</h2>
                            <div style={{ color: '#888', fontSize: '14px', marginBottom: '16px' }}>{profile.title}</div>
                            <button onClick={() => setView('EDIT_PROFILE')} style={{ background: '#333', color: '#fff', border: '1px solid #444', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' }}>
                                Modifier le profil
                            </button>
                        </div>

                        {/* Barres XP */}
                        <div style={{ background: '#1c1c1e', padding: '20px', borderRadius: '20px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#fff', fontWeight: 'bold' }}>
                                <span>Niveau {profile.level}</span>
                                <span style={{ color: '#2ecc71' }}>{profile.xp} / {profile.maxXp} XP</span>
                            </div>
                            <div style={{ height: '8px', background: '#333', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${(profile.xp / profile.maxXp) * 100}%`, height: '100%', background: '#2ecc71' }} />
                            </div>
                            <p style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>Plus que {profile.maxXp - profile.xp} XP pour le niveau suivant !</p>
                        </div>

                        {/* Stats */}
                        <h3 style={{ color: '#fff', marginBottom: '16px', fontSize: '18px' }}>Statistiques</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '32px' }}>
                            {[
                                { label: 'Trajets', value: profile.stats.trips, color: '#3498db' },
                                { label: 'Km', value: profile.stats.km, color: '#e67e22' },
                                { label: 'CO2 (kg)', value: profile.stats.co2, color: '#2ecc71' }
                            ].map((stat, i) => (
                                <div key={i} style={{ background: '#1c1c1e', padding: '16px', borderRadius: '16px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: stat.color, marginBottom: '4px' }}>{stat.value}</div>
                                    <div style={{ fontSize: '12px', color: '#888' }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Badges */}
                        <h3 style={{ color: '#fff', marginBottom: '16px', fontSize: '18px' }}>Badges</h3>
                        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '10px' }}>
                            {[
                                { name: 'Pionnier', icon: '🚀', color: '#f1c40f' },
                                { name: 'Écolo', icon: '🌿', color: '#2ecc71' },
                                { name: 'Nocturne', icon: '🦉', color: '#9b59b6' },
                                { name: 'Explorateur', icon: '🧭', color: '#e67e22' }
                            ].map((badge, i) => (
                                <div key={i} style={{ minWidth: '80px', background: '#1c1c1e', padding: '12px', borderRadius: '16px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{badge.icon}</div>
                                    <div style={{ fontSize: '11px', color: '#fff', fontWeight: '500' }}>{badge.name}</div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : view === 'EDIT_PROFILE' ? (
                    <>
                        <h2 style={{ color: '#fff', margin: '0 0 24px 0', fontSize: '20px', textAlign: 'center' }}>Choisir un avatar</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                            {avatars.map(av => (
                                <div
                                    key={av.id}
                                    onClick={() => setProfile({ ...profile, avatarId: av.id })}
                                    style={{
                                        aspectRatio: '1', borderRadius: '50%', background: '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px',
                                        cursor: 'pointer', border: profile.avatarId === av.id ? '4px solid #2ecc71' : '4px solid transparent',
                                        opacity: profile.avatarId === av.id ? 1 : 0.6
                                    }}
                                >
                                    {av.icon}
                                </div>
                            ))}
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Votre Nom</label>
                            <input
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                style={{ width: '100%', background: '#1c1c1e', border: 'none', padding: '16px', borderRadius: '12px', color: '#fff', fontSize: '16px', outline: 'none' }}
                            />
                        </div>

                        <button onClick={() => setView('PROFILE')} style={{ width: '100%', background: '#2ecc71', color: '#fff', border: 'none', padding: '16px', borderRadius: '16px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Enregistrer
                        </button>
                    </>
                ) : (
                    <div style={{ color: '#ddd', lineHeight: '1.6' }}>
                        <h3 style={{ color: '#fff' }}>1. Collecte des données</h3>
                        <p>Nous collectons votre position uniquement pour vous afficher les arrêts à proximité...</p>
                        <h3 style={{ color: '#fff' }}>2. Partage</h3>
                        <p>Vos données de localisation ne sont partagées qu'avec vos amis si vous activez explicitement le mode "Visible" dans Winek.</p>
                        <h3 style={{ color: '#fff' }}>3. Sécurité</h3>
                        <p>Toutes les données sont chiffrées. Nous ne revendons pas vos informations personnelles.</p>
                        <br />
                        <button onClick={() => setView('MAIN')} style={{ background: '#2c2c2e', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer' }}>Retour</button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default SettingsModal;

