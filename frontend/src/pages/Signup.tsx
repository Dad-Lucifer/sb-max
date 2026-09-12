import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import type { UserCredential } from 'firebase/auth';
import { auth } from '../config/firebase';
import axios, { AxiosError } from 'axios';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

type Role = 'employee' | 'owner';

interface SignupForm {
    username: string;
    password: string;
}

interface ApiErrorResponse {
    message: string;
}

const Signup = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState<SignupForm>({
        username: '',
        password: ''
    });

    const [role, setRole] = useState<Role>('employee');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const { username, password } = form;

        if (!username || !password) {
            setError('Operator ID and Clearance Key are mandatory.');
            return;
        }

        let firebaseUser = null;

        try {
            setLoading(true);

            // Generate an internal email replacing spaces
            const sanitizedId = username.replace(/\s+/g, '').toLowerCase();
            const email = `${sanitizedId}@thunder.local`;
            const name = username;

            /* 1️⃣ Create Firebase Auth user */
            const userCredential: UserCredential =
                await createUserWithEmailAndPassword(auth, email, password);

            firebaseUser = userCredential.user;

            /* 2️⃣ Save profile via backend */
            await axios.post('/api/auth/signup', {
                uid: userCredential.user.uid,
                name,
                email,
                username,
                role,
                password
            });

            setSuccess('IDENTITY LOGGED. PREPARING UPLINK...');
            setTimeout(() => navigate('/login'), 1500);

        } catch (err: unknown) {
            console.error(err);

            if (firebaseUser) {
                try {
                    await firebaseUser.delete();
                } catch (deleteError) {
                    console.error('Failed to rollback Firebase user', deleteError);
                }
            }

            if (
                typeof err === 'object' &&
                err !== null &&
                'code' in err &&
                (err as { code: string }).code === 'auth/email-already-in-use'
            ) {
                setError('ID ALREADY EXISTS IN MAINFRAME.');
                return;
            }

            const axiosError = err as AxiosError<ApiErrorResponse>;
            if (axiosError.response?.data?.message) {
                setError(`REJECTED: ${axiosError.response.data.message}`);
                return;
            }

            setError('SYSTEM FAILURE. ABORTED.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modern-split-layout">
            {/* Visual Artistic Left Pane (Hidden on Mobile) */}
            <div className="visual-pane">
                <div className="dynamic-mesh signup-mesh"></div>
                <div className="noise-overlay"></div>

                {/* Scrolling Marquee Background */}
                <div className="marquee-container">
                    <div className="marquee">
                        <span>RECRUIT</span>
                        <span className="stroke-text">RECRUIT</span>
                        <span>RECRUIT</span>
                        <span className="stroke-text">RECRUIT</span>
                    </div>
                    <div className="marquee reverse">
                        <span className="stroke-text">ONBOARDING</span>
                        <span>ONBOARDING</span>
                        <span className="stroke-text">ONBOARDING</span>
                        <span>ONBOARDING</span>
                    </div>
                </div>

                <div className="visual-content">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <div className="brand-badge signup-badge">NEW IDENTITY</div>
                        <h1 className="hero-text">
                            JOIN<br />
                            THE<br />
                            RANKS.
                        </h1>
                        <div className="decoration-bar signup-bar"></div>
                    </motion.div>
                </div>
            </div>

            {/* Precision Auth Right Pane */}
            <div className="auth-pane">
                {mounted && (
                    <motion.div
                        className="auth-content"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="mobile-only-header">
                            <h2>THUNDER</h2>
                        </div>

                        <div className="auth-header-wrapper">
                            <h2 className="auth-title">REGISTER</h2>
                            <p className="auth-subtitle">Establish your access parameters.</p>
                        </div>

                        <form className="minimal-form" onSubmit={handleSubmit}>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="alert-box"
                                >
                                    <div className="alert-line"></div>
                                    {error}
                                </motion.div>
                            )}

                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="alert-box success-box"
                                >
                                    <div className="alert-line success-line"></div>
                                    {success}
                                </motion.div>
                            )}

                            <div className="floating-input-group">
                                <input
                                    type="text"
                                    name="username"
                                    id="username"
                                    required
                                    value={form.username}
                                    onChange={handleChange}
                                    className="floating-input"
                                    placeholder=" "
                                />
                                <label htmlFor="username">NEW OPERATOR_ID</label>
                                <span className="focus-border"></span>
                            </div>

                            <div className="floating-input-group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    id="password"
                                    required
                                    value={form.password}
                                    onChange={handleChange}
                                    className="floating-input"
                                    placeholder=" "
                                />
                                <label htmlFor="password">CLEARANCE KEY</label>
                                <span className="focus-border"></span>
                                <button
                                    type="button"
                                    className="pass-visibility"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>

                            <div className="role-selection">
                                <span className="role-label-text">CHOOSE DIRECTIVE:</span>
                                <div className="role-buttons">
                                    <button
                                        type="button"
                                        className={`minimal-role-btn ${role === 'employee' ? 'is-active employee-active' : ''}`}
                                        onClick={() => setRole('employee')}
                                    >
                                        EMPLOYEE
                                    </button>
                                    <button
                                        type="button"
                                        className={`minimal-role-btn ${role === 'owner' ? 'is-active owner-active' : ''}`}
                                        onClick={() => setRole('owner')}
                                    >
                                        OWNER
                                    </button>
                                </div>
                            </div>

                            <div className="action-row">
                                <button
                                    type="submit"
                                    className={`impact-btn ${loading || success ? 'is-loading' : ''}`}
                                    disabled={loading || !!success}
                                >
                                    <span className="btn-text">
                                        {loading ? 'PROCESSING...' : success ? 'APPROVED' : 'CONFIRM IDENTITY'}
                                    </span>
                                    {(!loading && !success) && <span className="btn-arrow">→</span>}
                                    <div className="btn-glow"></div>
                                </button>
                            </div>
                        </form>

                        <div className="auth-footer-text">
                            ALREADY GRANTED ACCESS? <Link to="/login" className="bold-link">RETURN</Link>
                        </div>
                    </motion.div>
                )}
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Anton&family=Manrope:wght@400;500;700;800&display=swap');

                :root {
                    --bg-dark: #050505;
                    --text-primary: #ffffff;
                    --text-secondary: #888888;
                    --brand-gold: #FFD700;
                    --brand-blue: #00F0FF;
                    --brand-red: #FF0033;
                }

                * {
                    box-sizing: border-box;
                }

                .modern-split-layout {
                    display: flex;
                    min-height: 100dvh; /* Dynamic viewport for mobile keyboards */
                    background-color: var(--bg-dark);
                    font-family: 'Manrope', sans-serif;
                    color: var(--text-primary);
                    overflow-x: hidden;
                }

                /* --- LEFT VISUAL PANE --- */
                .visual-pane {
                    flex: 1.2;
                    position: relative;
                    background: #000;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: clamp(40px, 5vw, 80px);
                }

                .dynamic-mesh {
                    position: absolute;
                    inset: -50%;
                    background: 
                        radial-gradient(circle at 30% 30%, rgba(255, 0, 51, 0.45) 0%, transparent 50%),
                        radial-gradient(circle at 70% 70%, rgba(0, 68, 255, 0.45) 0%, transparent 50%),
                        radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.15) 0%, transparent 70%);
                    animation: meshDrift 20s infinite alternate ease-in-out;
                    z-index: 1;
                }

                .signup-mesh {
                    background: 
                        radial-gradient(circle at 70% 30%, rgba(0, 68, 255, 0.45) 0%, transparent 50%),
                        radial-gradient(circle at 30% 80%, rgba(255, 0, 51, 0.45) 0%, transparent 50%),
                        radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.15) 0%, transparent 70%);
                }

                @keyframes meshDrift {
                    0% { transform: rotate(0deg) scale(1); }
                    100% { transform: rotate(15deg) scale(1.1); }
                }

                .noise-overlay {
                    position: absolute;
                    inset: 0;
                    background-image: url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E');
                    opacity: 0.15;
                    mix-blend-mode: overlay;
                    z-index: 2;
                    pointer-events: none;
                }

                .marquee-container {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    gap: 20px;
                    z-index: 2;
                    opacity: 0.1;
                    transform: rotate(-5deg) scale(1.2);
                    pointer-events: none;
                }

                .marquee {
                    display: flex;
                    white-space: nowrap;
                    font-family: 'Anton', sans-serif;
                    font-size: clamp(8rem, 15vw, 20rem);
                    line-height: 1;
                    animation: slide 20s linear infinite;
                }

                .marquee.reverse {
                    animation: slideReverse 25s linear infinite;
                }

                .stroke-text {
                    color: transparent;
                    -webkit-text-stroke: 2px #fff;
                }

                @keyframes slide {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }

                @keyframes slideReverse {
                    0% { transform: translateX(-50%); }
                    100% { transform: translateX(0); }
                }

                .visual-content {
                    position: relative;
                    z-index: 10;
                }

                .brand-badge {
                    display: inline-block;
                    padding: 8px 16px;
                    border: 1px solid var(--text-secondary);
                    font-size: clamp(10px, 1.2vw, 12px);
                    font-weight: 700;
                    letter-spacing: 4px;
                    margin-bottom: 30px;
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(10px);
                }
                
                .signup-badge {
                    border-color: var(--brand-blue);
                    color: var(--brand-blue);
                }

                .hero-text {
                    font-family: 'Anton', sans-serif;
                    font-size: clamp(3rem, 7vw, 6rem);
                    line-height: 0.95;
                    text-transform: uppercase;
                    margin: 0;
                    text-shadow: 4px 4px 0px rgba(0,0,0,0.8);
                }

                .decoration-bar {
                    width: clamp(60px, 10vw, 100px);
                    height: clamp(5px, 1vw, 8px);
                    background: var(--brand-gold);
                    margin-top: clamp(20px, 4vw, 40px);
                    box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
                }

                .signup-bar {
                    background: var(--brand-blue);
                    box-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
                }

                /* --- RIGHT AUTH PANE --- */
                .auth-pane {
                    flex: 0.8;
                    background: var(--bg-dark);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: clamp(20px, 5vw, 40px);
                    position: relative;
                    z-index: 20;
                    box-shadow: -20px 0 50px rgba(0,0,0,0.5);
                    overflow-y: auto; /* Fix keyboard issues on mobile */
                }

                .auth-content {
                    width: 100%;
                    max-width: 420px;
                    margin: auto;
                }

                .mobile-only-header {
                    display: none;
                    margin-bottom: 30px;
                    text-align: center;
                }

                .mobile-only-header h2 {
                    font-family: 'Anton', sans-serif;
                    font-size: clamp(2.5rem, 10vw, 3.5rem);
                    margin: 0;
                    color: var(--text-primary);
                    letter-spacing: 2px;
                }

                .auth-header-wrapper {
                    margin-bottom: clamp(30px, 6vw, 50px);
                }

                .auth-title {
                    font-size: clamp(1.8rem, 6vw, 2.2rem);
                    font-weight: 800;
                    margin: 0 0 10px 0;
                    letter-spacing: -1px;
                }

                .auth-subtitle {
                    color: var(--text-secondary);
                    font-size: clamp(0.9rem, 3vw, 1rem);
                    font-weight: 500;
                    margin: 0;
                }

                .minimal-form {
                    display: flex;
                    flex-direction: column;
                    gap: clamp(25px, 5vw, 35px);
                }

                /* Alert Box */
                .alert-box {
                    background: rgba(255, 0, 51, 0.05);
                    padding: clamp(12px, 3vw, 16px) clamp(16px, 4vw, 20px);
                    border: 1px solid rgba(255, 0, 51, 0.2);
                    color: var(--text-primary);
                    font-size: clamp(12px, 3vw, 14px);
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    word-break: break-word; /* Prevents tiny screen horizontal scroll */
                }

                .alert-line {
                    width: 3px;
                    height: 20px;
                    background: var(--brand-red);
                    flex-shrink: 0;
                }

                .success-box {
                    background: rgba(0, 240, 255, 0.05);
                    border: 1px solid rgba(0, 240, 255, 0.2);
                }

                .success-line {
                    background: var(--brand-blue);
                }

                /* Floating Inputs */
                .floating-input-group {
                    position: relative;
                    width: 100%;
                }

                .floating-input {
                    width: 100%;
                    background: transparent;
                    border: none;
                    border-bottom: 2px solid rgba(255,255,255,0.1);
                    padding: clamp(8px, 2vw, 10px) 0;
                    color: #fff;
                    font-size: clamp(1rem, 4vw, 1.1rem);
                    font-family: 'Manrope', sans-serif;
                    font-weight: 500;
                    transition: 0.3s ease;
                    border-radius: 0; /* Clear iOS rounded corners */
                }

                .floating-input:focus {
                    outline: none;
                }

                .floating-input-group label {
                    position: absolute;
                    top: 12px;
                    left: 0;
                    color: var(--text-secondary);
                    font-size: clamp(0.9rem, 3vw, 1rem);
                    font-weight: 700;
                    letter-spacing: 1px;
                    pointer-events: none;
                    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .floating-input:focus ~ label,
                .floating-input:not(:placeholder-shown) ~ label {
                    top: -20px;
                    font-size: 0.75rem;
                    color: var(--brand-blue);
                }

                .focus-border {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 0;
                    height: 2px;
                    background: var(--brand-blue);
                    transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .floating-input:focus ~ .focus-border {
                    width: 100%;
                }

                .pass-visibility {
                    position: absolute;
                    right: 0;
                    top: 10px;
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-size: clamp(1rem, 4vw, 1.1rem);
                    transition: color 0.3s;
                    padding: 5px;
                    z-index: 5;
                }

                .pass-visibility:hover {
                    color: white;
                }

                /* Roles */
                .role-selection {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .role-label-text {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    font-weight: 700;
                    letter-spacing: 1px;
                }

                .role-buttons {
                    display: flex;
                    gap: 20px;
                }

                .minimal-role-btn {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-family: 'Manrope', sans-serif;
                    font-weight: 800;
                    font-size: 0.9rem;
                    letter-spacing: 2px;
                    padding: 5px 0;
                    cursor: pointer;
                    position: relative;
                    transition: color 0.3s;
                }

                .minimal-role-btn::after {
                    content: '';
                    position: absolute;
                    bottom: -5px;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background: transparent;
                    transition: background 0.3s;
                }

                .minimal-role-btn:hover {
                    color: #fff;
                }

                .minimal-role-btn.is-active {
                    color: #fff;
                }

                .employee-active::after {
                    background: var(--brand-blue);
                }

                .owner-active::after {
                    background: var(--brand-gold);
                }

                /* Action Row & Button */
                .action-row {
                    margin-top: clamp(5px, 2vw, 10px);
                }

                .impact-btn {
                    width: 100%;
                    background: #fff;
                    color: #000;
                    border: none;
                    padding: clamp(16px, 4vw, 20px);
                    font-family: 'Manrope', sans-serif;
                    font-weight: 800;
                    font-size: clamp(1rem, 3.5vw, 1.1rem);
                    letter-spacing: 2px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    transition: transform 0.2s, background 0.3s;
                    position: relative;
                    overflow: hidden;
                    border-radius: 0;
                }

                .impact-btn:hover {
                    background: var(--brand-blue);
                }

                .impact-btn:active {
                    transform: scale(0.98);
                }

                .btn-text {
                    position: relative;
                    z-index: 2;
                }

                .btn-arrow {
                    position: relative;
                    z-index: 2;
                    font-size: clamp(1.2rem, 4vw, 1.5rem);
                    line-height: 0;
                }

                .btn-glow {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 150%;
                    height: 150%;
                    background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 50%);
                    transform: translate(-50%, -50%) scale(0);
                    opacity: 0;
                    transition: 0.5s;
                    z-index: 1;
                }

                .impact-btn:hover .btn-glow {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 0.2;
                }

                .impact-btn.is-loading {
                    pointer-events: none;
                    background: #222;
                    color: #888;
                }

                .auth-footer-text {
                    margin-top: clamp(30px, 5vw, 40px);
                    font-size: clamp(0.75rem, 2.5vw, 0.85rem);
                    color: var(--text-secondary);
                    font-weight: 600;
                    letter-spacing: 1px;
                }

                .bold-link {
                    color: #fff;
                    text-decoration: none;
                    margin-left: 5px;
                    border-bottom: 2px solid var(--brand-red);
                    padding-bottom: 2px;
                    transition: color 0.3s, border-color 0.3s;
                }

                .bold-link:hover {
                    color: var(--brand-gold);
                    border-color: var(--brand-gold);
                }

                /* Responsive Breakpoints */
                @media (max-width: 1024px) {
                    .modern-split-layout {
                        flex-direction: column;
                    }
                    .visual-pane {
                        display: none;
                    }
                    .auth-pane {
                        flex: 1;
                        padding: clamp(20px, 6vw, 40px);
                    }
                    .mobile-only-header {
                        display: block;
                    }
                }
                
                @media (max-width: 400px) {
                    .auth-title {
                        letter-spacing: 0;
                    }
                    .floating-input-group label {
                        font-size: 0.85rem;
                    }
                    .impact-btn {
                        padding: 14px 16px;
                    }
                }
            `}</style>
        </div>
    );
};

export default Signup;
