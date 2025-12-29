import { useState, useEffect } from 'react';
import { User, Check, Sparkles } from 'lucide-react';
import './Onboarding.css'; // We'll create this for specific animations

const AVATARS = [
    { id: 'cat', src: '/avatars/cat.png', label: 'Cat' },
    { id: 'robot', src: '/avatars/robot.png', label: 'Robot' },
    { id: 'ghost', src: '/avatars/ghost.png', label: 'Ghost' },
    { id: 'fox', src: '/avatars/fox.png', label: 'Fox' },
];

const Onboarding = ({ onComplete }) => {
    const [step, setStep] = useState('welcome'); // welcome, create-account, avatar
    const [name, setName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(null);
    const [animateOut, setAnimateOut] = useState(false);

    const handleStart = () => {
        setStep('create-account');
    };

    const handleCreateAccount = () => {
        if (name.length > 0) {
            setStep('avatar');
        }
    };

    const handleFinish = () => {
        if (selectedAvatar) {
            const profile = { name, avatar: selectedAvatar };
            localStorage.setItem('user_profile', JSON.stringify(profile));
            setAnimateOut(true);
            setTimeout(() => {
                onComplete(profile);
            }, 500); // Wait for animation
        }
    };

    if (animateOut) return null; // Or keep rendering until unmounted by parent

    return (
        <div className={`onboarding-overlay ${animateOut ? 'fade-out' : ''}`}>

            {/* WELCOME STEP */}
            {step === 'welcome' && (
                <div className="onboarding-step slide-in">
                    <div className="logo-container pulse">
                        <div className="app-logo">T</div>
                    </div>
                    <h1>Bienvenue sur Transit</h1>
                    <p>Votre compagnon de voyage à Alger.</p>
                    <button className="btn-primary" onClick={handleStart}>
                        Commencer
                    </button>
                </div>
            )}

            {/* CREATE ACCOUNT STEP */}
            {step === 'create-account' && (
                <div className="onboarding-step slide-in-right">
                    <h2>Créer un profil</h2>
                    <p>Dites-nous comment vous appeler.</p>

                    <div className="input-group">
                        <User size={20} color="#666" />
                        <input
                            type="text"
                            placeholder="Votre prénom"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <button
                        className="btn-primary"
                        disabled={name.length === 0}
                        onClick={handleCreateAccount}
                    >
                        Continuer
                    </button>
                </div>
            )}

            {/* AVATAR SELECTION STEP */}
            {step === 'avatar' && (
                <div className="onboarding-step slide-in-right">
                    <h2>Choisir un Avatar</h2>
                    <p>Lequel vous correspond le mieux ?</p>

                    <div className="avatar-grid">
                        {AVATARS.map(av => (
                            <div
                                key={av.id}
                                className={`avatar-option ${selectedAvatar === av.src ? 'selected' : ''}`}
                                onClick={() => setSelectedAvatar(av.src)}
                            >
                                <img src={av.src} alt={av.label} />
                                {selectedAvatar === av.src && (
                                    <div className="check-badge">
                                        <Check size={12} color="#fff" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        className="btn-primary"
                        disabled={!selectedAvatar}
                        onClick={handleFinish}
                    >
                        Terminer <Sparkles size={16} style={{ marginLeft: 8 }} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Onboarding;
