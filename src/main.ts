import './style.css'

interface CheckInRecord {
  date: string;
  time: string;
  note: string;
  count: number;
}

class CheckInApp {
  private records: CheckInRecord[] = [];
  private currentDate: string;

  constructor() {
    this.currentDate = this.getTodayString();
    this.loadRecords();
    this.init();
  }

  private getTodayString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private loadRecords(): void {
    const saved = localStorage.getItem('checkInRecords');
    if (saved) {
      this.records = JSON.parse(saved);
    }
  }

  private saveRecords(): void {
    localStorage.setItem('checkInRecords', JSON.stringify(this.records));
  }

  private getTodayCheckIn(): CheckInRecord | undefined {
    return this.records.find(r => r.date === this.currentDate);
  }

  private getStreakDays(): number {
    if (this.records.length === 0) return 0;
    
    const sortedRecords = [...this.records].sort((a, b) => 
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

  private render(): void {
    const app = document.getElementById('app')!;
    const todayCheckIn = this.getTodayCheckIn();
    const hasCheckedIn = !!todayCheckIn;
    const streak = this.getStreakDays();
    const totalDays = this.records.length;
    
    app.innerHTML = `
      <div class="container">
        <header class="header">
          <h1>每日打卡</h1>
          <p class="date">${this.currentDate}</p>
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
        </div>
        
        <div class="checkin-section">
          ${hasCheckedIn ? `
            <div class="checked-in">
              <div class="checkmark">✓</div>
              <p class="checkin-time">打卡时间: ${todayCheckIn.time}</p>
              ${todayCheckIn.note ? `<p class="checkin-note">${todayCheckIn.note}</p>` : ''}
              <p class="checkin-count">第 ${todayCheckIn.count} 天</p>
            </div>
          ` : `
            <button id="checkinBtn" class="checkin-btn">
              <span class="btn-icon">+</span>
              <span class="btn-text">立即打卡</span>
            </button>
            <div class="note-section">
              <input type="text" id="noteInput" placeholder="添加备注 (可选)" maxlength="50" />
            </div>
          `}
        </div>
        
        <div class="records-section">
          <h2>打卡记录</h2>
          <div class="records-list" id="recordsList">
            ${this.records.length === 0 ? '<p class="no-records">暂无打卡记录</p>' : ''}
            ${this.records
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 30)
              .map(r => `
                <div class="record-item ${r.date === this.currentDate ? 'today' : ''}">
                  <div class="record-date">${r.date}</div>
                  <div class="record-time">${r.time}</div>
                  ${r.note ? `<div class="record-note">${r.note}</div>` : ''}
                </div>
              `).join('')}
          </div>
        </div>
        
        ${this.records.length > 0 ? `
          <button id="clearBtn" class="clear-btn">清除所有记录</button>
        ` : ''}
      </div>
    `;
    
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const checkinBtn = document.getElementById('checkinBtn');
    const clearBtn = document.getElementById('clearBtn');
    
    if (checkinBtn) {
      checkinBtn.addEventListener('click', () => this.handleCheckIn());
    }
    
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.handleClear());
    }
  }

  private handleCheckIn(): void {
    const noteInput = document.getElementById('noteInput') as HTMLInputElement;
    const note = noteInput?.value.trim() || '';
    
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const record: CheckInRecord = {
      date: this.currentDate,
      time,
      note,
      count: this.records.length + 1
    };
    
    this.records.push(record);
    this.saveRecords();
    this.render();
  }

  private handleClear(): void {
    if (confirm('确定要清除所有打卡记录吗？')) {
      this.records = [];
      this.saveRecords();
      this.render();
    }
  }

  private init(): void {
    this.render();
  }
}

new CheckInApp();
