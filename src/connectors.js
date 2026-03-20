import { escapeHtml } from "./utils.js";

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

export function renderConnections(connections) {
  if (!connections.length) {
    return "";
  }

  return connections
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

export function createConnectorController({ root, state, render }) {
  let layoutFrame = 0;

  function updateConnections() {
    if (!state.flow || state.mode !== "editor") {
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
    if (!state.flow || state.error || state.mode !== "editor") {
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

  return {
    scheduleConnectionLayout,
  };
}
