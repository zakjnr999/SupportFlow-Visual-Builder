export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function getStatusTone(error) {
  return error ? "status-pill--error" : "status-pill--info";
}

export function getFlowStats(flow) {
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

export function getNodeTypeLabel(type) {
  if (type === "start") {
    return "Start";
  }

  if (type === "end") {
    return "End";
  }

  return "Question";
}
