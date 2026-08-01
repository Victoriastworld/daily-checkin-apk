import './style.css'

interface CheckInRecord {
  date: string;
  time: string;
  note: string;
  count: number;
  duration?: number; // 打卡时长（小时）
}

interface AbsenceRecord {
  date: string;
  reason: 'leave' | 'other';
  description?: string;
}

interface AppState {
  records: CheckInRecord[];
  absences: AbsenceRecord[];
  currentMonth: Date;
  missedDays: number; // 连续未打卡的"其他"天数
  pendingDuration: number; // 当前需要完成的额外时长
  lastCheckInTime?: Date; // 上次打卡时间
}

class CheckInApp {
  private state: AppState;

  constructor() {
    this.state = {
      records: [],
      absences: [],
      currentMonth: new Date(),
      missedDays: 0,
      pendingDuration: 1
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
    localStorage.setItem('checkInRecords', JSON.stringify(this.state.records));
    localStorage.setItem('checkInAbsences', JSON.stringify(this.state.absences));
    localStorage.setItem('missedDays', this.state.missedDays.toString());
    if (this.state.lastCheckInTime) {
      localStorage.setItem('lastCheckInTime', this.state.lastCheckInTime.toISOString());
    }
  }

  private calculatePendingDuration(): number {
    // 基础1小时 + 未打卡天数
    return 1 + this.state.missedDays;
  }

  private checkMissedDays(): void {
    const yesterday = this.getYesterdayString();
    
    // 检查昨天是否打卡或请假
    const checkedInYesterday = this.state.records.some(r => r.date === yesterday);
    const onLeaveYesterday = this.state.absences.some(a => a.date === yesterday && a.reason === 'leave');
    
    if (!checkedInYesterday && !onLeaveYesterday) {
      // 检查是否有"其他"原因未打卡
      const otherAbsenceYesterday = this.state.absences.find(a => a.date === yesterday && a.reason === 'other');
      if (otherAbsenceYesterday) {
        this.state.missedDays++;
      }
    } else {
      // 如果昨天打卡或请假，重置计数
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
    // 使用setTimeout模拟提醒
    const durationMs = duration * 60 * 60 * 1000;
    
    // 存储下次提醒时间
    const nextReminder = new Date(Date.now() + durationMs);
    localStorage.setItem('nextReminder', nextReminder.toISOString());
    localStorage.setItem('reminderDuration', duration.toString());
    
    // 发送通知
    setTimeout(() => {
      this.showNotification(`打卡提醒`, `您已完成${duration}小时打卡！`);
    }, durationMs);
  }

  private showNotification(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/vite.svg' });
    }
    
    // 尝试使用Service Worker发送通知
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
    
    // 添加空白
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // 添加日期
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
    
    // 检查是否需要说明未打卡
    if (checkDate < todayDate) {
      const hasAbsence = this.state.absences.find(a => a.date === dateStr);
      if (hasAbsence && hasAbsence.reason === 'other') return 'missed';
    }
    
    return 'none';
  }

  private render(): void {
    const app = document.getElementById('app')!;
    const todayCheckIn = this.getTodayCheckIn();
    const hasCheckedIn = !!todayCheckIn;
    const streak = this.getStreakDays();
    const totalDays = this.state.records.length;
    
    app.innerHTML = `
      <div class="container">
        <header class="header">
          <h1>每日打卡</h1>
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
      
      let content = `<span class="day-number">${new Date(day).getDate()}</span>`;
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

  private attachEventListeners(): void {
    const checkinBtn = document.getElementById('checkinBtn');
    const clearBtn = document.getElementById('clearBtn');
    const prevMonth = document.getElementById('prevMonth');
    const nextMonth = document.getElementById('nextMonth');
    const closeModal = document.getElementById('closeModal');
    const btnLeave = document.getElementById('btnLeave');
    const btnOther = document.getElementById('btnOther');
    const saveReason = document.getElementById('saveReason');
    
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
    
    // 日历日期点击
    document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
      day.addEventListener('click', (e) => {
        const dateStr = (e.currentTarget as HTMLElement).dataset.date;
        if (dateStr) this.handleDayClick(dateStr);
      });
    });
  }

  private handleDayClick(dateStr: string): void {
    const today = this.getTodayString();
    const dayDate = new Date(dateStr);
    const todayDate = new Date(today);
    
    // 不能选择今天或未来的日期
    if (dayDate >= todayDate) return;
    
    const status = this.getDayStatus(dateStr);
    
    // 如果已经有记录或请假，显示详情
    if (status === 'checked' || status === 'leave') {
      alert(`日期: ${dateStr}\n类型: ${status === 'checked' ? '已打卡' : '请假'}`);
      return;
    }
    
    // 如果是未打卡的日子，弹出选择原因
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
    
    // 存储当前选择的日期
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
    this.state.pendingDuration = 1; // 重置为基础1小时
    
    this.saveState();
    this.scheduleReminder(record.duration || 1);
    this.render();
    
    alert(`打卡成功！完成时长: ${record.duration}小时\n将在${record.duration}小时后提醒您`);
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

// 初始化应用
new CheckInApp();
