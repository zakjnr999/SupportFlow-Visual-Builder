import { createConnectorController } from "./connectors.js";
import { createEditorController } from "./editor.js";
import { renderApp } from "./render.js";

const root = document.querySelector("#root");

const state = {
  flow: null,
  status: "Loading flow data...",
  error: null,
  connections: [],
  connectionSignature: "",
  selectedNodeId: null,
};

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

function render() {
  renderApp({
    root,
    state,
    selectedNode: getSelectedNode(),
    scheduleConnectionLayout: connectors.scheduleConnectionLayout,
  });
}

const connectors = createConnectorController({
  root,
  state,
  render,
});

const editor = createEditorController({
  root,
  state,
  render,
  findNodeById,
});

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
window.addEventListener("resize", connectors.scheduleConnectionLayout);
editor.attach();
