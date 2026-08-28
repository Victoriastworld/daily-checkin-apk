// @ts-nocheck
import './style.css';

const APP_HTML = `
<div class="container">
<header>
  <h1>📚 Future · 每日打卡清单</h1>
  <div class="subtitle">跨考上外 · 中职三第一学期 · 学习追踪</div>
</header>

<div class="tabs">
  <button class="tab active" data-tab="today">📅 今日</button>
  <button class="tab" data-tab="calendar">📆 任务总览</button>
  <button class="tab" data-tab="pomodoro">⏱️ 番茄钟</button>
  <button class="tab" data-tab="manage">⚙️ 任务管理</button>
</div>

<div class="tab-content active" id="tab-today">
  <div class="controls">
    <div class="date-nav">
      <button data-action="changeDate" data-delta="-1">← 昨天</button>
      <h2 id="currentDate">2026-08-28</h2>
      <button data-action="changeDate" data-delta="1">明天 →</button>
    </div>
    <button data-action="goToday">📅 今天</button>
    <button data-action="resetDay" style="background:#888">🔄 重置今日</button>
  </div>

  <div class="stats">
    <div class="stat-item"><span class="num" id="statDone">0</span><span class="label">已完成</span></div>
    <div class="stat-item"><span class="num" id="statTotal">0</span><span class="label">总任务</span></div>
    <div class="stat-item"><span class="num" id="statRate">0%</span><span class="label">完成率</span></div>
    <div class="stat-item"><span class="num" id="statStreak">0</span><span class="label">连续天数</span></div>
  </div>

  <div id="taskContainer"></div>
</div>

<div class="tab-content" id="tab-calendar">
  <div class="calendar-controls">
    <button data-action="changeMonth" data-delta="-1">← 上个月</button>
    <h2 id="calendarTitle">2026年8月</h2>
    <button data-action="changeMonth" data-delta="1">下个月 →</button>
  </div>
  <div class="calendar">
    <div class="cal-weekdays">
      <div class="cal-weekday">周一</div>
      <div class="cal-weekday">周二</div>
      <div class="cal-weekday">周三</div>
      <div class="cal-weekday">周四</div>
      <div class="cal-weekday">周五</div>
      <div class="cal-weekday">周六</div>
      <div class="cal-weekday">周日</div>
    </div>
    <div class="cal-grid" id="calGrid"></div>
  </div>
</div>

<div class="tab-content" id="tab-pomodoro">
  <div class="pomodoro-section">
    <div class="timer-mode" id="timerMode">📖 学习时间</div>
    <div class="timer-display work" id="timerDisplay">25:00</div>
    <div class="timer-buttons">
      <button class="btn-start" id="btnStart" data-action="startTimer">▶ 开始</button>
      <button class="btn-pause" data-action="pauseTimer">⏸ 暂停</button>
      <button class="btn-reset" data-action="resetTimer">🔄 重置</button>
      <button class="btn-skip" data-action="skipPhase">⏭ 跳过</button>
    </div>
    <div class="timer-presets">
      <button data-action="setWorkMinutes" data-min="25">25分钟</button>
      <button data-action="setWorkMinutes" data-min="45">45分钟</button>
      <button data-action="setWorkMinutes" data-min="15">15分钟</button>
      <button data-action="setWorkMinutes" data-min="50">50分钟</button>
      <button data-action="setWorkMinutes" data-min="5">5分钟(测试)</button>
    </div>
    <div class="timer-stats">
      <div class="timer-stat">
        <div class="num" id="pomTodayCount">0</div>
        <div class="label">今日完成番茄</div>
      </div>
      <div class="timer-stat">
        <div class="num" id="pomTotalCount">0</div>
        <div class="label">累计番茄</div>
      </div>
      <div class="timer-stat">
        <div class="num" id="pomTotalMinutes">0</div>
        <div class="label">累计时长(分钟)</div>
      </div>
    </div>
  </div>
</div>

<div class="tab-content" id="tab-manage">
  <div class="add-task-form">
    <h3>➕ 添加新任务（应用到今日）</h3>
    <div class="form-row">
      <input id="newTaskName" placeholder="任务名称（如：英语听力）">
      <input id="newTaskQuantity" class="quantity-input" placeholder="数量（如：30分钟）">
    </div>
    <div class="form-row">
      <select id="newTaskCat">
        <option value="📖 英语 - 单词">📖 英语 - 单词</option>
        <option value="📖 英语 - 阅读">📖 英语 - 阅读</option>
        <option value="📖 英语 - 听力">📖 英语 - 听力</option>
        <option value="📖 英语 - 写作">📖 英语 - 写作</option>
        <option value="📚 专业课 - 现代汉语">📚 专业课 - 现代汉语</option>
        <option value="📚 专业课 - 古汉语">📚 专业课 - 古汉语</option>
        <option value="📚 专业课 - 中国文化">📚 专业课 - 中国文化</option>
        <option value="🎓 转段考核 - 文化课">🎓 转段考核 - 文化课</option>
        <option value="🎓 转段考核 - 专业课">🎓 转段考核 - 专业课</option>
        <option value="🗣 英语活动">🗣 英语活动</option>
        <option value="💡 考研信息">💡 考研信息</option>
        <option value="📌 其他">📌 其他</option>
      </select>
      <button data-action="addTask">+ 添加任务</button>
    </div>
    <div class="form-row">
      <textarea id="newTaskDetail" placeholder="任务详情（可选）"></textarea>
    </div>
  </div>

  <div id="manageList"></div>
</div>

</div>

<div class="modal-overlay" id="resourceModal" data-action="closeModalOutside">
  <div class="modal">
    <h3 id="modalTitle">任务资源</h3>
    <div class="modal-detail" id="modalDetail"></div>
    <div class="resource-block" id="modalResource"></div>
    <button class="modal-close" data-action="closeModal">关闭</button>
  </div>
</div>
`;

