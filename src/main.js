const root = document.querySelector("#root");

const state = {
  flow: null,
  status: "Loading flow data...",
  error: null,
  connections: [],
  connectionSignature: "",
  selectedNodeId: null,
};

let layoutFrame = 0;

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

function findNodeById(nodeId) {
  if (!state.flow) {
    return null;
  }

  return state.flow.nodes.find((node) => node.id === nodeId) ?? null;
}

function getSelectedNode() {
  if (!state.selectedNodeId) {
    return null;
  }

  return findNodeById(state.selectedNodeId);
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
  const isSelected = state.selectedNodeId === node.id;

  return `
    <article
      class="flow-node flow-node--${escapeHtml(node.type)} ${isSelected ? "flow-node--selected" : ""}"
      data-node-id="${escapeHtml(node.id)}"
      style="left: ${node.position.x}px; top: ${node.position.y}px;"
      tabindex="0"
      role="button"
      aria-pressed="${isSelected ? "true" : "false"}"
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

function buildConnectionPath(connection) {
  const verticalDistance = Math.abs(connection.endY - connection.startY);
  const curveDepth = Math.max(56, verticalDistance * 0.45);
  const controlY1 = connection.startY + curveDepth;
  const controlY2 = connection.endY - curveDepth;

  return [
    `M ${connection.startX} ${connection.startY}`,
    `C ${connection.startX} ${controlY1}, ${connection.endX} ${controlY2}, ${connection.endX} ${connection.endY}`,
  ].join(" ");
}

function renderConnections() {
  if (!state.connections.length) {
    return "";
  }

  return state.connections
    .map(
      (connection) => `
        <g class="canvas-connection canvas-connection--${escapeHtml(connection.tone)}">
          <path
            class="canvas-connection__path"
            d="${buildConnectionPath(connection)}"
          ></path>
          <circle
            class="canvas-connection__dot"
            cx="${connection.startX}"
            cy="${connection.startY}"
            r="4"
          ></circle>
          <circle
            class="canvas-connection__dot canvas-connection__dot--end"
            cx="${connection.endX}"
            cy="${connection.endY}"
            r="4"
          ></circle>
        </g>
      `,
    )
    .join("");
}

function renderInspectorOptions(node) {
  if (!node.options?.length) {
    return `<p class="inspector-terminal">This node ends the conversation.</p>`;
  }

  const items = node.options
    .map(
      (option) => `
        <li class="inspector-branch">
          <span>${escapeHtml(option.label)}</span>
          <span class="inspector-branch__target">Goes to #${escapeHtml(option.nextId)}</span>
        </li>
      `,
    )
    .join("");

  return `<ul class="inspector-branches">${items}</ul>`;
}

function renderInspectorContent(stats) {
  if (!state.flow) {
    return `
      <div class="inspector-placeholder">
        <p>The editor will appear here after the flow data loads.</p>
      </div>
    `;
  }

  const selectedNode = getSelectedNode();

  if (!selectedNode) {
    return `
      <div class="inspector-placeholder">
        <p>
          Select a node on the canvas to edit its question text and review its
          answer branches.
        </p>
        <ul class="inspector-list">
          <li>Total nodes: <strong>${stats.nodeCount}</strong></li>
          <li>Start nodes: <strong>${stats.startCount}</strong></li>
          <li>Question nodes: <strong>${stats.questionCount}</strong></li>
        </ul>
      </div>
    `;
  }

  return `
    <div class="inspector-form">
      <div class="inspector-form__summary">
        <div>
          <p class="eyebrow">Selected node</p>
          <h3>${getNodeTypeLabel(selectedNode.type)} #${escapeHtml(selectedNode.id)}</h3>
        </div>
        <p>Changes update the canvas immediately.</p>
      </div>

      <label class="field">
        <span class="field__label">Question text</span>
        <textarea
          class="field__control field__control--textarea"
          name="node-text"
          data-node-id="${escapeHtml(selectedNode.id)}"
          rows="5"
        >${escapeHtml(selectedNode.text)}</textarea>
      </label>

      <div class="inspector-meta">
        <div>
          <span class="inspector-meta__label">Node type</span>
          <strong>${getNodeTypeLabel(selectedNode.type)}</strong>
        </div>
        <div>
          <span class="inspector-meta__label">Position</span>
          <strong>${selectedNode.position.x}, ${selectedNode.position.y}</strong>
        </div>
        <div>
          <span class="inspector-meta__label">Outgoing branches</span>
          <strong>${selectedNode.options.length}</strong>
        </div>
      </div>

      <div class="inspector-section">
        <div class="inspector-section__header">
          <h3>Answer paths</h3>
          <span>${selectedNode.options.length}</span>
        </div>
        ${renderInspectorOptions(selectedNode)}
      </div>
    </div>
  `;
}

function updateConnections() {
  if (!state.flow) {
    return;
  }

  const stage = root.querySelector(".canvas-stage");

  if (!stage) {
    return;
  }

  const nodeLayout = new Map(
    Array.from(stage.querySelectorAll(".flow-node")).map((element) => [
      element.dataset.nodeId,
      {
        left: element.offsetLeft,
        top: element.offsetTop,
        width: element.offsetWidth,
        height: element.offsetHeight,
      },
    ]),
  );

  const connections = [];

  state.flow.nodes.forEach((node) => {
    const source = nodeLayout.get(node.id);

    if (!source) {
      return;
    }

    (node.options ?? []).forEach((option, index) => {
      const target = nodeLayout.get(option.nextId);

      if (!target) {
        return;
      }

      connections.push({
        id: `${node.id}-${option.nextId}-${index}`,
        tone: node.type,
        startX: source.left + source.width / 2,
        startY: source.top + source.height,
        endX: target.left + target.width / 2,
        endY: target.top,
      });
    });
  });

  const signature = JSON.stringify(connections);

  if (signature === state.connectionSignature) {
    return;
  }

  state.connections = connections;
  state.connectionSignature = signature;
  render();
}

function scheduleConnectionLayout() {
  if (!state.flow || state.error) {
    return;
  }

  if (layoutFrame) {
    cancelAnimationFrame(layoutFrame);
  }

  layoutFrame = requestAnimationFrame(() => {
    layoutFrame = 0;
    updateConnections();
  });
}

function restoreEditorSelection(nodeId, cursorState) {
  if (!cursorState) {
    return;
  }

  requestAnimationFrame(() => {
    const textField = root.querySelector(
      `[name="node-text"][data-node-id="${nodeId}"]`,
    );

    if (!textField) {
      return;
    }

    textField.focus();
    textField.setSelectionRange(
      cursorState.selectionStart,
      cursorState.selectionEnd,
    );
    textField.scrollTop = cursorState.scrollTop;
  });
}

function selectNode(nodeId) {
  if (!state.flow || state.selectedNodeId === nodeId) {
    return;
  }

  state.selectedNodeId = nodeId;
  render();
}

function updateNodeText(nodeId, nextText, cursorState) {
  const node = findNodeById(nodeId);

  if (!node || node.text === nextText) {
    return;
  }

  node.text = nextText;
  render();
  restoreEditorSelection(nodeId, cursorState);
}

function handleRootClick(event) {
  const nodeElement = event.target.closest(".flow-node");

  if (!nodeElement || !root.contains(nodeElement)) {
    return;
  }

  selectNode(nodeElement.dataset.nodeId);
}

function handleRootInput(event) {
  const textField = event.target.closest('[name="node-text"]');

  if (!textField || !root.contains(textField)) {
    return;
  }

  updateNodeText(textField.dataset.nodeId, textField.value, {
    selectionStart: textField.selectionStart,
    selectionEnd: textField.selectionEnd,
    scrollTop: textField.scrollTop,
  });
}

function handleRootKeydown(event) {
  const nodeElement = event.target.closest(".flow-node");

  if (!nodeElement || !root.contains(nodeElement)) {
    return;
  }

  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  selectNode(nodeElement.dataset.nodeId);
}

function render() {
  const stats = getFlowStats(state.flow);
  const selectedNode = getSelectedNode();
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
              <svg
                class="canvas-stage__connections"
                viewBox="0 0 ${stats.canvasWidth} ${stats.canvasHeight}"
                aria-hidden="true"
                preserveAspectRatio="none"
              >
                ${renderConnections()}
              </svg>
              ${state.flow.nodes.map(renderNodeCard).join("")}
            </div>
          </div>
          <div class="canvas-note">
            <p>
              Nodes and connector lines are now rendered from the provided JSON.
              Select a node to edit its question text from the inspector.
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
            <span class="panel__meta">
              ${selectedNode ? `Selected #${escapeHtml(selectedNode.id)}` : "No node selected"}
            </span>
          </div>

          ${renderInspectorContent(stats)}
        </aside>
      </main>
    </div>
  `;

  scheduleConnectionLayout();
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
window.addEventListener("resize", scheduleConnectionLayout);
root.addEventListener("click", handleRootClick);
root.addEventListener("input", handleRootInput);
root.addEventListener("keydown", handleRootKeydown);
