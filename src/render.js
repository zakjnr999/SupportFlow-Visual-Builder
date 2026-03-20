import { renderConnections } from "./connectors.js";
import {
  escapeHtml,
  getFlowStats,
  getNodeTypeLabel,
  getStatusTone,
} from "./utils.js";

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

function renderNodeCard(node, selectedNodeId) {
  const isSelected = selectedNodeId === node.id;

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

function renderInspectorContent(flow, stats, selectedNode) {
  if (!flow) {
    return `
      <div class="inspector-placeholder">
        <p>The editor will appear here after the flow data loads.</p>
      </div>
    `;
  }

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

export function renderApp({
  root,
  state,
  selectedNode,
  scheduleConnectionLayout,
}) {
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
                <svg
                  class="canvas-stage__connections"
                  viewBox="0 0 ${stats.canvasWidth} ${stats.canvasHeight}"
                  aria-hidden="true"
                  preserveAspectRatio="none"
                >
                  ${renderConnections(state.connections)}
                </svg>
                ${state.flow.nodes
                  .map((node) => renderNodeCard(node, state.selectedNodeId))
                  .join("")}
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
          <span class="status-pill ${getStatusTone(state.error)}">${escapeHtml(statusText)}</span>
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

          ${renderInspectorContent(state.flow, stats, selectedNode)}
        </aside>
      </main>
    </div>
  `;

  scheduleConnectionLayout();
}