document.getElementById('app')!.innerHTML = APP_HTML;

// ============ 数据存储 ============
const STORAGE_KEY = 'kaoyan_checklist_v2';

let allData: any;
let currentDate = formatDate(new Date());
let calendarMonth = new Date().getMonth();
let calendarYear = new Date().getFullYear();

let timerInterval: any = null;
let timerSeconds = 25 * 60;
let timerMode: 'work' | 'break' = 'work';
let timerRunning = false;
let pomodoroStats: any = JSON.parse(localStorage.getItem('pomodoro_stats') || '{"today":{},"total":{"count":0,"minutes":0}}');

function initData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  const data: any = { tasks: {} };
  const today = new Date();
  for (let i = -7; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = formatDate(date);
    data.tasks[dateStr] = generateTasksForDate(date);
  }
  return data;
}

function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(allData)); }

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function generateTasksForDate(date: Date) {
  const dateStr = formatDate(date);
  const dayOfWeek = date.getDay();
  const tasks: any[] = [];

  const daily = [
    { cat: '📖 英语 - 单词', name: '墨墨背单词', detail: '考研英语一5500词', quantity: '新词20-30+复习50', catName: '英语单词',
      resources: '📱 墨墨背单词App\n📚 词库:考研英语一核心词汇\n⏰ 时间:早上/睡前各15min' },
    { cat: '📖 英语 - 阅读', name: '英语外刊精读', detail: '经济学人/卫报/BBC', quantity: '1-2篇', catName: '英语阅读',
      resources: '📰 经济学人: economist.com\n📰 卫报: theguardian.com\n📚 BBC Learning English\n🔧 欧路词典/有道词典\n\n📌 推荐篇目:\n《经济学人》Leaders / China / International版块\n《卫报》Opinion / World News\nBBC Learning English每日一课' },
    { cat: '📖 英语 - 听力', name: 'BBC 6 Minute English', detail: '保持雅思听力', quantity: '1-2次', catName: '英语听力',
      resources: '🎧 bbc.co.uk/learningenglish\n🎧 TED演讲(B站有中英字幕)\n⏰ 每次10-20min' },
    { cat: '📖 英语 - 写作', name: '英语写作练习', detail: '王江涛《考研英语高分写作》', quantity: '周一三五各1段', catName: '英语写作',
      resources: '📚 王江涛《考研英语高分写作》\n🔧 Grammarly浏览器插件\n🔧 DeepL Write写作助手' },
    { cat: '📚 专业课 - 现代汉语', name: '《现代汉语》精读', detail: '黄廖版绪论+第1-3章', quantity: '30分钟', catName: '现代汉语',
      resources: '📚 买第6版!(第7版是2025新出的,考研真题全按第6版)\n📖 京东/当当搜"现代汉语 第6版 黄伯荣"\n💰 全新70-90元,二手30-50元\n🎬 B站搜"现代汉语第6版精讲"\n📝 课后习题+思维导图\n\n💡 为什么学这本书:\n• 国际中文教育考研专业课指定教材\n• 国内600+高校中文系都用这本书\n• 教外国人中文必备基础(语音/语法/词汇)\n• 你文修背景+现代汉语=独特竞争优势\n• 复试面试一定会问到语言学问题' },
    { cat: '📚 专业课 - 古汉语', name: '《古文观止》背诵', detail: '每天1篇(从《桃花源记》开始)', quantity: '1篇', catName: '古汉语',
      resources: '📚 纸质书(人民文学出版社)\n📱 古文观止App\n🌐 在线免费:\n  • donglishuzhai.net(完整带注)\n  • wenyanguji.com(原文+译文)\n  • diancang.xyz(分章清晰)\n🎬 B站"古文观止朗读"\n🎧 喜马拉雅"古文观止全文诵读"' },
    { cat: '🎓 转段考核 - 文化课', name: '高中文化课复习', detail: '语文/数学/英语/文综', quantity: '30分钟', catName: '转段文化课',
      resources: '📚 人教版高中教材全套\n📱 猿题库/作业帮\n🎬 B站"高中数学一轮复习"\n📕 5年高考真题汇编' },
    { cat: '🎓 转段考核 - 专业课', name: '文修实操练习', detail: '古籍装帧/书画装裱', quantity: '60分钟', catName: '转段专业课',
      resources: '🏫 学校实训室\n👨‍🏫 中职专业课老师指导\n📋 历年转段考核实操要求' }
  ];
  daily.forEach(t => tasks.push({ ...t, id: 'd_' + t.catName + '_' + dateStr, done: false }));

  if ([1, 3, 5, 0].includes(dayOfWeek)) {
    const weekly = [
      { cat: '📚 专业课 - 中国文化', name: '《中国文化要略》通读', detail: '每周1章', quantity: '60分钟', catName: '中国文化' },
      { cat: '💡 考研信息', name: '浏览上岸学长经验贴', detail: '小红书/B站/知乎', quantity: '30分钟', catName: '考研信息' }
    ];
    weekly.forEach(t => tasks.push({ ...t, id: 'w_' + t.catName + '_' + dateStr, done: false }));
  }
  if ([6, 0].includes(dayOfWeek)) {
    tasks.push({ cat: '🗣 英语活动', name: '英语演讲/朗诵练习', detail: '对着镜子练习', quantity: '30分钟', id: 'w_speech_' + dateStr, done: false });
  }

  if (dateStr === '2026-08-29') {
    const special = [
      { cat: '⭐ 本周特别任务', name: '下载墨墨背单词App', detail: '导入"考研5500词"', quantity: '10分钟', catName: 'App下载',
        resources: '📱 App Store/应用商店搜"墨墨背单词"\n📚 注册账号→选词库"考研英语一核心词汇"\n⏰ 设置每日30新词+50复习' },
      { cat: '⭐ 本周特别任务', name: '下载《现代汉语》PDF', detail: '电子版即可', quantity: '10分钟', catName: '教材下载',
        resources: '🌐 百度网盘/鸠摩搜书搜"现代汉语黄伯荣"\n📚 微信读书App搜"现代汉语"\n📖 实体书京东购买(约60-80元)' },
      { cat: '⭐ 本周特别任务', name: 'B站搜索"上外汉硕上岸经验"', detail: '看3个视频', quantity: '30分钟', catName: '视频学习',
        resources: '🎬 B站搜"上外汉硕"/"上外国际中文教育"\n🎬 B站搜"考研英语5500词"\n📝 看完做笔记' },
      { cat: '⭐ 本周特别任务', name: '注册小红书+B站账号', detail: '关注"上外汉硕"', quantity: '10分钟', catName: '注册账号',
        resources: '📱 小红书搜"上外汉硕"关注10个博主\n🎬 B站关注3个考研UP主\n💬 考研帮App注册' },
      { cat: '⭐ 本周特别任务', name: '找1位上岸学长学姐', detail: '小红书私信', quantity: '30分钟', catName: '找人脉',
        resources: '📱 小红书私信"上外汉硕在读"\n📱 QQ群搜"上外考研2023"\n📱微信搜"上外汉硕考研"' },
      { cat: '⭐ 本周特别任务', name: '跟父母深谈一次', detail: '告诉他们你的考研计划', quantity: '60分钟', catName: '家庭沟通',
        resources: '👨‍👩‍👧 准备:打印Excel规划表\n💬 说清5年规划和转段考核\n🤝 寻求家庭支持' }
    ];
    special.forEach(t => tasks.push({ ...t, id: 's_' + t.catName + '_' + dateStr, done: false }));
  }

  return tasks;
}

// ============ 今日 Tab ============
function renderToday() {
  document.getElementById('currentDate')!.textContent = currentDate;

  if (!allData.tasks[currentDate]) {
    const date = new Date(currentDate);
    allData.tasks[currentDate] = generateTasksForDate(date);
    saveData();
  }

  const tasks = allData.tasks[currentDate];
  const container = document.getElementById('taskContainer')!;

  if (tasks.length === 0) {
    container.innerHTML = '<div class="empty">今天没有任务，去"任务管理"添加吧</div>';
    return;
  }

  const grouped: any = {};
  tasks.forEach((t: any) => {
    if (!grouped[t.cat]) grouped[t.cat] = [];
    grouped[t.cat].push(t);
  });

  let html = '';
  for (const cat in grouped) {
    html += `<div class="category"><div class="category-title">${cat}</div>`;
    grouped[cat].forEach((t: any) => {
      const hasResource = t.resources ? 'true' : 'false';
      html += `
        <div class="task ${t.done ? 'done' : ''}" data-id="${t.id}">
          <div class="checkbox" data-action="toggleTask" data-id="${t.id}"></div>
          <div class="task-content" data-action="toggleTask" data-id="${t.id}">
            <div class="task-name">${escapeHtml(t.name)}</div>
            <div class="task-detail">${escapeHtml(t.detail || '')}</div>
            <span class="task-quantity">${escapeHtml(t.quantity)}</span>
          </div>
          <button class="task-info ${t.resources ? 'has-resource' :''}" data-action="showResource" data-id="${t.id}" data-has="${hasResource}" title="查看具体资源">i</button>
          <button class="task-pomodoro" data-action="startPomodoroForTask" data-id="${t.id}" title="用番茄钟完成">⏱️</button>
          <button class="task-delete" data-action="deleteTask" data-id="${t.id}" title="删除任务">✕</button>
        </div>`;
    });
    html += '</div>';
  }
  container.innerHTML = html;

  const done = tasks.filter((t: any) => t.done).length;
  document.getElementById('statDone')!.textContent = String(done);
  document.getElementById('statTotal')!.textContent = String(tasks.length);
  document.getElementById('statRate')!.textContent = tasks.length ? Math.round(done / tasks.length * 100) + '%' : '0%';
  document.getElementById('statStreak')!.textContent = String(calcStreak());
}

