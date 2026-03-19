const root = document.querySelector("#root");

const state = {
  flow: null,
  status: "Loading flow data...",
  error: null,
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getStatusTone() {
  return state.error ? "status-pill--error" : "status-pill--info";
}

function getFlowStats(flow) {
  if (!flow) {
    return {
      nodeCount: 0,
      startCount: 0,
      questionCount: 0,
      endCount: 0,
      branchCount: 0,
      canvasWidth: 0,
      canvasHeight: 0,
    };
  }

  return {
    nodeCount: flow.nodes.length,
    startCount: flow.nodes.filter((node) => node.type === "start").length,
    questionCount: flow.nodes.filter((node) => node.type === "question").length,
    endCount: flow.nodes.filter((node) => node.type === "end").length,
    branchCount: flow.nodes.reduce(
      (count, node) => count + (node.options?.length ?? 0),
      0,
    ),
    canvasWidth: flow.meta.canvas_size.w,
    canvasHeight: flow.meta.canvas_size.h,
  };
}

function getNodeTypeLabel(type) {
  if (type === "start") {
    return "Start";
  }

  if (type === "end") {
    return "End";
  }

  return "Question";
}

function renderNodeOptions(node) {
  if (!node.options?.length) {
    return `<p class="flow-node__terminal">End of conversation</p>`;
  }

  const options = node.options
    .map(
      (option) => `
        <li class="flow-node__option">
          <span>${escapeHtml(option.label)}</span>
          <span class="flow-node__target">#${escapeHtml(option.nextId)}</span>
        </li>
      `,
    )
    .join("");

  return `<ul class="flow-node__options">${options}</ul>`;
}

function renderNodeCard(node) {
  return `
    <article
      class="flow-node flow-node--${escapeHtml(node.type)}"
      data-node-id="${escapeHtml(node.id)}"
      style="left: ${node.position.x}px; top: ${node.position.y}px;"
    >
      <div class="flow-node__header">
        <span class="flow-node__type">${getNodeTypeLabel(node.type)}</span>
        <span class="flow-node__id">#${escapeHtml(node.id)}</span>
      </div>
      <p class="flow-node__text">${escapeHtml(node.text)}</p>
      ${renderNodeOptions(node)}
    </article>
  `;
}

function render() {
  const stats = getFlowStats(state.flow);
  const statusText = state.error
    ? "Unable to load flow_data.json"
    : state.flow
      ? `${stats.nodeCount} nodes loaded`
      : state.status;

  const canvasContent = state.error
    ? `
      <div class="canvas-placeholder canvas-placeholder--error">
        <h2>Flow data unavailable</h2>
        <p>${escapeHtml(state.error)}</p>
      </div>
    `
    : !state.flow
      ? `
        <div class="canvas-placeholder">
          <div>
            <p class="eyebrow">Editor canvas</p>
            <h2>Loading flow data</h2>
            <p>The workspace is preparing the conversation map.</p>
          </div>
        </div>
      `
    : `
      <div class="canvas-shell" aria-label="Flow canvas placeholder">
        <div class="canvas-shell__grid"></div>
        <div class="canvas-shell__content">
          <div class="canvas-stage-wrap">
            <div
              class="canvas-stage"
              style="width: ${stats.canvasWidth}px; height: ${stats.canvasHeight}px;"
              aria-label="Conversation flow canvas"
            >
              ${state.flow.nodes.map(renderNodeCard).join("")}
            </div>
          </div>
          <div class="canvas-note">
            <p>
              Nodes are now rendered from the provided JSON positions. Connector
              lines and node interactions come next.
            </p>
          </div>
          <dl class="canvas-metrics">
            <div>
              <dt>Canvas size</dt>
              <dd>${stats.canvasWidth} x ${stats.canvasHeight}</dd>
            </div>
            <div>
              <dt>Question nodes</dt>
              <dd>${stats.questionCount}</dd>
            </div>
            <div>
              <dt>Branches</dt>
              <dd>${stats.branchCount}</dd>
            </div>
            <div>
              <dt>End nodes</dt>
              <dd>${stats.endCount}</dd>
            </div>
          </dl>
        </div>
      </div>
    `;

  root.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">SupportFlow AI</p>
          <h1>Visual Builder</h1>
          <p class="topbar__subtitle">
            Map support conversations, refine question text, and preview the path
            before it goes live.
          </p>
        </div>
        <div class="topbar__actions">
          <span class="status-pill ${getStatusTone()}">${escapeHtml(statusText)}</span>
          <button class="ghost-button" type="button" disabled>
            Preview
          </button>
        </div>
      </header>

      <main class="workspace">
        <section class="panel">
          <div class="panel__header">
            <div>
              <p class="eyebrow">Flow canvas</p>
              <h2>Conversation map</h2>
            </div>
            <span class="panel__meta">Canvas ready</span>
          </div>
          ${canvasContent}
        </section>

        <aside class="panel panel--sidebar">
          <div class="panel__header">
            <div>
              <p class="eyebrow">Inspector</p>
              <h2>Node details</h2>
            </div>
            <span class="panel__meta">No node selected</span>
          </div>

          <div class="inspector-placeholder">
            <p>
              The graph is now visible on the canvas. Selecting and editing a node
              will be the next slice.
            </p>
            <ul class="inspector-list">
              <li>Total nodes: <strong>${stats.nodeCount}</strong></li>
              <li>Start nodes: <strong>${stats.startCount}</strong></li>
              <li>Question nodes: <strong>${stats.questionCount}</strong></li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  `;
}

async function loadFlow() {
  try {
    const response = await fetch("./flow_data.json");

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    state.flow = await response.json();
    state.status = "Flow data loaded.";
  } catch (error) {
    state.error = error instanceof Error ? error.message : "Unknown error";
  }

  render();
}

render();
loadFlow();
