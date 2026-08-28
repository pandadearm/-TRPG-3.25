(() => {
  const kinds = ['B', 'L', 'A'];
  const whole = (value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  };
  const damage = () => ({ B: 0, L: 0, A: 0 });
  const copy = (state) => ({ ...state });
  const total = (state) => state.B + state.L + state.A;
  const intact = (state) => Math.max(0, state.maxHealth - total(state));
  const status = (state) => {
    if (state.B === 0 && state.L === 0 && state.A >= state.maxHealth) return '死亡';
    return intact(state) === 0 ? '昏迷' : '存活';
  };
  const resolveOverflow = (input) => {
    const state = copy(input);
    const worsening = [];
    for (const [from, to] of [['B', 'L'], ['L', 'A']]) {
      let excess = total(state) - state.maxHealth;
      if (excess <= 0 || state[from] === 0) continue;
      const sourceAmount = excess * 2 <= state[from] ? excess * 2 : state[from];
      const resultAmount = Math.ceil(sourceAmount / 2);
      state[from] -= sourceAmount;
      state[to] += resultAmount;
      worsening.push({ from, to, sourceAmount, resultAmount });
    }
    return { state, worsening };
  };
  const normalise = (input) => resolveOverflow({
    maxHealth: Math.max(1, whole(input.maxHealth)),
    temporaryHealth: whole(input.temporaryHealth), B: whole(input.B), L: whole(input.L), A: whole(input.A),
  }).state;
  const applyDamage = (current, incoming) => {
    const actualDamage = { B: whole(incoming.B), L: whole(incoming.L), A: whole(incoming.A) };
    const absorbedByTemporaryHealth = damage();
    let temporaryHealth = current.temporaryHealth;
    for (const kind of kinds) {
      const absorbed = Math.min(temporaryHealth, actualDamage[kind]);
      absorbedByTemporaryHealth[kind] = absorbed;
      actualDamage[kind] -= absorbed;
      temporaryHealth -= absorbed;
    }
    const resolved = resolveOverflow({ ...current, temporaryHealth, B: current.B + actualDamage.B, L: current.L + actualDamage.L, A: current.A + actualDamage.A });
    return { state: resolved.state, absorbedByTemporaryHealth, actualDamage, worsening: resolved.worsening, intactHealth: intact(resolved.state), status: status(resolved.state) };
  };
  const text = (amount) => kinds.filter((kind) => amount[kind] > 0).map((kind) => `${amount[kind]}${kind}`).join('、') || '無';
  const statusClass = (value) => value === '存活' ? 'alive' : value === '昏迷' ? 'unconscious' : 'dead';
  let state = { maxHealth: 20, temporaryHealth: 0, B: 0, L: 0, A: 0 };
  let incoming = damage();
  let history = [];
  let lastSettlement = null;
  const root = document.querySelector('#life-calculator');
  const numberField = (id, label, value, tone = '') => `<label class="number-field ${tone}" for="${id}"><span>${label}</span><input id="${id}" type="number" min="0" step="1" inputmode="numeric" value="${value}"></label>`;
  const renderRecord = () => {
    if (!lastSettlement) return '<p class="empty-record">尚未套用傷害。結算後會在此顯示臨時生命吸收、傷勢惡化與最終狀態。</p>';
    const rows = [];
    if (Object.values(lastSettlement.absorbedByTemporaryHealth).some(Boolean)) rows.push(['臨時生命吸收', text(lastSettlement.absorbedByTemporaryHealth)]);
    rows.push(['實際承受', text(lastSettlement.actualDamage)]);
    lastSettlement.worsening.forEach((step) => rows.push(['惡化', `${step.sourceAmount}${step.from} → ${step.resultAmount}${step.to}`]));
    rows.push(['結果', `完好 ${lastSettlement.intactHealth}／B ${lastSettlement.state.B}／L ${lastSettlement.state.L}／A ${lastSettlement.state.A}`]);
    rows.push(['狀態', lastSettlement.status]);
    return `<ol class="record-list">${rows.map(([label, value]) => `<li><span>${label}</span><strong>${value}</strong></li>`).join('')}</ol>`;
  };
  const render = () => {
    const lifeStatus = status(state);
    root.innerHTML = `<div class="page"><header class="header"><div><p class="eyebrow">無限流 TRPG 工具</p><h1>生命計算器</h1><p class="description">輸入最終傷害後，自動處理臨時生命、傷勢惡化與生命狀態。</p></div><a class="library-link" href="index.html">← 返回知識庫</a></header><section class="calculator" aria-label="生命與傷害計算"><div class="state-column"><section class="panel"><div class="panel-heading"><div><p class="kicker">角色狀態</p><h2>生命與目前傷勢</h2></div><span class="status status-${statusClass(lifeStatus)}">${lifeStatus}</span></div><div class="current-inputs">${numberField('max-health', '生命上限', state.maxHealth, 'max-health')}${numberField('temporary-health', '臨時生命', state.temporaryHealth, 'temporary')}${numberField('current-B', '目前 B', state.B, 'injury-b')}${numberField('current-L', '目前 L', state.L, 'injury-l')}${numberField('current-A', '目前 A', state.A, 'injury-a')}</div><p class="help">完好生命由「生命上限 − B − L − A」自動計算。手動調整傷勢時，若超出上限會依同一套惡化規則校正。</p></section><section class="vital-grid" aria-label="生命分佈"><div class="vital-card vital-intact"><span>完好生命</span><strong>${intact(state)}</strong></div><div class="vital-card vital-b"><span>B 衝擊傷害</span><strong>${state.B}</strong></div><div class="vital-card vital-l"><span>L 嚴重傷害</span><strong>${state.L}</strong></div><div class="vital-card vital-a"><span>A 惡性傷害</span><strong>${state.A}</strong></div><div class="vital-card vital-temp"><span>臨時生命</span><strong>${state.temporaryHealth}</strong></div><div class="vital-card status-card status-${statusClass(lifeStatus)}"><span>生命狀態</span><strong>${lifeStatus}</strong></div></section></div><div class="action-column"><section class="panel"><div class="panel-heading"><div><p class="kicker">本次結算</p><h2>輸入最終傷害</h2></div></div><p class="help">數值視為已完成防禦、減傷與吸收後的最終傷害。臨時生命會優先抵銷 B → L → A。</p><div class="damage-inputs">${numberField('incoming-B', '本次 B', incoming.B, 'injury-b')}${numberField('incoming-L', '本次 L', incoming.L, 'injury-l')}${numberField('incoming-A', '本次 A', incoming.A, 'injury-a')}</div><div class="actions"><button class="apply" id="apply">套用傷害</button><button class="undo" id="undo" ${history.length ? '' : 'disabled'}>復原上一步</button><button class="reset" id="reset">重設角色</button></div></section><section class="record-panel" aria-live="polite"><div class="record-heading"><div><p class="kicker">傷勢惡化紀錄</p><h2>本次結算</h2></div>${lastSettlement ? `<span class="record-status">${lastSettlement.status}</span>` : ''}</div>${renderRecord()}<p class="willpower">意志力支撐：後續功能；第一版不自動計算延後昏迷時間。</p></section></div></section></div>`;
    const updateCurrent = (key, min = 0) => root.querySelector(`#${key}`).oninput = (event) => { state = normalise({ ...state, [key === 'max-health' ? 'maxHealth' : key === 'temporary-health' ? 'temporaryHealth' : key.replace('current-', '')]: Math.max(min, whole(event.target.value)) }); lastSettlement = null; render(); };
    updateCurrent('max-health', 1); updateCurrent('temporary-health'); kinds.forEach((kind) => updateCurrent(`current-${kind}`));
    kinds.forEach((kind) => root.querySelector(`#incoming-${kind}`).oninput = (event) => { incoming[kind] = whole(event.target.value); });
    root.querySelector('#apply').onclick = () => { const before = copy(state); const result = applyDamage(state, incoming); history.push({ before, result }); state = result.state; lastSettlement = result; incoming = damage(); render(); };
    root.querySelector('#undo').onclick = () => { const entry = history.pop(); if (!entry) return; state = entry.before; lastSettlement = history.at(-1)?.result || null; render(); };
    root.querySelector('#reset').onclick = () => { state = { maxHealth: 20, temporaryHealth: 0, B: 0, L: 0, A: 0 }; incoming = damage(); history = []; lastSettlement = null; render(); };
  };
  render();
})();
