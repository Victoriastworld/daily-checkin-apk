import './style.css'

interface CheckInRecord {
  date: string;
  time: string;
  note: string;
  count: number;
  duration?: number;
}

interface AbsenceRecord {
  date: string;
  reason: 'leave' | 'other';
  description?: string;
}

interface User {
  username: string;
  isLoggedIn: boolean;
}

interface AppState {
  records: CheckInRecord[];
  absences: AbsenceRecord[];
  currentMonth: Date;
  missedDays: number;
  pendingDuration: number;
  lastCheckInTime?: Date;
  user: User | null;
}

class CheckInApp {
  private state: AppState;
  private countdownTimer: number | null = null;
  private checkInTimestamp: number = 0;
  private targetDuration: number = 0;

  constructor() {
    this.state = {
      records: [],
      absences: [],
      currentMonth: new Date(),
      missedDays: 0,
      pendingDuration: 1,
      user: null
    };
    this.loadState();
    this.init();
    this.requestNotificationPermission();
    this.registerServiceWorker();
  }

  private getTodayString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private loadState(): void {
    const savedUser = localStorage.getItem('checkInUser');
    if (savedUser) {
      this.state.user = JSON.parse(savedUser);
    }
    const savedRecords = localStorage.getItem('checkInRecords');
    if (savedRecords) {
      this.state.records = JSON.parse(savedRecords);
    }
    const savedAbsences = localStorage.getItem('checkInAbsences');
    if (savedAbsences) {
      this.state.absences = JSON.parse(savedAbsences);
    }
    const savedMissed = localStorage.getItem('missedDays');
    if (savedMissed) {
      this.state.missedDays = parseInt(savedMissed);
      this.state.pendingDuration = this.calculatePendingDuration();
    }
    const lastCheckIn = localStorage.getItem('lastCheckInTime');
    if (lastCheckIn) {
      this.state.lastCheckInTime = new Date(lastCheckIn);
    }
    this.checkMissedDays();
  }

  private saveState(): void {
    if (this.state.user) {
      localStorage.setItem('checkInUser', JSON.stringify(this.state.user));
    }
    localStorage.setItem('checkInRecords', JSON.stringify(this.state.records));
    localStorage.setItem('checkInAbsences', JSON.stringify(this.state.absences));
    localStorage.setItem('missedDays', this.state.missedDays.toString());
    if (this.state.lastCheckInTime) {
      localStorage.setItem('lastCheckInTime', this.state.lastCheckInTime.toISOString());
    }
  }

  private calculatePendingDuration(): number {
    return 1 + this.state.missedDays;
  }

  private checkMissedDays(): void {
    const yesterday = this.getYesterdayString();

    const checkedInYesterday = this.state.records.some(r => r.date === yesterday);
    const onLeaveYesterday = this.state.absences.some(a => a.date === yesterday && a.reason === 'leave');

    if (!checkedInYesterday && !onLeaveYesterday) {
      const otherAbsenceYesterday = this.state.absences.find(a => a.date === yesterday && a.reason === 'other');
      if (otherAbsenceYesterday) {
        this.state.missedDays++;
      }
    } else {
      this.state.missedDays = 0;
    }
    this.state.pendingDuration = this.calculatePendingDuration();
  }

  private getYesterdayString(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  }

  private getTodayCheckIn(): CheckInRecord | undefined {
    return this.state.records.find(r => r.date === this.getTodayString());
  }

