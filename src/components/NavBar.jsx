import React, { useState, useEffect } from 'react'
import { Menu, Home, Briefcase, Settings, ChevronRight, X, User, Plus, Check } from 'lucide-react'

const NavBar = ({ isMenuOpen, setIsMenuOpen, userProfile }) => {
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Shortcuts State
    const [homeAddress, setHomeAddress] = useState(localStorage.getItem('saved_home') || '');
    const [workAddress, setWorkAddress] = useState(localStorage.getItem('saved_work') || '');
    const [editingType, setEditingType] = useState(null); // 'home' | 'work' | null
    const [editValue, setEditValue] = useState('');

    // Winek State
    const [sharingEnabled, setSharingEnabled] = useState(true);
    const [isWinekOpen, setIsWinekOpen] = useState(false);

    const toggleDrawer = () => setDrawerOpen(!drawerOpen);

    const startEditing = (type) => {
        setEditingType(type);
        setEditValue(type === 'home' ? homeAddress : workAddress);
    };

    const saveAddress = () => {
        if (editingType === 'home') {
            setHomeAddress(editValue);
            localStorage.setItem('saved_home', editValue);
        } else {
            setWorkAddress(editValue);
            localStorage.setItem('saved_work', editValue);
        }
        setEditingType(null);
    };

    return (
        <>
            {/* TOP BAR (Floating) */}
            <div style={{
                position: 'fixed', top: '16px', left: '16px', zIndex: 300,
                pointerEvents: 'none', display: 'flex', gap: '10px'
            }}>
                {/* Profile Button */}
                <div onClick={toggleDrawer} style={{
                    pointerEvents: 'auto',
                    width: '44px', height: '44px',
                    background: '#fff', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer', overflow: 'hidden'
                }}>
                    {userProfile?.avatar ? (
                        <img src={userProfile.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <User color="#333" size={24} />
                    )}
                </div>

                {/* Winek Bubble (Restored) */}
                <div onClick={() => setIsWinekOpen(true)} style={{
                    pointerEvents: 'auto',
                    background: 'rgba(46, 204, 113, 0.2)', backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(46, 204, 113, 0.5)',
                    borderRadius: '24px', padding: '0 16px', height: '44px',
                    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    <div style={{
                        width: '10px', height: '10px',
                        borderRadius: '50%', background: sharingEnabled ? '#2ecc71' : '#7f8c8d',
                        boxShadow: sharingEnabled ? '0 0 8px #2ecc71' : 'none'
                    }} />
                    <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>Winek</span>
                </div>
            </div>

            {/* PROFILE DRAWER */}
            <div style={{
                position: 'fixed', top: 0, left: 0, bottom: 0, width: '85%', maxWidth: '320px',
                background: '#1c1c1e', zIndex: 3500,
                transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s cubic-bezier(0.19, 1, 0.22, 1)',
                boxShadow: '10px 0 30px rgba(0,0,0,0.5)',
                display: 'flex', flexDirection: 'column'
            }}>

                {/* Header */}
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

                {/* Shortcuts */}
                <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#8e8e93', textTransform: 'uppercase', marginBottom: '16px' }}>
                        Favoris
                    </div>

                    {/* Home Tile */}
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

                    {/* Work Tile */}
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

                    <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '24px', background: '#2c2c2e', padding: '16px', borderRadius: '12px' }}>
                        <div style={{ flex: 1, color: '#fff', fontSize: '16px', fontWeight: '600' }}>Paramètres</div>
                        <Settings size={20} color="#8e8e93" />
                        <div style={{ width: '8px', height: '8px', background: '#e74c3c', borderRadius: '50%', position: 'absolute', right: '40px' }} />
                    </div>
                </div>
            </div>

            {/* WINEK MODAL */}
            {isWinekOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 4000,
                    background: '#111', padding: '24px', paddingTop: '60px', overflowY: 'auto',
                    animation: 'slideInUp 0.3s'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                        <h1 style={{ margin: 0, color: '#2ecc71', fontSize: '32px', fontWeight: '900' }}>Winek.</h1>
                        <div onClick={() => setIsWinekOpen(false)} style={{ background: '#222', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                            <X color="#fff" size={24} />
                        </div>
                    </div>

                    <div style={{ background: '#1e1e1e', padding: '24px', borderRadius: '24px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ color: '#fff', fontWeight: '700', fontSize: '18px', marginBottom: '4px' }}>Visibilité</div>
                            <div style={{ color: sharingEnabled ? '#2ecc71' : '#888', fontSize: '14px' }}>
                                {sharingEnabled ? 'Active (Tout le monde)' : 'Masquée'}
                            </div>
                        </div>
                        <div onClick={() => setSharingEnabled(!sharingEnabled)} style={{
                            width: '56px', height: '32px', background: sharingEnabled ? '#2ecc71' : '#333', borderRadius: '16px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
                        }}>
                            <div style={{
                                width: '26px', height: '26px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px',
                                left: sharingEnabled ? '27px' : '3px', transition: 'left 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                            }} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ color: '#fff', fontWeight: '700', fontSize: '20px', marginBottom: '16px' }}>Amis actifs (2)</div>
                        {/* Mock Friends */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', background: '#1c1c1e', padding: '12px', borderRadius: '16px', border: '1px solid #333' }}>
                            <div style={{ width: '48px', height: '48px', background: '#3498db', borderRadius: '50%' }} />
                            <div>
                                <div style={{ color: '#fff', fontWeight: '700' }}>Yacine B.</div>
                                <div style={{ color: '#2ecc71', fontSize: '13px' }}>En route vers 1er Mai</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Overlay Backtrop */}
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
