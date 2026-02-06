'use client';

import { useRouter } from 'next/navigation';

export default function RoleSelection() {
    const router = useRouter();

    const selectRole = (role) => {
        if (role === 'host') {
            const password = prompt('🔒 Enter Host Password:');
            if (password !== 'admin123') {
                alert('❌ Incorrect password! Access denied.');
                return;
            }
            alert('✅ Access granted! Redirecting to Host Dashboard...');
            router.push('/leaderboard');
        } else {
            router.push('/game');
        }
    };

    return (
        <div className="selection-wrapper">
            <div className="background-animation"></div>

            <div className="selection-container">
                <header className="selection-header">
                    <h1 className="selection-title">
                        <span className="title-icon">🎮</span>
                        GAME FLOW - ROBOTICS CLUB
                    </h1>
                    <p className="selection-subtitle">Choose Your Role</p>
                </header>

                <div className="role-cards">
                    <div className="role-card participant-card" onClick={() => selectRole('participant')}>
                        <div className="card-glow participant-glow"></div>
                        <div className="card-content">
                            <div className="role-icon">👤</div>
                            <h2 className="role-title">Participant</h2>
                            <p className="role-description">Join the game and compete with others.</p>
                            <button className="role-btn">Join as Participant →</button>
                        </div>
                    </div>

                    <div className="role-card host-card" onClick={() => selectRole('host')}>
                        <div className="card-glow host-glow"></div>
                        <div className="card-content">
                            <div className="role-icon">🏆</div>
                            <h2 className="role-title">Host</h2>
                            <p className="role-description">Monitor the game session and leaderboard.</p>
                            <button className="role-btn">Join as Host →</button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .selection-wrapper {
                    min-height: 100vh;
                    background: #0f0c29;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                    position: relative;
                }

                .background-animation {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.1), transparent 50%),
                                radial-gradient(circle at 80% 80%, rgba(245, 87, 108, 0.1), transparent 50%);
                    z-index: 0;
                }

                .selection-container {
                    position: relative;
                    z-index: 1;
                    width: 100%;
                    max-width: 1000px;
                    padding: 2rem;
                }

                .selection-header {
                    text-align: center;
                    margin-bottom: 3rem;
                }

                .selection-title {
                    font-size: 3rem;
                    font-weight: 900;
                    color: #fff;
                    margin-bottom: 0.5rem;
                }

                .role-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 2rem;
                }

                .role-card {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 2.5rem;
                    cursor: pointer;
                    position: relative;
                    transition: all 0.3s ease;
                }

                .role-card:hover {
                    transform: translateY(-10px);
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(255, 255, 255, 0.2);
                }

                .role-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }

                .role-title {
                    font-size: 1.8rem;
                    margin-bottom: 1rem;
                }

                .role-btn {
                    margin-top: 1.5rem;
                    padding: 0.8rem 1.5rem;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    border: none;
                    border-radius: 10px;
                    color: #fff;
                    font-weight: 700;
                    width: 100%;
                }
            `}</style>
        </div>
    );
}
