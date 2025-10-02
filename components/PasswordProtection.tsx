import React, { useState, useEffect, useRef } from 'react';

const CORRECT_PASSWORD = 'GustavoBloqueiaInvadders';
const MAX_ATTEMPTS = 10;
const LOCKOUT_DURATION_SECONDS = 60;

interface PasswordProtectionProps {
  onSuccess: () => void;
}

const PasswordProtection: React.FC<PasswordProtectionProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(LOCKOUT_DURATION_SECONDS);

  const timerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (isLocked) {
      timerRef.current = window.setInterval(() => {
        setLockoutTime((prevTime) => prevTime - 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isLocked]);

  useEffect(() => {
    if (lockoutTime <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsLocked(false);
      setAttempts(0);
      setLockoutTime(LOCKOUT_DURATION_SECONDS);
      setError(null);
    }
  }, [lockoutTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    if (password === CORRECT_PASSWORD) {
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPassword('');

      if (newAttempts >= MAX_ATTEMPTS) {
        setError(`Muitas tentativas. Acesso bloqueado por ${LOCKOUT_DURATION_SECONDS} segundos.`);
        setIsLocked(true);
      } else {
        setError(`Senha incorreta. Tentativas restantes: ${MAX_ATTEMPTS - newAttempts}.`);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 space-y-6 animate-fade-in">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-800">Acesso Restrito</h2>
          <p className="mt-2 text-slate-600">Por favor, insira a senha para continuar.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password-input" className="sr-only">
              Senha
            </label>
            <input
              ref={inputRef}
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow disabled:bg-slate-100"
              disabled={isLocked}
              aria-describedby="error-message"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-6 py-3 font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isLocked}
            >
              {isLocked ? `Tente novamente em ${lockoutTime}s` : 'Entrar'}
            </button>
          </div>
        </form>
        {error && (
          <div
            id="error-message"
            className={`p-3 rounded-md text-sm font-medium text-center ${isLocked ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}
            role="alert"
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordProtection;