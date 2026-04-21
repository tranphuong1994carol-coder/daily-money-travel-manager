import { useEffect, useMemo, useState } from "react";
import "./App.css";

const STORAGE_KEY = "money-travel-manager-v1";
const TODAY = () => new Date().toISOString().slice(0, 10);

const categories = ["Food", "Transport", "Shopping", "Bills", "Travel", "Health", "Entertainment", "Other"];
const currencies = ["VND", "USD", "EUR", "THB", "JPY", "KRW", "CNY", "SGD"];
const tabs = [
  { id: "dashboard", label: "Dashboard", shortLabel: "Home", icon: "home" },
  { id: "add", label: "Add Transaction", shortLabel: "Add", icon: "add" },
  { id: "transactions", label: "Transactions", shortLabel: "Ledger", icon: "ledger" },
  { id: "fx", label: "Exchange", shortLabel: "FX", icon: "fx" },
  { id: "checklist", label: "Checklist", shortLabel: "Tasks", icon: "task" },
];
const blossomPetals = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: `${(index * 97) % 100}%`,
  size: 12 + (index % 4) * 6,
  delay: `${(index % 6) * 1.2}s`,
  duration: `${10 + (index % 5) * 2}s`,
}));
const categoryShortCodes = {
  Food: "FD",
  Transport: "TR",
  Shopping: "SP",
  Bills: "BL",
  Travel: "TV",
  Health: "HT",
  Entertainment: "EN",
  Other: "OT",
};

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

function formatMoney(value, currency = "VND") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
  }).format(Number(value || 0));
}

function monthKey(dateString) {
  return (dateString || TODAY()).slice(0, 7);
}

function safeParseStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function readInitialState() {
  return safeParseStorage() || {};
}

function getInitialTransactionForm(currency) {
  return {
    date: TODAY(),
    type: "expense",
    category: "Food",
    amount: "",
    currency,
    rateToBase: 1,
    trip: "",
    note: "",
  };
}

function getInitialTaskForm() {
  return {
    title: "",
    group: "Personal",
    dueDate: TODAY(),
  };
}

function getInitialFxForm() {
  return {
    amount: "",
    from: "USD",
    to: "VND",
    result: "",
    rate: "",
    updatedAt: "",
  };
}