function toggleTask(taskId: string) {
  const task = allData.tasks[currentDate]?.find((t: any) => t.id === taskId);
  if (task) {
    task.done = !task.done;
    saveData();
    renderToday();
  }
}

function deleteTask(taskId: string) {
  if (!confirm('确定删除这个任务？')) return;
  allData.tasks[currentDate] = allData.tasks[currentDate].filter((t: any) => t.id !== taskId);
  saveData();
  renderToday();
  renderManage();
}

function addTask() {
  const name = (document.getElementById('newTaskName') as HTMLInputElement).value.trim();
  const quantity = (document.getElementById('newTaskQuantity') as HTMLInputElement).value.trim() || '未指定';
  const cat = (document.getElementById('newTaskCat') as HTMLSelectElement).value;
  const detail = (document.getElementById('newTaskDetail') as HTMLTextAreaElement).value.trim();

  if (!name) { alert('请输入任务名称'); return; }

  const newTask = {
    id: 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    cat: cat, name: name, detail: detail, quantity: quantity,
    done: false
  };

  if (!allData.tasks[currentDate]) allData.tasks[currentDate] = [];
  allData.tasks[currentDate].push(newTask);
  saveData();

  (document.getElementById('newTaskName') as HTMLInputElement).value = '';
  (document.getElementById('newTaskQuantity') as HTMLInputElement).value = '';
  (document.getElementById('newTaskDetail') as HTMLTextAreaElement).value = '';

  renderToday();
  renderManage();
}

