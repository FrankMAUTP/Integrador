// =========================================
// LOGIN.JS
// =========================================

const _recovery = { email: null, userId: null };
const _register = { email: null };
let _activeCodeFlow = 'recovery'; // 'recovery' | 'register'

// ---- CARD SWITCHING ----
function switchCard(id) {
  document.querySelectorAll('.lcard').forEach(c => c.classList.remove('active'));
  const target = document.getElementById(id);
  if (!target) return;
  target.classList.add('active');
  const first = target.querySelector('input:not([readonly]):not([tabindex="-1"])');
  if (first) setTimeout(() => first.focus(), 40);
}

// ---- HELPER: configura el modal-code según el flujo ----
function _setupCodeModal(flow, email) {
  _activeCodeFlow = flow;
  document.getElementById('code-email-lbl').textContent = email;

  const title   = document.getElementById('code-modal-title');
  const sub     = document.getElementById('code-modal-sub');
  const chgLink = document.getElementById('code-change-link');

  if (flow === 'register') {
    title.textContent = 'Verificar correo';
    sub.innerHTML = 'Enviamos un código de 6 dígitos a<br/><strong id="code-email-lbl" class="lcard-highlight">' + email + '</strong>';
    chgLink.textContent = 'Cambiar correo';
    chgLink.onclick = () => switchCard('modal-register');
  } else {
    title.textContent = 'Ingresar código';
    sub.innerHTML = 'Enviamos un código de 6 dígitos a<br/><strong id="code-email-lbl" class="lcard-highlight">' + email + '</strong>';
    chgLink.textContent = 'Cambiar correo';
    chgLink.onclick = () => switchCard('modal-recover');
  }

  _clearCodeDigits();
  switchCard('modal-code');
  setTimeout(() => {
    const first = document.querySelector('.code-digit');
    if (first) first.focus();
  }, 60);
}

// ---- MODAL 1: LOGIN ----
async function doLogin() {
  const username = document.getElementById('l-user').value.trim();
  const password = document.getElementById('l-pass').value;

  if (!username || !password) { showToast('Completa todos los campos', 'error'); return; }

  try {
    const res  = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Usuario o contraseña incorrectos', 'error'); return; }

    DB.set('currentUser', { id: data.id, username: data.username, displayName: data.displayName, email: data.email, rol: data.rol });
    showToast(`Bienvenido, ${data.displayName || data.username}`, 'success');
    const dest = data.rol === 'admin' ? 'admin-dashboard.html' : 'inicio.html';
    setTimeout(() => { window.location.href = dest; }, 900);
  } catch {
    showToast('No se pudo conectar con el servidor', 'error');
  }
}

// ---- MODAL 2: CREAR CUENTA ----
async function doRegister() {
  const username = document.getElementById('r-user').value.trim();
  const email    = document.getElementById('r-email').value.trim().toLowerCase();
  const pass     = document.getElementById('r-pass').value;
  const pass2    = document.getElementById('r-pass2').value;

  if (!username || !email || !pass || !pass2) { showToast('Completa todos los campos', 'error'); return; }
  if (username.length < 3)  { showToast('El usuario debe tener al menos 3 caracteres', 'error'); return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { showToast('Ingresa un correo electrónico válido', 'error'); return; }
  if (pass.length < 6)      { showToast('La contraseña debe tener al menos 6 caracteres', 'error'); return; }
  if (pass !== pass2)       { showToast('Las contraseñas no coinciden', 'error'); return; }

  try {
    const res  = await fetch('/api/auth/send-register-code', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, email, password: pass }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Error al enviar el código', 'error'); return; }

    _register.email = email;
    showToast('Código enviado a tu correo', 'success');
    _setupCodeModal('register', email);
  } catch {
    showToast('No se pudo conectar con el servidor', 'error');
  }
}

// ---- MODAL 3: RECUPERAR CONTRASEÑA ----
async function doRecover() {
  const email = document.getElementById('rec-email').value.trim().toLowerCase();
  if (!email) { showToast('Ingresa tu correo electrónico', 'error'); return; }

  try {
    const res  = await fetch('/api/auth/send-recovery-code', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Error al enviar el código', 'error'); return; }

    _recovery.email = email;
    showToast('Código enviado a tu correo', 'success');
    _setupCodeModal('recovery', email);
  } catch {
    showToast('No se pudo conectar con el servidor', 'error');
  }
}

// ---- MODAL 4: REENVIAR CÓDIGO ----
async function doResendCode() {
  if (_activeCodeFlow === 'register') {
    if (!_register.email) return;
    try {
      const res = await fetch('/api/auth/send-register-code', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          username: document.getElementById('r-user').value.trim(),
          email:    _register.email,
          password: document.getElementById('r-pass').value,
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'No se pudo reenviar', 'error'); return; }
      showToast('Nuevo código enviado', 'success');
    } catch {
      showToast('No se pudo conectar con el servidor', 'error');
    }
  } else {
    if (!_recovery.email) return;
    try {
      const res = await fetch('/api/auth/send-recovery-code', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: _recovery.email }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'No se pudo reenviar', 'error'); return; }
      showToast('Nuevo código enviado', 'success');
    } catch {
      showToast('No se pudo conectar con el servidor', 'error');
    }
  }
  _clearCodeDigits();
  setTimeout(() => {
    const first = document.querySelector('.code-digit');
    if (first) first.focus();
  }, 40);
}