function SectionCard({ title, subtitle, actions, children, className = "" }) {
  return (
    <section className={`card ${className}`.trim()}>
      <div className="card__header">
        <div>
          <p className="eyebrow">{title}</p>
          {subtitle ? <h2>{subtitle}</h2> : null}
        </div>
        {actions ? <div className="card__actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

function SummaryCard({ label, value, tone = "default", detail }) {
  return (
    <article className={`summary-card summary-card--${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      {detail ? <span>{detail}</span> : null}
    </article>
  );
}

function TabIcon({ type }) {
  const icons = {
    home: (
      <path
        d="M4.5 8.5L12 3l7.5 5.5v8a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1v-8Z M9.5 18v-5h5V18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    add: (
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    ),
    ledger: (
      <path
        d="M6 5.5h12a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Z M8.5 9.5h7 M8.5 13h7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    fx: (
      <path
        d="M7 7.5h8M7 16.5h8M9 5l-2 2.5L9 10M15 14l2 2.5-2 2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    task: (
      <path
        d="M7 7.5h10M7 12h10M7 16.5h6M4.5 7.5h.01M4.5 12h.01M4.5 16.5h.01"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  };

  return (
    <span className="tabbar__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" role="presentation">
        {icons[type]}
      </svg>
    </span>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-state__art" aria-hidden="true">
        <span className="empty-state__petal empty-state__petal--one" />
        <span className="empty-state__petal empty-state__petal--two" />
        <span className="empty-state__petal empty-state__petal--three" />
      </div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

function TransactionRow({ item, baseCurrency, onEdit, onDelete }) {
  return (
    <article className={`list-row list-row--${item.type}`}>
      <div className="list-row__main">
        <div className="list-row__title-wrap">
          <span className="category-badge" aria-hidden="true">
            {categoryShortCodes[item.category] || "OT"}
          </span>
          <strong>{item.category}</strong>
          <span className={`pill pill--${item.type}`}>{item.type}</span>
        </div>
        <p className="muted">
          {item.date}
          {item.trip ? ` - ${item.trip}` : ""}
        </p>
        {item.note ? <p className="muted">{item.note}</p> : null}
      </div>

      <div className="list-row__side">
        <strong>{formatMoney(item.amount, item.currency)}</strong>
        <span className="muted">{formatMoney(item.amountBase, baseCurrency)}</span>
        <div className="inline-actions">
          <button type="button" className="button button--ghost" onClick={() => onEdit(item)}>
            Edit
          </button>
          <button type="button" className="button button--ghost-danger" onClick={() => onDelete(item.id)}>
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

function TaskRow({ task, onToggle, onEdit, onDelete }) {
  return (
    <div className="task-row">
      <label className="task-row__main">
        <input type="checkbox" checked={task.completed} onChange={() => onToggle(task.id)} />
        <div>
          <strong className={task.completed ? "is-done" : ""}>{task.title}</strong>
          <p className="muted">
            {task.group} - Due {task.dueDate}
          </p>
        </div>
      </label>

      <span className={`pill ${task.completed ? "pill--done" : "pill--open"}`}>
        {task.completed ? "Done" : "Open"}
      </span>

      <div className="inline-actions">
        <button type="button" className="button button--ghost" onClick={() => onEdit(task)}>
          Edit
        </button>
        <button type="button" className="button button--ghost-danger" onClick={() => onDelete(task.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}

function MiniChart({ data }) {
  const peak = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="mini-chart" aria-label="Monthly spending chart">
      {data.map((item) => (
        <div className="mini-chart__item" key={item.label}>
          <div className="mini-chart__bar-wrap">
            <div className="mini-chart__bar" style={{ height: `${Math.max((item.value / peak) * 100, 8)}%` }} />
          </div>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [initialState] = useState(readInitialState);
  const [tab, setTab] = useState("dashboard");
  const [theme, setTheme] = useState(() => initialState.theme || "blossom");
  const [baseCurrency, setBaseCurrency] = useState(() => initialState.baseCurrency || "VND");
  const [transactions, setTransactions] = useState(() => initialState.transactions || []);
  const [tasks, setTasks] = useState(() => initialState.tasks || []);
  const [ratesCache, setRatesCache] = useState(() => initialState.ratesCache || {});
  const [rateMessage, setRateMessage] = useState("Rate cache ready");
  const [txForm, setTxForm] = useState(() => getInitialTransactionForm(initialState.baseCurrency || "VND"));
  const [taskForm, setTaskForm] = useState(getInitialTaskForm);
  const [fxForm, setFxForm] = useState(getInitialFxForm);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [transactionQuery, setTransactionQuery] = useState("");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all");
  const [transactionCategoryFilter, setTransactionCategoryFilter] = useState("all");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ theme, baseCurrency, transactions, tasks, ratesCache }),
    );
  }, [theme, baseCurrency, transactions, tasks, ratesCache]);

  async function getRate(from, to) {
    if (from === to) {
      return { rate: 1, date: TODAY() };
    }

    const key = `${from}_${to}`;
    if (ratesCache[key]) {
      return ratesCache[key];
    }

    setRateMessage(`Fetching ${from}/${to}...`);

    try {
      const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
      const data = await response.json();
      const nextValue = {
        rate: Number(data?.rates?.[to] || 1),
        date: data?.date || TODAY(),
      };

      setRatesCache((current) => ({ ...current, [key]: nextValue }));
      setRateMessage(`Updated ${from}/${to} on ${nextValue.date}`);
      return nextValue;
    } catch (error) {
      console.error(error);
      setRateMessage("Could not fetch exchange rate");
      return { rate: 1, date: TODAY() };
    }
  }

  async function updateTransactionCurrency(currency) {
    const nextRate = currency === baseCurrency ? 1 : (await getRate(currency, baseCurrency)).rate;
    setTxForm((current) => ({ ...current, currency, rateToBase: nextRate }));
  }

  function updateTransactionField(field, value) {
    setTxForm((current) => ({ ...current, [field]: value }));
  }

  function updateTaskField(field, value) {
    setTaskForm((current) => ({ ...current, [field]: value }));
  }

  function updateFxField(field, value) {
    setFxForm((current) => ({ ...current, [field]: value }));
  }

  function resetTransactionForm() {
    setEditingTransactionId(null);
    setTxForm(getInitialTransactionForm(baseCurrency));
  }

  function resetTaskForm() {
    setEditingTaskId(null);
    setTaskForm(getInitialTaskForm());
  }

  function saveTransaction() {
    if (!txForm.amount) {
      return;
    }

    const nextTransaction = {
      id: editingTransactionId || createId(),
      ...txForm,
      amount: Number(txForm.amount),
      rateToBase: txForm.currency === baseCurrency ? 1 : Number(txForm.rateToBase || 1),
    };

    setTransactions((current) =>
      editingTransactionId
        ? current.map((item) => (item.id === editingTransactionId ? nextTransaction : item))
        : [nextTransaction, ...current],
    );

    resetTransactionForm();
    setTab("transactions");
  }

  async function convertNow() {
    if (!fxForm.amount) {
      return;
    }

    const info = await getRate(fxForm.from, fxForm.to);
    setFxForm((current) => ({
      ...current,
      result: Number(current.amount) * Number(info.rate),
      rate: info.rate,
      updatedAt: info.date,
    }));
  }

  function saveTask() {
    if (!taskForm.title.trim()) {
      return;
    }

    setTasks((current) =>
      editingTaskId
        ? current.map((task) => (task.id === editingTaskId ? { ...task, ...taskForm } : task))
        : [{ id: createId(), ...taskForm, completed: false }, ...current],
    );

    resetTaskForm();
  }

  function toggleTask(id) {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
    );
  }

  function startTransactionEdit(item) {
    setEditingTransactionId(item.id);
    setTxForm({
      date: item.date,
      type: item.type,
      category: item.category,
      amount: String(item.amount),
      currency: item.currency,
      rateToBase: item.rateToBase,
      trip: item.trip,
      note: item.note,
    });
    setTab("add");
  }

  function deleteTransaction(id) {
    setTransactions((current) => current.filter((item) => item.id !== id));
    if (editingTransactionId === id) {
      resetTransactionForm();
    }
  }

  function startTaskEdit(task) {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      group: task.group,
      dueDate: task.dueDate,
    });
    setTab("checklist");
  }

  function deleteTask(id) {
    setTasks((current) => current.filter((task) => task.id !== id));
    if (editingTaskId === id) {
      resetTaskForm();
    }
  }

  const enrichedTransactions = useMemo(
    () =>
      transactions.map((item) => ({
        ...item,
        amountBase: Number(item.amount || 0) * Number(item.rateToBase || 1),
      })),
    [transactions],
  );

  const metrics = useMemo(() => {
    const today = TODAY();
    const totalIncome = enrichedTransactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amountBase, 0);
    const totalExpense = enrichedTransactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amountBase, 0);
    const todayExpense = enrichedTransactions
      .filter((item) => item.type === "expense" && item.date === today)
      .reduce((sum, item) => sum + item.amountBase, 0);
    const monthExpense = enrichedTransactions
      .filter((item) => item.type === "expense" && monthKey(item.date) === monthKey(today))
      .reduce((sum, item) => sum + item.amountBase, 0);
    const completedTasks = tasks.filter((task) => task.completed).length;
    const openTasks = tasks.length - completedTasks;

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      todayExpense,
      monthExpense,
      completedTasks,
      openTasks,
      progress: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0,
    };
  }, [enrichedTransactions, tasks]);

  const categorySpend = useMemo(() => {
    const byCategory = enrichedTransactions
      .filter((item) => item.type === "expense")
      .reduce((accumulator, item) => {
        accumulator[item.category] = (accumulator[item.category] || 0) + item.amountBase;
        return accumulator;
      }, {});

    return Object.entries(byCategory)
      .sort(([, left], [, right]) => right - left)
      .slice(0, 4);
  }, [enrichedTransactions]);

  const upcomingTasks = useMemo(
    () =>
      tasks
        .filter((task) => !task.completed)
        .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
        .slice(0, 4),
    [tasks],
  );

  const filteredTransactions = useMemo(() => {
    const query = transactionQuery.trim().toLowerCase();

    return enrichedTransactions.filter((item) => {
      const matchesQuery = !query
        || item.category.toLowerCase().includes(query)
        || item.note.toLowerCase().includes(query)
        || item.trip.toLowerCase().includes(query);
      const matchesType = transactionTypeFilter === "all" || item.type === transactionTypeFilter;
      const matchesCategory = transactionCategoryFilter === "all" || item.category === transactionCategoryFilter;

      return matchesQuery && matchesType && matchesCategory;
    });
  }, [enrichedTransactions, transactionCategoryFilter, transactionQuery, transactionTypeFilter]);

  const monthChartData = useMemo(() => {
    const labels = [];
    const today = new Date();

    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth() - index, 1);
      labels.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: date.toLocaleDateString("en-US", { month: "short" }),
      });
    }

    return labels.map((entry) => ({
      label: entry.label,
      value: enrichedTransactions
        .filter((item) => item.type === "expense" && monthKey(item.date) === entry.key)
        .reduce((sum, item) => sum + item.amountBase, 0),
    }));
  }, [enrichedTransactions]);

  const tripInsights = useMemo(() => {
    const grouped = enrichedTransactions.reduce((accumulator, item) => {
      const key = item.trip?.trim() || "General";
      if (!accumulator[key]) {
        accumulator[key] = {
          trip: key,
          expense: 0,
          income: 0,
          entries: 0,
        };
      }

      accumulator[key].entries += 1;
      if (item.type === "expense") {
        accumulator[key].expense += item.amountBase;
      } else {
        accumulator[key].income += item.amountBase;
      }

      return accumulator;
    }, {});

    return Object.values(grouped)
      .sort((left, right) => right.expense - left.expense)
      .slice(0, 4);
  }, [enrichedTransactions]);

  return (
    <div className="app-shell">
      <div className="app-backdrop" />
      <div className="sun-glow sun-glow--left" aria-hidden="true" />
      <div className="sun-glow sun-glow--right" aria-hidden="true" />

      <div className="petal-field" aria-hidden="true">
        {blossomPetals.map((petal) => (
          <span
            key={petal.id}
            className="petal"
            style={{
              left: petal.left,
              width: `${petal.size}px`,
              height: `${petal.size * 0.78}px`,
              animationDelay: petal.delay,
              animationDuration: petal.duration,
            }}
          />
        ))}
      </div>

      <main className="app">
        <section className="hero">
          <div className="hero__copy">
            <div className="hero-art" aria-hidden="true">
              <span className="hero-art__orb hero-art__orb--large" />
              <span className="hero-art__orb hero-art__orb--small" />
              <span className="hero-art__branch" />
              <span className="hero-art__flower hero-art__flower--one" />
              <span className="hero-art__flower hero-art__flower--two" />
              <span className="hero-art__flower hero-art__flower--three" />
            </div>

            <div className="hero__tag-row">
              <p className="eyebrow">Daily Money Travel Manager</p>
              <div className="hero__top-actions">
                <button
                  type="button"
                  className="theme-toggle"
                  onClick={() => setTheme((current) => (current === "blossom" ? "night" : "blossom"))}
                >
                  {theme === "blossom" ? "Night mode" : "Blossom mode"}
                </button>
                <span className="hero-badge">Japan Travel Planner</span>
              </div>
            </div>

            <h1>Japan Trip</h1>
            <p className="hero__text">
              Keep your budget, exchange notes, and checklist in one polished space that stays easy to scan on desktop and phone.
            </p>

            <div className="hero__ribbons">
              <span className="ribbon">Travel budget</span>
              <span className="ribbon">Exchange helper</span>
              <span className="ribbon">Trip checklist</span>
            </div>

            <div className="hero__toolbar">
              <Field label="Base currency" hint={rateMessage}>
                <select value={baseCurrency} onChange={(event) => setBaseCurrency(event.target.value)}>
                  {currencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="hero-note">
                <strong>Calm trip planning</strong>
                <p>Everything stays local in your browser, so it feels quick and lightweight.</p>
              </div>
            </div>
          </div>

          <div className="hero__panel">
            <div className="hero__panel-head">
              <p className="eyebrow">Today snapshot</p>
              <span className="panel-chip">{transactions.length} entries</span>
            </div>

            <SummaryCard label="Current balance" value={formatMoney(metrics.balance, baseCurrency)} tone="neutral" />
            <SummaryCard label="Spent today" value={formatMoney(metrics.todayExpense, baseCurrency)} tone="warm" />
            <SummaryCard label="This month" value={formatMoney(metrics.monthExpense, baseCurrency)} tone="cool" />
            <SummaryCard
              label="Checklist progress"
              value={`${metrics.progress}%`}
              tone="success"
              detail={`${metrics.completedTasks}/${tasks.length || 0} tasks completed`}
            />

            <div className="mini-board">
              <div className="mini-board__item">
                <span>Open tasks</span>
                <strong>{metrics.openTasks}</strong>
              </div>
              <div className="mini-board__item">
                <span>Main currency</span>
                <strong>{baseCurrency}</strong>
              </div>
            </div>
          </div>
        </section>

        <nav className="tabbar">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? "tabbar__item is-active" : "tabbar__item"}
              onClick={() => setTab(item.id)}
            >
              <TabIcon type={item.icon} />
              <span className="tabbar__label tabbar__label--full">{item.label}</span>
              <span className="tabbar__label tabbar__label--short">{item.shortLabel}</span>
            </button>
          ))}
        </nav>

        {tab === "dashboard" ? (
          <div className="dashboard-grid">
            <SectionCard title="Overview" subtitle="Financial pulse">
              <div className="metric-grid">
                <SummaryCard label="Income" value={formatMoney(metrics.totalIncome, baseCurrency)} tone="success" />
                <SummaryCard label="Expenses" value={formatMoney(metrics.totalExpense, baseCurrency)} tone="danger" />
                <SummaryCard label="Active trips" value={`${tripInsights.length}`} tone="neutral" />
              </div>
            </SectionCard>

            <SectionCard title="Trend" subtitle="Monthly spending rhythm">
              <MiniChart data={monthChartData} />
            </SectionCard>

            <SectionCard title="Categories" subtitle="Where the money goes">
              {categorySpend.length === 0 ? (
                <EmptyState title="No spending data" description="Add a few transactions to see category breakdowns." />
              ) : (
                <div className="stack-list">
                  {categorySpend.map(([category, total]) => (
                    <div className="bar-row" key={category}>
                      <div className="bar-row__label">
                        <strong>{category}</strong>
                        <span>{formatMoney(total, baseCurrency)}</span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${Math.max((total / categorySpend[0][1]) * 100, 12)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Trips" subtitle="Top trip budgets">
              {tripInsights.length === 0 ? (
                <EmptyState title="No trip data yet" description="Add a trip name on transactions to see travel-based summaries here." />
              ) : (
                <div className="stack-list">
                  {tripInsights.map((trip) => (
                    <article className="trip-card" key={trip.trip}>
                      <div>
                        <strong>{trip.trip}</strong>
                        <p className="muted">{trip.entries} entries</p>
                      </div>
                      <div className="trip-card__stats">
                        <span>Spend {formatMoney(trip.expense, baseCurrency)}</span>
                        <span>Income {formatMoney(trip.income, baseCurrency)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Recent Activity" subtitle="Latest transactions">
              {enrichedTransactions.length === 0 ? (
                <EmptyState title="Nothing logged yet" description="Your recent expenses and income will appear here." />
              ) : (
                <div className="stack-list">
                  {enrichedTransactions.slice(0, 5).map((item) => (
                    <TransactionRow
                      key={item.id}
                      item={item}
                      baseCurrency={baseCurrency}
                      onEdit={startTransactionEdit}
                      onDelete={deleteTransaction}
                    />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Travel Checklist" subtitle="Upcoming tasks">
              {upcomingTasks.length === 0 ? (
                <EmptyState title="Checklist is clear" description="Create tasks for documents, packing, booking, or reminders." />
              ) : (
                <div className="stack-list">
                  {upcomingTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                      onEdit={startTaskEdit}
                      onDelete={deleteTask}
                    />
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        ) : null}

        {tab === "add" ? (
          <SectionCard
            title="Transactions"
            subtitle={editingTransactionId ? "Update an existing entry" : "Log income or expenses"}
          >
            <div className="form-grid">
              <Field label="Date">
                <input type="date" value={txForm.date} onChange={(event) => updateTransactionField("date", event.target.value)} />
              </Field>

              <Field label="Type">
                <select value={txForm.type} onChange={(event) => updateTransactionField("type", event.target.value)}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </Field>

              <Field label="Category">
                <select value={txForm.category} onChange={(event) => updateTransactionField("category", event.target.value)}>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Amount">
                <input type="number" placeholder="0" value={txForm.amount} onChange={(event) => updateTransactionField("amount", event.target.value)} />
              </Field>

              <Field label="Currency">
                <select value={txForm.currency} onChange={(event) => updateTransactionCurrency(event.target.value)}>
                  {currencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Trip name">
                <input value={txForm.trip} placeholder="Da Nang trip" onChange={(event) => updateTransactionField("trip", event.target.value)} />
              </Field>
            </div>

            <Field label="Note" hint={`Rate to base: ${txForm.rateToBase}`}>
              <textarea value={txForm.note} placeholder="Taxi from airport, hotel deposit, dinner..." onChange={(event) => updateTransactionField("note", event.target.value)} />
            </Field>

            <div className="action-row">
              <button type="button" className="button button--primary" onClick={saveTransaction}>
                {editingTransactionId ? "Update transaction" : "Save transaction"}
              </button>
              {editingTransactionId ? (
                <button type="button" className="button button--ghost" onClick={resetTransactionForm}>
                  Cancel edit
                </button>
              ) : null}
              <span className="muted">Transactions are stored locally in your browser.</span>
            </div>
          </SectionCard>
        ) : null}

        {tab === "transactions" ? (
          <SectionCard title="Ledger" subtitle="All transactions">
            <div className="filter-bar">
              <Field label="Search">
                <input
                  value={transactionQuery}
                  placeholder="Search trip, note, category..."
                  onChange={(event) => setTransactionQuery(event.target.value)}
                />
              </Field>

              <Field label="Type">
                <select value={transactionTypeFilter} onChange={(event) => setTransactionTypeFilter(event.target.value)}>
                  <option value="all">All</option>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </Field>

              <Field label="Category">
                <select value={transactionCategoryFilter} onChange={(event) => setTransactionCategoryFilter(event.target.value)}>
                  <option value="all">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {enrichedTransactions.length === 0 ? (
              <EmptyState title="No transactions yet" description="Add your first income or expense entry to populate the ledger." />
            ) : filteredTransactions.length === 0 ? (
              <EmptyState title="No matching transactions" description="Try another keyword or reset the current filters." />
            ) : (
              <div className="stack-list">
                {filteredTransactions.map((item) => (
                  <TransactionRow
                    key={item.id}
                    item={item}
                    baseCurrency={baseCurrency}
                    onEdit={startTransactionEdit}
                    onDelete={deleteTransaction}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        ) : null}

        {tab === "fx" ? (
          <div className="two-column">
            <SectionCard title="Exchange Rate" subtitle="Quick conversion">
              <div className="form-grid">
                <Field label="Amount">
                  <input type="number" placeholder="0" value={fxForm.amount} onChange={(event) => updateFxField("amount", event.target.value)} />
                </Field>

                <Field label="From">
                  <select value={fxForm.from} onChange={(event) => updateFxField("from", event.target.value)}>
                    {currencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="To">
                  <select value={fxForm.to} onChange={(event) => updateFxField("to", event.target.value)}>
                    {currencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="action-row">
                <button type="button" className="button button--primary" onClick={convertNow}>
                  Convert
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Result" subtitle="Latest conversion snapshot">
              {fxForm.result ? (
                <div className="fx-result">
                  <strong>{formatMoney(fxForm.result, fxForm.to)}</strong>
                  <p>Rate: {fxForm.rate}</p>
                  <p>Updated: {fxForm.updatedAt}</p>
                </div>
              ) : (
                <EmptyState title="No result yet" description="Choose currencies and run a conversion to see the latest rate." />
              )}
            </SectionCard>
          </div>
        ) : null}

        {tab === "checklist" ? (
          <div className="two-column">
            <SectionCard
              title="Checklist"
              subtitle={editingTaskId ? "Update a trip task" : "Add a task for your trip"}
            >
              <div className="form-grid">
                <Field label="Task title">
                  <input value={taskForm.title} placeholder="Renew passport" onChange={(event) => updateTaskField("title", event.target.value)} />
                </Field>

                <Field label="Group">
                  <input value={taskForm.group} placeholder="Documents" onChange={(event) => updateTaskField("group", event.target.value)} />
                </Field>

                <Field label="Due date">
                  <input type="date" value={taskForm.dueDate} onChange={(event) => updateTaskField("dueDate", event.target.value)} />
                </Field>
              </div>

              <div className="action-row">
                <button type="button" className="button button--primary" onClick={saveTask}>
                  {editingTaskId ? "Update task" : "Add task"}
                </button>
                {editingTaskId ? (
                  <button type="button" className="button button--ghost" onClick={resetTaskForm}>
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </SectionCard>

            <SectionCard title="Progress" subtitle={`${metrics.progress}% complete`}>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${metrics.progress}%` }} />
              </div>

              {tasks.length === 0 ? (
                <EmptyState title="No tasks yet" description="Create checklist items for planning, booking, documents, or packing." />
              ) : (
                <div className="stack-list">
                  {tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                      onEdit={startTaskEdit}
                      onDelete={deleteTask}
                    />
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default App;
