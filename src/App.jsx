import { useEffect, useMemo, useRef, useState } from 'react';
import {
  codeExamples,
  technicalQuestions,
  theoryQuestions,
  topicOptions,
} from './data.js';
import { questionBank, questionBankCategories } from './questionBank.js';
import { answerForQuestion } from './questionBankAnswers.js';
import LadderApp from './ladder/LadderApp.jsx';

const navItems = [
  { id: 'overview', label: 'Start here', icon: '✦' },
  { id: 'question-bank', label: 'Question bank', icon: '01' },
  { id: 'theory', label: 'Theory Q&A', icon: '02' },
  { id: 'code', label: 'Code solutions', icon: '03' },
  { id: 'technical', label: 'Technical Q&A', icon: '04' },
];

const roadmapTracks = [
  { label: 'Components + JSX', detail: 'rendering, props, keys' },
  { label: 'State + forms', detail: 'events, reducers, controlled inputs' },
  { label: 'Hooks + effects', detail: 'sync, refs, custom hooks' },
  { label: 'Context + routing', detail: 'shared data, URLs, layouts' },
  { label: 'Server state', detail: 'Query, mutations, cache' },
  { label: 'Quality', detail: 'tests, performance, boundaries' },
  { label: 'React 19 + Next', detail: 'actions, RSC boundaries' },
];