function changeDate(delta: number) {
  const date = new Date(currentDate);
  date.setDate(date.getDate() + delta);
  currentDate = formatDate(date);
  if (!allData.tasks[currentDate]) {
    allData.tasks[currentDate] = generateTasksForDate(date);
    saveData();
  }
  renderToday();
}

function goToday() {
  currentDate = formatDate(new Date());
  if (!allData.tasks[currentDate]) {
    allData.tasks[currentDate] = generateTasksForDate(new Date());
    saveData();
  }
  renderToday();
}

function resetDay() {
  if (confirm('确定重置今日所有任务？')) {
    allData.tasks[currentDate].forEach((t: any) => t.done = false);
    saveData();
    renderToday();
  }
}

function calcStreak() {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = formatDate(date);
    const tasks = allData.tasks[dateStr] || [];
    if (tasks.length === 0) continue;
    const allDone = tasks.every((t: any) => t.done);
    if (allDone) streak++;
    else if (i > 0) break;
  }
  return streak;
}

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]!));
}

// ============ 日历 Tab ============
function renderCalendar() {
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  document.getElementById('calendarTitle')!.textContent = `${calendarYear}年${monthNames[calendarMonth]}`;

  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
  const firstDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  let html = '';
  const today = new Date();
  const todayStr = formatDate(today);

  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1;
    const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;

    if (!isCurrentMonth) {
      html += `<div class="cal-day other-month"></div>`;
      continue;
    }

    const dateStr = `${calendarYear}-${String(calendarMonth+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
    const tasks = allData.tasks[dateStr] || [];
    const done = tasks.filter((t: any) => t.done).length;
    const total = tasks.length;
    const ratio = total > 0 ? Math.round(done / total * 100) : 0;

    const isToday = dateStr === todayStr;
    let dots = '';
    if (total > 0 && ratio > 0 && ratio < 100) dots = '<span class="dot"></span>';
    if (ratio === 100 && total > 0) dots = '<span class="dot"></span><span class="dot"></span>';

    html += `
      <div class="cal-day ${isToday ? 'today' : ''}" data-action="goToDate" data-date="${dateStr}">
        <div class="day-num">${dayNum}</div>
        <div class="day-info">
          ${total > 0 ? `<span class="ratio">${ratio}%</span>` : '<span style="color:#aaa">无任务</span>'}
          ${dots}
        </div>
      </div>`;
  }

  document.getElementById('calGrid')!.innerHTML = html;
}

function goToDate(dateStr: string) {
  currentDate = dateStr;
  if (!allData.tasks[currentDate]) {
    allData.tasks[currentDate] = generateTasksForDate(new Date(dateStr));
    saveData();
  }
  switchTab('today');
}

function changeMonth(delta: number) {
  calendarMonth += delta;
  if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
  if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
  renderCalendar();
}

// ============ 番茄钟 Tab ============
function updateTimerDisplay() {
  const m = Math.floor(timerSeconds / 60);
  const s = timerSeconds % 60;
  document.getElementById('timerDisplay')!.textContent =
    `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  document.getElementById('timerDisplay')!.className =
    'timer-display ' + (timerMode === 'work' ? 'work' : 'break');
  document.getElementById('timerMode')!.textContent =
    timerMode === 'work' ? '📖 学习时间' : '☕ 休息时间';
}

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  timerInterval = setInterval(() => {
    timerSeconds--;
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      onTimerComplete();
    }
    updateTimerDisplay();
  }, 1000);
}

