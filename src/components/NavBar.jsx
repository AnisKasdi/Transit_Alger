// ============================================================================
// FICHIER: NavBar.jsx
// ROLE: Barre de navigation supérieure et Menu latéral (Profil)
// ============================================================================

import React, { useState, useEffect } from 'react'
import { Menu, Home, Briefcase, Settings, ChevronRight, X, User, Plus, Check } from 'lucide-react'
import WinekModal from './WinekModal'     // Import du composant "Winek" (le tableau de bord amis)
import SettingsModal from './SettingsModal' // Import du composant "Paramètres"

const NavBar = ({ isMenuOpen, setIsMenuOpen, userProfile }) => {
    // Gestion de l'ouverture du menu latéral (Drawer)
    const [drawerOpen, setDrawerOpen] = useState(false);

    // ----------------------------------------------------------------
    // GESTION DES RACCOURCIS (Maison / Travail)
    // ----------------------------------------------------------------
    // On charge les adresses sauvegardées depuis la mémoire du téléphone (localStorage)
    const [homeAddress, setHomeAddress] = useState(localStorage.getItem('saved_home') || '');
    const [workAddress, setWorkAddress] = useState(localStorage.getItem('saved_work') || '');

    // Etat pour savoir quel champ on est en train de modifier ('home' ou 'work')
    const [editingType, setEditingType] = useState(null);
    const [editValue, setEditValue] = useState('');

    // ----------------------------------------------------------------
    // GESTION DES MODALES (Fenêtres par dessus)
    // ----------------------------------------------------------------
    const [sharingEnabled, setSharingEnabled] = useState(true); // Pour Winek
    const [isWinekOpen, setIsWinekOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Fonction simple pour ouvrir/fermer le menu
    const toggleDrawer = () => setDrawerOpen(!drawerOpen);

    // Lance le mode édition pour une adresse (Maison ou Travail)
    const startEditing = (type) => {
        setEditingType(type);
        // On pré-remplit le champ texte avec l'adresse actuelle
        setEditValue(type === 'home' ? homeAddress : workAddress);
    };

    // Sauvegarde la nouvelle adresse dans le stockage local et le state
    const saveAddress = () => {
        if (editingType === 'home') {
            setHomeAddress(editValue);
            localStorage.setItem('saved_home', editValue); // Sauvegarde permanente
        } else {
            setWorkAddress(editValue);
            localStorage.setItem('saved_work', editValue);
        }
        setEditingType(null); // On quitte le mode édition
    };

    return (
        <>
            {/* -------------------------------------------------------
                BARRE FLOTTANTE DU HAUT (Top Bar)
                Elle contient le bouton Profil et le bouton Winek
            ------------------------------------------------------- */}
            <div style={{
                position: 'fixed', top: '16px', left: '16px', zIndex: 300,
                pointerEvents: 'none', // Important: permet de cliquer "à travers" le vide autour des boutons
                display: 'flex', gap: '10px'
            }}>
                {/* BOUTON PROFIL (Rond) */}
                <div onClick={toggleDrawer} style={{
                    pointerEvents: 'auto', // On réactive les clics sur le bouton lui-même
                    width: '44px', height: '44px',
                    background: '#fff', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer', overflow: 'hidden'
                }}>
                    {/* Si l'utilisateur a un avatar, on l'affiche, sinon icône par défaut */}
                    {userProfile?.avatar ? (
                        <img src={userProfile.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <User color="#333" size={24} />
                    )}
                </div>

                {/* BOUTON WINEK (Bulle verte) */}
                <div onClick={() => setIsWinekOpen(true)} style={{
                    pointerEvents: 'auto',
                    background: 'rgba(46, 204, 113, 0.2)', backdropFilter: 'blur(10px)', // Effet verre dépoli
                    border: '1px solid rgba(46, 204, 113, 0.5)',
                    borderRadius: '24px', padding: '0 16px', height: '44px',
                    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    {/* Indicateur d'état (vert allumé ou gris éteint) */}
                    <div style={{
                        width: '10px', height: '10px',
                        borderRadius: '50%', background: sharingEnabled ? '#2ecc71' : '#7f8c8d',
                        boxShadow: sharingEnabled ? '0 0 8px #2ecc71' : 'none'
                    }} />
                    <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>Winek</span>
                </div>
            </div>

            {/* -------------------------------------------------------
                MENU LATÉRAL (Drawer)
                C'est le panneau noir qui glisse depuis la gauche
            ------------------------------------------------------- */}
            <div style={{
                position: 'fixed', top: 0, left: 0, bottom: 0, width: '85%', maxWidth: '320px',
                background: '#1c1c1e', zIndex: 3500, // Très haut pour passer au dessus de tout
                transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)', // Animation de glissement CSS
                transition: 'transform 0.3s cubic-bezier(0.19, 1, 0.22, 1)', // Animation fluide type iOS
                boxShadow: '10px 0 30px rgba(0,0,0,0.5)',
                display: 'flex', flexDirection: 'column'
            }}>

                {/* EN-TÊTE DU MENU (Infos Profil) */}
                <div style={{ padding: '24px', paddingTop: '48px', background: '#2c2c2e' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #2ecc71' }}>
                            {userProfile?.avatar ? (
                                <img src={userProfile.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: '#555' }} />
                            )}
                        </div>
                        <div onClick={toggleDrawer} style={{ cursor: 'pointer' }}>
                            <X color="#fff" size={24} />
                        </div>
                    </div>
                    <div style={{ color: '#fff', fontSize: '24px', fontWeight: '800' }}>
                        {userProfile?.name || 'Voyageur'}
                    </div>
                    <div style={{ color: '#2ecc71', fontSize: '14px', fontWeight: '600', marginTop: '4px' }}>
                        Alger, Algérie
                    </div>
                </div>

                {/* LISTE DES RACCOURCIS */}
                <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#8e8e93', textTransform: 'uppercase', marginBottom: '16px' }}>
                        Favoris
                    </div>

                    {/* Bloc MAISON (Affichage ou Edition) */}
                    <div style={{ marginBottom: '20px' }}>
                        {editingType === 'home' ? (
                            <div style={{ background: '#2c2c2e', padding: '12px', borderRadius: '12px' }}>
                                <input
                                    autoFocus
                                    style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%', marginBottom: '10px', fontSize: '16px', outline: 'none' }}
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    placeholder="Adresse complète..."
                                />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={saveAddress} style={{ flex: 1, background: '#2ecc71', border: 'none', borderRadius: '8px', padding: '8px', fontWeight: '700', cursor: 'pointer' }}>Sauvegarder</button>
                                    <button onClick={() => setEditingType(null)} style={{ flex: 1, background: '#3a3a3c', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>Annuler</button>
                                </div>
                            </div>
                        ) : (
                            <div onClick={() => startEditing('home')} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <div style={{ width: '36px', height: '36px', background: '#3a3a3c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
                                    <Home size={18} color="#fff" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: '#fff', fontWeight: '600', fontSize: '16px' }}>Maison</div>
                                    <div style={{ color: '#8e8e93', fontSize: '13px' }}>{homeAddress || 'Définir l\'adresse'}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bloc TRAVAIL (Similaire à Maison) */}
                    <div>
                        {editingType === 'work' ? (
                            <div style={{ background: '#2c2c2e', padding: '12px', borderRadius: '12px' }}>
                                <input
                                    autoFocus
                                    style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%', marginBottom: '10px', fontSize: '16px', outline: 'none' }}
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    placeholder="Adresse complète..."
                                />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={saveAddress} style={{ flex: 1, background: '#2ecc71', border: 'none', borderRadius: '8px', padding: '8px', fontWeight: '700', cursor: 'pointer' }}>Sauvegarder</button>
                                    <button onClick={() => setEditingType(null)} style={{ flex: 1, background: '#3a3a3c', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>Annuler</button>
                                </div>
                            </div>
                        ) : (
                            <div onClick={() => startEditing('work')} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <div style={{ width: '36px', height: '36px', background: '#3a3a3c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
                                    <Briefcase size={18} color="#fff" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: '#fff', fontWeight: '600', fontSize: '16px' }}>Travail</div>
                                    <div style={{ color: '#8e8e93', fontSize: '13px' }}>{workAddress || 'Définir l\'adresse'}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '24px 0' }} />

                    {/* BOUTON PARAMETRES */}
                    <div onClick={() => setIsSettingsOpen(true)} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '24px', background: '#2c2c2e', padding: '16px', borderRadius: '12px' }}>
                        <div style={{ flex: 1, color: '#fff', fontSize: '16px', fontWeight: '600' }}>Paramètres</div>
                        <Settings size={20} color="#8e8e93" />
                        <div style={{ width: '8px', height: '8px', background: '#e74c3c', borderRadius: '50%', position: 'absolute', right: '40px' }} />
                    </div>
                </div>
            </div>

            {/* -------------------------------------------------------
                INCLUSION DES MODALES
                Elles sont cachées par défaut et s'affichent quand isOpen=true
            ------------------------------------------------------- */}
            <WinekModal
                isOpen={isWinekOpen}
                onClose={() => setIsWinekOpen(false)}
                sharingEnabled={sharingEnabled}
                setSharingEnabled={setSharingEnabled}
            />

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                userProfile={userProfile}
            />

            {/* FOND NOIR SEMI-TRANSPARENT (Backdrop) 
                Quand le menu est ouvert, on assombrit le reste de l'écran
            */}
            {drawerOpen && (
                <div onClick={toggleDrawer} style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', zIndex: 3000,
                    backdropFilter: 'blur(4px)',
                    animation: 'fadeIn 0.3s'
                }} />
            )}
        </>
    )
}

export default NavBar

