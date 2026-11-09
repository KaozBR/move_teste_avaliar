/* Move — integra cadastro, login, agenda de aluno, administração e contato.
   Sem servidor: armazenamento demonstrativo local no navegador. */
(async function () {
  'use strict';
  const S = window.MoveStore;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const page = document.body.dataset.page;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const firstName = fullName => String(fullName || '').trim().split(' ')[0];
  const dayMonth = iso => iso ? iso.split('-').slice(1).reverse() : [];

  function error(id, message = '') {
    const element = $(`#${id}`);
    if (!element) return;
    element.textContent = message;
    element.hidden = !message;
  }
  function notice(id, message = '', isError = false) {
    const element = $(`#${id}`);
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('error', isError);
    element.hidden = !message;
  }
  function showDialog(id) {
    const el = $(`#${id}`);
    if (el && !el.open) el.showModal();
  }
  function closeDialog(id) { $(`#${id}`)?.close(); }

function showSuccess(title, detail) {
  const dialog = $('#success-dialog');
  if (!dialog) return;
  $('#success-title').textContent = title;
  $('#success-detail').textContent = detail;
  showDialog('success-dialog');
}

  function addDays(amount, from = new Date()) {
    const d = new Date(from);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + amount);
    return S.todayLocal(d);
  }
  function fillTimes(select, times, preferred = '') {
    select.replaceChildren();
    select.add(new Option(times.length ? 'Selecione um horário' : 'Sem horários disponíveis', ''));
    times.forEach(t => select.add(new Option(t, t)));
    if (times.includes(preferred)) select.value = preferred;
  }
  function bindDialogs() {
    $$('[data-close]').forEach(btn => btn.addEventListener('click', () => closeDialog(btn.dataset.close)));
    $$('.move-dialog').forEach(dialog => {
      dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    });
  }
  function bindLogout() {
    $$('[data-logout]').forEach(btn => btn.addEventListener('click', () => showDialog('logout-dialog')));
    $('#confirm-logout')?.addEventListener('click', () => {
      S.signOut();
      location.href = 'saida.html';
    });
  }
  function setProtectedRole(expected) {
    const user = S.account();
    if (!user) {
      location.replace('login.html');
      return null;
    }
    if (user.role !== expected) {
      location.replace(user.role === 'admin' ? 'admin.html' : 'aluno.html');
      return null;
    }
    return user;
  }

  function handleLogin() {
    const fromSignup = new URLSearchParams(location.search).get('email');
    if (fromSignup) $('#login-email').value = fromSignup.slice(0, 254);
    const form = $('#login-form');
    form.addEventListener('submit', async ev => {
      ev.preventDefault();
      error('login-error');
      const button = $('button[type=submit]', form);
      button.disabled = true;
      try {
        const u = await S.login($('#login-email').value, $('#login-password').value);
        location.assign(u.role === 'admin' ? 'admin.html' : 'aluno.html');
      } catch (e) {
        error('login-error', e.message || 'Não foi possível entrar.');
      } finally { button.disabled = false; }
    });
  }
    // Somente preenche contas fictícias para facilitar a demonstração da AS.
  function bindDemoAccounts() {
    $$('[data-demo]').forEach(button => button.addEventListener('click', () => {
      $('#login-email').value = button.dataset.demo === 'admin' ? 'admin@move.com.br' : 'aluno@move.com.br';
      $('#login-password').value = 'Move@2026';
      $('#login-password').focus();
    }));
  }
  function handleSignup() {
    $('#signup-form').addEventListener('submit', async ev => {
      ev.preventDefault();
      error('signup-error');
      const button = $('#signup-form button[type=submit]');
      button.disabled = true;
      try {
        await S.register({
          name: $('#signup-name').value, email: $('#signup-email').value,
          password: $('#signup-password').value, confirm: $('#signup-confirm').value
        });
        $('#signup-content').hidden = true;
        $('#signup-success').hidden = false;
        $('#signup-to-login').href = `login.html?email=${encodeURIComponent($('#signup-email').value.trim())}`;
        $('#signup-success-email').textContent = $('#signup-email').value.trim();
      } catch (e) {
        error('signup-error', e.message || 'Não foi possível criar a conta.');
      } finally { button.disabled = false; }
    });
  }
  function handleContact() {
    const me = S.account();
    if (me) {
      $('#contact-name').value = me.name;
      $('#contact-email').value = me.email;
    }
    $('#contact-form').addEventListener('submit', ev => {
      ev.preventDefault();
      error('contact-error');
      try {
        S.sendMessage({ name: $('#contact-name').value, email: $('#contact-email').value,
          returnMode: $('#contact-return').value, subject: $('#contact-subject').value,
          message: $('#contact-message').value });
        $('#contact-form').hidden = true;
        $('#contact-success').hidden = false;
      } catch (e) { error('contact-error', e.message); }
    });
  }

  function handleStudent(user) {
    $('#student-name').textContent = firstName(user.name);
    let editingId = null;
    let cancelId = null;
    const dateInput = $('#student-date');
    const timeSelect = $('#student-time');
    dateInput.min = S.todayLocal();
    const currentBooking = id => S.bookingsFor(user.id).find(b => b.id === id);

    function render() {
      const bookings = S.bookingsFor(user.id);
      const container = $('#student-bookings');
      $('#student-count').textContent = `${bookings.length} ${bookings.length === 1 ? 'aula' : 'aulas'}`;
      if (!bookings.length) {
        container.innerHTML = '<div class="empty-state"><span class="empty-icon" aria-hidden="true">◷</span><strong>Você ainda não tem agendamentos</strong><p>Escolha uma data e um horário disponível clicando no botão Agendar aula.</p></div>';
        return;
      }
      container.innerHTML = bookings.map(b => {
        const [day, month, year] = b.date.split('-').reverse();
        const weekday = S.dateLabel(b.date);
        const isLastMinute = S.dateTime(b.date, b.time).getTime() - Date.now() < 24 * 3600000;
        return `<article class="booking-card"><div class="booking-main"><div class="date-tile"><strong>${esc(day)}</strong><span>${esc(month)}/${esc(year)}</span></div><div class="booking-info"><strong>${esc(weekday)}</strong><small>Horário: ${esc(b.time)} · Pilates</small><span class="status-dot">● Confirmado</span></div></div><div class="booking-actions" aria-label="Ações do agendamento"><button class="btn-outline btn-sm" type="button" data-change-id="${esc(b.id)}" aria-label="Alterar aula de ${esc(S.shortDate(b.date))} às ${esc(b.time)}">✎ Alterar</button><button class="btn-danger btn-sm" type="button" data-cancel-id="${esc(b.id)}" aria-label="Cancelar aula de ${esc(S.shortDate(b.date))} às ${esc(b.time)}">× Cancelar</button></div>${isLastMinute ? '<p class="booking-warning">Alterações e cancelamentos exigem 24 horas de antecedência.</p>' : ''}</article>`;
      }).join('');
    }
    function updateSummary() {
      const dt = dateInput.value;
      const time = timeSelect.value;
      $('#student-summary').textContent = dt && time ? `${user.name} • Pilates • ${S.shortDate(dt)} às ${time}.` : 'Selecione data e horário para visualizar sua confirmação.';
    }
    function updateOptions(preferred = '') {
      const dt = dateInput.value;
      const list = dt ? S.available(dt, editingId, false) : [];
      fillTimes(timeSelect, list, preferred);
      const help = $('#student-availability');
      if (help) {
        if (!dt) help.textContent = 'Escolha uma data para consultar horários liberados.';
        else if (list.length) help.textContent = `${list.length} ${list.length === 1 ? 'horário disponível' : 'horários disponíveis'} nesta data.`;
        else if (!S.daySlots(dt).length) help.textContent = 'A administradora ainda não disponibilizou horários para esta data. Selecione outro dia.';
        else if (S.daySlots(dt).every(t => S.dateTime(dt, t).getTime() - Date.now() < 24 * 3600000)) help.textContent = 'Não há horários com pelo menos 24 horas de antecedência nesta data. Escolha outro dia.';
        else help.textContent = 'Os horários deste dia já foram ocupados. Escolha outra data.';
      }
      updateSummary();
    }
    function openBooking(id = null) {
      editingId = id;
      const old = id ? currentBooking(id) : null;
      const date = old?.date || addDays(2);
      dateInput.value = date;
      $('#student-book-title').textContent = id ? 'Alterar agendamento' : 'Agendar aula';
      $('#student-confirm-btn').textContent = id ? 'Salvar alteração' : 'Confirmar agendamento';
      error('student-book-error');
      updateOptions(old?.time || '');
      showDialog('student-book-dialog');
    }
    $('#new-student-booking').addEventListener('click', () => openBooking());
    dateInput.addEventListener('change', () => updateOptions());
    timeSelect.addEventListener('change', updateSummary);
    $('#student-book-form').addEventListener('submit', ev => {
      ev.preventDefault();
      error('student-book-error');
      try {
        const wasEditing = Boolean(editingId);
        if (wasEditing) S.change(editingId, { date: dateInput.value, time: timeSelect.value });
        else S.book({ userId: user.id, date: dateInput.value, time: timeSelect.value });
        const lesson = `${S.shortDate(dateInput.value)} às ${timeSelect.value}`;
        closeDialog('student-book-dialog');
        render();
        notice('student-notice', wasEditing ? 'Aula alterada com sucesso!' : 'Aula agendada com sucesso!');
        showSuccess(wasEditing ? 'Aula alterada com sucesso!' : 'Aula agendada com sucesso!', `${user.name} — Pilates, ${lesson}. Sua agenda está atualizada.`);
      } catch (e) { error('student-book-error', e.message); }
    });
    $('#student-bookings').addEventListener('click', ev => {
      const changeButton = ev.target.closest('[data-change-id]');
      const cancelButton = ev.target.closest('[data-cancel-id]');
      if (changeButton) openBooking(changeButton.dataset.changeId);
      if (cancelButton) {
        cancelId = cancelButton.dataset.cancelId;
        const b = currentBooking(cancelId);
        if (!b) return;
        $('#student-cancel-detail').textContent = `Deseja cancelar a aula de ${S.shortDate(b.date)} às ${b.time}?`;
        error('student-cancel-error');
        showDialog('student-cancel-dialog');
      }
    });
    $('#student-do-cancel').addEventListener('click', () => {
      error('student-cancel-error');
      try {
        const cancelled = S.cancel(cancelId);
        closeDialog('student-cancel-dialog');
        render();
        notice('student-notice', 'Aula cancelada com sucesso!');
        showSuccess('Aula cancelada com sucesso!', `${user.name} — ${S.shortDate(cancelled.date)} às ${cancelled.time}. O horário foi liberado para novos agendamentos.`);
      } catch (e) { error('student-cancel-error', e.message); }
    });
    render();
  }

  function handleAdmin(user) {
    $('#admin-name').textContent = firstName(user.name);
    const datePicker = $('#admin-date');
    datePicker.value = S.todayLocal();
    let editingId = null;
    let cancellingId = null;
    const bookDate = $('#admin-book-date');
    const bookTime = $('#admin-book-time');
    const users = S.members();
    const getBooking = id => S.allBookings().find(b => b.id === id);
    const getMember = id => users.find(u => u.id === id);
    const membersSelect = $('#admin-student');
    membersSelect.add(new Option('Selecione um aluno', ''));
    users.forEach(u => membersSelect.add(new Option(`${u.name} (${u.email})`, u.id)));
    $('#stat-students').textContent = String(users.length);

    function renderSchedule() {
      const date = datePicker.value;
      const slots = S.daySlots(date);
      const bookings = S.bookingsOn(date);
      $('#stat-booked').textContent = String(bookings.length);
      $('#stat-free').textContent = String(S.available(date, null, true).filter(t => S.dateTime(date,t).getTime() > Date.now()).length);
      const container = $('#admin-day');
      if (!slots.length) {
        container.innerHTML = '<div class="empty-state"><span class="empty-icon" aria-hidden="true">◷</span><strong>Nenhum horário definido para esta data</strong><p>Clique em Definir horários para disponibilizar aulas.</p></div>';
        return;
      }
      container.innerHTML = slots.map(time => {
        const b = bookings.find(x => x.time === time);
        const student = b ? getMember(b.userId) : null;
        const past = S.dateTime(date, time).getTime() < Date.now();
        return `<div class="slot-row"><span class="slot-time">${esc(time)}</span><span class="slot-name">${b ? esc(student?.name || 'Aluno') : 'Horário disponível'}</span><span class="slot-status ${b ? 'busy' : ''}">${b ? '● Confirmado' : past ? 'Encerrado' : '● Livre'}</span><div class="slot-actions">${b ? `<button type="button" class="btn-outline btn-sm" data-admin-change="${esc(b.id)}">Alterar</button><button type="button" class="btn-danger btn-sm" data-admin-cancel="${esc(b.id)}">Cancelar</button>` : past ? '' : `<button type="button" class="btn-outline btn-sm" data-admin-free="${esc(time)}">Agendar</button>`}</div></div>`;
      }).join('');
    }
    function renderInbox() {
      const msgs = S.inbox().slice().reverse();
      $('#contact-count').textContent = String(msgs.length);
      $('#admin-messages').innerHTML = msgs.length ? msgs.map(m => `<article class="inbox-item"><strong>${esc(m.subject)} — ${esc(m.name)}</strong><div class="inbox-meta">${esc(m.email)} · Retorno: ${esc(m.returnMode)} · ${esc(new Date(m.createdAt).toLocaleDateString('pt-BR'))}</div><p>${esc(m.message)}</p></article>`).join('') : '<div class="empty-state"><strong>Nenhuma mensagem recebida</strong><p>Mensagens enviadas pelo formulário de Contato aparecerão aqui.</p></div>';
    }
    datePicker.addEventListener('change', renderSchedule);

    function updateBookTimes(preferred = '') {
      const list = S.available(bookDate.value, editingId, true).filter(t => S.dateTime(bookDate.value, t).getTime() >= Date.now());
      fillTimes(bookTime, list, preferred);
      updateSummary();
    }
    function updateSummary() {
      const member = getMember(membersSelect.value);
      $('#admin-summary').textContent = member && bookDate.value && bookTime.value ? `${member.name} • Pilates • ${S.shortDate(bookDate.value)} às ${bookTime.value}.` : 'Selecione aluno, data e horário para conferir o agendamento.';
    }
    function openAdminBooking(id = null, freeTime = '') {
      editingId = id;
      const b = id ? getBooking(id) : null;
      $('#admin-book-title').textContent = id ? 'Alterar agendamento' : 'Agendar aula para um aluno';
      $('#admin-book-form button[type=submit]').textContent = id ? 'Salvar alteração' : 'Salvar agendamento';
      membersSelect.value = b?.userId || '';
      membersSelect.disabled = !!id;
      bookDate.min = S.todayLocal();
      bookDate.value = b?.date || datePicker.value;
      error('admin-book-error');
      updateBookTimes(b?.time || freeTime);
      showDialog('admin-book-dialog');
    }
    $('#admin-new-booking').addEventListener('click', () => openAdminBooking());
    membersSelect.addEventListener('change', updateSummary);
    bookDate.addEventListener('change', () => updateBookTimes());
    bookTime.addEventListener('change', updateSummary);
    $('#admin-book-form').addEventListener('submit', ev => {
      ev.preventDefault();
      error('admin-book-error');
      try {
        const wasEditing = Boolean(editingId);
        if (wasEditing) S.change(editingId, { date: bookDate.value, time: bookTime.value });
        else S.book({ userId: membersSelect.value, date: bookDate.value, time: bookTime.value });
        const member = getMember(membersSelect.value);
        const result = `${member?.name || 'Aluno'} — ${S.shortDate(bookDate.value)} às ${bookTime.value}.`;
        closeDialog('admin-book-dialog');
        datePicker.value = bookDate.value;
        renderSchedule();
        notice('admin-notice', wasEditing ? 'Agendamento alterado com sucesso!' : 'Aula agendada com sucesso!');
        showSuccess(wasEditing ? 'Aula alterada com sucesso!' : 'Aula agendada com sucesso!', result);
      } catch (e) { error('admin-book-error', e.message); }
    });
    $('#admin-day').addEventListener('click', ev => {
      const change = ev.target.closest('[data-admin-change]');
      const cancel = ev.target.closest('[data-admin-cancel]');
      const free = ev.target.closest('[data-admin-free]');
      if (change) openAdminBooking(change.dataset.adminChange);
      if (free) openAdminBooking(null, free.dataset.adminFree);
      if (cancel) {
        cancellingId = cancel.dataset.adminCancel;
        const b = getBooking(cancellingId);
        const member = getMember(b.userId);
        $('#admin-cancel-detail').textContent = `${member?.name || 'Aluno'} — ${S.shortDate(b.date)} às ${b.time}. Deseja realmente cancelar?`;
        error('admin-cancel-error');
        showDialog('admin-cancel-dialog');
      }
    });
    $('#admin-do-cancel').addEventListener('click', () => {
      error('admin-cancel-error');
      try {
        const cancelled = S.cancel(cancellingId);
        const member = getMember(cancelled.userId);
        closeDialog('admin-cancel-dialog');
        renderSchedule();
        notice('admin-notice', 'Agendamento cancelado com sucesso!');
        showSuccess('Aula cancelada com sucesso!', `${member?.name || 'Aluno'} — ${S.shortDate(cancelled.date)} às ${cancelled.time}.`);
      } catch (e) { error('admin-cancel-error', e.message); }
    });

    const hoursDate = $('#hours-date');
    hoursDate.min = S.todayLocal();
    function renderHours() {
      const selected = new Set(S.daySlots(hoursDate.value));
      $('#hours-checkboxes').innerHTML = S.TIMES.map(time => `<label class="time-choice"><input type="checkbox" value="${time}" ${selected.has(time) ? 'checked' : ''}><span>${time}</span></label>`).join('');
    }
    function openHours() {
      hoursDate.value = datePicker.value;
      error('admin-hours-error');
      renderHours();
      showDialog('admin-hours-dialog');
    }
    $('#admin-define-hours').addEventListener('click', openHours);
    $$('[data-set-hours]').forEach(btn => btn.addEventListener('click', openHours));
    hoursDate.addEventListener('change', renderHours);
    $('#admin-hours-form').addEventListener('submit', ev => {
      ev.preventDefault();
      error('admin-hours-error');
      try {
        const selected = $$('#hours-checkboxes input:checked').map(input => input.value);
        S.setDaySlots(hoursDate.value, selected);
        closeDialog('admin-hours-dialog');
        datePicker.value = hoursDate.value;
        renderSchedule();
        notice('admin-notice', 'Horários disponíveis atualizados com sucesso!');
        showSuccess('Horários adicionados com sucesso!', `${S.shortDate(hoursDate.value)} — ${selected.length ? selected.sort().join(', ') : 'nenhum horário disponível'}.`);
      } catch (e) { error('admin-hours-error', e.message); }
    });
    renderSchedule();
    renderInbox();
  }

  try {
    await S.init();
    if (page === 'home') {
      const user = S.account();
      if (user) {
        const navLogin = $('.nav-login');
        if (navLogin) {
          navLogin.href = user.role === 'admin' ? 'admin.html' : 'aluno.html';
          navLogin.textContent = user.role === 'admin' ? 'Área administrativa' : 'Minha agenda';
        }
      }
    }
    bindDialogs();
    bindLogout();
    if (page === 'login') { handleLogin(); bindDemoAccounts(); }
    if (page === 'cadastro') handleSignup();
    if (page === 'contato') handleContact();
    if (page === 'aluno') {
      const u = setProtectedRole('aluno');
      if (u) handleStudent(u);
    }
    if (page === 'admin') {
      const u = setProtectedRole('admin');
      if (u) handleAdmin(u);
    }
  } catch (e) {
    console.error('Move — erro ao iniciar o protótipo:', e);
    const main = $('#conteudo');
    if (main) {
      const message = document.createElement('p');
      message.className = 'form-alert';
      message.setAttribute('role', 'alert');
      message.textContent = 'Não foi possível iniciar o protótipo. Execute pelo Live Server do VS Code (http://localhost:5500).';
      main.prepend(message);
    }
  }
})();