function pauseTimer() {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerRunning = false;
}

function resetTimer() {
  pauseTimer();
  timerSeconds = (timerMode === 'work' ? 25 : 5) * 60;
  updateTimerDisplay();
}

function skipPhase() {
  pauseTimer();
  timerMode = timerMode === 'work' ? 'break' : 'work';
  timerSeconds = (timerMode === 'work' ? 25 : 5) * 60;
  updateTimerDisplay();
}

function setWorkMinutes(min: number) {
  pauseTimer();
  timerMode = 'work';
  timerSeconds = min * 60;
  updateTimerDisplay();
}

function showResource(taskId: string) {
  const task = allData.tasks[currentDate]?.find((t: any) => t.id === taskId);
  if (!task) return;

  document.getElementById('modalTitle')!.textContent = task.name;
  document.getElementById('modalDetail')!.textContent =
    `${task.cat} · ${task.detail || ''} · ${task.quantity}`;

  const resourceDiv = document.getElementById('modalResource')!;
  if (task.resources) {
    resourceDiv.textContent = task.resources;
    resourceDiv.className = 'resource-block';
  } else {
    resourceDiv.textContent = '这个任务暂无具体资源，请自由安排。';
    resourceDiv.className = 'no-resource';
  }

  document.getElementById('resourceModal')!.classList.add('show');
}

function closeModal() {
  document.getElementById('resourceModal')!.classList.remove('show');
}

function startPomodoroForTask(taskId: string) {
  const task = allData.tasks[currentDate]?.find((t: any) => t.id === taskId);
  if (task) {
    timerSeconds = 25 * 60;
    timerMode = 'work';
    updateTimerDisplay();
    switchTab('pomodoro');
    startTimer();
  }
}

function onTimerComplete() {
  if (timerMode === 'work') {
    if (!pomodoroStats.today[currentDate]) pomodoroStats.today[currentDate] = 0;
    pomodoroStats.today[currentDate]++;
    pomodoroStats.total.count++;
    pomodoroStats.total.minutes += 25;
    localStorage.setItem('pomodoro_stats', JSON.stringify(pomodoroStats));
    alert('🎉 完成一个番茄钟完成休息一下吧');
    timerMode = 'break';
    timerSeconds = 5 * 60;
  } else {
    alert('☕ 休息结束，开始下一个番茄钟');
    timerMode = 'work';
    timerSeconds = 25 * 60;
  }
  updateTimerDisplay();
  renderPomodoroStats();
}

function renderPomodoroStats() {
  const today = currentDate;
  document.getElementById('pomTodayCount')!.textContent = String(pomodoroStats.today[today] || 0);
  document.getElementById('pomTotalCount')!.textContent = String(pomodoroStats.total.count);
  document.getElementById('pomTotalMinutes')!.textContent = String(pomodoroStats.total.minutes);
}

