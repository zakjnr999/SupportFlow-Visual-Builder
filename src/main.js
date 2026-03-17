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
      endCount: 0,
      canvasWidth: 0,
      canvasHeight: 0,
    };
  }

  return {
    nodeCount: flow.nodes.length,
    startCount: flow.nodes.filter((node) => node.type === "start").length,
    endCount: flow.nodes.filter((node) => node.type === "end").length,
    canvasWidth: flow.meta.canvas_size.w,
    canvasHeight: flow.meta.canvas_size.h,
  };
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
    : `
      <div class="canvas-shell" aria-label="Flow canvas placeholder">
        <div class="canvas-shell__grid"></div>
        <div class="canvas-shell__content">
          <div>
            <p class="eyebrow">Editor canvas</p>
            <h2>Workspace ready for node rendering</h2>
            <p>
              The layout is wired up. Next we will place each node from the JSON
              onto the canvas and draw the connections by hand with SVG.
            </p>
          </div>
          <dl class="canvas-metrics">
            <div>
              <dt>Canvas size</dt>
              <dd>${stats.canvasWidth} x ${stats.canvasHeight}</dd>
            </div>
            <div>
              <dt>Theme hint</dt>
              <dd>${escapeHtml(state.flow?.meta.theme ?? "n/a")}</dd>
            </div>
            <div>
              <dt>Start nodes</dt>
              <dd>${stats.startCount}</dd>
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
            <p>Select a node to edit its question text and review its answer branches.</p>
            <ul class="inspector-list">
              <li>Total nodes: <strong>${stats.nodeCount}</strong></li>
              <li>Start nodes: <strong>${stats.startCount}</strong></li>
              <li>End nodes: <strong>${stats.endCount}</strong></li>
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
