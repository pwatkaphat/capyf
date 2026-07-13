import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './Login.css';

const errorMessages = {
  'Invalid login credentials': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง',
  'Email not confirmed': 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ',
  'User already registered': 'อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const response = isRegister
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (response.error) {
      setMessage({ type: 'error', text: errorMessages[response.error.message] || response.error.message });
    } else if (isRegister) {
      setMessage({ type: 'success', text: 'สร้างบัญชีแล้ว กรุณาเปิดอีเมลเพื่อยืนยันก่อนเข้าสู่ระบบ' });
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <section className="login-form-side">
        <div className="login-form-wrap">
          <div className="login-heading">
            <span className="login-wave">👋</span>
            <h1>{isRegister ? 'เริ่มดูแลสวนกับเรา' : 'ยินดีต้อนรับกลับสวน'}</h1>
            <p>{isRegister ? 'สร้างบัญชีเพื่อเชื่อมต่ออุปกรณ์และดูข้อมูลฟาร์ม' : 'เข้าสู่ระบบเพื่อดูสภาพสวนล่าสุดของคุณ'}</p>
          </div>

          {message.text && <div className={`status-message status-message--${message.type}`} role="alert">{message.text}</div>}

          <form onSubmit={handleAuth} className="login-form">
            <label><span className="field-label">อีเมล</span><span className="input-with-icon"><Mail size={19} /><input className="field-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="name@example.com" /></span></label>
            <label><span className="field-label">รหัสผ่าน</span><span className="input-with-icon"><LockKeyhole size={19} /><input className="field-input" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder="อย่างน้อย 6 ตัวอักษร" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></span></label>
            <button type="submit" className="primary-button login-submit" disabled={loading}>{loading ? 'กำลังดำเนินการ...' : isRegister ? 'สร้างบัญชี CapyF' : 'เข้าสู่สวน'}{!loading && <ArrowRight size={19} />}</button>
          </form>

          <p className="login-switch">{isRegister ? 'มีบัญชีอยู่แล้ว?' : 'ยังไม่มีบัญชี?'} <button type="button" onClick={() => { setIsRegister((value) => !value); setMessage({ type: '', text: '' }); }}>{isRegister ? 'เข้าสู่ระบบ' : 'สร้างบัญชีใหม่'}</button></p>
          <p className="login-note">CapyF ช่วยสรุปข้อมูลเซนเซอร์เป็นภาษาง่าย ๆ เพื่อให้คุณตัดสินใจดูแลสวนได้มั่นใจขึ้น</p>
        </div>
      </section>
    </div>
  );
}