// ============ 任务管理 Tab ============
function renderManage() {
  const tasks = allData.tasks[currentDate] || [];
  const container = document.getElementById('manageList')!;

  if (tasks.length === 0) {
    container.innerHTML = '<div class="empty">今日暂无任务</div>';
    return;
  }

  let html = '<div class="category"><div class="category-title">今日所有任务（可删除）</div>';
  tasks.forEach((t: any) => {
    html += `
      <div class="task ${t.done ? 'done' : ''}">
        <div class="checkbox" data-action="toggleTask" data-id="${t.id}"></div>
        <div class="task-content" data-action="toggleTask" data-id="${t.id}">
          <div class="task-name">${escapeHtml(t.name)}</div>
          <div class="task-detail">${escapeHtml(t.cat)} · ${escapeHtml(t.detail || '')}</div>
          <span class="task-quantity">${escapeHtml(t.quantity)}</span>
        </div>
        <button class="task-delete" data-action="deleteTask" data-id="${t.id}">✕ 删除</button>
      </div>`;
  });
  html += '</div>';
  container.innerHTML = html;
}

// ============ Tab 切换 ============
function switchTab(tabName: string) {
  document.querySelectorAll<HTMLElement>('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll<HTMLElement>('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll<HTMLElement>('.tab').forEach(btn => {
    if (btn.dataset.tab === tabName) btn.classList.add('active');
  });
  document.getElementById('tab-' + tabName)!.classList.add('active');

  if (tabName === 'today') renderToday();
  if (tabName === 'calendar') renderCalendar();
  if (tabName === 'pomodoro') renderPomodoroStats();
  if (tabName === 'manage') renderManage();
}

// ============ 初始化 ============
allData = initData();
renderToday();
renderPomodoroStats();

// ============ 事件代理 ============
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const actionEl = target.closest<HTMLElement>('[data-action]');
  if (!actionEl) return;
  const action = actionEl.dataset.action;
  const id = actionEl.dataset.id;
  const delta = actionEl.dataset.delta ? parseInt(actionEl.dataset.delta) : 0;
  const min = actionEl.dataset.min ? parseInt(actionEl.dataset.min) : 0;
  const date = actionEl.dataset.date;

  switch (action) {
    case 'toggleTask': if (id) toggleTask(id); break;
    case 'deleteTask': if (id) deleteTask(id); break;
    case 'showResource': if (id) showResource(id); break;
    case 'startPomodoroForTask': if (id) startPomodoroForTask(id); break;
    case 'changeDate': changeDate(delta); break;
    case 'goToday': goToday(); break;
    case 'resetDay': resetDay(); break;
    case 'changeMonth': changeMonth(delta); break;
    case 'goToDate': if (date) goToDate(date); break;
    case 'startTimer': startTimer(); break;
    case 'pauseTimer': pauseTimer(); break;
    case 'resetTimer': resetTimer(); break;
    case 'skipPhase': skipPhase(); break;
    case 'setWorkMinutes': setWorkMinutes(min); break;
    case 'addTask': addTask(); break;
    case 'closeModal': closeModal(); break;
  }
});

// Tab 切换事件
document.querySelectorAll<HTMLElement>('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    if (tab) switchTab(tab);
  });
});

// 弹窗外点击关闭
document.getElementById('resourceModal')!.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

// 检查旧版本
setTimeout(() => {
  const hasAnyResource = Object.values(allData.tasks).some((dayTasks: any) =>
    dayTasks.some((t: any) => t.resources)
  );
  if (!hasAnyResource && confirm('检测到你的浏览器存的是旧版本任务（没有资源信息）。\n\n是否要重新生成包含具体网址/软件的任务？\n\n点"确定"重置，点"取消"保留旧数据。')) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('pomodoro_stats');
    allData = { tasks: {} };
    const today = new Date();
    for (let i = -7; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = formatDate(date);
      allData.tasks[dateStr] = generateTasksForDate(date);
    }
    saveData();
    alert('✓ 已重置！已自动生成过去7天+未来30天的任务');
    renderToday();
    renderManage();
    renderCalendar();
  }
}, 500);