  private getStreakDays(): number {
    if (this.state.records.length === 0) return 0;

    const sortedRecords = [...this.state.records].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedRecords.length; i++) {
      const recordDate = new Date(sortedRecords[i].date);
      recordDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      if (recordDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private async requestNotificationPermission(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (e) {
        console.log('Service Worker registration not available');
      }
    }
  }

  private scheduleReminder(duration: number): void {
    const durationMs = duration * 60 * 60 * 1000;

    const nextReminder = new Date(Date.now() + durationMs);
    localStorage.setItem('nextReminder', nextReminder.toISOString());
    localStorage.setItem('reminderDuration', duration.toString());

    setTimeout(() => {
      this.showNotification(`Future 打卡提醒`, `您已完成${duration}小时打卡！`);
    }, durationMs);
  }

  private showNotification(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/vite.svg' });
    }

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body
      });
    }
  }

  private getMonthDays(year: number, month: number): (string | null)[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (string | null)[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push(dateStr);
    }

    return days;
  }

  private getDayStatus(dateStr: string): 'checked' | 'leave' | 'missed' | 'future' | 'none' {
    const today = this.getTodayString();
    const todayDate = new Date(today);
    const checkDate = new Date(dateStr);

    if (checkDate > todayDate) return 'future';

    if (this.state.records.some(r => r.date === dateStr)) return 'checked';
    if (this.state.absences.some(a => a.date === dateStr && a.reason === 'leave')) return 'leave';

    if (checkDate < todayDate) {
      const hasAbsence = this.state.absences.find(a => a.date === dateStr);
      if (hasAbsence && hasAbsence.reason === 'other') return 'missed';
    }

    return 'none';
  }

  private render(): void {
    const app = document.getElementById('app')!;

    if (!this.state.user || !this.state.user.isLoggedIn) {
      app.innerHTML = `
        <div class="login-container">
          <div class="login-box">
            <h1>Future</h1>
            <p class="login-subtitle">请先登录</p>
            <form id="loginForm">
              <input type="text" id="username" placeholder="请输入用户名" required />
              <button type="submit" class="login-btn">登录</button>
            </form>
          </div>
        </div>
      `;
      this.attachLoginListeners();
      return;
    }

    const todayCheckIn = this.getTodayCheckIn();
    const hasCheckedIn = !!todayCheckIn;
    const streak = this.getStreakDays();
    const totalDays = this.state.records.length;

    app.innerHTML = `
      <div class="container">
        <header class="header">
          <div class="header-top">
            <h1>Future</h1>
            <button id="logoutBtn" class="logout-btn">退出</button>
          </div>
          <p class="user-info">欢迎，${this.state.user.username}</p>
          <p class="date">${this.getTodayString()}</p>
        </header>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-value">${streak}</div>
            <div class="stat-label">连续打卡</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${totalDays}</div>
            <div class="stat-label">总打卡次数</div>
          </div>
          <div class="stat-card warning">
            <div class="stat-value">${this.state.pendingDuration}h</div>
            <div class="stat-label">待完成时长</div>
          </div>
        </div>

        <div class="checkin-section">
          ${hasCheckedIn ? `
            <div class="checked-in">
              <div class="checkmark">✓</div>
              <p class="checkin-time">打卡时间: ${todayCheckIn.time}</p>
              <p class="checkin-duration">完成时长: ${todayCheckIn.duration || 1}小时</p>
              ${todayCheckIn.note ? `<p class="checkin-note">${todayCheckIn.note}</p>` : ''}
              <p class="checkin-count">第 ${todayCheckIn.count} 天</p>
            </div>
            <div class="countdown-section" id="countdownSection">
              <p class="countdown-title">距离打卡完成还剩</p>
              <div class="countdown-timer" id="countdownTimer">--:--:--</div>
              <div class="countdown-progress">
                <div class="countdown-progress-bar" id="countdownProgress" style="width: 100%"></div>
              </div>
            </div>
          ` : `
            <button id="checkinBtn" class="checkin-btn">
              <span class="btn-icon">+</span>
              <span class="btn-text">立即打卡</span>
            </button>
            <div class="pending-info">
              <p>今日待完成: <strong>${this.state.pendingDuration}小时</strong></p>
            </div>
            <div class="note-section">
              <input type="text" id="noteInput" placeholder="添加备注 (可选)" maxlength="50" />
            </div>
          `}
        </div>

        <div class="calendar-section">
          <div class="calendar-header">
            <button id="prevMonth" class="month-nav">&lt;</button>
            <h2 id="monthTitle">${this.state.currentMonth.getFullYear()}年${this.state.currentMonth.getMonth() + 1}月</h2>
            <button id="nextMonth" class="month-nav">&gt;</button>
          </div>
          <div class="calendar-weekdays">
            <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
          </div>
          <div class="calendar-grid" id="calendarGrid">
            ${this.renderCalendarDays()}
          </div>
          <div class="calendar-legend">
            <span class="legend-item"><span class="dot checked"></span>已打卡</span>
            <span class="legend-item"><span class="dot leave"></span>请假</span>
            <span class="legend-item"><span class="dot missed"></span>未打卡</span>
          </div>
        </div>

        <div class="records-section">
          <h2>打卡记录</h2>
          <div class="records-list" id="recordsList">
            ${this.state.records.length === 0 ? '<p class="no-records">暂无打卡记录</p>' : ''}
            ${this.state.records
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 30)
              .map(r => `
                <div class="record-item ${r.date === this.getTodayString() ? 'today' : ''}">
                  <div class="record-date">${r.date}</div>
                  <div class="record-time">${r.time}</div>
                  <div class="record-duration">${r.duration || 1}h</div>
                  ${r.note ? `<div class="record-note">${r.note}</div>` : ''}
                </div>
              `).join('')}
          </div>
        </div>

        ${this.state.records.length > 0 ? `
          <button id="clearBtn" class="clear-btn">清除所有记录</button>
        ` : ''}
      </div>

      <div id="modal" class="modal" style="display:none;">
        <div class="modal-content">
          <h3 id="modalTitle">选择原因</h3>
          <p id="modalDate"></p>
          <div class="modal-buttons">
            <button id="btnLeave" class="modal-btn leave">请假</button>
            <button id="btnOther" class="modal-btn other">其他原因</button>
          </div>
          <div id="otherReasonSection" class="other-reason-section" style="display:none;">
            <textarea id="reasonInput" placeholder="请输入原因..." maxlength="100"></textarea>
            <button id="saveReason" class="save-btn">保存</button>
          </div>
          <button id="closeModal" class="close-btn">取消</button>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private renderCalendarDays(): string {
    const year = this.state.currentMonth.getFullYear();
    const month = this.state.currentMonth.getMonth();
    const days = this.getMonthDays(year, month);

    return days.map(day => {
      if (!day) return '<div class="calendar-day empty"></div>';

      const status = this.getDayStatus(day);
      const isToday = day === this.getTodayString();

      let className = 'calendar-day';
      if (isToday) className += ' today';
      className += ` ${status}`;

      const dayNum = new Date(day).getDate();
      let content = `<span class="day-number">${dayNum}</span>`;
      if (status === 'checked') {
        content += '<span class="day-check">✓</span>';
      } else if (status === 'leave') {
        content += '<span class="day-leave">假</span>';
      } else if (status === 'missed') {
        content += '<span class="day-missed">缺</span>';
      }

      return `<div class="${className}" data-date="${day}">${content}</div>`;
    }).join('');
  }

  private attachLoginListeners(): void {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById('username') as HTMLInputElement;
        const username = usernameInput?.value.trim();
        if (username) {
          this.state.user = { username, isLoggedIn: true };
          this.saveState();
          this.render();
        }
      });
    }
  }

  private attachEventListeners(): void {
    const logoutBtn = document.getElementById('logoutBtn');
    const checkinBtn = document.getElementById('checkinBtn');
    const clearBtn = document.getElementById('clearBtn');
    const prevMonth = document.getElementById('prevMonth');
    const nextMonth = document.getElementById('nextMonth');
    const closeModal = document.getElementById('closeModal');
    const btnLeave = document.getElementById('btnLeave');
    const btnOther = document.getElementById('btnOther');
    const saveReason = document.getElementById('saveReason');

    const todayCheckIn = this.getTodayCheckIn();
    const hasCheckedIn = !!todayCheckIn;

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    if (checkinBtn) {
      checkinBtn.addEventListener('click', () => this.handleCheckIn());
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.handleClear());
    }

    if (prevMonth) {
      prevMonth.addEventListener('click', () => this.changeMonth(-1));
    }

    if (nextMonth) {
      nextMonth.addEventListener('click', () => this.changeMonth(1));
    }

    if (closeModal) {
      closeModal.addEventListener('click', () => this.closeModal());
    }

    if (btnLeave) {
      btnLeave.addEventListener('click', () => this.handleLeave());
    }

    if (btnOther) {
      btnOther.addEventListener('click', () => this.showOtherReasonSection());
    }

    if (saveReason) {
      saveReason.addEventListener('click', () => this.saveOtherReason());
    }

    if (hasCheckedIn && todayCheckIn) {
      this.startCountdown(todayCheckIn);
    }

    document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
      day.addEventListener('click', (e) => {
        const dateStr = (e.currentTarget as HTMLElement).dataset.date;
        if (dateStr) this.handleDayClick(dateStr);
      });
    });
  }

  private handleLogout(): void {
    if (confirm('确定要退出登录吗？')) {
      this.state.user = null;
      this.saveState();
      this.render();
    }
  }

  private handleDayClick(dateStr: string): void {
    const today = this.getTodayString();
    const dayDate = new Date(dateStr);
    const todayDate = new Date(today);

    if (dayDate >= todayDate) return;

    const status = this.getDayStatus(dateStr);

    if (status === 'checked' || status === 'leave') {
      alert(`日期: ${dateStr}\n类型: ${status === 'checked' ? '已打卡' : '请假'}`);
      return;
    }

    if (status === 'missed' || status === 'none') {
      this.openModal(dateStr);
    }
  }

  private openModal(dateStr: string): void {
    const modal = document.getElementById('modal');
    const modalDate = document.getElementById('modalDate');
    const otherSection = document.getElementById('otherReasonSection');
    const reasonInput = document.getElementById('reasonInput') as HTMLTextAreaElement;

    if (modal) modal.style.display = 'flex';
    if (modalDate) modalDate.textContent = dateStr;
    if (otherSection) otherSection.style.display = 'none';
    if (reasonInput) reasonInput.value = '';

    (window as any).currentModalDate = dateStr;
  }

  private closeModal(): void {
    const modal = document.getElementById('modal');
    if (modal) modal.style.display = 'none';
  }

  private handleLeave(): void {
    const dateStr = (window as any).currentModalDate;
    if (!dateStr) return;

    const absence: AbsenceRecord = {
      date: dateStr,
      reason: 'leave'
    };

    this.state.absences.push(absence);
    this.saveState();
    this.closeModal();
    this.render();
  }

  private showOtherReasonSection(): void {
    const otherSection = document.getElementById('otherReasonSection');
    if (otherSection) otherSection.style.display = 'block';
  }

  private saveOtherReason(): void {
    const dateStr = (window as any).currentModalDate;
    const reasonInput = document.getElementById('reasonInput') as HTMLTextAreaElement;

    if (!dateStr || !reasonInput?.value.trim()) {
      alert('请输入原因');
      return;
    }

    const absence: AbsenceRecord = {
      date: dateStr,
      reason: 'other',
      description: reasonInput.value.trim()
    };

    this.state.absences.push(absence);
    this.state.missedDays++;
    this.state.pendingDuration = this.calculatePendingDuration();
    this.saveState();
    this.closeModal();
    this.render();
  }

  private changeMonth(delta: number): void {
    this.state.currentMonth.setMonth(this.state.currentMonth.getMonth() + delta);
    this.render();
  }

  private handleCheckIn(): void {
    const noteInput = document.getElementById('noteInput') as HTMLInputElement;
    const note = noteInput?.value.trim() || '';

    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const record: CheckInRecord = {
      date: this.getTodayString(),
      time,
      note,
      count: this.state.records.length + 1,
      duration: this.state.pendingDuration
    };

    this.state.records.push(record);
    this.state.lastCheckInTime = now;
    this.state.missedDays = 0;
    this.state.pendingDuration = 1;

    this.saveState();
    this.scheduleReminder(record.duration || 1);
    this.render();

    alert(`打卡成功！完成时长: ${record.duration}小时\n将在${record.duration}小时后提醒您`);
  }

  private startCountdown(checkIn: CheckInRecord): void {
    const duration = checkIn.duration || 1;
    const now = new Date();
    const checkInTime = new Date(checkIn.date + ' ' + checkIn.time);

    this.checkInTimestamp = checkInTime.getTime();
    this.targetDuration = duration * 60 * 60 * 1000;

    const endTime = this.checkInTimestamp + this.targetDuration;
    const remaining = endTime - now.getTime();

    if (remaining > 0) {
      this.updateCountdown(remaining);
      this.countdownTimer = window.setInterval(() => {
        const now2 = new Date();
        const remaining2 = endTime - now2.getTime();
        if (remaining2 <= 0) {
          this.stopCountdown();
          this.showNotification('打卡完成', '恭喜！您已完成今日打卡任务！');
        } else {
          this.updateCountdown(remaining2);
        }
      }, 1000);
    } else {
      const timer = document.getElementById('countdownTimer');
      if (timer) timer.textContent = '已完成!';
    }
  }

  private updateCountdown(remaining: number): void {
    const timer = document.getElementById('countdownTimer');
    const progress = document.getElementById('countdownProgress');

    if (!timer || !progress) return;

    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

    timer.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const elapsed = this.targetDuration - remaining;
    const percent = (elapsed / this.targetDuration) * 100;
    progress.style.width = `${100 - percent}%`;

    if (hours < 1) {
      timer.className = 'countdown-timer danger';
    } else if (hours < 2) {
      timer.className = 'countdown-timer warning';
    } else {
      timer.className = 'countdown-timer';
    }
  }

  private stopCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    const timer = document.getElementById('countdownTimer');
    const progress = document.getElementById('countdownProgress');
    if (timer) timer.textContent = '已完成!';
    if (progress) progress.style.width = '0%';
  }

  private handleClear(): void {
    if (confirm('确定要清除所有打卡记录吗？')) {
      this.state.records = [];
      this.state.absences = [];
      this.state.missedDays = 0;
      this.state.pendingDuration = 1;
      this.state.lastCheckInTime = undefined;
      this.saveState();
      this.render();
    }
  }

  private init(): void {
    this.render();
  }
}

new CheckInApp();