function readMastered() {
  try {
    const stored = window.localStorage.getItem('react-interview-mastered');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function normalize(value) {
  return value.trim().toLowerCase();
}

function matchesSearch(item, search, fields) {
  if (!search) return true;
  const haystack = fields.map(field => item[field] ?? '').join(' ');
  return normalize(haystack).includes(normalize(search));
}

function scrollToSection(id, setActiveSection) {
  setActiveSection(id);
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function App() {
  const [view, setView] = useState(() => (
    typeof window !== 'undefined' && window.location.hash === '#ladder' ? 'ladder' : 'lab'
  ));

  function switchView(nextView) {
    setView(nextView);
    window.history.replaceState(null, '', nextView === 'ladder' ? '#ladder' : '#lab');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (view === 'ladder') return <LadderApp onSwitch={switchView} />;
  return <MainLab onSwitch={switchView} />;
}

function MainLab({ onSwitch }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('All topics');
  const [bankCategory, setBankCategory] = useState('all');
  const [expandedTheory, setExpandedTheory] = useState(new Set(['component']));
  const [mastered, setMastered] = useState(readMastered);
  const [selectedCodeId, setSelectedCodeId] = useState(codeExamples[0].id);
  const [copiedId, setCopiedId] = useState(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        'react-interview-mastered',
        JSON.stringify([...mastered]),
      );
    } catch {
      // Progress is a convenience; the guide remains usable if storage is blocked.
    }
  }, [mastered]);

  useEffect(() => {
    function focusSearch(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }

    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  const filteredTheory = useMemo(() => theoryQuestions.filter(item => {
    const topicMatches = topic === 'All topics' || item.topic === topic;
    return topicMatches && matchesSearch(item, search, ['question', 'answer', 'topic']);
  }), [search, topic]);

  const filteredCode = useMemo(() => codeExamples.filter(item => (
    matchesSearch(item, search, ['title', 'lane', 'prompt', 'solution', 'interviewNotes'])
  )), [search]);

  const filteredTechnical = useMemo(() => technicalQuestions.filter(item => (
    matchesSearch(item, search, ['question', 'answer', 'signal', 'followUp'])
  )), [search]);

  const filteredQuestionBank = useMemo(() => questionBank.filter(item => (
    (bankCategory === 'all' || item.category === bankCategory)
      && matchesSearch(item, search, ['question', 'category', 'sourceLabel'])
  )), [bankCategory, search]);

  const activeCode = filteredCode.find(item => item.id === selectedCodeId)
    ?? filteredCode[0]
    ?? null;

  function toggleTheory(id) {
    setExpandedTheory(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleMastered(id) {
    setMastered(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function resetProgress() {
    setMastered(new Set());
  }

  async function copyCode(id, code) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      setCopiedId(null);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">R</div>
          <div>
            <p className="brand-name">React Interview Lab</p>
            <p className="brand-caption">80/20 preparation</p>
          </div>
        </div>

        <div className="sidebar-rule" />

        <div className="site-switcher" aria-label="Choose a study guide">
          <p className="site-switcher-label">Study guides</p>
          <button className="site-switcher-button active" type="button" onClick={() => onSwitch('lab')}>
            <span>80/20</span> React Interview Lab
          </button>
          <button className="site-switcher-button" type="button" onClick={() => onSwitch('ladder')}>
            <span>0→5</span> React ladder
          </button>
        </div>
        <div className="sidebar-rule compact" />

        <p className="sidebar-label">Study path</p>
        <nav className="nav-list" aria-label="Study path">
          {navItems.map(item => (
            <button
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              key={item.id}
              onClick={() => scrollToSection(item.id, setActiveSection)}
              type="button"
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'question-bank' && <span className="nav-count">{questionBank.length}</span>}
              {item.id === 'theory' && <span className="nav-count">{theoryQuestions.length}</span>}
              {item.id === 'code' && <span className="nav-count">{codeExamples.length}</span>}
              {item.id === 'technical' && <span className="nav-count">{technicalQuestions.length}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-progress">
          <div className="progress-heading">
            <span>Marked mastered</span>
            <strong>{mastered.size}/{theoryQuestions.length}</strong>
          </div>
          <div className="progress-track" aria-label={`${mastered.size} of ${theoryQuestions.length} theory questions marked mastered`}>
            <span style={{ width: `${Math.min((mastered.size / theoryQuestions.length) * 100, 100)}%` }} />
          </div>
          <button className="text-button" type="button" onClick={resetProgress}>
            Reset progress
          </button>
        </div>

        <div className="sidebar-source">
          <p className="mini-label">Source boundary</p>
          <p>React concepts and ecosystem tools from the supplied roadmap and reference files. The HR-only PDF is excluded from this React question bank.</p>
          <span className="date-stamp">Refreshed Oct 01, 2026</span>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div className="breadcrumb">
            <span className="breadcrumb-dot" />
            <span>React only</span>
            <span className="slash">/</span>
            <span>Interview prep</span>
          </div>
          <div className="topbar-actions">
            <span className="updated-label">Roadmap-aligned · 01 Oct 2026</span>
            <button className="top-action" type="button" onClick={() => scrollToSection('theory', setActiveSection)}>
              Start with theory <span>↗</span>
            </button>
          </div>
        </header>

        <div className="page-intro">
          <div>
            <p className="eyebrow">The high-signal React interview guide</p>
            <h1>Think in renders.<br /><span>Answer with confidence.</span></h1>
            <p className="intro-copy">
              A focused, interview-first path through the React skills used every day: component design, state, effects, forms, data, testing, performance, and modern React 19 patterns.
            </p>
          </div>
          <div className="intro-stat-card">
            <span className="stat-kicker">Coverage at a glance</span>
            <div className="stat-grid">
              <div><strong>{theoryQuestions.length}</strong><span>Theory Q&A</span></div>
              <div><strong>{codeExamples.length}</strong><span>Code solutions</span></div>
              <div><strong>{technicalQuestions.length}</strong><span>Technical prompts</span></div>
            </div>
            <div className="stat-footer"><span className="signal-dot" /> Prioritized by the roadmap’s 20%</div>
          </div>
        </div>

        <div className="global-search-wrap">
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input
            aria-label="Search the React interview guide"
            onChange={event => setSearch(event.target.value)}
            placeholder="Search across the question bank, theory, code, and technical prompts…"
            ref={searchInputRef}
            value={search}
          />
          {search && <button className="clear-search" type="button" onClick={() => setSearch('')} aria-label="Clear search">×</button>}
          <kbd>⌘ K</kbd>
        </div>

        <section className="section overview-section" id="overview">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">01 / Orientation</p>
              <h2>The 20% that powers most React work</h2>
            </div>
            <p className="section-note">Use the theory cards to build mental models, then switch to code and technical prompts to practice saying it out loud.</p>
          </div>

          <div className="overview-grid">
            <div className="panel roadmap-panel">
              <div className="panel-header">
                <div>
                  <p className="mini-label">High-signal coverage</p>
                  <h3>What interviewers probe first</h3>
                </div>
                <span className="panel-index">7 tracks</span>
              </div>
              <div className="track-list">
                {roadmapTracks.map((track, index) => (
                  <div className="track-row" key={track.label}>
                    <span className="track-number">0{index + 1}</span>
                    <div><strong>{track.label}</strong><span>{track.detail}</span></div>
                    <span className="track-arrow">→</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="right-overview-stack">
              <div className="panel study-panel">
                <p className="mini-label">A better study loop</p>
                <h3>Explain → type → break → rebuild</h3>
                <div className="study-steps">
                  <span><b>01</b> Read one answer</span>
                  <span><b>02</b> Type the example</span>
                  <span><b>03</b> Break the edge case</span>
                  <span><b>04</b> Rebuild from memory</span>
                </div>
              </div>
              <div className="panel guardrail-panel">
                <div className="guardrail-icon">!</div>
                <div>
                  <p className="mini-label">Version guardrail</p>
                  <p>The supplied roadmap targets React 19.3, React Compiler 1.0, React Router v8, and Next.js 16.3. Verify version-sensitive details against the docs for the role’s actual stack.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="scope-strip">
            <span className="scope-title">Deliberately out of scope</span>
            <span>General JavaScript drills</span>
            <span>CSS / styling interviews</span>
            <span>Backend + deployment</span>
            <span>Legacy class React trivia</span>
          </div>
        </section>

        <QuestionBankSection
          questions={filteredQuestionBank}
          category={bankCategory}
          onCategoryChange={setBankCategory}
          onClear={() => { setSearch(''); setBankCategory('all'); }}
        />

        <TheorySection
          filteredTheory={filteredTheory}
          expandedTheory={expandedTheory}
          mastered={mastered}
          onToggle={toggleTheory}
          onToggleMastered={toggleMastered}
          onTopicChange={setTopic}
          topic={topic}
          onCopy={copyCode}
          copiedId={copiedId}
          onClearFilters={() => { setSearch(''); setTopic('All topics'); }}
        />

        <CodeSection
          activeCode={activeCode}
          codeItems={filteredCode}
          selectedCodeId={selectedCodeId}
          onSelect={setSelectedCodeId}
          onCopy={copyCode}
          copiedId={copiedId}
        />

        <TechnicalSection questions={filteredTechnical} />

        <footer className="footer">
          <div><span className="brand-mark small">R</span><strong>React Interview Lab</strong></div>
          <p>Focused on the React 80/20 roadmap · refreshed 01 Oct 2026</p>
          <button className="back-to-top" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top ↑</button>
        </footer>
      </main>
    </div>
  );
}

function SectionHeader({ eyebrow, title, description, count }) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description && <p className="section-description">{description}</p>}
      </div>
      {count && <span className="section-count">{count}</span>}
    </div>
  );
}

function CodeBlock({ id, code, onCopy, copiedId, compact = false }) {
  return (
    <div className={`code-frame ${compact ? 'compact' : ''}`}>
      <div className="code-toolbar">
        <div className="window-dots"><i /><i /><i /></div>
        <span>solution.jsx</span>
        <button type="button" onClick={() => onCopy(id, code)}>{copiedId === id ? 'Copied ✓' : 'Copy code'}</button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  );
}

function QuestionBankSection({ questions, category, onCategoryChange, onClear }) {
  return (
    <section className="section question-bank-section" id="question-bank">
      <SectionHeader
        eyebrow="02 / Source-backed practice"
        title="React question bank"
        description="Questions extracted from the reference PDFs and Word documents, with closely related roadmap questions added where the source material points to a missing interview angle."
        count={`${questions.length} shown`}
      />

      <div className="question-bank-toolbar">
        <div className="filter-tabs" role="tablist" aria-label="Filter the React question bank">
          {questionBankCategories.map(option => (
            <button
              className={category === option.id ? 'selected' : ''}
              key={option.id}
              onClick={() => onCategoryChange(option.id)}
              role="tab"
              type="button"
              aria-selected={category === option.id}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="bank-source-note">{questions.filter(item => !item.expanded).length} source questions · {questions.filter(item => item.expanded).length} expanded</span>
      </div>

      <div className="question-bank-grid">
        {questions.map(item => (
          <article className={`bank-card ${item.expanded ? 'expanded' : ''}`} key={item.id}>
            <div className="bank-card-topline">
              <span className={`bank-category ${item.category}`}>{item.category}</span>
              <span className="bank-origin">{item.expanded ? 'Expanded' : 'Source'}</span>
            </div>
            <h3>{item.question}</h3>
            <div className="bank-answer">
              <span className="bank-answer-label">Answer</span>
              <p>{answerForQuestion(item)}</p>
            </div>
            <details>
              <summary>Source trace</summary>
              <ul>
                {item.sources.map(source => (
                  <li key={`${source.file}-${source.number ?? source.section}`}>
                    {source.file}{source.number ? ` · question ${source.number}` : ''}{source.section ? ` · ${source.section}` : ''}
                  </li>
                ))}
              </ul>
            </details>
          </article>
        ))}
      </div>

      {questions.length === 0 && (
        <EmptyState label="No question-bank item matches the current filters." onClear={onClear} />
      )}
    </section>
  );
}

function TheorySection({
  filteredTheory,
  expandedTheory,
  mastered,
  onToggle,
  onToggleMastered,
  onTopicChange,
  topic,
  onCopy,
  copiedId,
  onClearFilters,
}) {
  return (
    <section className="section" id="theory">
      <SectionHeader
        eyebrow="02 / Mental models"
        title="Theory Q&A"
        description="Short answers with the example you should be able to type and explain at a whiteboard."
        count={`${filteredTheory.length} shown`}
      />

      <div className="section-toolbar">
        <div className="filter-tabs" role="tablist" aria-label="Filter theory by topic">
          {topicOptions.map(option => (
            <button
              className={topic === option ? 'selected' : ''}
              key={option}
              onClick={() => onTopicChange(option)}
              role="tab"
              type="button"
              aria-selected={topic === option}
            >
              {option}
            </button>
          ))}
        </div>
        <span className="mastered-summary"><span className="check-dot">✓</span> {mastered.size} mastered</span>
      </div>

      <div className="theory-list">
        {filteredTheory.map(item => {
          const open = expandedTheory.has(item.id);
          const done = mastered.has(item.id);
          return (
            <article className={`question-card ${open ? 'open' : ''} ${done ? 'done' : ''}`} key={item.id}>
              <button className="question-trigger" type="button" onClick={() => onToggle(item.id)} aria-expanded={open}>
                <span className="question-number">{item.number}</span>
                <span className="question-heading">
                  <span className="topic-label">{item.topic}</span>
                  <strong>{item.question}</strong>
                </span>
                <span className="question-toggle">{open ? '−' : '+'}</span>
              </button>
              {open && (
                <div className="answer-body">
                  <p>{item.answer}</p>
                  <div className="example-label"><span>Example</span><span>React</span></div>
                  <CodeBlock id={`theory-${item.id}`} code={item.example} onCopy={onCopy} copiedId={copiedId} compact />
                  <div className="answer-actions">
                    <button className={`master-button ${done ? 'marked' : ''}`} type="button" onClick={() => onToggleMastered(item.id)}>
                      <span>{done ? '✓' : '○'}</span> {done ? 'Mastered' : 'Mark as mastered'}
                    </button>
                    <span className="signal-caption">High-signal React concept</span>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {filteredTheory.length === 0 && <EmptyState onClear={onClearFilters} label="No theory matches those filters." />}
    </section>
  );
}

function CodeSection({ activeCode, codeItems, selectedCodeId, onSelect, onCopy, copiedId }) {
  return (
    <section className="section" id="code">
      <SectionHeader
        eyebrow="03 / Build it"
        title="Code examples + solutions"
        description="Practice prompts drawn from the roadmap builds. Read the solution, then close it and recreate the flow from memory."
        count={`${codeItems.length} shown`}
      />

      <div className="code-lab">
        <div className="code-index">
          <div className="code-index-header"><span className="mini-label">Practice set</span><span>{codeItems.length} exercises</span></div>
          {codeItems.map((item, index) => (
            <button
              className={`code-index-item ${activeCode?.id === item.id ? 'active' : ''}`}
              key={item.id}
              onClick={() => onSelect(item.id)}
              type="button"
            >
              <span className="code-index-number">{String(index + 1).padStart(2, '0')}</span>
              <span><strong>{item.title}</strong><small>{item.lane}</small></span>
              <span className="index-chevron">›</span>
            </button>
          ))}
          {codeItems.length === 0 && <p className="empty-inline">No code example matches the search.</p>}
        </div>

        {activeCode ? (
          <div className="code-detail">
            <div className="code-detail-topline"><span className="topic-label">{activeCode.lane}</span><span className="difficulty-pill">{activeCode.difficulty}</span></div>
            <h3>{activeCode.title}</h3>
            <div className="prompt-box"><span className="prompt-label">Prompt</span><p>{activeCode.prompt}</p></div>
            <div className="solution-copy"><span className="mini-label">Solution approach</span><p>{activeCode.solution}</p></div>
            <CodeBlock id={`code-${activeCode.id}`} code={activeCode.code} onCopy={onCopy} copiedId={copiedId} />
            <div className="interview-notes">
              <span className="mini-label">Say this in the interview</span>
              <ul>{activeCode.interviewNotes.map(note => <li key={note}>{note}</li>)}</ul>
            </div>
          </div>
        ) : (
          <EmptyState label="No code example matches the search." />
        )}
      </div>
    </section>
  );
}

function TechnicalSection({ questions }) {
  return (
    <section className="section" id="technical">
      <SectionHeader
        eyebrow="04 / Speak clearly"
        title="Technical interview Q&A"
        description="Prompts that test judgment: state ownership, effects, identity, caching, test strategy, and version-aware React decisions."
        count={`${questions.length} shown`}
      />
      <div className="technical-grid">
        {questions.map((item, index) => (
          <article className="technical-card" key={item.id}>
            <div className="technical-meta"><span>0{(index % 9) + 1}</span><span>{item.signal}</span></div>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
            <div className="follow-up"><span>Follow-up</span><p>{item.followUp}</p></div>
          </article>
        ))}
      </div>
      {questions.length === 0 && <EmptyState label="No technical prompt matches the search." />}
    </section>
  );
}

function EmptyState({ label, onClear }) {
  return (
    <div className="empty-state">
      <span className="empty-symbol">⌁</span>
      <p>{label}</p>
      {onClear && <button type="button" onClick={onClear}>Clear filters</button>}
    </div>
  );
}

export default App;
