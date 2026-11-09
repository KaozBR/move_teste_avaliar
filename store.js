/* Move — armazenamento demonstrativo no navegador.
   IMPORTANTE: localStorage não substitui banco de dados ou autenticação segura.
   Utilize apenas dados e senhas FICTÍCIOS. */
(function () {
  'use strict';

  const KEY = 'move_as_prototipo_v1';
  const SESSION_KEY = 'move_as_sessao_v1';
  const HOUR_MS = 60 * 60 * 1000;
  const TIMES = ['07:00', '08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

  function read() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch (_) {
      return null;
    }
  }
  function write(data) { localStorage.setItem(KEY, JSON.stringify(data)); }
  function todayLocal(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  function dateTime(date, time) { return new Date(`${date}T${time}:00`); }
  function dateLabel(value) {
    if (!value) return '';
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(year, month - 1, day));
  }
  function shortDate(value) {
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  }
  function safeEmail(value) { return String(value || '').trim().toLowerCase(); }
  function uid() { return (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; }
  function saltValue() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }
  async function passwordHash(password, salt) {
    const bytes = new TextEncoder().encode(`${salt}:${password}`);
    if (!crypto.subtle) {
      // Apenas para abrir o protótipo demonstrativo via file:// (não é autenticação real).
      let hash = 2166136261;
      for (const byte of bytes) hash = Math.imul(hash ^ byte, 16777619);
      return 'demo-' + (hash >>> 0).toString(16).padStart(8, '0');
    }
    const result = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(result), b => b.toString(16).padStart(2, '0')).join('');
  }
  async function demoUser(name, email, password, role) {
    const salt = saltValue();
    return { id: uid(), name, email: safeEmail(email), salt, hash: await passwordHash(password, salt), role };
  }
  const defaults = {
    contasDemo: [
      { nome: 'Cristiane Silva', email: 'admin@move.com.br', perfil: 'admin' },
      { nome: 'Camila Souza', email: 'aluno@move.com.br', perfil: 'aluno' }
    ],
    horariosPadrao: {
      diasUteis: ['07:00', '09:00', '10:00', '14:00', '16:00', '18:00'],
      sabado: ['08:00', '09:00', '10:00'], domingo: []
    }
  };
  async function fixtures() {
    try {
      const response = await fetch('data/dados-iniciais.json', { cache: 'no-store' });
      if (response.ok) {
        const parsed = await response.json();
        if (Array.isArray(parsed.contasDemo) && parsed.contasDemo.length >= 2 && parsed.horariosPadrao) return parsed;
      }
    } catch (_) { /* Permite testes sem servidor e ambientes de demonstração. */ }
    return defaults;
  }
  function normalizedSlots(date, config) {
    const dateObj = new Date(`${date}T12:00:00`);
    const day = dateObj.getDay();
    const scheduled = day === 0 ? config.domingo : day === 6 ? config.sabado : config.diasUteis;
    return Array.isArray(scheduled) ? scheduled.filter(t => TIMES.includes(t)) : [];
  }

  async function init() {
    if (read()) return;
    const seed = await fixtures();
    const adminDemo = seed.contasDemo.find(c => c.perfil === 'admin') || defaults.contasDemo[0];
    const alunoDemo = seed.contasDemo.find(c => c.perfil === 'aluno') || defaults.contasDemo[1];
    const admin = await demoUser(adminDemo.nome, adminDemo.email, 'Move@2026', 'admin');
    const student = await demoUser(alunoDemo.nome, alunoDemo.email, 'Move@2026', 'aluno');
    const days = [];
    for (let i = 0; i < 120; i++) {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() + i);
      days.push({ date: todayLocal(d), times: normalizedSlots(todayLocal(d), seed.horariosPadrao) });
    }
    const eligible = days.filter(d => d.times.length && dateTime(d.date, '16:00').getTime() > Date.now() + 48 * HOUR_MS);
    const bookings = eligible.slice(0, 2).map((d, idx) => ({
      id: uid(), userId: student.id, date: d.date,
      time: d.times.includes(idx ? '09:00' : '16:00') ? (idx ? '09:00' : '16:00') : d.times[0],
      status: 'ativo', createdAt: new Date().toISOString()
    }));
    write({ users: [admin, student], days, bookings, messages: [] });
  }

  function account() {
    const session = sessionStorage.getItem(SESSION_KEY);
    if (!session) return null;
    const db = read();
    return db?.users.find(u => u.id === session) || null;
  }
  function role() { return account()?.role || null; }
  function signOut() { sessionStorage.removeItem(SESSION_KEY); }
  function publicUser(u) { return u && { id: u.id, name: u.name, email: u.email, role: u.role }; }
  function members() { return (read()?.users || []).filter(u => u.role === 'aluno').map(publicUser); }
  function fail(message) { throw new Error(message); }

  async function register({ name, email, password, confirm }) {
    name = String(name || '').trim();
    email = safeEmail(email);
    if (!name || !email || !password || !confirm) fail('Preencha todos os campos obrigatórios.');
    if (name.length > 100) fail('O nome deve conter no máximo 100 caracteres.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length < 6) fail('Informe um e-mail válido.');
    if (password.length < 8) fail('A senha deve ter pelo menos 8 caracteres.');
    if (password !== confirm) fail('As senhas não coincidem. Confira e tente novamente.');
    const db = read();
    if (db.users.some(u => u.email === email)) fail('Este e-mail já está cadastrado.');
    const user = await demoUser(name, email, password, 'aluno');
    db.users.push(user);
    write(db);
    return publicUser(user);
  }
  async function login(email, password) {
    const db = read();
    const u = db?.users.find(x => x.email === safeEmail(email));
    const genericError = 'E-mail ou senha inválidos.';
    if (!u || !password) fail(genericError);
    const hash = await passwordHash(password, u.salt);
    if (hash !== u.hash) fail(genericError);
    sessionStorage.setItem(SESSION_KEY, u.id);
    return publicUser(u);
  }
  function allBookings() {
    return (read()?.bookings || []).filter(b => b.status === 'ativo');
  }
  function booked(date, time, ignoreId = null) {
    return allBookings().some(b => b.date === date && b.time === time && b.id !== ignoreId);
  }
  function daySlots(date) {
    return read()?.days.find(d => d.date === date)?.times || [];
  }
  function available(date, ignoreId = null, asAdmin = false) {
    return daySlots(date).filter(time => !booked(date, time, ignoreId) && (asAdmin || dateTime(date, time).getTime() - Date.now() >= 24 * HOUR_MS));
  }
  function validateDate(date, time, admin) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !/^\d{2}:\d{2}$/.test(time || '')) fail('Selecione uma data e um horário.');
    const when = dateTime(date, time).getTime();
    if (!Number.isFinite(when) || todayLocal(dateTime(date, time)) !== date || !TIMES.includes(time)) fail('Data ou horário inválido.');
    if (!admin && when - Date.now() < 24 * HOUR_MS) fail('Para alunos, é necessário agendar, alterar ou cancelar com pelo menos 24 horas de antecedência.');
    if (admin && when < Date.now()) fail('Não é possível agendar aulas em horários que já passaram.');
    if (!daySlots(date).includes(time)) fail('Esse horário não foi disponibilizado pela administradora.');
  }
  function bookingsFor(userId) {
    return (read()?.bookings || []).filter(b => b.userId === userId && b.status === 'ativo').sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  }
  function bookingsOn(date) {
    return allBookings().filter(b => b.date === date).sort((a, b) => a.time.localeCompare(b.time));
  }
  function book({ userId, date, time }) {
    const me = account();
    if (!me) fail('Entre na sua conta para agendar.');
    const isAdmin = me.role === 'admin';
    if (!isAdmin && userId !== me.id) fail('Você só pode agendar para sua própria conta.');
    if (!read().users.some(u => u.id === userId && u.role === 'aluno')) fail('Selecione um aluno válido.');
    validateDate(date, time, isAdmin);
    if (booked(date, time)) fail('Este horário já está ocupado. Escolha outro.');
    const db = read();
    const result = { id: uid(), userId, date, time, status: 'ativo', createdAt: new Date().toISOString() };
    db.bookings.push(result);
    write(db);
    return result;
  }
  function change(id, { date, time }) {
    const me = account();
    if (!me) fail('É necessário entrar na conta.');
    const db = read();
    const b = db.bookings.find(x => x.id === id && x.status === 'ativo');
    if (!b) fail('Agendamento não encontrado.');
    if (me.role !== 'admin' && b.userId !== me.id) fail('Você não pode alterar esse agendamento.');
    if (me.role !== 'admin' && dateTime(b.date, b.time).getTime() - Date.now() < 24 * HOUR_MS) fail('Não é possível alterar uma aula com menos de 24 horas de antecedência.');
    validateDate(date, time, me.role === 'admin');
    if (booked(date, time, id)) fail('Este horário já está ocupado. Escolha outro.');
    b.date = date;
    b.time = time;
    b.updatedAt = new Date().toISOString();
    write(db);
    return b;
  }
  function cancel(id) {
    const me = account();
    if (!me) fail('É necessário entrar na conta.');
    const db = read();
    const b = db.bookings.find(x => x.id === id && x.status === 'ativo');
    if (!b) fail('Agendamento não encontrado.');
    if (me.role !== 'admin' && b.userId !== me.id) fail('Você não pode cancelar esse agendamento.');
    if (me.role !== 'admin' && dateTime(b.date, b.time).getTime() - Date.now() < 24 * HOUR_MS) fail('Não é possível cancelar uma aula com menos de 24 horas de antecedência.');
    b.status = 'cancelado';
    b.cancelledAt = new Date().toISOString();
    write(db);
    return b;
  }
  function setDaySlots(date, slots) {
    const me = account();
    if (me?.role !== 'admin') fail('Apenas a administradora pode definir horários disponíveis.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) fail('Selecione uma data válida.');
    if (date < todayLocal()) fail('Selecione hoje ou uma data futura.');
    const sorted = [...new Set(slots.filter(t => TIMES.includes(t)))].sort();
    const occupiedTimes = bookingsOn(date).map(b => b.time);
    if (occupiedTimes.some(time => !sorted.includes(time))) fail('Não é possível remover um horário que já possui uma aula agendada.');
    const db = read();
    const row = db.days.find(d => d.date === date);
    if (row) row.times = sorted;
    else db.days.push({ date, times: sorted });
    write(db);
    return sorted;
  }
  function sendMessage({ name, email, returnMode, subject, message }) {
    name = String(name || '').trim();
    email = safeEmail(email);
    message = String(message || '').trim();
    if (!name || !email || !returnMode || !subject || !message) fail('Preencha todos os campos para enviar a mensagem.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Informe um e-mail válido.');
    if (!['WhatsApp', 'E-mail', 'Ligação'].includes(returnMode)) fail('Selecione uma opção válida de retorno.');
    if (!['Elogios', 'Reclamações', 'Dúvidas', 'Aula de pilates'].includes(subject)) fail('Selecione um assunto válido.');
    const db = read();
    db.messages.push({ id: uid(), name, email, returnMode, subject, message, createdAt: new Date().toISOString() });
    write(db);
  }
  function inbox() { return read()?.messages || []; }
  function resetDemo() { localStorage.removeItem(KEY); signOut(); }

  window.MoveStore = {
    init, account, role, publicUser, members, register, login, signOut, book, change, cancel,
    allBookings, bookingsFor, bookingsOn, daySlots, available, setDaySlots, sendMessage, inbox,
    shortDate, dateLabel, todayLocal, dateTime, TIMES, resetDemo, read
  };
})();