// ---- MODAL 4: VERIFICAR CÓDIGO ----
async function doVerifyCode() {
  const digits  = [...document.querySelectorAll('.code-digit')];
  const entered = digits.map(d => d.value).join('');

  if (entered.length < 6) {
    showToast('Ingresa el código completo de 6 dígitos', 'error'); return;
  }

  if (_activeCodeFlow === 'register') {
    try {
      const res  = await fetch('/api/auth/verify-register-code', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: _register.email, code: entered }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Código incorrecto', 'error');
        _clearCodeDigits();
        digits[0].focus();
        return;
      }
      _register.email = null;
      document.getElementById('r-user').value  = '';
      document.getElementById('r-email').value = '';
      document.getElementById('r-pass').value  = '';
      document.getElementById('r-pass2').value = '';
      showToast('Cuenta creada correctamente. Inicia sesión.', 'success');
      switchCard('modal-login');
    } catch {
      showToast('No se pudo conectar con el servidor', 'error');
    }
  } else {
    try {
      const res  = await fetch('/api/auth/verify-recovery-code', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: _recovery.email, code: entered }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Código incorrecto', 'error');
        _clearCodeDigits();
        digits[0].focus();
        return;
      }
      _recovery.userId = data.userId;
      document.getElementById('reset-email').value = data.email;
      document.getElementById('reset-user').value  = data.username;
      document.getElementById('reset-pass').value  = '';
      document.getElementById('reset-pass2').value = '';
      showToast('Código verificado correctamente', 'success');
      switchCard('modal-reset');
    } catch {
      showToast('No se pudo conectar con el servidor', 'error');
    }
  }
}

// ---- MODAL 5: RESTABLECER CONTRASEÑA ----
async function doReset() {
  const pass  = document.getElementById('reset-pass').value;
  const pass2 = document.getElementById('reset-pass2').value;

  if (!pass || !pass2)   { showToast('Completa todos los campos', 'error'); return; }
  if (pass.length < 6)   { showToast('La contraseña debe tener al menos 6 caracteres', 'error'); return; }
  if (pass !== pass2)    { showToast('Las contraseñas no coinciden', 'error'); return; }
  if (!_recovery.userId) { showToast('Error: sesión expirada', 'error'); return; }

  try {
    const res  = await fetch('/api/auth/reset-password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId: _recovery.userId, newPassword: pass }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Error al restablecer la contraseña', 'error'); return; }

    const savedUsername = document.getElementById('reset-user').value;
    _recovery.email = _recovery.userId = null;
    showToast('Contraseña restablecida. Inicia sesión.', 'success');
    document.getElementById('rec-email').value = '';
    document.getElementById('l-user').value    = savedUsername;
    document.getElementById('l-pass').value    = '';
    switchCard('modal-login');
  } catch {
    showToast('No se pudo conectar con el servidor', 'error');
  }
}

// ---- HELPERS ----
function _clearCodeDigits() {
  document.querySelectorAll('.code-digit').forEach(d => {
    d.value = '';
    d.classList.remove('filled');
  });
}

// ---- CODE INPUT BEHAVIOUR ----
document.addEventListener('DOMContentLoaded', async () => {
  if (!await dbReady()) return;

  const digits = [...document.querySelectorAll('.code-digit')];

  digits.forEach((input, idx) => {
    input.addEventListener('input', e => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val ? val[val.length - 1] : '';
      e.target.classList.toggle('filled', !!e.target.value);

      if (e.target.value && idx < digits.length - 1) {
        digits[idx + 1].focus();
      }

      if (digits.every(d => d.value)) {
        setTimeout(doVerifyCode, 220);
      }
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !e.target.value && idx > 0) {
        digits[idx - 1].value = '';
        digits[idx - 1].classList.remove('filled');
        digits[idx - 1].focus();
      }
      if (e.key === 'Enter') doVerifyCode();
    });

    input.addEventListener('paste', e => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData)
        .getData('text').replace(/\D/g, '').slice(0, 6);
      [...pasted].forEach((char, i) => {
        if (digits[idx + i]) {
          digits[idx + i].value = char;
          digits[idx + i].classList.add('filled');
        }
      });
      const next = digits.find((d, i) => i >= idx && !d.value);
      (next || digits[digits.length - 1]).focus();
    });
  });
});
