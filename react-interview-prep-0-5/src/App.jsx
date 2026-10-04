import { useEffect, useMemo, useState } from 'react';
import { exercises, levels, scenarios, theory } from './content/index.js';

const STORAGE_KEY = 'react-0-5-progress';
const allCards = [...theory, ...exercises, ...scenarios];
const navItems = [
  { id: 'overview', label: 'Overview', icon: '✦' },
  { id: 'theory', label: 'Mental models', icon: '01' },
  { id: 'practice', label: 'Practice lab', icon: '02' },
  { id: 'scenarios', label: 'Interview scenarios', icon: '03' },
];

function readProgress() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function matchesSearch(item, search) {
  if (!search) return true;
  return [item.title, item.question, item.prompt, item.answer, item.signal, item.category, item.role]
    .flatMap(value => Array.isArray(value) ? value : [value])
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(search.toLowerCase());
}

function App() {
  const [activeLevel, setActiveLevel] = useState(0);
  const [search, setSearch] = useState('');
  const [progress, setProgress] = useState(readProgress);
  const [openTheory, setOpenTheory] = useState(new Set(['t0-components']));
  const [selectedExerciseId, setSelectedExerciseId] = useState('e0-card-list');
  const [selectedScenarioId, setSelectedScenarioId] = useState('s0-review');

  const level = levels[activeLevel];
  const levelTheory = useMemo(
    () => theory.filter(item => item.level === activeLevel && matchesSearch(item, search)),
    [activeLevel, search],
  );
  const levelExercises = useMemo(
    () => exercises.filter(item => item.level === activeLevel && matchesSearch(item, search)),
    [activeLevel, search],
  );
  const levelScenarios = useMemo(
    () => scenarios.filter(item => item.level === activeLevel && matchesSearch(item, search)),
    [activeLevel, search],
  );
  const currentItems = useMemo(
    () => allCards.filter(item => item.level === activeLevel),
    [activeLevel],
  );
  const currentCompleted = currentItems.filter(item => progress.has(item.id)).length;
  const overallPercent = Math.round((progress.size / allCards.length) * 100);
  const levelPercent = Math.round((currentCompleted / currentItems.length) * 100);
  const activeExercise = levelExercises.find(item => item.id === selectedExerciseId) ?? levelExercises[0] ?? null;
  const activeScenario = levelScenarios.find(item => item.id === selectedScenarioId) ?? levelScenarios[0] ?? null;

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...progress]));
    } catch {
      // Progress is optional; the guide remains useful if storage is blocked.
    }
  }, [progress]);

  function chooseLevel(id) {
    setActiveLevel(id);
    setSearch('');
    setOpenTheory(new Set([theory.find(item => item.level === id)?.id].filter(Boolean)));
    setSelectedExerciseId(exercises.find(item => item.level === id)?.id ?? null);
    setSelectedScenarioId(scenarios.find(item => item.level === id)?.id ?? null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function toggleComplete(id) {
    setProgress(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleTheory(id) {
    setOpenTheory(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function resetProgress() {
    setProgress(new Set());
  }

  return (
    <div className="app-shell">
      <aside className="rail">
        <button className="brand" type="button" onClick={() => chooseLevel(0)}>
          <span className="brand-mark">0→5</span>
          <span className="brand-copy">
            <strong>React ladder</strong>
            <small>interview preparation</small>
          </span>
        </button>

        <div className="rail-divider" />
        <p className="rail-label">Your route</p>
        <nav className="level-nav" aria-label="Preparation levels">
          {levels.map(item => {
            const itemCount = allCards.filter(card => card.level === item.id).length;
            const itemDone = allCards.filter(card => card.level === item.id && progress.has(card.id)).length;
            return (
              <button
                className={`level-nav-item ${item.id === activeLevel ? 'active' : ''}`}
                key={item.id}
                onClick={() => chooseLevel(item.id)}
                type="button"
              >
                <span className={`level-dot ${item.color}`}><span>{item.id}</span></span>
                <span className="level-nav-copy"><strong>{item.name}</strong><small>{item.kicker}</small></span>
                <span className="level-nav-count">{itemDone}/{itemCount}</span>
              </button>
            );
          })}
        </nav>

        <div className="rail-bottom">
          <div className="overall-card">
            <div className="overall-topline"><span>Overall progress</span><strong>{overallPercent}%</strong></div>
            <div className="overall-track"><span style={{ width: `${overallPercent}%` }} /></div>
            <p>{progress.size} of {allCards.length} study cards complete</p>
            <button className="quiet-button" type="button" onClick={resetProgress}>Reset progress</button>
          </div>
          <p className="rail-footnote">Six levels. One practical loop: understand → build → explain.</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs"><span className="live-dot" /> React interview prep <span>/</span> 0–5 ladder</div>
          <div className="topbar-right">
            <span className="date-note">A focused path, not a topic dump</span>
            <button className="jump-button" type="button" onClick={() => scrollToSection('theory')}>Start studying <span>↘</span></button>
          </div>
        </header>

        <section className="hero" id="overview">
          <div className="hero-copy">
            <p className="eyebrow">{level.label} <span>/</span> {level.kicker}</p>
            <h1>From first component<br /><em>to architecture.</em></h1>
            <p className="hero-description">A practical React path that grows with the problems you can solve—from making a component render to leading decisions across a product.</p>
            <div className="hero-actions">
              <button className="primary-button" type="button" onClick={() => scrollToSection('theory')}>Study {level.name.toLowerCase()} <span>↓</span></button>
              <button className="secondary-button" type="button" onClick={() => scrollToSection('practice')}>Open practice lab</button>
            </div>
          </div>
          <div className="hero-meter">
            <div className="meter-label"><span>Current level</span><strong>{levelPercent}% complete</strong></div>
            <div className="meter-ring" style={{ '--progress': `${levelPercent * 3.6}deg` }}>
              <div><strong>{activeLevel}</strong><span>of 5</span></div>
            </div>
            <div className="meter-footer"><span className={`level-dot ${level.color}`}><span>{activeLevel}</span></span><span><strong>{level.name}</strong><small>{currentCompleted} / {currentItems.length} cards checked</small></span></div>
          </div>
        </section>

        <section className="level-picker" aria-label="Choose a preparation level">
          <div className="level-picker-heading"><p className="eyebrow">Choose your altitude</p><span>Each level ends with a checkpoint.</span></div>
          <div className="level-picker-list">
            {levels.map(item => (
              <button className={`level-pill ${item.id === activeLevel ? 'active' : ''}`} key={item.id} onClick={() => chooseLevel(item.id)} type="button">
                <span>{item.id}</span><strong>{item.shortName}</strong>
              </button>
            ))}
          </div>
        </section>

        <section className="level-intro">
          <div className="level-intro-main">
            <div className="section-kicker"><span className="section-index">00</span><span>Current level</span></div>
            <h2>{level.name}: {level.description}</h2>
            <div className="focus-row">{level.focus.map((item, index) => <span key={item}><b>0{index + 1}</b>{item}</span>)}</div>
          </div>
          <div className="checkpoint-card">
            <span className="mini-label">Level checkpoint</span>
            <p>{level.checkpoint}</p>
            <span className="checkpoint-arrow">↗</span>
          </div>
        </section>

        <div className="search-bar-wrap">
          <span className="search-symbol" aria-hidden="true">⌕</span>
          <input aria-label="Search the current level" value={search} onChange={event => setSearch(event.target.value)} placeholder={`Search ${level.name.toLowerCase()} cards…`} />
          {search && <button className="clear-button" type="button" onClick={() => setSearch('')} aria-label="Clear search">×</button>}
          <kbd>⌘ K</kbd>
        </div>

        <section className="content-section" id="theory">
          <SectionHeading index="01" eyebrow="Mental models" title="Say it simply, then prove it." description="The few ideas that unlock the level. Open an answer, rehearse it out loud, and mark it when you can explain the trade-off." count={`${levelTheory.length} cards`} />
          <div className="theory-list">
            {levelTheory.length ? levelTheory.map(item => (
              <TheoryCard key={item.id} item={item} open={openTheory.has(item.id)} complete={progress.has(item.id)} onToggle={() => toggleTheory(item.id)} onComplete={() => toggleComplete(item.id)} />
            )) : <EmptyState label="theory cards" onClear={() => setSearch('')} />}
          </div>
        </section>

        <section className="content-section" id="practice">
          <SectionHeading index="02" eyebrow="Practice lab" title="Turn understanding into muscle memory." description="Choose one prompt. The goal is not a perfect answer—it is a clear approach, the right boundary, and a working edge case." count={`${levelExercises.length} exercises`} />
          {activeExercise ? (
            <div className="practice-layout">
              <div className="exercise-menu">
                {levelExercises.length ? levelExercises.map(item => (
                  <button className={`exercise-menu-item ${item.id === activeExercise.id ? 'active' : ''}`} key={item.id} onClick={() => setSelectedExerciseId(item.id)} type="button">
                    <span className="exercise-number">{String(item.level + 1).padStart(2, '0')}</span>
                    <span><small>{item.type} · {item.time}</small><strong>{item.title}</strong></span>
                    <span className={progress.has(item.id) ? 'complete-check checked' : 'complete-check'}>{progress.has(item.id) ? '✓' : '○'}</span>
                  </button>
                )) : <EmptyState label="practice prompts" onClear={() => setSearch('')} />}
              </div>
              <ExerciseDetail item={activeExercise} complete={progress.has(activeExercise.id)} onComplete={() => toggleComplete(activeExercise.id)} />
            </div>
          ) : <EmptyState label="practice prompts" onClear={() => setSearch('')} />}
        </section>

        <section className="content-section" id="scenarios">
          <SectionHeading index="03" eyebrow="Interview scenarios" title="Practice the conversation, not just the code." description="These prompts reveal how you reason when the problem is ambiguous, the system is growing, or the happy path is not enough." count={`${levelScenarios.length} scenarios`} />
          {activeScenario ? (
            <div className="scenario-layout">
              <div className="scenario-menu">
                {levelScenarios.length ? levelScenarios.map(item => (
                  <button className={`scenario-menu-item ${item.id === activeScenario.id ? 'active' : ''}`} key={item.id} onClick={() => setSelectedScenarioId(item.id)} type="button">
                    <span className="scenario-role">{item.role}</span>
                    <strong>{item.title}</strong>
                    <span className={progress.has(item.id) ? 'complete-check checked' : 'complete-check'}>{progress.has(item.id) ? '✓' : '○'}</span>
                  </button>
                )) : <EmptyState label="scenario prompts" onClear={() => setSearch('')} />}
              </div>
              <ScenarioDetail item={activeScenario} complete={progress.has(activeScenario.id)} onComplete={() => toggleComplete(activeScenario.id)} />
            </div>
          ) : <EmptyState label="scenario prompts" onClear={() => setSearch('')} />}
        </section>

        <footer className="footer">
          <div className="footer-brand"><span className="brand-mark small">0→5</span><strong>React ladder</strong></div>
          <p>Built for deliberate practice · React concepts from foundations to architecture</p>
          <button className="back-top" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top ↑</button>
        </footer>
      </main>
    </div>
  );
}

function SectionHeading({ index, eyebrow, title, description, count }) {
  return (
    <div className="section-heading">
      <div className="section-heading-copy"><div className="section-kicker"><span className="section-index">{index}</span><span>{eyebrow}</span></div><h2>{title}</h2><p>{description}</p></div>
      <span className="section-count">{count}</span>
    </div>
  );
}

function TheoryCard({ item, open, complete, onToggle, onComplete }) {
  return (
    <article className={`theory-card ${open ? 'open' : ''} ${complete ? 'complete' : ''}`}>
      <button className="theory-trigger" type="button" onClick={onToggle} aria-expanded={open}>
        <span className="theory-number">{String(item.level + 1).padStart(2, '0')}</span>
        <span className="theory-title"><small>{item.category}</small><strong>{item.question}</strong></span>
        <span className="expand-icon">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="theory-answer">
          <div className="answer-copy"><p>{item.answer}</p><div className="interviewer-signal"><span>Interview signal</span><strong>{item.signal}</strong></div></div>
          <CodeSnippet code={item.code} />
          <button className={`complete-button ${complete ? 'is-complete' : ''}`} type="button" onClick={onComplete}>{complete ? 'Marked complete ✓' : 'Mark as understood'}</button>
        </div>
      )}
    </article>
  );
}

function CodeSnippet({ code }) {
  return <div className="code-snippet"><div className="code-header"><span><i /><i /><i /></span><small>react.jsx</small></div><pre><code>{code}</code></pre></div>;
}

function ExerciseDetail({ item, complete, onComplete }) {
  return (
    <article className="exercise-detail">
      <div className="detail-topline"><span className="type-label">{item.type}</span><span>{item.time}</span></div>
      <h3>{item.title}</h3>
      <p className="detail-prompt">{item.prompt}</p>
      <div className="detail-columns">
        <div><span className="mini-label">Constraints</span><ul>{item.constraints.map(constraint => <li key={constraint}>{constraint}</li>)}</ul></div>
        <div><span className="mini-label">A strong approach</span><ol>{item.approach.map(step => <li key={step}>{step}</li>)}</ol></div>
      </div>
      <CodeSnippet code={item.starter} />
      <div className="detail-footer"><p><span>Interviewer follow-up</span>{item.interview}</p><button className={`complete-button ${complete ? 'is-complete' : ''}`} type="button" onClick={onComplete}>{complete ? 'Complete ✓' : 'I practised this'}</button></div>
    </article>
  );
}

function ScenarioDetail({ item, complete, onComplete }) {
  return (
    <article className="scenario-detail">
      <div className="scenario-detail-top"><span className="scenario-role large">{item.role}</span><span className="signal-chip">{item.signal}</span></div>
      <h3>{item.title}</h3>
      <p className="scenario-prompt">“{item.prompt}”</p>
      <div className="answer-path"><span className="mini-label">Answer path</span>{item.answer.map((step, index) => <div className="answer-step" key={step}><b>0{index + 1}</b><p>{step}</p></div>)}</div>
      <div className="scenario-footer"><p><span>Follow-up</span>{item.followUp}</p><button className={`complete-button ${complete ? 'is-complete' : ''}`} type="button" onClick={onComplete}>{complete ? 'Rehearsed ✓' : 'Mark rehearsed'}</button></div>
    </article>
  );
}

function EmptyState({ label, onClear }) {
  return <div className="empty-state"><span>⌕</span><strong>No {label} match that search.</strong><button type="button" onClick={onClear}>Clear search</button></div>;
}

export default App;
