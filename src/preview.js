function getStartNode(state) {
  if (!state.flow) {
    return null;
  }

  return state.flow.nodes.find((node) => node.type === "start") ?? state.flow.nodes[0] ?? null;
}

export function createPreviewController({ root, state, render, findNodeById }) {
  function enterPreview() {
    if (!state.flow) {
      return;
    }

    const startNode = getStartNode(state);

    if (!startNode) {
      return;
    }

    state.mode = "preview";
    state.preview = {
      currentNodeId: startNode.id,
      transcript: [
        {
          role: "bot",
          text: startNode.text,
          nodeId: startNode.id,
        },
      ],
    };

    render();
  }

  function exitPreview() {
    if (state.mode !== "preview") {
      return;
    }

    state.mode = "editor";
    render();
  }

  function chooseOption(optionIndex) {
    const currentNode = findNodeById(state.preview.currentNodeId);

    if (!currentNode || !currentNode.options?.length) {
      return;
    }

    const selectedOption = currentNode.options[optionIndex];

    if (!selectedOption) {
      return;
    }

    const nextNode = findNodeById(selectedOption.nextId);

    if (!nextNode) {
      return;
    }

    state.preview.transcript.push({
      role: "user",
      text: selectedOption.label,
    });

    state.preview.currentNodeId = nextNode.id;
    state.preview.transcript.push({
      role: "bot",
      text: nextNode.text,
      nodeId: nextNode.id,
    });

    render();
  }

  function restartPreview() {
    if (state.mode !== "preview") {
      return;
    }

    enterPreview();
  }

  function handlePreviewActions(event) {
    const actionTrigger = event.target.closest("[data-action]");

    if (!actionTrigger || !root.contains(actionTrigger)) {
      return;
    }

    const action = actionTrigger.dataset.action;

    if (action === "toggle-preview") {
      if (state.mode === "preview") {
        exitPreview();
      } else {
        enterPreview();
      }
      return;
    }

    if (action === "preview-option") {
      chooseOption(Number(actionTrigger.dataset.optionIndex));
      return;
    }

    if (action === "preview-restart") {
      restartPreview();
    }
  }

  function attach() {
    root.addEventListener("click", handlePreviewActions);
  }

  return {
    attach,
  };
}
